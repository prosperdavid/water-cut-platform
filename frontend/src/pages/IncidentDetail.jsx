import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";

import {
  ArrowLeft,
  MapPin,
  Clock3,
  Users,
  Droplets,
  DropletOff,
  Home,
  Map,
  Plus,
  User,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

function IncidentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [incident, setIncident] = useState(null);
  const [position, setPosition] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("access_token");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const chargerIncident = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/incidents/${id}/`,
        { headers }
      );

      setIncident(response.data);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/");
      } else {
        setErreur(
          "Impossible de charger cet incident."
        );
      }
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    chargerIncident();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {
          setErreur(
            "Activez votre position GPS pour répondre à cet incident."
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    }
  }, [id]);

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

  const formaterDate = (date) => {
    if (!date) {
      return "Non renseignée";
    }

    return new Date(date).toLocaleString(
      "fr-FR",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const envoyerReponse = async (typeReponse) => {
    setMessage("");
    setErreur("");

    if (!position) {
      setErreur(
        "Votre position GPS est nécessaire pour répondre."
      );
      return;
    }

    setEnvoi(true);

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/confirmations/",
        {
          incident: Number(id),
          type_reponse: typeReponse,
          latitude: position.latitude,
          longitude: position.longitude,
        },
        { headers }
      );

      setMessage(
        response.data.message ||
          "Votre réponse a été enregistrée."
      );

      await chargerIncident();
    } catch (error) {
      console.error(error);

      const gpsErreur =
        error.response?.data?.gps;

      if (gpsErreur) {
        setErreur(
          Array.isArray(gpsErreur)
            ? gpsErreur[0]
            : gpsErreur
        );
      } else {
        setErreur(
          "Votre réponse n'a pas pu être enregistrée."
        );
      }
    } finally {
      setEnvoi(false);
    }
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

  if (!incident) {
    return (
      <main className="app-page">
        <div className="loading-page">
          Incident introuvable.
        </div>
      </main>
    );
  }

  return (
    <main className="app-page">
      <section className="mobile-app incident-detail-page">

        <header className="detail-header">
          <button
            onClick={() => navigate("/accueil")}
          >
            <ArrowLeft />
          </button>

          <h1>Incident</h1>
        </header>

        <section
          className={`incident-summary status-${incident.statut.toLowerCase()}`}
        >
          <div className="summary-title">
            <AlertTriangle />

            <div>
              <h2>
                {afficherStatut(
                  incident.statut
                )}
              </h2>

              <p>
                <MapPin size={17} />
                {incident.zone_nom}
              </p>
            </div>
          </div>

          <div className="confidence-card">
            <div className="confidence-line">
              <span>
                Confiance de l'information
              </span>

              <strong>
                {Math.round(
                  incident.score_confiance
                )}%
              </strong>
            </div>

            <div className="confidence-bar">
              <span
                style={{
                  width: `${Math.min(
                    100,
                    incident.score_confiance
                  )}%`,
                }}
              ></span>
            </div>
          </div>

          <div className="incident-stats">
            <div>
              <Clock3 />
              <span>Début</span>
              <strong>
                {formaterDate(
                  incident.date_debut
                )}
              </strong>
            </div>

            <div>
              <Users />
              <span>Signalements</span>
              <strong>
                {incident.nombre_signalements}
              </strong>
            </div>

            <div>
              <CheckCircle2 />
              <span>Confirmations</span>
              <strong>
                {incident.nombre_confirmations}
              </strong>
            </div>
          </div>
        </section>

        <section className="incident-follow">
          <h3>Suivi de l'incident</h3>

          <div className="follow-item completed">
            <span></span>

            <div>
              <strong>
                Premier signalement
              </strong>

              <p>
                {formaterDate(
                  incident.date_debut
                )}
              </p>
            </div>
          </div>

          {incident.statut !==
            "A_CONFIRMER" && (
            <div className="follow-item completed">
              <span></span>

              <div>
                <strong>
                  {incident.statut ===
                  "ACTIF"
                    ? "Coupure confirmée"
                    : "Évolution de l'incident"}
                </strong>

                <p>
                  Les déclarations des habitants
                  ont permis de faire évoluer
                  l'état de l'incident.
                </p>
              </div>
            </div>
          )}

          {incident.statut ===
            "RETABLI" && (
            <div className="follow-item restored">
              <span></span>

              <div>
                <strong>
                  Eau rétablie
                </strong>

                <p>
                  {formaterDate(
                    incident.date_fin
                  )}
                </p>
              </div>
            </div>
          )}
        </section>

        {incident.statut !== "RETABLI" &&
          incident.statut !== "REJETE" && (
            <section className="confirmation-section">
              <h3>
                Quelle est la situation chez vous ?
              </h3>

              <p>
                Votre réponse contribue à améliorer
                la fiabilité de l'incident.
              </p>

              {erreur && (
                <div className="report-error">
                  {erreur}
                </div>
              )}

              {message && (
                <div className="report-success">
                  ✓ {message}
                </div>
              )}

              <div className="confirmation-buttons">
                <button
                  className="no-water-button"
                  disabled={envoi}
                  onClick={() =>
                    envoyerReponse(
                      "COUPURE_CONFIRMEE"
                    )
                  }
                >
                  <DropletOff />
                  Je n'ai pas d'eau
                </button>

                <button
                  className="water-button"
                  disabled={envoi}
                  onClick={() =>
                    envoyerReponse(
                      "EAU_DISPONIBLE"
                    )
                  }
                >
                  <Droplets />
                  J'ai de l'eau
                </button>
              </div>

              <small className="confirmation-note">
                Vous pourrez modifier votre réponse
                plus tard.
              </small>
            </section>
          )}

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

export default IncidentDetail;