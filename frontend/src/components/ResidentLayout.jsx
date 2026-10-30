import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Search, Bell, MapPin, Settings2, LayoutDashboard, Map, Plus, Clock3, UserRound, Info, Settings2, ChevronDown, X, ArrowRight } from "lucide-react";
import CoupureIcon from "./CoupureIcon";
import { API_BASE_URL } from "../services/apiConfig";

const links = [
  { to: "/accueil", label: "Vue d'ensemble", mobile: "Accueil", Icon: LayoutDashboard },
  { to: "/carte", label: "Carte des incidents", mobile: "Carte", Icon: Map },
  { to: "/signaler", label: "Signaler une coupure", mobile: "Signaler", Icon: Plus },
  { to: "/historique", label: "Mon historique", mobile: "Historique", Icon: Clock3 },
  { to: "/profil", label: "Mon profil", mobile: "Profil", Icon: UserRound },
];
const titles = {
  "/accueil": "Vue d'ensemble",
  "/carte": "Carte des incidents",
  "/signaler": "Signaler une coupure",
  "/historique": "Mon historique",
  "/profil": "Mon profil",
};

export default function ResidentLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [profile, setProfile] = useState(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem("access_token");
    if (!token) return undefined;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    Promise.allSettled([
      axios.get(`${API_BASE_URL}/api/auth/me/`, config),
      axios.get(`${API_BASE_URL}/api/incidents/`, config),
    ]).then(([userResult, incidentResult]) => {
      if (!active) return;
      if (userResult.status === "fulfilled") setProfile(userResult.value.data);
      if (incidentResult.status === "fulfilled") {
        const data = incidentResult.value.data;
        setIncidents(Array.isArray(data) ? data : data?.results || []);
      }
    });
    return () => { active = false; };
  }, []);

  const search = (event) => {
    event.preventDefault();
    const value = query.trim();
    navigate(value ? `/carte?q=${encodeURIComponent(value)}` : "/carte");
  };
  const pending = incidents.filter(item => item.statut === "ACTIF" || item.statut === "A_CONFIRMER").length;
  const displayName = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username || "Mon compte";
  const initials = displayName.split(" ").slice(0,2).map(part => part[0] || "").join("").toUpperCase();
  const title = titles[pathname] || "Détails d'un incident";

  return (
    <div className="resident-shell reference-shell">
      <aside className="resident-sidebar reference-sidebar">
        <NavLink to="/accueil" className="reference-brand">
          <CoupureIcon name="logo" size={48} />
          <span><strong>Coupure</strong><small>L'EAU, EN COMMUN</small></span>
        </NavLink>
        <nav className="reference-side-nav" aria-label="Navigation principale">
          {links.map(({to,label,Icon}) => (
            <NavLink to={to} key={to} className={({isActive}) => "reference-side-link" + (isActive || (to === "/carte" && pathname.startsWith("/incidents/")) ? " is-current" : "")}>
              <Icon size={21} strokeWidth={1.85} aria-hidden="true" /><span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="reference-sidebar-separator" />
        <p className="reference-sidebar-label">PLATEFORME</p>
        <NavLink to="/" className="reference-side-link reference-side-secondary"><Info size={21} aria-hidden="true"/>À propos du suivi</NavLink>
        {profile?.is_staff && <NavLink to="/administration" className="reference-side-link reference-side-secondary"><Settings2 size={21} aria-hidden="true"/>Administration</NavLink>}
        <div className="reference-sidebar-bottom">
          <div className="reference-skyline" aria-hidden="true" />
          <strong>TOLIARA, MADAGASCAR</strong>
          <p>Une plateforme citoyenne pour mieux partager l'information sur l'accès à l'eau.</p>
        </div>
      </aside>

      <div className="resident-workspace reference-workspace">
        <header className="reference-topbar">
          <form className="reference-search" onSubmit={search} role="search">
            <Search size={19} aria-hidden="true" />
            <input aria-label="Rechercher un quartier" value={query} onChange={event => setQuery(event.target.value)} placeholder="Rechercher un quartier, une rue..." />
          </form>
          <div className="reference-topbar-right">
            <span className="reference-location"><MapPin size={17} aria-hidden="true"/>Toliara, Madagascar</span>
            <div className="reference-notification-wrap">
              <button type="button" className="reference-bell" aria-label="Informations sur les signalements" aria-expanded={notificationsOpen} onClick={() => setNotificationsOpen(!notificationsOpen)}>
                <Bell size={20} aria-hidden="true"/>{pending > 0 && <i aria-hidden="true"/>}
              </button>
              {notificationsOpen && (
                <div className="reference-notification-panel">
                  <button type="button" className="reference-panel-close" onClick={() => setNotificationsOpen(false)} aria-label="Fermer"><X size={16}/></button>
                  <strong>État des signalements</strong>
                  <p>{pending === 0 ? "Aucun signalement actif recensé." : `${pending} incident(s) en cours ou à confirmer à Toliara.`}</p>
                  <button type="button" onClick={() => { setNotificationsOpen(false); navigate("/carte"); }}>Consulter la carte <ArrowRight size={14}/></button>
                </div>
              )}
            </div>
            <NavLink to="/profil" className="reference-account" aria-label="Mon profil">
              <span className="reference-avatar">{initials || "C"}</span>
              <span className="reference-account-text"><strong>{displayName}</strong><small>Habitant</small></span>
              <ChevronDown size={17} aria-hidden="true"/>
            </NavLink>
          </div>
        </header>

        {pathname === "/accueil" && (
          <header className="reference-mobile-brand">
            <NavLink to="/accueil" className="reference-mobile-wordmark"><CoupureIcon name="logo" size={40} /><span><strong>Coupure</strong><small>L'EAU, EN COMMUN</small></span></NavLink>
            <button type="button" className="reference-mobile-bell" aria-label="Voir les incidents en cours" onClick={() => navigate("/carte")}><Bell size={20}/>{pending>0&&<i/>}</button>
          </header>
        )}

        <div className="resident-content reference-content">
          <Outlet context={{ profile, incidents }} />
        </div>

        <nav className="reference-mobile-nav" aria-label="Navigation mobile">
          {links.map(({to,mobile,Icon}) => (
            <NavLink key={to} to={to} className={({isActive}) => "reference-mobile-link" + (isActive ? " is-current" : "") + (to === "/signaler" ? " is-report" : "")}>
              <span className="reference-mobile-icon"><Icon size={21} strokeWidth={1.9} aria-hidden="true"/></span><span>{mobile}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
