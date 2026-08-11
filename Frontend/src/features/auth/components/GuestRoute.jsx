import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";

const GuestRoute = ({ children }) => {
  const { user, authChecked } = useAuth();

  // ⏳ wait until auth is checked
  if (!authChecked) {
    return (
      <main className="loading-screen">
        <div className="loading-spinner"></div>
        <h1>Loading JobGenie...</h1>
      </main>
    );
  }

  // 🔐 already logged in → redirect
  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default GuestRoute;
