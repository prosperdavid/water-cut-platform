import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import MiniMap from "../components/MiniMap";
import { API_BASE_URL } from "../services/apiConfig";

import {
  ArrowLeft,
  MapPin,
  LocateFixed,
  Map,
  Clock3,
  MessageSquare,
  Send,
  Home,
  Plus,
  User,
} from "lucide-react";

function Signaler() {
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState("");
  const [position, setPosition] = useState(null);
  const [depuis, setDepuis] = useState("0");
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/zones/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setZones(response.data);

        if (response.data.length > 0) {
          setZoneId(response.data[0].id);
        }
      })
      .catch((error) => {
        console.error(error);
      });

    detecterPosition();
  }, []);

  const detecterPosition = () => {
    setErreur("");

    if (!navigator.geolocation) {
      setErreur(
        "La géolocalisation n'est pas disponible sur cet appareil."
      );
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {
        setErreur(
          "Impossible de détecter votre position. Autorisez l'accès au GPS."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  const envoyerSignalement = async (e) => {
    e.preventDefault();

    setMessage("");
    setErreur("");

    if (!position) {
      setErreur(
        "Votre position GPS est nécessaire pour signaler une coupure."
      );
      return;
    }

    if (!zoneId) {
      setErreur("Veuillez sélectionner une zone.");
      return;
    }

    setChargement(true);

    try {
      const donnees = {
        zone_id: Number(zoneId),
        latitude: position.latitude,
        longitude: position.longitude,
        commentaire,
      };

      if (depuis !== "0") {
        const minutes = Number(depuis);

        donnees.heure_debut_estimee = new Date(
          Date.now() - minutes * 60 * 1000
        ).toISOString();
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/signalements/`,
        donnees,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(response.data.message);
      setCommentaire("");

      setTimeout(() => {
        navigate("/accueil");
      }, 1500);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.clear();
        navigate("/");
        return;
      }

      setErreur(
        "Le signalement n'a pas pu être enregistré."
      );
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="app-page">
      <section className="mobile-app report-page">

        <header className="report-header">
          <button onClick={() => navigate("/accueil")}>
            <ArrowLeft />
          </button>

          <h1>Signaler une coupure</h1>
        </header>

        <section className="gps-card">
          <div className="gps-icon">
            <MapPin />
          </div>

          <div className="gps-info">
            <strong>Votre position</strong>

            {position ? (
              <>
                <span className="gps-ok">
                  ● Position détectée
                </span>

                <small>
                  {position.latitude.toFixed(6)},{" "}
                  {position.longitude.toFixed(6)}
                </small>
              </>
            ) : (
              <span>Position non détectée</span>
            )}
          </div>

          <button
            className="refresh-location"
            onClick={detecterPosition}
          >
            <LocateFixed size={18} />
            Actualiser
          </button>
        </section>

        <form
          className="report-form"
          onSubmit={envoyerSignalement}
        >
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

          <label>
            <Map size={20} />
            Zone
          </label>

          <select
            value={zoneId}
            onChange={(e) =>
              setZoneId(e.target.value)
            }
          >
            {zones.map((zone) => (
              <option
                key={zone.id}
                value={zone.id}
              >
                {zone.nom}
              </option>
            ))}
          </select>

          <label>
            <Clock3 size={20} />
            Depuis quand ?
          </label>

          <select
            value={depuis}
            onChange={(e) =>
              setDepuis(e.target.value)
            }
          >
            <option value="0">
              Maintenant
            </option>

            <option value="30">
              Il y a environ 30 minutes
            </option>

            <option value="60">
              Il y a environ 1 heure
            </option>

            <option value="120">
              Il y a environ 2 heures
            </option>
          </select>

          <label>
            <MessageSquare size={20} />
            Commentaire
            <span> (facultatif)</span>
          </label>

          <div className="comment-box">
            <textarea
              maxLength={250}
              value={commentaire}
              onChange={(e) =>
                setCommentaire(e.target.value)
              }
              placeholder="Ajoutez un détail sur la coupure..."
            />

            <small>
              {commentaire.length}/250
            </small>
          </div>

          <section className="position-preview">
            <h3>
              <Map size={20} />
              Aperçu de votre position
            </h3>

            <div className="signal-map-preview">
            <MiniMap
           position={position}
          height={180}
           />
      </div>
          </section>

          <button
            type="submit"
            className="submit-report"
            disabled={chargement || !position}
          >
            <Send size={21} />

            {chargement
              ? "Envoi..."
              : "Signaler la coupure"}
          </button>

          <div className="report-note">
            Votre signalement sera automatiquement
            rattaché à un incident proche si nécessaire.
          </div>
        </form>

        <nav className="bottom-nav">
          <button
            onClick={() => navigate("/accueil")}
          >
            <Home />
            <span>Accueil</span>
          </button>

          <button
            onClick={() => navigate("/carte")}
          >
            <Map />
            <span>Carte</span>
          </button>

          <button className="central-button active">
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
            onClick={() => navigate("/profil")}
          >
            <User />
            <span>Profil</span>
          </button>
        </nav>
      </section>
    </main>
  );
}

export default Signaler;