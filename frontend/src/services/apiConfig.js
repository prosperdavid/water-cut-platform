const defaultApiUrl =
  window.location.hostname === "water-cut-frontend.onrender.com"
    ? "https://water-cut-backend.onrender.com"
    : `http://${window.location.hostname}:8000`;

export const API_BASE_URL = import.meta.env.VITE_API_URL || defaultApiUrl;
