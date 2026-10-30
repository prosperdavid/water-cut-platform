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
  const [etape, setEtape] = useState(1);
  const [typeSignalement, setTypeSignalement] = useState("COUPURE");
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
       latitude: Number(position.latitude.toFixed(6)),
       longitude: Number(position.longitude.toFixed(6)),
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
      <section className="mobile-app report-page reference-report-page">
        <header className="report-header">
          <button type="button" aria-label="Revenir à l'accueil" onClick={() => navigate("/accueil")}><ArrowLeft size={21} /></button>
          <div>
            <h1>Signaler une coupure</h1>
            <p>Votre information aide votre quartier.</p>
          </div>
        </header>

        <div className="reference-steps" aria-label="Étapes du signalement">
          {[["Informations",1],["Localisation",2],["Confirmation",3]].map(([label,index])=>(
            <div key={index} className={"reference-step" + (etape===index?" current":"") + (etape>index?" completed":"")}>
              <span className="reference-step-number">{index}</span><small>{label}</small>
            </div>
          ))}
        </div>

        <form className="report-form reference-report-form" onSubmit={envoyerSignalement}>
          {erreur && <div className="report-error" role="alert">{erreur}</div>}
          {message && <div className="report-success" role="status">{message}</div>}

          {etape===1 && (
            <div className="reference-report-step-panel">
              <div className="reference-field-group">
                <h2>Type de signalement</h2>
                <div className="reference-report-options" role="radiogroup" aria-label="Type de signalement">
                  <button type="button" role="radio" aria-checked={typeSignalement==="COUPURE"}
                    className={"reference-report-option" + (typeSignalement==="COUPURE"?" selected":"")}
                    onClick={()=>setTypeSignalement("COUPURE")}>
                    <span className="reference-option-icon danger"><MapPin size={20}/></span>
                    <span><strong>Coupure d'eau</strong><small>Actuellement sans eau</small></span>
                    <span className="reference-option-check">{typeSignalement==="COUPURE"?"✓":""}</span>
                  </button>
                  <button type="button" role="radio" aria-checked={typeSignalement==="RETOUR"}
                    className={"reference-report-option" + (typeSignalement==="RETOUR"?" selected":"")}
                    onClick={()=>setTypeSignalement("RETOUR")}>
                    <span className="reference-option-icon success"><Clock3 size={20}/></span>
                    <span><strong>Retour de l'eau</strong><small>Confirmer un rétablissement</small></span>
                    <span className="reference-option-check">{typeSignalement==="RETOUR"?"✓":""}</span>
                  </button>
                  <button type="button" role="radio" aria-checked={typeSignalement==="AUTRE"}
                    className={"reference-report-option" + (typeSignalement==="AUTRE"?" selected":"")}
                    onClick={()=>setTypeSignalement("AUTRE")}>
                    <span className="reference-option-icon neutral"><MessageSquare size={20}/></span>
                    <span><strong>Autre</strong><small>Autre problème lié à l'eau</small></span>
                    <span className="reference-option-check">{typeSignalement==="AUTRE"?"✓":""}</span>
                  </button>
                </div>
                {typeSignalement!=="COUPURE" && (
                  <div className="reference-report-info">
                    {typeSignalement==="RETOUR"
                      ? "Pour confirmer le retour de l'eau, ouvrez l'incident concerné sur la carte et indiquez que vous avez de l'eau."
                      : "Les autres types de problèmes ne disposent pas encore d'un formulaire dédié. Seules les coupures peuvent être enregistrées ici."}
                    {typeSignalement==="RETOUR"&&
                      <button type="button" onClick={()=>navigate("/carte")}>Voir les incidents <ArrowLeft size={14} /></button>}
                  </div>
                )}
              </div>

              {typeSignalement==="COUPURE" && <>
                <div className="reference-field-group">
                  <label htmlFor="reference-zone">Quartier <span className="reference-required">*</span></label>
                  <select id="reference-zone" value={zoneId} onChange={e=>setZoneId(e.target.value)}>
                    <option value="">{rechercheQuartier?"Détection du quartier...":"Sélectionner un quartier"}</option>
                    {zones.map(zone=><option value={zone.id} key={zone.id}>{zone.nom}</option>)}
                  </select>
                  {quartierDetecte && <p className="reference-field-note"><MapPin size={14}/> Quartier détecté : {quartierDetecte}</p>}
                </div>
                <div className="reference-field-group">
                  <label htmlFor="reference-duration">Depuis quand ?</label>
                  <select id="reference-duration" value={depuis} onChange={e=>setDepuis(e.target.value)}>
                    <option value="0">Maintenant</option>
                    <option value="30">Depuis environ 30 minutes</option>
                    <option value="60">Depuis environ 1 heure</option>
                    <option value="120">Depuis environ 2 heures</option>
                  </select>
                </div>
                <div className="reference-field-group">
                  <label htmlFor="reference-description">Description <span className="reference-optional">(optionnel)</span></label>
                  <textarea id="reference-description" maxLength={250} value={commentaire} onChange={e=>setCommentaire(e.target.value)} placeholder="Décrivez la situation..." rows={4}/>
                  <small className="reference-character-count">{commentaire.length}/250</small>
                </div>
                <button type="button" className="reference-next-button" onClick={()=>{
                  if(!zoneId){setErreur("Veuillez sélectionner un quartier avant de continuer.");return;}
                  setErreur("");setEtape(2);
                }}>Suivant <Send size={17}/></button>
              </>}
            </div>
          )}

          {etape===2 && (
            <div className="reference-report-step-panel">
              <h2>Vérifiez votre localisation</h2>
              <p className="reference-step-description">Le GPS permet de relier votre signalement au bon secteur.</p>
              <div className="gps-card">
                <div className="gps-icon"><MapPin size={21}/></div>
                <div className="gps-info">
                  <strong>Votre position</strong>
                  {position ? <span className="gps-ok">Position détectée · {position.latitude.toFixed(5)}, {position.longitude.toFixed(5)}</span>
                    : <span>{recherchePosition ? "Recherche de la position..." : "Position non détectée"}</span>}
                  {position?.accuracy && <small>Précision approximative : {Math.round(position.accuracy)} m</small>}
                  {rechercheQuartier && <small>Identification du quartier...</small>}
                </div>
                <button type="button" className="refresh-location" disabled={recherchePosition||rechercheQuartier} onClick={()=>detecterPosition()}>
                  <LocateFixed size={17}/>{recherchePosition?"Localisation...":"Actualiser"}
                </button>
              </div>
              <div className="reference-location-preview"><MiniMap position={position} height={300}/></div>
              {!position && <p className="reference-field-note">Autorisez la localisation dans votre navigateur pour continuer.</p>}
              <div className="reference-form-actions">
                <button type="button" className="reference-back-button" onClick={()=>setEtape(1)}>Retour</button>
                <button type="button" className="reference-next-button" disabled={!position||rechercheQuartier} onClick={()=>{setErreur("");setEtape(3);}}>Suivant <Send size={16}/></button>
              </div>
            </div>
          )}

          {etape===3 && (
            <div className="reference-report-step-panel">
              <h2>Confirmer votre signalement</h2>
              <p className="reference-step-description">Vérifiez les informations avant l'envoi.</p>
              <div className="reference-report-summary">
                <div><span>Type</span><strong>Coupure d'eau</strong></div>
                <div><span>Quartier</span><strong>{zones.find(z=>String(z.id)===String(zoneId))?.nom||"Non renseigné"}</strong></div>
                <div><span>Début estimé</span><strong>{depuis==="0"?"Maintenant":`Il y a ${depuis} minutes`}</strong></div>
                <div><span>Localisation</span><strong>{position?"GPS détecté":"Non disponible"}</strong></div>
                {commentaire&&<div><span>Description</span><strong>{commentaire}</strong></div>}
              </div>
              <p className="reference-report-consent">Les informations transmises seront utilisées pour suivre les incidents de votre quartier.</p>
              <div className="reference-form-actions">
                <button type="button" className="reference-back-button" onClick={()=>setEtape(2)}>Retour</button>
                <button type="submit" className="reference-next-button" disabled={chargement||!position||!zoneId||rechercheQuartier}>
                  {chargement?"Envoi...":"Envoyer le signalement"} <Send size={17}/>
                </button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}

export default Signaler;