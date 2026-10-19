import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/apiConfig";
import {
  Droplets,
  User,
  LockKeyhole,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
} from "lucide-react";

import axios from "axios";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

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

      localStorage.setItem(
        "access_token",
        response.data.access
      );

      localStorage.setItem(
        "refresh_token",
        response.data.refresh
      );

      navigate("/accueil");
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
      <section className="login-container">
        <div className="brand">
          <div className="brand-icon">
            <Droplets size={34} />
          </div>

          <div>
            <h2>Suivi Coupure Eau</h2>
            <p>Toliara</p>
          </div>
        </div>

        <div className="hero">
          <h1>Bienvenue</h1>

          <p>
            Suivez les coupures d'eau
            <br />
            dans votre quartier
          </p>
        </div>

        <form
          className="login-card"
          onSubmit={connecter}
        >
          {erreur && (
            <div className="error-message">
              {erreur}
            </div>
          )}

          <label>
            Nom d'utilisateur
          </label>

          <div className="input-group">
            <User size={21} />

            <input
              type="text"
              placeholder="Votre nom d'utilisateur"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              required
            />
          </div>

          <label>Mot de passe</label>

          <div className="input-group">
            <LockKeyhole size={21} />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
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
            className="login-button"
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
      </section>
    </main>
  );
}

export default Login;