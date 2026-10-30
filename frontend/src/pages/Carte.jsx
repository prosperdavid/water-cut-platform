import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/apiConfig";
import CoupureIcon from "../components/CoupureIcon";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
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
  LocateFixed,
  Search,
} from "lucide-react";


const POSITION_TOLIARA = [-23.35, 43.67];


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


function ControleCarte({
  destination,
  zoom = 16,
}) {
  const map = useMap();

  useEffect(() => {
    if (destination) {
      map.flyTo(destination, zoom, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [destination, zoom, map]);

  return null;
}


function Carte() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const searchTerm = new URLSearchParams(search).get("q") || "";
  const [recherche, setRecherche] = useState(searchTerm);
  useEffect(() => { setRecherche(searchTerm); }, [searchTerm]);

  const [incidents, setIncidents] =
    useState([]);

  const [filtre, setFiltre] =
    useState("TOUS");

  const [
    positionUtilisateur,
    setPositionUtilisateur,
  ] = useState(null);

  const [
    destinationCarte,
    setDestinationCarte,
  ] = useState(null);

  const [zoomCarte, setZoomCarte] =
    useState(16);

  const [
    recherchePosition,
    setRecherchePosition,
  ] = useState(false);

  const [
    messagePosition,
    setMessagePosition,
  ] = useState("");


  useEffect(() => {
    const token =
      localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get(
        `${API_BASE_URL}/api/incidents/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        setIncidents(response.data);
      })
      .catch((error) => {
        console.error(
          "Erreur chargement incidents :",
          error
        );
      });
  }, [navigate]);


  const allerMaPosition = () => {
    if (!navigator.geolocation) {
      alert(
        "La géolocalisation n'est pas disponible sur cet appareil."
      );
      return;
    }

    setRecherchePosition(true);

    setMessagePosition(
      "Recherche de votre position GPS..."
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(
          pos.coords.latitude
        );

        const longitude = Number(
          pos.coords.longitude
        );

        const accuracy = Number(
          pos.coords.accuracy
        );


        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          setRecherchePosition(false);

          setMessagePosition(
            "La position GPS reçue est invalide."
          );

          return;
        }


        setPositionUtilisateur({
          latitude,
          longitude,
          accuracy: Number.isFinite(
            accuracy
          )
            ? accuracy
            : null,
        });


        setDestinationCarte([
          latitude,
          longitude,
        ]);


        if (
          Number.isFinite(accuracy) &&
          accuracy <= 20
        ) {
          setZoomCarte(18);
        } else if (
          Number.isFinite(accuracy) &&
          accuracy <= 50
        ) {
          setZoomCarte(17);
        } else {
          setZoomCarte(16);
        }


        if (
          Number.isFinite(accuracy)
        ) {
          setMessagePosition(
            `Votre position a été détectée avec une précision d'environ ±${Math.round(
              accuracy
            )} m.`
          );
        } else {
          setMessagePosition(
            "Votre position a été détectée."
          );
        }

        setRecherchePosition(false);
      },

      (erreur) => {
        console.error(
          "Erreur géolocalisation :",
          erreur
        );

        setRecherchePosition(false);

        if (erreur.code === 1) {
          setMessagePosition(
            "Localisation refusée. Autorisez la position précise pour ce site."
          );
        } else if (
          erreur.code === 2
        ) {
          setMessagePosition(
            "Impossible de déterminer votre position. Vérifiez que le GPS est activé."
          );
        } else if (
          erreur.code === 3
        ) {
          setMessagePosition(
            "La localisation prend trop de temps. Réessayez."
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
  };


  const retournerToliara = () => {
    setDestinationCarte(
      POSITION_TOLIARA
    );

    setZoomCarte(14);
  };


  const incidentsFiltres = incidents.filter((incident) => {
    const matchesStatus = filtre === "TOUS" || incident.statut === filtre;
    const matchesSearch = !recherche.trim() || (incident.zone_nom || "")
      .normalize("NFD").replace(/\p{Diacritic}/gu, "")
      .toLowerCase().includes(
        recherche.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase()
      );
    return matchesStatus && matchesSearch && incident.statut !== "REJETE" &&
      Number.isFinite(Number(incident.latitude)) &&
      Number.isFinite(Number(incident.longitude));
  });


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
            <CoupureIcon name="zones" size={18} />
            Toliara
          </p>
        </header>


        <label className="reference-map-search">
          <Search size={17} aria-hidden="true"/>
          <input aria-label="Rechercher un quartier sur la carte" value={recherche}
            onChange={event=>setRecherche(event.target.value)} placeholder="Rechercher un quartier..."/>
          {recherche && <button type="button" aria-label="Effacer la recherche" onClick={()=>setRecherche("")}>×</button>}
        </label>

        <div className="map-filters">
          <button
            className={
              filtre === "TOUS"
                ? "active"
                : ""
            }
            onClick={() =>
              setFiltre("TOUS")
            }
          >
            Tous
          </button>

          <button
            className={
              filtre === "ACTIF"
                ? "active"
                : ""
            }
            onClick={() =>
              setFiltre("ACTIF")
            }
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
            onClick={() =>
              setFiltre("RETABLI")
            }
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
            <LocateFixed size={18} />

            {recherchePosition
              ? "Localisation..."
              : "Ma position"}
          </button>


          <button
            className="toliara-button"
            onClick={retournerToliara}
          >
            <CoupureIcon name="zones" size={18} />
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


        <p className="reference-map-count" aria-live="polite">
          {incidentsFiltres.length} incident{incidentsFiltres.length>1?"s":""} correspondant aux filtres
        </p>
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
              destination={
                destinationCarte
              }
              zoom={zoomCarte}
            />


            {incidentsFiltres.map(
              (incident) => (
                <Marker
                  key={incident.id}
                  position={[
                    Number(
                      incident.latitude
                    ),
                    Number(
                      incident.longitude
                    ),
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
                        {
                          incident.zone_nom
                        }
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

                    {positionUtilisateur.accuracy !==
                      null && (
                      <p>
                        Précision : ±
                        {Math.round(
                          positionUtilisateur.accuracy
                        )}{" "}
                        m
                      </p>
                    )}

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