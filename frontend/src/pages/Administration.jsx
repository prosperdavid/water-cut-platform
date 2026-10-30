import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  LogOut,
  MapPin,
  Menu,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Waves,
  X,
  XCircle,
} from "lucide-react";
import { API_BASE_URL } from "../services/apiConfig";
import "./Administration.css";
import "./AdministrationPremium.css";
import CoupureIcon from "../components/CoupureIcon";

const STATUTS = {
  A_CONFIRMER: { libelle: "À confirmer", couleur: "attente" },
  ACTIF: { libelle: "Coupure confirmée", couleur: "actif" },
  RETABLISSEMENT_PROBABLE: { libelle: "Rétablissement probable", couleur: "probable" },
  RETABLI: { libelle: "Eau rétablie", couleur: "retabli" },
  REJETE: { libelle: "Rejeté", couleur: "rejete" },
};

const NAVIGATION = [
  { key: "tableau", titre: "Vue d’ensemble", icon: "dashboard" },
  { key: "incidents", titre: "Incidents", icon: "incidents" },
  { key: "utilisateurs", titre: "Utilisateurs", icon: "users" },
];

function dateFR(valeur, avecHeure = false) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  if (Number.isNaN(date.getTime())) return "—";
  return avecHeure
    ? date.toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function erreurAPI(erreur) {
  const contenu = erreur?.response?.data;
  if (erreur?.response?.status === 401) return "Votre session a expiré. Déconnectez-vous puis reconnectez-vous.";
  if (erreur?.response?.status === 403) return "Vous ne disposez pas des droits nécessaires.";
  if (typeof contenu?.detail === "string") return contenu.detail;
  if (typeof contenu?.action === "string") return contenu.action;
  if (Array.isArray(contenu?.action)) return contenu.action.join(" ");
  return "Impossible de communiquer avec le serveur. Vérifiez votre connexion et réessayez.";
}

function config() {
  return {
    headers: { Authorization: "Bearer " + localStorage.getItem("access_token") },
  };
}

function Statut({ valeur }) {
  const meta = STATUTS[valeur] || { libelle: valeur || "Inconnu", couleur: "attente" };
  return (
    <span className={"coupure-etat coupure-etat--" + meta.couleur}>
      <span className="coupure-etat__point" />
      {meta.libelle}
    </span>
  );
}

function IconBadge({ icon, couleur }) {
  return <span className={"coupure-icon-badge coupure-icon-badge--" + couleur}><CoupureIcon name={icon} size={30} /></span>;
}

function EmptyState({ icon: Icon = Search, titre, description }) {
  return (
    <div className="coupure-empty">
      <div className="coupure-empty__icon"><Icon size={23} /></div>
      <strong>{titre}</strong>
      <p>{description}</p>
    </div>
  );
}

function Metrique({ icon, couleur, libelle, valeur, details }) {
  return (
    <article className="coupure-metrique">
      <div className="coupure-metrique__haut">
        <IconBadge icon={icon} couleur={couleur} />
        <span className="coupure-metrique__details">{details}</span>
      </div>
      <div>
        <strong className="coupure-metrique__valeur">{valeur ?? "—"}</strong>
        <p className="coupure-metrique__libelle">{libelle}</p>
      </div>
    </article>
  );
}

