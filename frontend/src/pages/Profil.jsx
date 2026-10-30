import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../services/apiConfig";

import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  BarChart3,
  LogOut,
  Home,
  Map,
  Plus,
  Clock3,
  Lightbulb,
} from "lucide-react";

function Profil() {
  const navigate = useNavigate();

  const [profil, setProfil] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/");
      return;
    }

    axios
      .get(
        `${API_BASE_URL}/api/auth/me/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then((response) => {
        setProfil(response.data);
      })
      .catch((error) => {
        console.error(error);

        if (error.response?.status === 401) {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          navigate("/connexion");
        } else {
          setErreurChargement("Impossible de charger votre profil. Vérifiez le serveur Django.");
        }
      })
      .finally(() => {
        setChargement(false);
      });
  }, [navigate]);

  const deconnexion = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    navigate("/");
  };

  if (chargement) {
    return (
      <main className="app-page">
        <div className="loading-page">
          Chargement...
        </div>
      </main>
    );
  }

  if (!profil) {
    return (
      <main className="app-page">
        <div className="loading-page">
          {erreurChargement || "Profil indisponible."}
        </div>
      </main>
    );
  }

  const nomComplet =
    `${profil.first_name || ""} ${profil.last_name || ""}`.trim();

  return (
    <main className="app-page">
      <section className="mobile-app profile-page">

        <header className="profile-header">
          <h1>Mon profil</h1>
        </header>

        <section className="profile-identity">
          <div className="profile-avatar">
            <User size={42} />
          </div>

          <div>
            <h2>
              {nomComplet || profil.username}
            </h2>

            <p>@{profil.username}</p>

            <span>Habitant</span>
          </div>
        </section>

        <section className="profile-info-card">

          <div className="profile-row">
            <div className="profile-row-icon">
              <Phone />
            </div>

            <div>
              <span>Téléphone</span>
              <strong>
                {profil.telephone || "Non renseigné"}
              </strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row-icon">
              <Mail />
            </div>

            <div>
              <span>Email</span>
              <strong>
                {profil.email || "Non renseigné"}
              </strong>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row-icon">
              <ShieldCheck />
            </div>

            <div className="score-content">
              <span>Score de fiabilité</span>

              <strong>
                {Math.round(
                  profil.score_fiabilite
                )} / 100
              </strong>

              <div className="profile-score-bar">
                <span
                  style={{
                    width: `${Math.min(
                      100,
                      profil.score_fiabilite
                    )}%`,
                  }}
                ></span>
              </div>
            </div>
          </div>

          <div className="profile-row">
            <div className="profile-row-icon">
              <BarChart3 />
            </div>

            <div>
              <span>Participations</span>
              <strong>
                {profil.nombre_participations}
              </strong>
            </div>
          </div>

        </section>

        <section className="score-explanation">
          <div className="score-light">
            <Lightbulb />
          </div>

          <div>
            <h3>Pourquoi ce score ?</h3>

            <p>
              Votre score évolue selon la fiabilité
              de vos signalements et de vos réponses
              aux incidents.
            </p>
          </div>
        </section>

        <button
          className="logout-button"
          onClick={deconnexion}
        >
          <LogOut />
          Se déconnecter
        </button>

        <nav className="bottom-nav">
          <button
            onClick={() =>
              navigate("/accueil")
            }
          >
            <Home />
            <span>Accueil</span>
          </button>

          <button
            onClick={() =>
              navigate("/carte")
            }
          >
            <Map />
            <span>Carte</span>
          </button>

          <button
            className="central-button"
            onClick={() =>
              navigate("/signaler")
            }
          >
            <Plus />
            <span>Signaler</span>
          </button>

          <button
            onClick={() =>
              navigate("/historique")
            }
          >
            <Clock3 />
            <span>Historique</span>
          </button>

          <button className="active">
            <User />
            <span>Profil</span>
          </button>
        </nav>

      </section>
    </main>
  );
}

export default Profil;