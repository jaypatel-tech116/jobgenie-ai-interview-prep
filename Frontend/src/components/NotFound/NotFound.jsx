import React from "react";
import { Link } from "react-router";

const NotFound = () => {
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
      <h1
        style={{
          fontSize: "4rem",
          fontFamily: "var(--font-display)",
          color: "var(--gold-light)",
          marginBottom: "0.5rem",
        }}
      >
        404
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: "var(--text-muted)",
          marginBottom: "1.5rem",
        }}
      >
        Page not found
      </p>
      <Link to="/" className="btn-primary">
        ← Back to Home
      </Link>
    </main>
  );
};

export default NotFound;
