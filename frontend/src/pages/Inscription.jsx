import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  LockKeyhole,
  UserPlus,
} from "lucide-react";

function Inscription() {
  const navigate = useNavigate();

  const [formulaire, setFormulaire] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    telephone: "",
    password: "",
  });

  const [erreur, setErreur] = useState("");
  const [succes, setSucces] = useState("");
  const [chargement, setChargement] = useState(false);

  const modifier = (e) => {
    setFormulaire({
      ...formulaire,
      [e.target.name]: e.target.value,
    });
  };

  const inscrire = async (e) => {
    e.preventDefault();

    setErreur("");
    setSucces("");
    setChargement(true);

    try {
      // 1. Création du compte
      await axios.post(
        "http://127.0.0.1:8000/api/auth/register/",
        formulaire
      );

      setSucces("Compte créé avec succès.");

      // 2. Connexion automatique
      const connexion = await axios.post(
        "http://127.0.0.1:8000/api/auth/login/",
        {
          username: formulaire.username,
          password: formulaire.password,
        }
      );

      // 3. Enregistrement des tokens JWT
      localStorage.setItem(
        "access_token",
        connexion.data.access
      );

      localStorage.setItem(
        "refresh_token",
        connexion.data.refresh
      );

      // 4. Accès direct à l'application
      navigate("/accueil");
    } catch (error) {
      console.error(error);

      const donneesErreur = error.response?.data;

      if (donneesErreur?.username) {
        setErreur(
          "Ce nom d'utilisateur est déjà utilisé ou n'est pas valide."
        );
      } else if (donneesErreur?.password) {
        setErreur(
          "Le mot de passe ne respecte pas les critères demandés."
        );
      } else if (donneesErreur?.email) {
        setErreur(
          "L'adresse e-mail saisie n'est pas valide."
        );
      } else {
        setErreur(
          "Impossible de créer le compte. Vérifiez les informations saisies."
        );
      }
    } finally {
      setChargement(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-container">

        <header className="register-header">
          <button
            type="button"
            onClick={() => navigate("/")}
          >
            <ArrowLeft />
          </button>

          <div>
            <h1>Créer un compte</h1>
            <p>Rejoignez la communauté</p>
          </div>
        </header>

        <form
          className="login-card register-form"
          onSubmit={inscrire}
        >
          {erreur && (
            <div className="error-message">
              {erreur}
            </div>
          )}

          {succes && (
            <div className="report-success">
              ✓ {succes}
            </div>
          )}

          <div className="register-grid">
            <div>
              <label>Prénom</label>

              <div className="input-group">
                <User size={20} />

                <input
                  name="first_name"
                  value={formulaire.first_name}
                  onChange={modifier}
                  placeholder="Prénom"
                  required
                />
              </div>
            </div>

            <div>
              <label>Nom</label>

              <div className="input-group">
                <User size={20} />

                <input
                  name="last_name"
                  value={formulaire.last_name}
                  onChange={modifier}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>
          </div>

          <label>
            Nom d'utilisateur
          </label>

          <div className="input-group">
            <User size={20} />

            <input
              name="username"
              value={formulaire.username}
              onChange={modifier}
              placeholder="Ex : david_jb"
              required
            />
          </div>

          <label>Email</label>

          <div className="input-group">
            <Mail size={20} />

            <input
              type="email"
              name="email"
              value={formulaire.email}
              onChange={modifier}
              placeholder="adresse@email.com"
            />
          </div>

          <label>Téléphone</label>

          <div className="input-group">
            <Phone size={20} />

            <input
              name="telephone"
              value={formulaire.telephone}
              onChange={modifier}
              placeholder="034..."
            />
          </div>

          <label>Mot de passe</label>

          <div className="input-group">
            <LockKeyhole size={20} />

            <input
              type="password"
              name="password"
              value={formulaire.password}
              onChange={modifier}
              placeholder="Minimum 8 caractères"
              minLength={8}
              required
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={chargement}
          >
            <UserPlus size={21} />

            {chargement
              ? "Création..."
              : "Créer mon compte"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Inscription;