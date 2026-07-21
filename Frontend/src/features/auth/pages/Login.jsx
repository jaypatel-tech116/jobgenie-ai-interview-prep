import React, { useState } from "react";
import "../auth.form.scss";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import SmallLogo from "../../../images/SmallLogo.png";
import { useToast } from "../../../components/Toast/ToastContext";

const Login = () => {
  const { loading, handleLogin, handleGoogleLogin, authChecked } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleLogin({ email, password });
      toast.success("Welcome back! Redirecting...");
      navigate("/");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Login failed. Check your credentials.",
      );
    }
  };

  if (!authChecked) {
    return <h1>Checking session...</h1>;
  }

  return (
    <div className="page">
      <div className="orb orb--violet" />
      <div className="orb orb--gold" />

      <div className="card">
        {/* Top accent line is handled via border-top in CSS */}

        <div className="cardTop">
          <div className="logoWrap">
            <img src={SmallLogo} alt="JobGenie" className="logo" />
          </div>
          <h2 className="title">Welcome Back</h2>
          <p className="sub">Sign in to continue your journey</p>
        </div>

        {/* Google Button */}
        <button
          type="button"
          className="googleBtn"
          disabled={loading}
          onClick={async () => {
            try {
              await handleGoogleLogin();
              navigate("/");
            } catch (err) {
              if (err.code === "auth/popup-closed-by-user") return;
              toast.error("Google login failed");
            }
          }}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            className="googleIcon"
          />
          Continue with Google
        </button>

        <div className="divider">
          <span>or continue with email</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email" className="label">
              Email address
            </label>
            <div className="inputWrap">
              <svg className="inputIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,12 2,6" />
              </svg>
              <input
                type="email"
                name="email"
                id="email"
                className="input"
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="field">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "7px" }}>
              <label htmlFor="password" style={{ margin: 0 }} className="label">
                Password
              </label>
              <NavLink
                to="/forgot-password"
                style={{ fontSize: "0.78rem", color: "var(--gold-light)", textDecoration: "none", fontWeight: "600" }}
              >
                Forgot password?
              </NavLink>
            </div>
            <div className="inputWrap">
              <svg className="inputIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                name="password"
                id="password"
                className="input"
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button className="submitBtn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="switchText">
          Don't have an account?{" "}
          <NavLink to="/register" className="switchLink">
            Create one →
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default Login;