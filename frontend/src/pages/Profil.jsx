import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/apiConfig";
import { ArrowLeft, UserRound, Phone, Mail, ShieldCheck, BarChart3, LogOut, ChevronRight, Bell, Globe2, Info, MessageSquareText } from "lucide-react";

export default function Profil() {
  const navigate=useNavigate();
  const infoRef=useRef(null);
  const [profil,setProfil]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    let active=true;
    const token=localStorage.getItem("access_token");
    if(!token){navigate("/connexion");return undefined;}
    axios.get(`${API_BASE_URL}/api/auth/me/`,{headers:{Authorization:`Bearer ${token}`}})
      .then(({data})=>{if(active)setProfil(data);})
      .catch(err=>{
        if(!active)return;
        if(err.response?.status===401)navigate("/connexion");
        else setError("Impossible de charger votre profil. Vérifiez le serveur Django.");
      }).finally(()=>{if(active)setLoading(false);});
    return ()=>{active=false;};
  },[navigate]);

  const deconnexion=()=>{
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/connexion");
  };
  const name=[profil?.first_name,profil?.last_name].filter(Boolean).join(" ") || profil?.username || "Habitant";
  const initials=name.split(" ").slice(0,2).map(w=>w[0]||"").join("").toUpperCase();

  if(loading)return <div className="reference-loading">Chargement du profil...</div>;
  if(error||!profil)return <div className="reference-feedback" role="alert"><strong>Profil indisponible</strong><p>{error||"Votre profil n'a pas pu être chargé."}</p></div>;

  return <div className="reference-profile">
    <header className="reference-section-header">
      <button type="button" className="reference-back-icon" onClick={()=>navigate("/accueil")} aria-label="Revenir à l'accueil"><ArrowLeft size={21}/></button>
      <h1>Mon profil</h1>
    </header>
    <section className="reference-profile-person">
      <div className="reference-profile-avatar">{initials||"C"}</div>
      <h2>{name}</h2>
      <p>Habitant · Toliara</p>
    </section>

    <div className="reference-profile-menu">
      <button type="button" onClick={()=>infoRef.current?.scrollIntoView({behavior:"smooth",block:"start"})}>
        <UserRound size={20}/><span>Mes informations</span><ChevronRight size={18}/>
      </button>
      <button type="button" onClick={()=>navigate("/historique")}>
        <MessageSquareText size={20}/><span>Mes signalements</span><ChevronRight size={18}/>
      </button>
      <div className="reference-profile-menu-row"><Bell size={20}/><span>Notifications</span><small>Dans l'application</small></div>
      <div className="reference-profile-menu-row"><Globe2 size={20}/><span>Langue</span><small>Français</small></div>
      <button type="button" onClick={()=>navigate("/")}>
        <Info size={20}/><span>À propos de Coupure</span><ChevronRight size={18}/>
      </button>
    </div>

    <section className="reference-profile-details" ref={infoRef}>
      <h2>Mes informations</h2>
      <div><Phone size={18}/><span>Téléphone</span><strong>{profil.telephone||"Non renseigné"}</strong></div>
      <div><Mail size={18}/><span>E-mail</span><strong>{profil.email||"Non renseigné"}</strong></div>
      <div><ShieldCheck size={18}/><span>Score de fiabilité</span><strong>{Math.round(Number(profil.score_fiabilite)||0)} / 100</strong></div>
      <div><BarChart3 size={18}/><span>Participations</span><strong>{profil.nombre_participations||0}</strong></div>
    </section>

    <button type="button" className="reference-logout" onClick={deconnexion}><LogOut size={18}/>Se déconnecter</button>
  </div>;
}
