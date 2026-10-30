import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/apiConfig";
import CoupureIcon from "../components/CoupureIcon";

import {
  Home,
  Map,
  Plus,
  Clock3,
  User,
  CalendarDays,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
} from "lucide-react";

function Historique() {
  const navigate = useNavigate();

  const [historique, setHistorique] = useState([]);
  const [filtre, setFiltre] = useState("TOUS");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get(
       `${API_BASE_URL}/api/auth/history/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        setHistorique(response.data);
      })
      .catch((error) => {
        console.error(error);

        if (error.response?.status === 401) {
          localStorage.clear();
          navigate("/");
        }
      })
      .finally(() => {
        setChargement(false);
      });
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

  const afficherReponse = (reponse) => {
    if (reponse === "COUPURE_CONFIRMEE") {
      return "Je n'ai pas d'eau";
    }

    if (reponse === "EAU_DISPONIBLE") {
      return "J'ai de l'eau";
    }

    return "Aucune réponse";
  };

  const formaterDate = (date) => {
    if (!date) {
      return "En cours";
    }

    return new Date(date).toLocaleString(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const elementsFiltres = historique.filter(
    (incident) => {
      if (filtre === "RETABLIS") {
        return incident.statut === "RETABLI";
      }

      if (filtre === "COUPURES") {
        return incident.statut !== "RETABLI";
      }

      return true;
    }
  );

  if (chargement) {
    return (
      <main className="app-page">
        <div className="loading-page">
          Chargement...
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="mobile-app history-page">

        <header className="history-header">
          <h1>Mon historique</h1>
          <p>Vos participations récentes</p>
        </header>

        <div className="history-filters">
          <button
            className={
              filtre === "TOUS" ? "active" : ""
            }
            onClick={() => setFiltre("TOUS")}
          >
            Tous
          </button>

          <button
            className={
              filtre === "COUPURES"
                ? "active"
                : ""
            }
            onClick={() =>
              setFiltre("COUPURES")
            }
          >
            Coupures
          </button>

          <button
            className={
              filtre === "RETABLIS"
                ? "active"
                : ""
            }
            onClick={() =>
              setFiltre("RETABLIS")
            }
          >
            Rétablis
          </button>
        </div>

        <section className="history-list">
          {elementsFiltres.length === 0 ? (
            <div className="history-empty">
              Aucun incident dans cet historique.
            </div>
          ) : (
            elementsFiltres.map((incident) => (
              <article
                key={incident.id}
                className={`history-card history-${incident.statut.toLowerCase()}`}
                onClick={() =>
                  navigate(
                    `/incidents/${incident.id}`
                  )
                }
              >
                <div className="history-card-top">
                  <div className="history-icon">
                    {incident.statut ===
                    "RETABLI" ? (
                      <CheckCircle2 />
                    ) : (
                      <AlertTriangle />
                    )}
                  </div>

                  <div className="history-main">
                    <h3>
                      {incident.zone_nom}
                    </h3>

                    <span className="history-status">
                      {afficherStatut(
                        incident.statut
                      )}
                    </span>
                  </div>
                </div>

                <div className="history-dates">
                  <CoupureIcon name="reports" size={18} />

                  <span>
                    {formaterDate(
                      incident.date_debut
                    )}
                  </span>

                  <span>→</span>

                  <span>
                    {formaterDate(
                      incident.date_fin
                    )}
                  </span>
                </div>

                <div className="history-user-info">
                  <p>
                    <User size={17} />

                    Vous avez signalé :
                    <strong>
                      {incident.ai_signale
                        ? " Oui"
                        : " Non"}
                    </strong>
                  </p>

                  <p>
                    <MessageCircle size={17} />

                    Votre réponse :
                    <strong>
                      {" "}
                      {afficherReponse(
                        incident.ma_reponse
                      )}
                    </strong>
                  </p>
                </div>
              </article>
            ))
          )}
        </section>

        <nav className="bottom-nav">
          <button
            onClick={() =>
              navigate("/accueil")
            }
          >
            <Home />
            <span>Accueil</span>
          </button>

          <button
            onClick={() =>
              navigate("/carte")
            }
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

          <button className="active">
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

export default Historique;