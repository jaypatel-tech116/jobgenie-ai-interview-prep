import React from "react";
import { useRouteError, Link } from "react-router";

const ErrorBoundary = () => {
  const error = useRouteError();

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
        Something went wrong
      </h1>
      <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem" }}>
        {error?.statusText || error?.message || "An unexpected error occurred."}
      </p>
      <Link to="/" className="btn-primary">
        ← Back to Home
      </Link>
    </main>
  );
};

export default ErrorBoundary;
