import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const POSITION_TOLIARA = [-23.35, 43.67];
const couleurs = {
  A_CONFIRMER: "#f29a33",
  ACTIF: "#e83c47",
  RETABLISSEMENT_PROBABLE: "#f29a33",
  RETABLI: "#29a17d",
  REJETE: "#8495a4",
};

function iconIncident(statut, signalements) {
  const color = couleurs[statut] || couleurs.A_CONFIRMER;
  const count = Math.max(0, Number(signalements) || 0);
  const label = count > 1 ? String(Math.min(count, 99)) : "";
  return L.divIcon({
    className: "coupure-map-marker",
    html: `<span style="display:grid;place-items:center;width:36px;height:36px;border-radius:50%;border:3px solid white;box-shadow:0 2px 0 7px ${color}30,0 4px 18px #12364237;background:${color};color:white;font-size:13px;font-weight:800;">${label || "●"}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const utilisateurIcon = L.divIcon({
  className: "coupure-user-marker",
  html: '<span style="display:block;width:20px;height:20px;border-radius:50%;background:#148bb6;border:4px solid white;box-shadow:0 2px 10px #063e5380;"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function ResizeMap({ position }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [map]);
  useEffect(() => {
    if (position && Number.isFinite(Number(position.latitude)) && Number.isFinite(Number(position.longitude))) {
      map.setView([Number(position.latitude), Number(position.longitude)], 16);
    }
  }, [map, position]);
  return null;
}

export default function MiniMap({ incidents = [], position = null, height = 210, interactive = false, onIncidentClick }) {
  const center = position && Number.isFinite(Number(position.latitude)) && Number.isFinite(Number(position.longitude))
    ? [Number(position.latitude), Number(position.longitude)]
    : POSITION_TOLIARA;
  const visibles = incidents.filter(i => Number.isFinite(Number(i.latitude)) && Number.isFinite(Number(i.longitude)) && i.latitude != null && i.longitude != null);

  return (
    <MapContainer
      center={center}
      zoom={position ? 16 : 13}
      zoomControl={false}
      attributionControl
      dragging={interactive}
      scrollWheelZoom={false}
      doubleClickZoom={interactive}
      style={{ width: "100%", height: interactive ? "100%" : `${height}px` }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ResizeMap position={position} />
      {interactive && <ZoomControl position="topleft" />}
      {visibles.map(incident => (
        <Marker key={incident.id} position={[Number(incident.latitude), Number(incident.longitude)]}
          icon={iconIncident(incident.statut, incident.nombre_signalements)}>
          {interactive && (
            <Popup>
              <div className="coupure-map-popup">
                <strong>{incident.zone_nom || "Incident"}</strong>
                <p>{incident.statut === "ACTIF" ? "Coupure confirmée" : incident.statut === "RETABLI" ? "Eau rétablie" : "À confirmer"}</p>
                {onIncidentClick && <button type="button" onClick={() => onIncidentClick(incident)}>Voir les détails</button>}
              </div>
            </Popup>
          )}
        </Marker>
      ))}
      {position && <Marker position={center} icon={utilisateurIcon}/>}
    </MapContainer>
  );
}
