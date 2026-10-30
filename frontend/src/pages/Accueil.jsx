import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MiniMap from "../components/MiniMap";
import CoupureIcon from "../components/CoupureIcon";
import { API_BASE_URL } from "../services/apiConfig";

import {
  Map,
  MapPin,
  Plus,
  Home,
  Clock3,
  User,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  ShieldAlert,
  Activity,
} from "lucide-react";

function Accueil() {
  const navigate = useNavigate();

  const [profil, setProfil] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");

  useEffect(() => {
    const chargerDonnees = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      try {
        const [profilResponse, incidentsResponse] =
          await Promise.all([
            axios.get(
              `${API_BASE_URL}/api/auth/me/`,
              { headers }
            ),

            axios.get(
             `${API_BASE_URL}/api/incidents/`,
              { headers }
            ),
          ]);

        setProfil(profilResponse.data);
        setIncidents(incidentsResponse.data);
      } catch (error) {
        console.error(error);

        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/connexion");
        } else {
          setErreurChargement(
            "Impossible de charger les données. Vérifiez le serveur Django puis réessayez."
          );
        }
      } finally {
        setChargement(false);
      }
    };

    chargerDonnees();
  }, [navigate]);

  const afficherStatut = (statut) => {
    const statuts = {
      A_CONFIRMER: "À confirmer",
      ACTIF: "Coupure confirmée",
      RETABLISSEMENT_PROBABLE:
        "Rétablissement probable",
      RETABLI: "Eau rétablie",
      REJETE: "Rejeté",
    };

    return statuts[statut] || statut;
  };

  if (chargement) {
    return (
      <main className="app-page">
        <div className="loading-page">
          Chargement...
        </div>
      </main>
    );
  }

  if (erreurChargement) {
    return (
      <main className="app-page">
        <section className="mobile-app" role="alert">
          <div className="report-error">{erreurChargement}</div>
          <button type="button" className="report-main-button" onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </section>
      </main>
    );
  }

  const aConfirmer = incidents.filter((incident) => incident.statut === "A_CONFIRMER").length;
  const actifs = incidents.filter((incident) => incident.statut === "ACTIF").length;
  const retablis = incidents.filter((incident) => incident.statut === "RETABLI").length;

  const incidentsEnCours = incidents.filter(
    (incident) =>
      incident.statut !== "RETABLI" &&
      incident.statut !== "REJETE"
  );

  return (
    <main className="app-page">
      <section className="mobile-app home-dashboard">

        <header className="app-header">
          <div className="brand">
            <div className="brand-icon">
              <CoupureIcon name="logo" size={32} />
            </div>

            <div>
              <h2>Coupure</h2>
              <p>Toliara</p>
            </div>
          </div>

          <div className="welcome">
            <h1>
              Bonjour{" "}
              {profil?.first_name ||
                profil?.username ||
                "Habitant"}
            </h1>

            <p>
              <MapPin size={18} />
              Toliara
            </p>
          </div>
        </header>

        <section className="status-card">
          <div>
            <span className="small-title">
              Situation signalée à Toliara
            </span>

            <h3>
              {incidentsEnCours.length} incident(s)
              en cours
            </h3>
          </div>

          <span className="status-badge">
            {incidentsEnCours.length > 0
              ? "Signalements en cours"
              : "Aucun signalement actif"}
          </span>
        </section>

        <section className="home-highlights" aria-label="Synthèse des signalements">
          <article className="home-highlights__item">
            <Activity size={22} aria-hidden="true" />
            <div><strong>{actifs}</strong><span>Coupures confirmées</span></div>
          </article>
          <article className="home-highlights__item home-highlights__item--warn">
            <ShieldAlert size={22} aria-hidden="true" />
            <div><strong>{aConfirmer}</strong><span>À confirmer</span></div>
          </article>
          <article className="home-highlights__item home-highlights__item--safe">
            <CheckCircle2 size={22} aria-hidden="true" />
            <div><strong>{retablis}</strong><span>Eau rétablie</span></div>
          </article>
        </section>

        <section className="map-preview">
          <div className="section-heading">
            <h3>
              <Map size={21} />
              Carte des incidents
            </h3>

            <button
              onClick={() => navigate("/carte")}
            >
              Voir la carte
            </button>
          </div>

         <div className="home-real-map">
  <MiniMap
    incidents={incidents}
    height={220}
  />
</div>
        </section>

        <section className="nearby-section">
          <div className="section-heading">
            <h3>
              <AlertTriangle size={21} />
              Incidents récents
            </h3>
          </div>

          {incidents.length === 0 ? (
            <p className="empty-message">
              Aucun incident signalé pour le moment.
            </p>
          ) : (
            incidents
              .slice(0, 2)
              .map((incident) => (
                <article
                  className={"incident-card incident-card--" + incident.statut.toLowerCase()}
                  key={incident.id}
                >
                  <div className="incident-icon"><AlertTriangle size={22} aria-hidden="true" /></div>

                  <div className="incident-info">
                    <strong>
                      {afficherStatut(
                        incident.statut
                      )}
                    </strong>

                    <span>
                      {incident.zone_nom}
                    </span>

                    <small>
                      Confiance :{" "}
                      {incident.score_confiance} %
                    </small>
                  </div>

                  <button
                    onClick={() =>
                      navigate(
                        `/incidents/${incident.id}`
                      )
                    }
                   aria-label={"Voir l’incident " + incident.id}>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                </article>
              ))
          )}
        </section>

        <button
          className="report-main-button"
          onClick={() => navigate("/signaler")}
        >
          <Plus size={24} />
          Signaler une coupure
        </button>

        <nav className="bottom-nav">
          <button className="active">
            <Home />
            <span>Accueil</span>
          </button>

          <button
            onClick={() => navigate("/carte")}
          >
            <Map />
            <span>Carte</span>
          </button>

          <button
            className="central-button"
            onClick={() =>
              navigate("/signaler")
            }
          >
            <Plus />
            <span>Signaler</span>
          </button>

          <button
            onClick={() =>
              navigate("/historique")
            }
          >
            <Clock3 />
            <span>Historique</span>
          </button>

          <button
            onClick={() =>
              navigate("/profil")
            }
          >
            <User />
            <span>Profil</span>
          </button>
        </nav>

      </section>
    </main>
  );
}

export default Accueil;