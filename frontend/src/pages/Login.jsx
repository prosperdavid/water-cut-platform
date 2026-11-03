import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toliaraMer from "../assets/toliara-mer.png";
import { API_BASE_URL } from "../services/apiConfig";
import {
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import axios from "axios";
import CoupureIcon from "../components/CoupureIcon";
import "../App.css";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
let googleInitializedClientId = "";
let googleCredentialHandler = null;

function handleGoogleCredential(response) {
  if (response?.credential && googleCredentialHandler) {
    void googleCredentialHandler(response.credential);
  }
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!window.googleIdentityPromise) {
    window.googleIdentityPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.id = "google-identity-services";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }).catch((error) => {
      window.googleIdentityPromise = null;
      throw error;
    });
  }

  return window.googleIdentityPromise;
}

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");
  const googleButtonRef = useRef(null);

  const ouvrirSession = useCallback(async (tokens) => {
    localStorage.setItem("access_token", tokens.access);
    localStorage.setItem("refresh_token", tokens.refresh);

    let destination = "/accueil";
    try {
      await axios.get(`${API_BASE_URL}/api/administration/me/`, {
        headers: { Authorization: `Bearer ${tokens.access}` },
      });
      destination = "/administration";
    } catch {
      // Les habitants continuent vers l'accueil.
    }
    navigate(destination);
  }, [navigate]);

  const connecterAvecGoogle = useCallback(async (credential) => {
    setErreur("");
    setLoading(true);
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/auth/google/`, {
        credential,
      });
      await ouvrirSession(data);
    } catch (error) {
      setErreur(
        error.response?.data?.detail ||
        "La connexion avec Google a échoué. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  }, [ouvrirSession]);

  useEffect(() => {
    const button = googleButtonRef.current;
    if (!GOOGLE_CLIENT_ID || !button) return undefined;

    let cancelled = false;
    googleCredentialHandler = connecterAvecGoogle;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !googleButtonRef.current) return;

        if (googleInitializedClientId !== GOOGLE_CLIENT_ID) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredential,
            ux_mode: "popup",
            auto_select: false,
          });
          googleInitializedClientId = GOOGLE_CLIENT_ID;
        }

        const width = Math.min(400, Math.max(220, button.clientWidth));
        window.google.accounts.id.renderButton(button, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          logo_alignment: "left",
          width,
          locale: "fr",
        });
      })
      .catch(() => {
        if (!cancelled) {
          setErreur("Le service Google n’est pas joignable pour le moment.");
        }
      });

    return () => {
      cancelled = true;
      if (googleCredentialHandler === connecterAvecGoogle) {
        googleCredentialHandler = null;
      }
      button.replaceChildren();
    };
  }, [connecterAvecGoogle]);

  const connecter = async (e) => {
    e.preventDefault();

    setErreur("");
    setLoading(true);

    try {
      const response = await axios.post(
       `${API_BASE_URL}/api/auth/login/`,
        {
          username,
          password,
        }
      );

      await ouvrirSession(response.data);
    } catch {
      setErreur(
        "Nom d'utilisateur ou mot de passe incorrect."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-container login-layout">
        <aside className="login-aside" style={{ backgroundImage: `linear-gradient(155deg, rgba(5, 36, 54, .38), rgba(4, 31, 48, .88)), url(${toliaraMer})` }}>
          <div className="login-aside-brand">
            <span className="login-aside-logo"><CoupureIcon name="logo" size={43} /></span>
            <span><strong>Coupure</strong><small>L’EAU, EN COMMUN</small></span>
          </div>
          <div className="login-aside-copy">
            <span className="login-aside-location"><MapPin size={15} /> TOLIARA · MADAGASCAR</span>
            <h2>L’eau en commun,<br />quartier par quartier.</h2>
            <p>Suivez les coupures, partagez une information utile et contribuez au retour de l’eau dans votre quartier.</p>
          </div>
          <div className="login-aside-note">
            <span className="login-aside-note-icon"><ShieldCheck size={19} /></span>
            <span><strong>Un suivi construit ensemble</strong><small>Les habitants s’informent et vérifient les signalements.</small></span>
          </div>
        </aside>

        <div className="login-content">
          <div className="login-heading">
            <span className="login-eyebrow">VOTRE ESPACE HABITANT</span>
            <h1>Heureux de vous revoir.</h1>
            <p>Connectez-vous pour consulter la situation de votre quartier.</p>
          </div>

          <form className="login-card login-form" onSubmit={connecter}>
          {erreur && (
            <div className="error-message" role="alert">
              {erreur}
            </div>
          )}

          <label htmlFor="login-username">Nom d’utilisateur</label>

          <div className="input-group">
            <User size={19} aria-hidden="true" />

            <input
              id="login-username"
              type="text"
              autoComplete="username"
              placeholder="Votre nom d’utilisateur"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
            />
          </div>

          <label htmlFor="login-password">Mot de passe</label>

          <div className="input-group">
            <LockKeyhole size={19} aria-hidden="true" />

            <input
              id="login-password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              required
            />

            <button
              type="button"
              className="eye-button"
              aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              {showPassword ? (
                <EyeOff size={21} />
              ) : (
                <Eye size={21} />
              )}
            </button>
          </div>

          <button
            className="login-button login-submit"
            type="submit"
            disabled={loading}
          >
            <LogIn size={21} />

            {loading
              ? "Connexion..."
              : "Se connecter"}
          </button>

          <div className="separator">
            <span></span>
            <p>ou</p>
            <span></span>
          </div>

          {GOOGLE_CLIENT_ID ? (
            <div
              ref={googleButtonRef}
              className="google-login-slot"
              aria-label="Continuer avec Google"
            />
          ) : (
            <div className="google-login-config-note" role="status">
              La connexion Google sera disponible après configuration.
            </div>
          )}

          <button
              type="button"
             className="register-button"
             onClick={() => navigate("/inscription")}
>
             <UserPlus size={21} />
             Créer un compte
          </button>
          <button
            type="button"
            className="forgot-password"
          >
            Mot de passe oublié ?
          </button>
          </form>
          <p className="login-back-link"><button type="button" onClick={() => navigate("/")}>Retourner à l’accueil</button></p>
        </div>
      </section>
    </main>
  );
}

export default Login;
