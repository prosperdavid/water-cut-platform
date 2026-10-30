import { useId } from "react";

/* Famille d'icônes Coupure : dessin SVG original, bleu et turquoise. */
export default function CoupureIcon({ name = "logo", size = 24, title, className = "" }) {
  // Utiliser le logo choisi par l'équipe ; les autres pictogrammes restent vectoriels.
  const id = useId().replace(/:/g, "");
  if (name === "logo") {
    return <img
      src="/brand/coupure-logo.webp"
      width={size}
      height={size}
      alt={title || ""}
      aria-hidden={title ? undefined : true}
      className={className}
      decoding="async"
      style={{ objectFit: "contain", verticalAlign: "middle", flexShrink: 0 }}
    />;
  }
  const fill = "url(#" + id + "-o)";
  const light = "url(#" + id + "-l)";
  const ripple = <path d="M9 58q23 9 46 0" stroke="#20cfe8" strokeWidth="2.5" strokeLinecap="round" fill="none" />;
  const shapes = {
    logo: <>
      <path d="M32 3C21 19 10 29 10 41c0 7 3 12 9 16l10-18-8-6L32 9Z" fill={fill}/>
      <path d="m37 10-10 22 10 7-9 18c15 3 26-7 26-19 0-9-8-21-17-28Z" fill={light}/>
      {ripple}
    </>,
    dashboard: <>
      <rect x="6" y="7" width="52" height="49" rx="12" fill={fill}/>
      <rect x="14" y="34" width="9" height="13" rx="3" fill="#d9ffff"/>
      <rect x="28" y="26" width="9" height="21" rx="3" fill="#bcf9ff"/>
      <rect x="42" y="18" width="9" height="29" rx="3" fill="#78eafd"/>
      <path d="M9 43c12-9 17-4 25 0s13 2 20-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity=".7"/>
    </>,
    incidents: <>
      <path d="M26 8a7 7 0 0 1 12 0l24 42a7 7 0 0 1-6 10H8a7 7 0 0 1-6-10L26 8Z" fill={fill}/>
      <path d="M32 18c-5 7-12 15-12 22a12 12 0 0 0 9 12l6-13-7-5 6-13Z" fill={light}/>
      <path d="m39 25-8 13 7 5-4 10c7-1 11-7 11-13 0-5-3-11-6-15Z" fill="#c9ffff"/>
      <path d="M9 54h46" stroke="#83edff" strokeWidth="2" opacity=".5"/>
    </>,
    users: <>
      <circle cx="16" cy="23" r="9" fill={light}/><circle cx="48" cy="23" r="9" fill={light}/>
      <path d="M3 51c0-9 5-15 13-15s13 6 13 15v4H3Z" fill={fill}/>
      <path d="M35 51c0-9 5-15 13-15s13 6 13 15v4H35Z" fill={fill}/>
      <circle cx="32" cy="18" r="11" fill={light}/>
      <path d="M14 53c0-11 7-18 18-18s18 7 18 18v7H14Z" fill={fill}/>
    </>,
    zones: <>
      <path d="M32 3C18 3 8 13 8 27c0 17 24 34 24 34s24-17 24-34C56 13 46 3 32 3Z" fill={fill}/>
      <circle cx="32" cy="27" r="13" fill="#d5ffff"/>
      <path d="M32 17c-4 6-9 11-9 16a9 9 0 0 0 18 0c0-5-5-10-9-16Z" fill={light}/>
    </>,
    security: <>
      <path d="M32 3 56 13v19c0 15-10 25-24 29C18 57 8 47 8 32V13Z" fill={fill}/>
      <path d="M32 13c-5 8-13 16-13 26a13 13 0 0 0 26 0c0-10-8-18-13-26Z" fill={light}/>
      <path d="m23 37 7 6 12-14" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </>,
    settings: <>
      <path d="M27 3h10l2 8 7 3 7-4 7 9-6 6v9l6 6-7 9-7-4-7 3-2 9H27l-2-9-7-3-7 4-7-9 6-6v-9l-6-6 7-9 7 4 7-3Z" fill={fill}/>
      <circle cx="32" cy="32" r="17" fill="#c6fcff"/>
      <path d="M32 19c-5 7-11 14-11 21a11 11 0 0 0 22 0c0-7-6-14-11-21Z" fill={light} transform="translate(0 -4)"/>
    </>,
    notifications: <>
      <path d="M32 8c-11 0-17 8-17 20v9c0 5-3 8-6 12h46c-3-4-6-7-6-12v-9C49 16 43 8 32 8Z" fill={fill}/>
      <path d="M20 29c0-9 3-14 12-15" stroke="#d2ffff" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".7"/>
      <circle cx="32" cy="52" r="6" fill={light}/>
      {ripple}
    </>,
    reports: <>
      <rect x="10" y="9" width="44" height="49" rx="9" fill={fill}/>
      <rect x="19" y="4" width="26" height="13" rx="5" fill={light}/>
      <path d="M19 29h21M19 37h17M19 45h9" stroke="#d3ffff" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="46" cy="46" r="12" fill={light}/>
      <path d="m40 46 4 4 8-9" stroke="#0759b5" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </>,
    maintenance: <>
      <path d="M32 4C24 16 10 29 10 41a22 22 0 0 0 44 0C54 29 40 16 32 4Z" fill={fill}/>
      <path d="M42 19a13 13 0 0 0-15 16L15 47a5 5 0 0 0 7 7l12-12a13 13 0 0 0 16-16l-9 9-7-2-2-7 10-7Z" fill={light}/>
      {ripple}
    </>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true} focusable="false">
    <defs>
      <linearGradient id={id+"-o"} x1="2" y1="62" x2="58" y2="3" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0643be"/><stop offset=".55" stopColor="#078cf5"/><stop offset="1" stopColor="#39e7ea"/>
      </linearGradient>
      <linearGradient id={id+"-l"} x1="7" y1="59" x2="55" y2="4" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0c78ed"/><stop offset=".52" stopColor="#4ad8f4"/><stop offset="1" stopColor="#d6ffff"/>
      </linearGradient>
    </defs>
    {shapes[name] || shapes.logo}
  </svg>;
}
