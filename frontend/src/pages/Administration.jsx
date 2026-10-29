import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Activity, AlertTriangle, ArrowLeft, CheckCircle2, Droplets,
  LayoutDashboard, LogOut, MapPin, RefreshCw, ShieldCheck, Users, XCircle
} from "lucide-react";
import { API_BASE_URL } from "../services/apiConfig";
import "./Administration.css";

const STATUTS = {
  A_CONFIRMER: "À confirmer",
  ACTIF: "Coupure confirmée",
  RETABLISSEMENT_PROBABLE: "Rétablissement probable",
  RETABLI: "Eau rétablie",
  REJETE: "Rejeté",
};

function dateFR(valeur) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("fr-FR");
}

function erreurAPI(erreur) {
  const contenu = erreur?.response?.data;
  if (typeof contenu?.detail === "string") return contenu.detail;
  if (typeof contenu?.action === "string") return contenu.action;
  if (Array.isArray(contenu?.action)) return contenu.action.join(" ");
  return "Une erreur est survenue. Vérifiez la connexion et réessayez.";
}

export default function Administration() {
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState("tableau");
  const [tableau, setTableau] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [filtre, setFiltre] = useState("TOUS");
  const [chargement, setChargement] = useState(true);
  const [operation, setOperation] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const client = useMemo(() => axios.create({ baseURL: API_BASE_URL }), []);
  const config = () => ({
    headers: { Authorization: "Bearer " + localStorage.getItem("access_token") },
  });

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      const options = config();
      const [dashboard, listeIncidents, listeUtilisateurs] = await Promise.all([
        client.get("/api/administration/tableau-bord/", options),
        client.get("/api/administration/incidents/", options),
        client.get("/api/administration/utilisateurs/", options),
      ]);
      setTableau(dashboard.data);
      setIncidents(listeIncidents.data);
      setUtilisateurs(listeUtilisateurs.data);
    } catch (e) {
      setErreur(erreurAPI(e));
    } finally {
      setChargement(false);
    }
  }, [client]);

  useEffect(() => { charger(); }, [charger]);

  const moderer = async (incident, action) => {
    const verbe = action === "rejeter" ? "rejeter" : "rouvrir";
    if (!window.confirm("Voulez-vous " + verbe + " l'incident n°" + incident.id + " ?")) return;
    setOperation(true);
    setMessage("");
    try {
      await client.patch(
        "/api/administration/incidents/" + incident.id + "/",
        { action },
        config()
      );
      setMessage("L'incident n°" + incident.id + " a été modifié.");
      await charger();
    } catch (e) {
      setErreur(erreurAPI(e));
    } finally {
      setOperation(false);
    }
  };

  const modifierCompte = async (compte) => {
    const verbe = compte.is_active ? "désactiver" : "réactiver";
    if (!window.confirm("Voulez-vous " + verbe + " le compte « " + compte.username + " » ?")) return;
    setOperation(true);
    setMessage("");
    try {
      await client.patch(
        "/api/administration/utilisateurs/" + compte.id + "/",
        { is_active: !compte.is_active },
        config()
      );
      setMessage("Le compte a été modifié.");
      await charger();
    } catch (e) {
      setErreur(erreurAPI(e));
    } finally {
      setOperation(false);
    }
  };

  const deconnexion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/connexion");
  };
  const incidentsFiltres = incidents.filter(
    incident => filtre === "TOUS" || incident.statut === filtre
  );

  return (
    <main className="adm-shell">
      <aside className="adm-sidebar">
        <div className="adm-brand"><Droplets size={26} /><div><strong>Coupure</strong><small>Administration • Toliara</small></div></div>
        <p className="adm-label">ESPACE DE GESTION</p>
        <nav className="adm-menu" aria-label="Administration">
          <button className={onglet === "tableau" ? "active" : ""} onClick={() => setOnglet("tableau")}><LayoutDashboard size={18} /> Tableau de bord</button>
          <button className={onglet === "incidents" ? "active" : ""} onClick={() => setOnglet("incidents")}><AlertTriangle size={18} /> Incidents</button>
          <button className={onglet === "utilisateurs" ? "active" : ""} onClick={() => setOnglet("utilisateurs")}><Users size={18} /> Utilisateurs</button>
        </nav>
        <div className="adm-sidebar-foot">
          <button onClick={() => navigate("/accueil")}><ArrowLeft size={17} /> Retour au site</button>
          <button onClick={deconnexion}><LogOut size={17} /> Déconnexion</button>
        </div>
      </aside>
      <section className="adm-content">
        <header className="adm-header">
          <div><span className="adm-label"><ShieldCheck size={15} /> ACCÈS ADMINISTRATEUR</span>
            <h1>{onglet === "tableau" ? "Tableau de bord" : onglet === "incidents" ? "Gestion des incidents" : "Gestion des utilisateurs"}</h1>
            <p>Suivi et modération de la plateforme participative.</p></div>
          <button className="adm-refresh" onClick={charger} disabled={chargement}><RefreshCw size={16} /> Actualiser</button>
        </header>
        {erreur && <div className="adm-alert adm-error" role="alert">{erreur}</div>}
        {message && <div className="adm-alert adm-success" role="status">{message}</div>}
        {chargement && <p>Chargement des données…</p>}

        {onglet === "tableau" && tableau && <>
          <div className="adm-stats">
            <article><Activity /><span>Incidents au total</span><strong>{tableau.nombre_incidents}</strong></article>
            <article><AlertTriangle /><span>À confirmer</span><strong>{tableau.incidents_par_statut?.A_CONFIRMER ?? 0}</strong></article>
            <article><Users /><span>Habitants inscrits</span><strong>{tableau.nombre_utilisateurs}</strong></article>
            <article><MapPin /><span>Quartiers suivis</span><strong>{tableau.nombre_zones}</strong></article>
          </div>
          <div className="adm-columns">
            <section className="adm-panel"><h2>Répartition des incidents</h2>
              {Object.entries(STATUTS).map(([code, titre]) => {
                const n = tableau.incidents_par_statut?.[code] ?? 0;
                const pct = tableau.nombre_incidents ? (n / tableau.nombre_incidents) * 100 : 0;
                return <div className="adm-status-row" key={code}>
                  <div><span>{titre}</span><b>{n}</b></div>
                  <div className="adm-bar"><span style={{ width: pct + "%" }} /></div>
                </div>;
              })}
            </section>
            <section className="adm-panel"><h2>Incidents récents</h2>
              {tableau.incidents_recents?.length ? tableau.incidents_recents.map(incident =>
                <div className="adm-recent" key={incident.id}>
                  <div><strong>{incident.zone_nom}</strong><small>#{incident.id} · {dateFR(incident.date_creation)}</small></div>
                  <span className="adm-pill">{STATUTS[incident.statut] || incident.statut}</span>
                </div>
              ) : <p>Aucun incident enregistré.</p>}
              <button className="adm-link" onClick={() => setOnglet("incidents")}>Voir les incidents</button>
            </section>
          </div>
        </>}

        {onglet === "incidents" && <section className="adm-panel">
          <div className="adm-panel-title"><div><h2>Modération des incidents</h2><p>100 derniers incidents • rejet et réouverture</p></div>
            <label>Statut <select value={filtre} onChange={e => setFiltre(e.target.value)}>
              <option value="TOUS">Tous</option>
              {Object.entries(STATUTS).map(([code, titre]) => <option value={code} key={code}>{titre}</option>)}
            </select></label>
          </div>
          <div className="adm-scroll"><table><thead><tr><th>Incident</th><th>Zone</th><th>Statut</th><th>Confiance</th><th>Créé le</th><th>Action</th></tr></thead>
            <tbody>{incidentsFiltres.map(incident => <tr key={incident.id}>
              <td>#{incident.id}</td><td>{incident.zone_nom}</td>
              <td><span className="adm-pill">{STATUTS[incident.statut] || incident.statut}</span></td>
              <td>{Math.round(incident.score_confiance || 0)} %</td><td>{dateFR(incident.date_creation)}</td>
              <td>{incident.statut === "REJETE" ?
                <button className="adm-action" disabled={operation} onClick={() => moderer(incident, "rouvrir")}><CheckCircle2 size={15} /> Rouvrir</button> :
                incident.statut === "RETABLI" ? "Clôturé" :
                <button className="adm-action danger" disabled={operation} onClick={() => moderer(incident, "rejeter")}><XCircle size={15} /> Rejeter</button>}</td>
            </tr>)}
            {!incidentsFiltres.length && <tr><td colSpan={6}>Aucun incident trouvé.</td></tr>}
            </tbody></table></div>
        </section>}

        {onglet === "utilisateurs" && <section className="adm-panel">
          <h2>Comptes habitants</h2><p>100 derniers comptes • administrateurs non modifiables</p>
          <div className="adm-scroll"><table><thead><tr><th>Utilisateur</th><th>Nom</th><th>Inscription</th><th>État</th><th>Action</th></tr></thead>
            <tbody>{utilisateurs.map(compte => <tr key={compte.id}>
              <td><strong>{compte.username}</strong></td>
              <td>{[compte.first_name, compte.last_name].filter(Boolean).join(" ") || "—"}</td>
              <td>{dateFR(compte.date_joined)}</td><td>{compte.is_active ? "Actif" : "Désactivé"}</td>
              <td><button className={"adm-action " + (compte.is_active ? "danger" : "")} disabled={operation} onClick={() => modifierCompte(compte)}>{compte.is_active ? "Désactiver" : "Réactiver"}</button></td>
            </tr>)}
            {!utilisateurs.length && <tr><td colSpan={5}>Aucun compte habitant.</td></tr>}
            </tbody></table></div>
        </section>}
        <footer className="adm-footer">Coupure • Informations citoyennes non officielles.</footer>
      </section>
    </main>
  );
}
