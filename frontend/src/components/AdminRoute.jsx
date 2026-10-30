import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/apiConfig";

export default function AdminRoute() {
  const [etat, setEtat] = useState("verification");

  useEffect(() => {
    let actif = true;
    const token = localStorage.getItem("access_token");
    if (!token) {
      setEtat("connexion");
      return () => { actif = false; };
    }
    axios.get(API_BASE_URL + "/api/administration/me/", {
      headers: { Authorization: "Bearer " + token },
    }).then(() => {
      if (actif) setEtat("autorise");
    }).catch((erreur) => {
      if (!actif) return;
      if (erreur.response?.status === 401) {
        setEtat("connexion");
      } else if (erreur.response?.status === 403) {
        setEtat("interdit");
      } else {
        setEtat("erreur");
      }
    });
    return () => { actif = false; };
  }, []);

  if (etat === "connexion") return <Navigate to="/connexion" replace />;
  if (etat === "interdit") return <Navigate to="/accueil" replace />;
  if (etat === "erreur") return <main style={{ padding: 40 }} role="alert">
    Impossible de vérifier les droits administrateur. Vérifiez le serveur et réactualisez.
  </main>;
  if (etat !== "autorise") return <main style={{ padding: 40 }}>
    Vérification des droits administrateur…
  </main>;
  return <Outlet />;
}
