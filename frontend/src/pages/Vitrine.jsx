import { useNavigate } from "react-router-dom";
import toliaraMer from "../assets/toliara-mer.png";
import CoupureIcon from "../components/CoupureIcon";
import toliaraVille from "../assets/toliara-ville.png";

import {
  Droplets,
  MapPin,
  Users,
  ShieldCheck,
  MapPinned,
  History,
  CircleCheck,
  ArrowRight,
  LogIn,
  UserPlus,
  Radio,
} from "lucide-react";

function Vitrine() {
  const navigate = useNavigate();
  const estConnecte = Boolean(localStorage.getItem("access_token"));

  return (
    <main className="landing-page">
      {/* Navigation */}
      <header className="landing-navbar">
        <div className="landing-brand">
          <div className="landing-logo"><CoupureIcon name="logo" size={39} /></div>

          <div>
            <strong>Eau Toliara</strong>
            <small>Suivi participatif</small>
          </div>
        </div>

        {estConnecte ? (
          <button
            className="landing-login"
            onClick={() => navigate("/accueil")}
          >
            Accéder à l'application
          </button>
        ) : (
          <button
            className="landing-login"
            onClick={() => navigate("/connexion")}
          >
            <LogIn size={18} />
            Connexion
          </button>
        )}
      </header>

    {/* Présentation */}

  <section
  className="landing-hero"
  style={{
  backgroundImage: `linear-gradient(rgba(6, 37, 68, 0.48), rgba(6, 65, 120, 0.42)), url(${toliaraMer})`,
}}
 >
  <div className="hero-badge">
          <Radio size={16} />
          Plateforme participative à Toliara
        </div>

        <h1>
          Suivez les coupures d'eau
          <span> dans votre quartier</span>
        </h1>

        <p>
          Signalez une coupure, consultez les incidents
          autour de vous et aidez les habitants à suivre
          le rétablissement de l'eau.
        </p>

        <div className="hero-actions">
          {estConnecte ? (
            <button
              className="hero-primary"
              onClick={() => navigate("/accueil")}
            >
              Accéder à l'application
              <ArrowRight size={20} />
            </button>
          ) : (
            <>
              <button
                className="hero-primary"
                onClick={() => navigate("/inscription")}
              >
                <UserPlus size={20} />
                Créer un compte
              </button>

              <button
                className="hero-secondary"
                onClick={() => navigate("/connexion")}
              >
                Se connecter
              </button>
            </>
          )}
        </div>

        
          <section className="landing-map-showcase">
  <div className="landing-map-card">
    <div className="landing-map-header">
      <div className="landing-map-title">
        <span className="map-title-icon">📍</span>
        <strong>Toliara</strong>
      </div>

      <div className="map-live-badge">● En direct</div>
    </div>

    <div className="landing-map-body">
      <div className="landing-map-visual">
        <div className="map-road road-1"></div>
        <div className="map-road road-2"></div>
        <div className="map-road road-3"></div>

        <div className="map-zone-label zone-1">Centre-ville</div>
        <div className="map-zone-label zone-2">Tanambao</div>
        <div className="map-zone-label zone-3">Anketa</div>

        <div className="map-marker marker-red">
          <span></span>
        </div>

        <div className="map-marker marker-orange">
          <span></span>
        </div>

        <div className="map-marker marker-green">
          <span></span>
        </div>

        <div className="map-mini-card mini-card-1">
          <strong>Coupure confirmée</strong>
          <small>Tanambao • 15 min</small>
        </div>

        <div className="map-mini-card mini-card-2">
          <strong>Rétablissement probable</strong>
          <small>Centre-ville • 40 min</small>
        </div>
      </div>

      <div className="landing-map-side">
        <div className="map-stat-box">
          <h4>Vue rapide</h4>

          <div className="map-stat-item">
            <strong>3</strong>
            <span>incidents actifs</span>
          </div>

          <div className="map-stat-item">
            <strong>2</strong>
            <span>quartiers touchés</span>
          </div>

          <div className="map-stat-item">
            <strong>24h</strong>
            <span>historique récent</span>
          </div>
        </div>
      </div>
    </div>

    <div className="landing-map-legend">
      <span><i className="dot orange"></i> À confirmer</span>
      <span><i className="dot red"></i> Coupure confirmée</span>
      <span><i className="dot green"></i> Eau rétablie</span>
    </div>
  </div>
</section>
</section>

      {/* Fonctionnement */}
      <section className="landing-section">
        <div className="section-heading">
          <small>COMMENT ÇA MARCHE ?</small>
          <h2>La communauté vérifie les coupures</h2>
          <p>
            Quelques étapes suffisent pour transformer
            plusieurs déclarations en information utile.
          </p>
        </div>

        <div className="steps-grid">
          <article className="landing-card">
            <span className="step-number">1</span>
            <MapPin />
            <h3>Signalez</h3>
            <p>
              Votre position GPS est détectée et votre
              quartier est identifié automatiquement.
            </p>
          </article>

          <article className="landing-card">
            <span className="step-number">2</span>
            <Users />
            <h3>Confirmez</h3>
            <p>
              Les habitants proches peuvent confirmer ou
              infirmer la présence de la coupure.
            </p>
          </article>

          <article className="landing-card">
            <span className="step-number">3</span>
            <ShieldCheck />
            <h3>Vérifiez</h3>
            <p>
              Les déclarations croisées permettent de
              calculer un niveau de confiance.
            </p>
          </article>

          <article className="landing-card">
            <span className="step-number">4</span>
            <Droplets />
            <h3>Suivez</h3>
            <p>
              Les habitants peuvent ensuite signaler le
              retour de l'eau dans leur quartier.
            </p>
          </article>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="landing-section landing-light">
        <div className="section-heading">
          <small>LA PLATEFORME</small>
          <h2>Tout ce qu'il faut pour suivre la situation</h2>
        </div>

        <div className="features-grid">
          <article className="feature-card">
            <MapPinned />
            <div>
              <h3>Carte interactive</h3>
              <p>
                Visualisez les incidents signalés autour
                de Toliara.
              </p>
            </div>
          </article>

          <article className="feature-card">
            <MapPin />
            <div>
              <h3>GPS automatique</h3>
              <p>
                Votre position et votre quartier sont
                détectés automatiquement.
              </p>
            </div>
          </article>

          <article className="feature-card">
            <Users />
            <div>
              <h3>Validation communautaire</h3>
              <p>
                Plusieurs habitants participent à la
                vérification d'un incident.
              </p>
            </div>
          </article>

          <article className="feature-card">
            <History />
            <div>
              <h3>Historique</h3>
              <p>
                Retrouvez vos participations et les
                événements précédents.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Fiabilité */}
      <section className="landing-section">
        <div className="section-heading">
          <small>FIABILITÉ</small>
          <h2>Une déclaration seule ne suffit pas</h2>
          <p>
            La plateforme rapproche plusieurs
            signalements avant de considérer une coupure
            comme confirmée.
          </p>
        </div>

        <div className="reliability-grid">
          <article>
            <strong>300 m</strong>
            <span>Rayon de regroupement</span>
          </article>

          <article>
            <strong>2 h</strong>
            <span>Fenêtre temporelle</span>
          </article>

          <article>
            <strong>3</strong>
            <span>Participants minimum</span>
          </article>

          <article>
            <strong>70 %</strong>
            <span>Seuil de confiance</span>
          </article>
        </div>
      </section>

      {/* Statuts */}
      <section className="landing-section landing-light">
        <div className="section-heading">
          <small>SUIVI</small>
          <h2>Comprenez rapidement la situation</h2>
        </div>

        <div className="status-showcase">
          <div className="status-item">
            <span className="status-dot orange"></span>
            <div>
              <strong>À confirmer</strong>
              <small>
                Les habitants commencent à signaler.
              </small>
            </div>
          </div>

          <div className="status-item">
            <span className="status-dot red"></span>
            <div>
              <strong>Coupure confirmée</strong>
              <small>
                Le niveau de confiance est suffisant.
              </small>
            </div>
          </div>

          <div className="status-item">
            <span className="status-dot yellow"></span>
            <div>
              <strong>Rétablissement probable</strong>
              <small>
                Des habitants signalent le retour de l'eau.
              </small>
            </div>
          </div>

          <div className="status-item">
            <span className="status-dot green"></span>
            <div>
              <strong>Eau rétablie</strong>
              <small>
                L'incident est considéré comme terminé.
              </small>
            </div>
          </div>
        </div>
      </section>
      <section className="landing-local-section">
  <div className="landing-local-image">
    <img
      src={toliaraVille}
      alt="Vue de la ville de Toliara"
    />
  </div>

  <div className="landing-local-content">
    <small>UNE PLATEFORME LOCALE</small>

    <h2>
      Pensée pour les habitants de Toliara
    </h2>

    <p>
      La plateforme permet aux habitants de signaler les
      coupures d'eau observées dans leur quartier, de
      consulter les incidents proches et de participer à
      leur vérification.
    </p>

    <p>
      Grâce au GPS et aux déclarations croisées de plusieurs
      utilisateurs, les informations deviennent plus utiles
      pour suivre la situation dans les différents quartiers
      de la ville.
    </p>

    <div className="local-points">
      <span>✓ Détection GPS du quartier</span>
      <span>✓ Signalements communautaires</span>
      <span>✓ Suivi des incidents en temps réel</span>
    </div>
  </div>
</section>

      {/* Objectif */}
      <section className="landing-purpose">
        <CircleCheck size={40} />

        <h2>Une information construite ensemble</h2>

        <p>
          L'objectif est de produire un historique plus
          fiable des coupures d'eau grâce aux déclarations
          croisées des habitants.
        </p>
      </section>

      {/* CTA final */}
      <section className="landing-cta">
        <Droplets size={45} />

        <h2>Une coupure dans votre quartier ?</h2>

        <p>
          Rejoignez la communauté et contribuez au suivi
          de l'eau à Toliara.
        </p>

        <button
          onClick={() =>
            navigate(estConnecte ? "/accueil" : "/inscription")
          }
        >
          {estConnecte
            ? "Accéder à l'application"
            : "Créer mon compte"}

          <ArrowRight size={20} />
        </button>

        {!estConnecte && (
          <span
            className="cta-login"
            onClick={() => navigate("/connexion")}
          >
            J'ai déjà un compte
          </span>
        )}
      </section>

      <footer className="landing-footer">
        <div>
          <Droplets size={20} />
          <strong>Eau Toliara</strong>
        </div>

        <p>
          Plateforme participative de suivi des coupures
          d'eau.
        </p>

        <small>
          Toliara, Madagascar
        </small>
      </footer>
    </main>
  );
}

export default Vitrine;