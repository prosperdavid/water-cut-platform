import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, Map, Clock3, UserRound, Plus, ArrowUpRight, MapPin, ShieldCheck } from "lucide-react";
import CoupureIcon from "./CoupureIcon";
import "./ResidentLayout.css";

const menus = [
  { to: "/accueil", label: "Vue d’ensemble", icon: Home },
  { to: "/carte", label: "Carte des incidents", icon: Map },
  { to: "/historique", label: "Mon historique", icon: Clock3 },
  { to: "/profil", label: "Mon profil", icon: UserRound },
];

const noms = {
  "/accueil": "Vue d’ensemble",
  "/carte": "Carte des incidents",
  "/signaler": "Signaler une coupure",
  "/historique": "Mon historique",
  "/profil": "Mon profil",
};

export default function ResidentLayout() {
  const { pathname } = useLocation();
  const titre = noms[pathname] || (pathname.startsWith("/incidents/") ? "Détails de l’incident" : "Espace citoyen");

  return (
    <div className="resident-shell">
      <aside className="resident-sidebar" aria-label="Navigation principale">
        <NavLink to="/accueil" className="resident-brand">
          <span className="resident-brand__mark"><CoupureIcon name="logo" size={51} /></span>
          <span><strong>Coupure<span className="resident-brand__dot">.</span></strong><small>PLATEFORME CITOYENNE</small></span>
        </NavLink>

        <div className="resident-sidebar__group">
          <p className="resident-sidebar__label">ESPACE DE SUIVI</p>
          <nav className="resident-sidebar__menu" aria-label="Pages des habitants">
            {menus.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({isActive}) =>
                "resident-sidebar__link" + (isActive || (to === "/carte" && pathname.startsWith("/incidents/")) ? " resident-sidebar__link--active" : "")
              }>
                <Icon size={19} strokeWidth={1.9} aria-hidden="true" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
          <NavLink to="/signaler" className="resident-sidebar__report">
            <Plus size={19} aria-hidden="true" />
            Nouveau signalement
            <ArrowUpRight size={16} aria-hidden="true" />
          </NavLink>
        </div>
        <div className="resident-sidebar__bottom">
          <div className="resident-sidebar__community">
            <ShieldCheck size={19} aria-hidden="true" />
            <strong>Une information partagée</strong>
            <p>Les signalements viennent des habitants et ne sont pas des annonces officielles.</p>
          </div>
          <div className="resident-sidebar__location"><MapPin size={15} aria-hidden="true" /> Toliara, Madagascar</div>
        </div>
      </aside>

      <div className="resident-workspace">
        <header className="resident-topbar">
          <div className="resident-topbar__context">
            <span className="resident-topbar__eyebrow">ESPACE CITOYEN</span>
            <strong>{titre}</strong>
          </div>
          <div className="resident-topbar__right">
            <span className="resident-topbar__location"><MapPin size={16} aria-hidden="true" /> Toliara</span>
            <NavLink to="/signaler" className="resident-topbar__cta"><Plus size={17} aria-hidden="true" /> Signaler une coupure</NavLink>
          </div>
        </header>
        <div className="resident-content"><Outlet /></div>
      </div>
    </div>
  );
}