export default function Administration() {
  const navigate = useNavigate();
  const [onglet, setOnglet] = useState("tableau");
  const [tableau, setTableau] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [filtre, setFiltre] = useState("TOUS");
  const [rechercheIncident, setRechercheIncident] = useState("");
  const [rechercheCompte, setRechercheCompte] = useState("");
  const [chargement, setChargement] = useState(true);
  const [operation, setOperation] = useState(false);
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState(null);
  const [menuMobile, setMenuMobile] = useState(false);
  const [derniereMaj, setDerniereMaj] = useState(null);
  const boutonAnnulerRef = useRef(null);
  const client = useMemo(() => axios.create({ baseURL: API_BASE_URL }), []);

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
      setDerniereMaj(new Date());
    } catch (e) {
      setErreur(erreurAPI(e));
    } finally {
      setChargement(false);
    }
  }, [client]);

  useEffect(() => { charger(); }, [charger]);

  useEffect(() => {
    if (!confirmation) return undefined;
    boutonAnnulerRef.current?.focus();
    function fermerAvecEchap(e) {
      if (e.key === "Escape" && !operation) setConfirmation(null);
    }
    window.addEventListener("keydown", fermerAvecEchap);
    return () => window.removeEventListener("keydown", fermerAvecEchap);
  }, [confirmation, operation]);

  const naviguer = (cle) => {
    setOnglet(cle);
    setMenuMobile(false);
    setErreur("");
    setMessage("");
  };

  const deconnexion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/connexion");
  };

  const executerAction = async () => {
    if (!confirmation || operation) return;
    const { type, cible, action } = confirmation;
    setOperation(true);
    setErreur("");
    setMessage("");
    try {
      if (type === "incident") {
        await client.patch("/api/administration/incidents/" + cible.id + "/", { action }, config());
        setMessage("L’incident #" + cible.id + " a bien été mis à jour.");
      } else {
        await client.patch(
          "/api/administration/utilisateurs/" + cible.id + "/",
          { is_active: !cible.is_active },
          config()
        );
        setMessage("Le compte « " + cible.username + " » a bien été mis à jour.");
      }
      setConfirmation(null);
      await charger();
    } catch (e) {
      setErreur(erreurAPI(e));
      setConfirmation(null);
    } finally {
      setOperation(false);
    }
  };

  const incidentsFiltres = useMemo(() => {
    const terme = rechercheIncident.trim().toLocaleLowerCase("fr-FR");
    return incidents.filter((incident) => {
      const correspondAuStatut = filtre === "TOUS" || incident.statut === filtre;
      const correspondAuTexte = !terme
        || String(incident.id).includes(terme.replace(/^#/, ""))
        || (incident.zone_nom || "").toLocaleLowerCase("fr-FR").includes(terme);
      return correspondAuStatut && correspondAuTexte;
    });
  }, [incidents, filtre, rechercheIncident]);

  const utilisateursFiltres = useMemo(() => {
    const terme = rechercheCompte.trim().toLocaleLowerCase("fr-FR");
    return utilisateurs.filter((compte) =>
      !terme || [compte.username, compte.first_name, compte.last_name]
        .some((valeur) => (valeur || "").toLocaleLowerCase("fr-FR").includes(terme))
    );
  }, [utilisateurs, rechercheCompte]);

  const repartition = tableau?.incidents_par_statut || {};
  const total = tableau?.nombre_incidents || 0;
  const enCours = (repartition.ACTIF || 0) + (repartition.RETABLISSEMENT_PROBABLE || 0);
  const attente = repartition.A_CONFIRMER || 0;

  const ouvrirIncident = (incident, action) => setConfirmation({ type: "incident", cible: incident, action });
  const ouvrirCompte = (compte) => setConfirmation({ type: "utilisateur", cible: compte });
  const confirmationRejet = confirmation?.type === "incident" && confirmation?.action === "rejeter";
  const confirmationDesactivation = confirmation?.type === "utilisateur" && confirmation?.cible.is_active;
  const actionDestructive = confirmationRejet || confirmationDesactivation;

  return (
    <main className="coupure-admin">
      <aside className={"coupure-sidebar" + (menuMobile ? " coupure-sidebar--ouvert" : "")}>
        <div className="coupure-marque">
          <div className="coupure-marque__logo"><CoupureIcon name="logo" size={42} /></div>
          <div><span className="coupure-marque__nom">coupure<span>.</span></span><small>ESPACE ADMINISTRATEUR</small></div>
        </div>

        <div className="coupure-sidebar__nav-wrap">
          <p className="coupure-sidebar__titre">MENU PRINCIPAL</p>
          <nav className="coupure-navigation" aria-label="Navigation administrateur">
            {NAVIGATION.map(({ key, titre, icon }) => (
              <button
                type="button"
                key={key}
                className={"coupure-navigation__item" + (onglet === key ? " coupure-navigation__item--actif" : "")}
                aria-current={onglet === key ? "page" : undefined}
                onClick={() => naviguer(key)}
              >
                <CoupureIcon name={icon} size={23} /><span>{titre}</span>
                {key === "incidents" && attente > 0 && <span className="coupure-navigation__nombre">{attente}</span>}
                {onglet === key && <span className="coupure-navigation__indicateur" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="coupure-sidebar__bas">
          <div className="coupure-sidebar__notice">
            <div className="coupure-sidebar__notice-icon"><CoupureIcon name="zones" size={30} /></div>
            <strong>Le suivi, ensemble.</strong>
            <p>Une information citoyenne plus claire, quartier par quartier.</p>
          </div>
          <button className="coupure-sidebar__lien" onClick={() => navigate("/accueil")}><ArrowLeft size={17} /> Revenir au site</button>
          <button className="coupure-sidebar__lien coupure-sidebar__lien--sortie" onClick={deconnexion}><LogOut size={17} /> Se déconnecter</button>
          <div className="coupure-sidebar__copyright">© Coupure · Toliara</div>
        </div>
      </aside>

      {menuMobile && <button type="button" aria-label="Fermer le menu" className="coupure-overlay" onClick={() => setMenuMobile(false)} />}

      <div className="coupure-main">
        <header className="coupure-topbar">
          <div className="coupure-topbar__gauche">
            <button className="coupure-mobile-menu" aria-label="Ouvrir le menu" onClick={() => setMenuMobile(true)}><Menu size={21} /></button>
            <span className="coupure-fil-ariane">Administration</span>
            <ChevronRight size={15} className="coupure-fil-ariane__chevron" />
            <strong>{onglet === "tableau" ? "Vue d’ensemble" : onglet === "incidents" ? "Incidents" : "Utilisateurs"}</strong>
          </div>
          <div className="coupure-topbar__droite">
            <span className="coupure-topbar__lieu"><MapPin size={15} /> Toliara, Madagascar</span>
            <span className="coupure-topbar__separateur" />
            <span className="coupure-topbar__profil" title="Session administrateur"><CoupureIcon name="security" size={26} /><span>Admin</span></span>
          </div>
        </header>

        <div className="coupure-contenu">
          <div className="coupure-page-header">
            <div>
              <span className="coupure-surtitre"><span className="coupure-surtitre__point" /> PLATEFORME PARTICIPATIVE</span>
              <h1>{onglet === "tableau" ? "Vue d’ensemble" : onglet === "incidents" ? "Gestion des incidents" : "Gestion des utilisateurs"}</h1>
              <p>{onglet === "tableau"
                ? "Gardez une vue claire sur les signalements et l’activité des quartiers."
                : onglet === "incidents"
                  ? "Consultez les déclarations et modérez les incidents de la communauté."
                  : "Suivez les comptes des habitants et gérez leur accès à la plateforme."}</p>
            </div>
            <button className="coupure-bouton coupure-bouton--clair" disabled={chargement || operation} onClick={charger}>
              <RefreshCw size={17} className={chargement ? "coupure-tourne" : ""} />
              <span>{chargement ? "Actualisation..." : "Actualiser"}</span>
            </button>
          </div>

          {erreur && <div className="coupure-notification coupure-notification--erreur" role="alert"><AlertCircle size={19} /><span>{erreur}</span><button aria-label="Fermer" onClick={() => setErreur("")}><X size={16} /></button></div>}
          {message && <div className="coupure-notification coupure-notification--succes" role="status"><CheckCircle2 size={19} /><span>{message}</span><button aria-label="Fermer" onClick={() => setMessage("")}><X size={16} /></button></div>}
          {chargement && !tableau && <div className="coupure-chargement" role="status"><RefreshCw size={22} className="coupure-tourne" /> Chargement de votre espace de gestion…</div>}

          {onglet === "tableau" && tableau && (
            <>
              <section className="coupure-hero">
                <div className="coupure-hero__corps">
                  <div className="coupure-hero__etiquette"><Sparkles size={14} /> CENTRE DE SUIVI · TOLIARA</div>
                  <h2>Chaque signalement<br />compte<span>.</span></h2>
                  <p>Un seul espace pour suivre les coupures déclarées et mieux accompagner les habitants.</p>
                  <button type="button" className="coupure-hero__bouton" onClick={() => naviguer("incidents")}>
                    Gérer les incidents <ArrowRight size={17} />
                  </button>
                </div>
                <div className="coupure-hero__illustration" aria-hidden="true">
                  <div className="coupure-hero__cercle coupure-hero__cercle--externe" />
                  <div className="coupure-hero__cercle coupure-hero__cercle--interne" />
                  <div className="coupure-hero__goutte"><CoupureIcon name="logo" size={110} /></div>
                  <span className="coupure-hero__decor coupure-hero__decor--un" />
                  <span className="coupure-hero__decor coupure-hero__decor--deux" />
                </div>
                <div className="coupure-hero__mention"><span className="coupure-hero__mention-point" /> Données issues des habitants, non officielles</div>
              </section>

              <section className="coupure-metriques" aria-label="Indicateurs de la plateforme">
                <Metrique icon="logo" couleur="bleu" libelle="Incidents déclarés" valeur={total} details="Total enregistré" />
                <Metrique icon="maintenance" couleur="corail" libelle="Incidents en cours" valeur={enCours} details="En cours de suivi" />
                <Metrique icon="incidents" couleur="orange" libelle="À confirmer" valeur={attente} details="À examiner" />
                <Metrique icon="users" couleur="violet" libelle="Habitants inscrits" valeur={tableau.nombre_utilisateurs} details="Comptes habitants" />
              </section>

              <div className="coupure-grille-dashboard">
                <section className="coupure-carte">
                  <div className="coupure-carte__entete">
                    <div><span className="coupure-section-label">VUE GLOBALE</span><h3>État des signalements</h3><p>Répartition des incidents selon leur statut.</p></div>
                    <span className="coupure-carte__badge"><CoupureIcon name="dashboard" size={16} /> {total} au total</span>
                  </div>
                  <div className="coupure-repartition">
                    {Object.entries(STATUTS).map(([code, meta]) => {
                      const nombre = repartition[code] || 0;
                      const pourcentage = total > 0 ? (nombre / total) * 100 : 0;
                      return (
                        <div className="coupure-repartition__ligne" key={code}>
                          <div className="coupure-repartition__infos"><span className={"coupure-repartition__pastille coupure-repartition__pastille--" + meta.couleur} /><span className="coupure-repartition__nom">{meta.libelle}</span><strong>{nombre}</strong></div>
                          <div className="coupure-repartition__barre" role="progressbar" aria-label={meta.libelle} aria-valuenow={nombre} aria-valuemin={0} aria-valuemax={total}>
                            <span className={"coupure-repartition__niveau coupure-repartition__niveau--" + meta.couleur} style={{ width: pourcentage + "%" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="coupure-carte__pied"><CoupureIcon name="zones" size={18} /> <span>{tableau.nombre_zones} quartier(s) enregistré(s) dans la plateforme</span></div>
                </section>

                <section className="coupure-carte">
                  <div className="coupure-carte__entete">
                    <div><span className="coupure-section-label">ACTIVITÉ RÉCENTE</span><h3>Derniers incidents</h3><p>Les déclarations les plus récentes.</p></div>
                    <span className="coupure-carte__icone"><CoupureIcon name="notifications" size={28} /></span>
                  </div>
                  <div className="coupure-activite">
                    {tableau.incidents_recents?.length ? tableau.incidents_recents.map((incident) => (
                      <div className="coupure-activite__ligne" key={incident.id}>
                        <div className="coupure-activite__repere"><CoupureIcon name="zones" size={27} /></div>
                        <div className="coupure-activite__corps">
                          <div className="coupure-activite__titre"><strong>{incident.zone_nom || "Zone inconnue"}</strong><span>#{incident.id}</span></div>
                          <p>{dateFR(incident.date_creation, true)}</p>
                        </div>
                        <Statut valeur={incident.statut} />
                      </div>
                    )) : <EmptyState icon={Waves} titre="Aucun incident pour le moment" description="Les prochains signalements apparaîtront ici." />}
                  </div>
                  <button className="coupure-carte__voir" type="button" onClick={() => naviguer("incidents")}>
                    Consulter tous les incidents <ArrowRight size={17} />
                  </button>
                </section>
              </div>

              <div className="coupure-info-bas"><CircleHelp size={16} /><span>Les informations proviennent des contributions citoyennes. Elles ne remplacent pas les communications officielles du service d’eau.</span></div>
            </>
          )}

          {onglet === "incidents" && (
            <section className="coupure-carte coupure-carte--table">
              <div className="coupure-liste-header">
                <div><span className="coupure-section-label">MODÉRATION</span><h3>Liste des incidents</h3><p>Les 100 incidents les plus récents · {incidentsFiltres.length} résultat(s) affiché(s)</p></div>
                <span className="coupure-compteur">{incidents.length} incidents chargés</span>
              </div>
              <div className="coupure-filtres">
                <label className="coupure-recherche"><Search size={19} /><span className="coupure-visually-hidden">Rechercher un incident</span>
                  <input value={rechercheIncident} onChange={(e) => setRechercheIncident(e.target.value)} placeholder="Rechercher par quartier ou numéro…" />
                  {rechercheIncident && <button type="button" aria-label="Effacer la recherche" onClick={() => setRechercheIncident("")}><X size={16} /></button>}
                </label>
                <label className="coupure-select"><CoupureIcon name="settings" size={22} /><span className="coupure-visually-hidden">Filtrer par statut</span>
                  <select value={filtre} onChange={(e) => setFiltre(e.target.value)}>
                    <option value="TOUS">Tous les statuts</option>
                    {Object.entries(STATUTS).map(([code, meta]) => <option value={code} key={code}>{meta.libelle}</option>)}
                  </select>
                </label>
              </div>
              <div className="coupure-table-scroll">
                <table className="coupure-table">
                  <thead><tr><th>INCIDENT</th><th>QUARTIER</th><th>STATUT</th><th>CONFIANCE</th><th>SIGNALÉ LE</th><th className="coupure-table__actions">ACTION</th></tr></thead>
                  <tbody>
                    {incidentsFiltres.map((incident) => {
                      const confiance = Math.max(0, Math.min(100, Number(incident.score_confiance) || 0));
                      return (
                        <tr key={incident.id}>
                          <td><span className="coupure-reference"><CoupureIcon name="reports" size={17} /> #{incident.id}</span></td>
                          <td><div className="coupure-cellule-zone"><span className="coupure-cellule-zone__icone"><CoupureIcon name="zones" size={28} /></span><strong>{incident.zone_nom || "Zone inconnue"}</strong></div></td>
                          <td><Statut valeur={incident.statut} /></td>
                          <td><div className="coupure-confiance"><strong>{Math.round(confiance)} %</strong><div className="coupure-confiance__barre"><span style={{ width: confiance + "%" }} /></div></div></td>
                          <td className="coupure-date">{dateFR(incident.date_creation)}</td>
                          <td className="coupure-table__actions">
                            {incident.statut === "REJETE" ? (
                              <button className="coupure-bouton-action coupure-bouton-action--reouvrir" disabled={operation} onClick={() => ouvrirIncident(incident, "rouvrir")}><RefreshCw size={15} /> Rouvrir</button>
                            ) : incident.statut === "RETABLI" ? (
                              <span className="coupure-termine"><Check size={15} /> Clôturé</span>
                            ) : (
                              <button className="coupure-bouton-action coupure-bouton-action--danger" disabled={operation} onClick={() => ouvrirIncident(incident, "rejeter")}><XCircle size={15} /> Rejeter</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!incidentsFiltres.length && <tr><td colSpan={6}><EmptyState icon={Search} titre="Aucun incident trouvé" description="Essayez un autre quartier ou un autre filtre." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {onglet === "utilisateurs" && (
            <section className="coupure-carte coupure-carte--table">
              <div className="coupure-liste-header">
                <div><span className="coupure-section-label">COMMUNAUTÉ</span><h3>Comptes habitants</h3><p>Les 100 comptes les plus récents · {utilisateursFiltres.length} résultat(s) affiché(s)</p></div>
                <span className="coupure-compteur">{utilisateurs.length} comptes chargés</span>
              </div>
              <div className="coupure-filtres">
                <label className="coupure-recherche"><Search size={19} /><span className="coupure-visually-hidden">Rechercher un utilisateur</span>
                  <input value={rechercheCompte} onChange={(e) => setRechercheCompte(e.target.value)} placeholder="Rechercher un nom ou identifiant…" />
                  {rechercheCompte && <button type="button" aria-label="Effacer la recherche" onClick={() => setRechercheCompte("")}><X size={16} /></button>}
                </label>
                <div className="coupure-comptes-info"><ShieldCheck size={16} /> Comptes administrateurs protégés</div>
              </div>
              <div className="coupure-table-scroll">
                <table className="coupure-table">
                  <thead><tr><th>UTILISATEUR</th><th>NOM COMPLET</th><th>INSCRIPTION</th><th>ÉTAT DU COMPTE</th><th className="coupure-table__actions">ACTION</th></tr></thead>
                  <tbody>
                    {utilisateursFiltres.map((compte) => (
                      <tr key={compte.id}>
                        <td><div className="coupure-utilisateur"><span className="coupure-utilisateur__avatar"><CoupureIcon name="users" size={27} /></span><div><strong>{compte.username}</strong><small>Habitant</small></div></div></td>
                        <td>{[compte.first_name, compte.last_name].filter(Boolean).join(" ") || "—"}</td>
                        <td className="coupure-date">{dateFR(compte.date_joined)}</td>
                        <td><span className={"coupure-etat " + (compte.is_active ? "coupure-etat--retabli" : "coupure-etat--rejete")}><span className="coupure-etat__point" />{compte.is_active ? "Actif" : "Désactivé"}</span></td>
                        <td className="coupure-table__actions"><button className={"coupure-bouton-action " + (compte.is_active ? "coupure-bouton-action--danger" : "coupure-bouton-action--reouvrir")} disabled={operation} onClick={() => ouvrirCompte(compte)}>{compte.is_active ? <><XCircle size={15} /> Désactiver</> : <><CheckCircle2 size={15} /> Réactiver</>}</button></td>
                      </tr>
                    ))}
                    {!utilisateursFiltres.length && <tr><td colSpan={5}><EmptyState icon={Users} titre="Aucun utilisateur trouvé" description="Essayez un autre nom ou identifiant." /></td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <footer className="coupure-pied"><span>© 2026 Coupure · Plateforme participative de suivi des coupures d’eau</span><span>{derniereMaj ? "Données actualisées à " + derniereMaj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "En attente des données"}</span></footer>
        </div>
      </div>

      {confirmation && (
        <div className="coupure-modal-fond" onMouseDown={(e) => { if (e.target === e.currentTarget && !operation) setConfirmation(null); }}>
          <section className="coupure-modal" role="dialog" aria-modal="true" aria-labelledby="coupure-modal-titre" aria-describedby="coupure-modal-description">
            <div className={"coupure-modal__icone" + (actionDestructive ? " coupure-modal__icone--danger" : "")}>{actionDestructive ? <CoupureIcon name="incidents" size={34} /> : <CoupureIcon name="maintenance" size={34} />}</div>
            <button className="coupure-modal__fermer" aria-label="Fermer" disabled={operation} onClick={() => setConfirmation(null)}><X size={19} /></button>
            <h2 id="coupure-modal-titre">{confirmation.type === "incident"
              ? confirmation.action === "rejeter" ? "Rejeter cet incident ?" : "Rouvrir cet incident ?"
              : confirmation.cible.is_active ? "Désactiver cet utilisateur ?" : "Réactiver cet utilisateur ?"}</h2>
            <p id="coupure-modal-description">{confirmation.type === "incident"
              ? "Cette action modifiera le statut de l’incident #" + confirmation.cible.id + " et sera enregistrée dans l’historique administratif."
              : "Cette action modifiera l’accès à la plateforme pour le compte « " + confirmation.cible.username + " »."}</p>
            <div className="coupure-modal__boutons">
              <button className="coupure-bouton coupure-bouton--clair" ref={boutonAnnulerRef} disabled={operation} onClick={() => setConfirmation(null)}>Annuler</button>
              <button className={"coupure-bouton " + (actionDestructive ? "coupure-bouton--danger" : "coupure-bouton--primaire")} disabled={operation} onClick={executerAction}>
                {operation ? "Traitement…" : confirmation.type === "incident"
                  ? confirmation.action === "rejeter" ? "Rejeter l’incident" : "Rouvrir l’incident"
                  : confirmation.cible.is_active ? "Désactiver le compte" : "Réactiver le compte"}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
