import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/apiConfig";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  Home,
  Map as MapIcon,
  Plus,
  Clock3,
  User,
  MapPin,
  LocateFixed,
  LoaderCircle,
} from "lucide-react";


const POSITION_TOLIARA = [-23.35, 43.67];

// Si la précision est supérieure à cette valeur,
// on considère la position comme trop imprécise.
const PRECISION_MAX_METRES = 100;


function creerIcone(couleur) {
  return L.divIcon({
    className: "",
    html: `
      <div
        style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: ${couleur};
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 900;
          font-size: 18px;
        "
      >
        !
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}


const iconeUtilisateur = L.divIcon({
  className: "",
  html: `
    <div
      style="
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #1689f8;
        border: 4px solid white;
        box-shadow: 0 3px 10px rgba(0,0,0,.35);
      "
    ></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});


const couleursStatut = {
  A_CONFIRMER: "#ff9f1a",
  ACTIF: "#ef3f48",
  RETABLISSEMENT_PROBABLE: "#278cff",
  RETABLI: "#22b573",
  REJETE: "#8997a8",
};


function ControleCarte({ destination, zoom = 16 }) {
  const map = useMap();

  useEffect(() => {
    if (destination) {
      map.flyTo(destination, zoom, {
        animate: true,
        duration: 1,
      });
    }
  }, [destination, zoom, map]);

  return null;
}


function Carte() {
  const navigate = useNavigate();

  const watchIdRef = useRef(null);
  const timerRef = useRef(null);

  const [incidents, setIncidents] = useState([]);
  const [filtre, setFiltre] = useState("TOUS");

  const [positionUtilisateur, setPositionUtilisateur] =
    useState(null);

  const [destinationCarte, setDestinationCarte] =
    useState(null);

  const [zoomCarte, setZoomCarte] = useState(16);

  const [recherchePosition, setRecherchePosition] =
    useState(false);

  const [messagePosition, setMessagePosition] =
    useState("");


  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get(`${API_BASE_URL}/api/incidents/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setIncidents(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [navigate]);


  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(
          watchIdRef.current
        );
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);


  const arreterRechercheGPS = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(
        watchIdRef.current
      );

      watchIdRef.current = null;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setRecherchePosition(false);
  };


  const traiterPosition = (pos) => {
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;
    const accuracy = pos.coords.accuracy;

    const nouvellePosition = {
      latitude,
      longitude,
      accuracy,
    };


    // On garde toujours la meilleure précision obtenue.
    setPositionUtilisateur((anciennePosition) => {
      if (
        !anciennePosition ||
        accuracy < anciennePosition.accuracy
      ) {
        return nouvellePosition;
      }

      return anciennePosition;
    });


    /*
      Une position très imprécise arrive souvent sur PC,
      lorsque Chrome utilise le réseau plutôt qu'un vrai GPS.
    */
    if (accuracy > PRECISION_MAX_METRES) {
      setMessagePosition(
        `Position détectée mais trop imprécise : ±${Math.round(
          accuracy
        )} m. Activez le GPS ou utilisez un smartphone.`
      );

      return;
    }


    setDestinationCarte([latitude, longitude]);

    // Plus la précision est bonne, plus on zoome.
    if (accuracy <= 20) {
      setZoomCarte(18);
    } else if (accuracy <= 50) {
      setZoomCarte(17);
    } else {
      setZoomCarte(16);
    }

    setMessagePosition(
      `Position GPS obtenue avec une précision d'environ ±${Math.round(
        accuracy
      )} m.`
    );


    /*
      Lorsque la précision devient excellente,
      on n'a plus besoin d'attendre d'autres mesures.
    */
    if (accuracy <= 20) {
      arreterRechercheGPS();
    }
  };


  const allerMaPosition = () => {
    if (!navigator.geolocation) {
      alert(
        "La géolocalisation n'est pas disponible sur cet appareil."
      );
      return;
    }


    // Stoppe une éventuelle recherche précédente.
    arreterRechercheGPS();

    setRecherchePosition(true);
    setMessagePosition(
      "Recherche de votre position GPS..."
    );


    watchIdRef.current =
      navigator.geolocation.watchPosition(
        traiterPosition,

        (erreur) => {
          arreterRechercheGPS();

          if (erreur.code === 1) {
            setMessagePosition(
              "Accès à la localisation refusé."
            );

            alert(
              "Autorisez la localisation précise dans votre navigateur."
            );
          } else if (erreur.code === 2) {
            setMessagePosition(
              "Votre position n'a pas pu être déterminée."
            );

            alert(
              "Activez le GPS de votre appareil puis réessayez."
            );
          } else if (erreur.code === 3) {
            setMessagePosition(
              "La recherche GPS a pris trop de temps."
            );
          } else {
            setMessagePosition(
              "Impossible de récupérer votre position."
            );
          }
        },

        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 20000,
        }
      );


    /*
      On laisse quelques secondes au smartphone
      pour améliorer progressivement la précision.
    */
    timerRef.current = setTimeout(() => {
      arreterRechercheGPS();

      setPositionUtilisateur((position) => {
        if (!position) {
          setMessagePosition(
            "Aucune position GPS fiable n'a été obtenue."
          );

          return position;
        }

        if (
          position.accuracy >
          PRECISION_MAX_METRES
        ) {
          setMessagePosition(
            `Position trop imprécise : ±${Math.round(
              position.accuracy
            )} m. Essayez dehors avec le GPS activé.`
          );
        }

        return position;
      });
    }, 15000);
  };


  const retournerToliara = () => {
    setDestinationCarte(POSITION_TOLIARA);
    setZoomCarte(14);
  };


  const incidentsFiltres =
    filtre === "TOUS"
      ? incidents
      : incidents.filter(
          (incident) =>
            incident.statut === filtre
        );


  const afficherStatut = (statut) => {
    const valeurs = {
      A_CONFIRMER: "À confirmer",
      ACTIF: "Coupure confirmée",
      RETABLISSEMENT_PROBABLE:
        "Rétablissement probable",
      RETABLI: "Eau rétablie",
      REJETE: "Rejeté",
    };

    return valeurs[statut] || statut;
  };


  return (
    <main className="app-page">
      <section className="mobile-app map-page">

        <header className="map-header">
          <h1>Carte des incidents</h1>

          <p>
            <MapPin size={18} />
            Toliara
          </p>
        </header>


        <div className="map-filters">
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
              filtre === "ACTIF" ? "active" : ""
            }
            onClick={() => setFiltre("ACTIF")}
          >
            Actifs
          </button>

          <button
            className={
              filtre === "A_CONFIRMER"
                ? "active"
                : ""
            }
            onClick={() =>
              setFiltre("A_CONFIRMER")
            }
          >
            À confirmer
          </button>

          <button
            className={
              filtre === "RETABLI"
                ? "active"
                : ""
            }
            onClick={() => setFiltre("RETABLI")}
          >
            Rétablis
          </button>
        </div>


        <div className="map-actions">
          <button
            className="my-location-button"
            onClick={allerMaPosition}
            disabled={recherchePosition}
          >
            {recherchePosition ? (
              <LoaderCircle size={18} />
            ) : (
              <LocateFixed size={18} />
            )}

            {recherchePosition
              ? "Localisation..."
              : "Ma position"}
          </button>

          <button
            className="toliara-button"
            onClick={retournerToliara}
          >
            <MapPin size={18} />
            Revenir à Toliara
          </button>
        </div>


        {messagePosition && (
          <div
            style={{
              margin: "8px 0 10px",
              padding: "10px 12px",
              borderRadius: "12px",
              background: "#eef7ff",
              color: "#315a7d",
              fontSize: "13px",
              lineHeight: "1.4",
            }}
          >
            {messagePosition}
          </div>
        )}


        <div className="real-map">
          <MapContainer
            center={POSITION_TOLIARA}
            zoom={14}
            style={{
              width: "100%",
              height: "100%",
            }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />


            <ControleCarte
              destination={destinationCarte}
              zoom={zoomCarte}
            />


            {incidentsFiltres.map(
              (incident) => (
                <Marker
                  key={incident.id}
                  position={[
                    Number(incident.latitude),
                    Number(incident.longitude),
                  ]}
                  icon={creerIcone(
                    couleursStatut[
                      incident.statut
                    ] || "#8997a8"
                  )}
                >
                  <Popup>
                    <div className="map-popup">
                      <strong>
                        {afficherStatut(
                          incident.statut
                        )}
                      </strong>

                      <p>
                        {incident.zone_nom}
                      </p>

                      <p>
                        Confiance :{" "}
                        {
                          incident.score_confiance
                        }{" "}
                        %
                      </p>

                      <button
                        onClick={() =>
                          navigate(
                            `/incidents/${incident.id}`
                          )
                        }
                      >
                        Voir les détails
                      </button>
                    </div>
                  </Popup>
                </Marker>
              )
            )}


            {positionUtilisateur && (
              <>
                <Circle
                  center={[
                    positionUtilisateur.latitude,
                    positionUtilisateur.longitude,
                  ]}
                  radius={
                    positionUtilisateur.accuracy
                  }
                  pathOptions={{
                    color: "#1689f8",
                    fillColor: "#1689f8",
                    fillOpacity: 0.12,
                    weight: 1,
                  }}
                />

                <Marker
                  position={[
                    positionUtilisateur.latitude,
                    positionUtilisateur.longitude,
                  ]}
                  icon={iconeUtilisateur}
                >
                  <Popup>
                    <div>
                      <strong>
                        Votre position
                      </strong>

                      <p>
                        Précision : ±
                        {Math.round(
                          positionUtilisateur.accuracy
                        )}{" "}
                        m
                      </p>

                      <small>
                        {positionUtilisateur.latitude.toFixed(
                          6
                        )}
                        ,{" "}
                        {positionUtilisateur.longitude.toFixed(
                          6
                        )}
                      </small>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

          </MapContainer>
        </div>


        <nav className="bottom-nav">
          <button
            onClick={() =>
              navigate("/accueil")
            }
          >
            <Home />
            <span>Accueil</span>
          </button>

          <button className="active">
            <MapIcon />
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

export default Carte;