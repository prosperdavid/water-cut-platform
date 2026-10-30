import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Vitrine from "./pages/Vitrine";
import Login from "./pages/Login";
import Accueil from "./pages/Accueil";
import Carte from "./pages/Carte";
import Signaler from "./pages/Signaler";
import IncidentDetail from "./pages/IncidentDetail";
import Historique from "./pages/Historique";
import Profil from "./pages/Profil";
import Inscription from "./pages/Inscription";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Administration from "./pages/Administration";

import "./App.css";
import "./premium.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Partie publique */}
        <Route
          path="/"
          element={<Vitrine />}
        />

        <Route
          path="/connexion"
          element={<Login />}
        />

        <Route
          path="/inscription"
          element={<Inscription />}
        />

        {/* Partie réservée aux utilisateurs connectés */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/accueil"
            element={<Accueil />}
          />

          <Route
            path="/carte"
            element={<Carte />}
          />

          <Route
            path="/signaler"
            element={<Signaler />}
          />

          <Route
            path="/incidents/:id"
            element={<IncidentDetail />}
          />

          <Route
            path="/historique"
            element={<Historique />}
          />

          <Route
            path="/profil"
            element={<Profil />}
          />
        </Route>
        <Route element={<AdminRoute />}>
          <Route path="/administration" element={<Administration />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;