import { Navigate } from "react-router-dom";
import ResidentLayout from "./ResidentLayout";

function ProtectedRoute() {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return <ResidentLayout />;
}

export default ProtectedRoute;