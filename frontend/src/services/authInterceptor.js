import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

// Un renouvellement unique pour les appels lancés simultanément.
let renouvellementEnCours = null;

function terminerSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  // Les erreurs de connexion sont traitées par le formulaire de connexion.
  if (window.location.pathname !== "/connexion" && window.location.pathname !== "/") {
    window.location.assign("/connexion");
  }
}

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const demande = error.config;
    const url = demande?.url || "";

    if (
      error.response?.status !== 401 ||
      !demande ||
      demande._retry ||
      url.includes("/api/auth/login/") ||
      url.includes("/api/auth/register/") ||
      url.includes("/api/auth/token/refresh/")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      terminerSession();
      return Promise.reject(error);
    }

    demande._retry = true;
    try {
      if (!renouvellementEnCours) {
        renouvellementEnCours = axios
          .post(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh: refreshToken })
          .then(({ data }) => {
            if (!data.access) throw new Error("Aucun jeton d'accès renvoyé");
            localStorage.setItem("access_token", data.access);
            return data.access;
          })
          .finally(() => {
            renouvellementEnCours = null;
          });
      }

      const access = await renouvellementEnCours;
      demande.headers = demande.headers || {};
      demande.headers.Authorization = `Bearer ${access}`;
      return axios(demande);
    } catch {
      terminerSession();
      return Promise.reject(error);
    }
  }
);
