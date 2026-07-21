import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from "react";

const Protected = ({ children, allowUnverified = false }) => {
  const { loading, user, authChecked } = useAuth();

  if (loading || !authChecked) {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <span className="spinner" />
      </main>
    );
  }

  if (!user) {
    return <Navigate to={"/login"} />;
  }

  // If local user's email is not verified, restrict access to verify-email or allowed routes
  if (user.provider === "local" && !user.isEmailVerified && !allowUnverified) {
    return <Navigate to={"/verify-email"} />;
  }

  return children;
};

export default Protected;
