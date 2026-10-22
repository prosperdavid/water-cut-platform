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

  const [quartierDetecte, setQuartierDetecte] = useState("");
  const [recherchePosition, setRecherchePosition] = useState(false);
  const [rechercheQuartier, setRechercheQuartier] = useState(false);

  const [depuis, setDepuis] = useState("0");
  const [commentaire, setCommentaire] = useState("");
  const [chargement, setChargement] = useState(false);

  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const token = localStorage.getItem("access_token");

  const normaliserTexte = (texte = "") => {
    return texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  };

  const trouverZoneCorrespondante = (quartier, listeZones) => {
    if (!quartier || !listeZones?.length) {
      return null;
    }

    const quartierNormalise = normaliserTexte(quartier);

    const correspondance = listeZones.find((zone) => {
      const nomZone = normaliserTexte(zone.nom);

      return (
        nomZone === quartierNormalise ||
        quartierNormalise.includes(nomZone) ||
        nomZone.includes(quartierNormalise)
      );
    });

    if (correspondance) {
      return correspondance;
    }

    return listeZones.find((zone) =>
      normaliserTexte(zone.nom).includes("autre zone")
    );
  };

  const appliquerZoneAutomatique = (quartier, listeZones = zones) => {
    const zoneTrouvee = trouverZoneCorrespondante(
      quartier,
      listeZones
    );

    if (zoneTrouvee) {
      setZoneId(String(zoneTrouvee.id));
    }
  };

  const detecterQuartier = async (
    latitude,
    longitude,
    listeZones = zones
  ) => {
    setRechercheQuartier(true);
    setQuartierDetecte("");

    try {
      const params = new URLSearchParams({
        format: "jsonv2",
        lat: String(latitude),
        lon: String(longitude),
        zoom: "14",
        addressdetails: "1",
        layer: "address",
        "accept-language": "fr",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Erreur de géocodage");
      }

      const data = await response.json();
      const adresse = data.address || {};

      const quartier =
        adresse.neighbourhood ||
        adresse.quarter ||
        adresse.suburb ||
        adresse.city_district ||
        adresse.district ||
        adresse.borough ||
        adresse.village ||
        adresse.hamlet ||
        adresse.residential ||
        "";

      if (quartier) {
        setQuartierDetecte(quartier);
        appliquerZoneAutomatique(quartier, listeZones);
      } else {
        setQuartierDetecte("Quartier non identifié");

        const zoneAutre = listeZones.find((zone) =>
          normaliserTexte(zone.nom).includes("autre zone")
        );

        if (zoneAutre) {
          setZoneId(String(zoneAutre.id));
        }
      }
    } catch (error) {
      console.error(
        "Erreur lors de la détection du quartier :",
        error
      );

      setQuartierDetecte("Quartier non identifié");

      const zoneAutre = listeZones.find((zone) =>
        normaliserTexte(zone.nom).includes("autre zone")
      );

      if (zoneAutre) {
        setZoneId(String(zoneAutre.id));
      }
    } finally {
      setRechercheQuartier(false);
    }
  };

  const detecterPosition = (listeZones = zones) => {
    setErreur("");
    setRecherchePosition(true);

    if (!navigator.geolocation) {
      setErreur(
        "La géolocalisation n'est pas disponible sur cet appareil."
      );

      setRecherchePosition(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const nouvellePosition = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Number.isFinite(pos.coords.accuracy)
            ? pos.coords.accuracy
            : null,
        };

        setPosition(nouvellePosition);
        setRecherchePosition(false);

        await detecterQuartier(
          nouvellePosition.latitude,
          nouvellePosition.longitude,
          listeZones
        );
      },

      (error) => {
        setRecherchePosition(false);

        if (error.code === error.PERMISSION_DENIED) {
          setErreur(
            "L'accès au GPS a été refusé. Autorisez la localisation dans votre navigateur."
          );
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErreur(
            "Votre position GPS est actuellement indisponible."
          );
        } else if (error.code === error.TIMEOUT) {
          setErreur(
            "La détection GPS a pris trop de temps. Réessayez."
          );
        } else {
          setErreur(
            "Impossible de détecter votre position."
          );
        }
      },

      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  };

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
        const listeZones = Array.isArray(response.data)
          ? response.data
          : response.data.results || [];

        setZones(listeZones);

        detecterPosition(listeZones);
      })
      .catch((error) => {
        console.error(error);

        setErreur(
          "Impossible de récupérer la liste des zones."
        );
      });
  }, []);

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
      setErreur(
        "Aucune zone n'a été détectée. Veuillez sélectionner une zone."
      );

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

                {position.accuracy && (
                  <small>
                    Précision : environ{" "}
                    {Math.round(position.accuracy)} m
                  </small>
                )}

                {rechercheQuartier ? (
                  <small>
                    Recherche du quartier...
                  </small>
                ) : quartierDetecte ? (
                  <small>
                    Quartier : {quartierDetecte}
                  </small>
                ) : null}
              </>
            ) : recherchePosition ? (
              <span>
                Recherche de votre position...
              </span>
            ) : (
              <span>Position non détectée</span>
            )}
          </div>

          <button
            type="button"
            className="refresh-location"
            onClick={() => detecterPosition()}
            disabled={
              recherchePosition || rechercheQuartier
            }
          >
            <LocateFixed size={18} />

            {recherchePosition
              ? "Localisation..."
              : "Actualiser"}
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
            <option value="">
              {rechercheQuartier
                ? "Détection automatique..."
                : "Sélectionnez une zone"}
            </option>

            {zones.map((zone) => (
              <option
                key={zone.id}
                value={zone.id}
              >
                {zone.nom}
              </option>
            ))}
          </select>

          {quartierDetecte && (
            <small
              style={{
                display: "block",
                marginTop: "6px",
              }}
            >
              📍 Quartier détecté automatiquement :{" "}
              <strong>{quartierDetecte}</strong>
            </small>
          )}

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
            disabled={
              chargement ||
              !position ||
              rechercheQuartier
            }
          >
            <Send size={21} />

            {chargement
              ? "Envoi..."
              : "Signaler la coupure"}
          </button>

          <div className="report-note">
            Votre position GPS est utilisée pour
            détecter automatiquement votre quartier
            et rattacher votre signalement à un
            incident proche.
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