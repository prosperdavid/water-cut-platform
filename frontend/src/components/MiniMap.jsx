import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


const POSITION_TOLIARA = [-23.35, 43.67];


const couleursStatut = {
  A_CONFIRMER: "#ff9f1a",
  ACTIF: "#ef3f48",
  RETABLISSEMENT_PROBABLE: "#278cff",
  RETABLI: "#22b573",
  REJETE: "#8997a8",
};


function creerIcone(couleur) {
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${couleur};
        border: 3px solid white;
        box-shadow: 0 3px 9px rgba(0,0,0,.25);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: 900;
      ">
        !
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}


const iconeUtilisateur = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #1689f8;
      border: 4px solid white;
      box-shadow: 0 3px 9px rgba(0,0,0,.25);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});


function RecentrerMiniCarte({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(
        [
          position.latitude,
          position.longitude,
        ],
        16
      );
    }
  }, [position, map]);

  return null;
}


function MiniMap({
  incidents = [],
  position = null,
  height = 210,
}) {
  const centre = position
    ? [
        position.latitude,
        position.longitude,
      ]
    : POSITION_TOLIARA;

  return (
    <MapContainer
      center={centre}
      zoom={position ? 16 : 14}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      attributionControl={false}
      style={{
        width: "100%",
        height: `${height}px`,
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <RecentrerMiniCarte
        position={position}
      />

      {incidents.map((incident) => (
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
        />
      ))}

      {position && (
        <Marker
          position={[
            position.latitude,
            position.longitude,
          ]}
          icon={iconeUtilisateur}
        />
      )}
    </MapContainer>
  );
}


export default MiniMap;