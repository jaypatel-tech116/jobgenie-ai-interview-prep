import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import "../auth.form.scss";
import SmallLogo from "../../../images/SmallLogo.png";
import { useToast } from "../../../components/Toast/ToastContext";

const Register = () => {
  const { loading, handleRegister, handleGoogleLogin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleRegister({ username, email, password });
      toast.success("Account created! Please log in.");
      navigate("/");
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          "Registration failed. Please try again.",
      );
    }
  };

  const checkStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    setStrength(score);
  };

  const strengthColors = ["", "#e24b4a", "#ef9f27", "#d4a017", "#5dcaa5"];
  const strengthLabels = ["", "Too weak", "Weak", "Good", "Strong"];



  return (
    <div className="page">
      <div className="orb orb--violet" />
      <div className="orb orb--gold" />

      <div className="card">
        <div className="cardTop">
          <div className="logoWrap">
            <img src={SmallLogo} alt="JobGenie" className="logo" />
          </div>
          <h2 className="title">Create Account</h2>
          <p className="sub">Start your job-winning journey today</p>
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
              toast.error("Google sign-up failed");
            }
          }}
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="google"
            className="googleIcon"
          />
          Sign up with Google
        </button>

        <div className="divider">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username" className="label">
              Username
            </label>
            <div className="inputWrap">
              <svg
                className="inputIcon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                type="text"
                name="username"
                id="username"
                className="input"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="johndoe"
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email" className="label">
              Email address
            </label>
            <div className="inputWrap">
              <svg
                className="inputIcon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
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
            <label htmlFor="password" className="label">
              Password
            </label>
            <div className="inputWrap">
              <svg
                className="inputIcon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                name="password"
                id="password"
                className="input"
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkStrength(e.target.value);
                }}
                placeholder="Min. 8 characters"
              />
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="strengthWrap">
                <div className="strengthBar">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="strengthSeg"
                      style={{
                        background:
                          i <= strength
                            ? strengthColors[strength]
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
                <span
                  className="strengthLabel"
                  style={{ color: strengthColors[strength] }}
                >
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="submitBtn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" />
                Creating account...
              </>
            ) : (
              <>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="switchText">
          Already have an account?{" "}
          <NavLink to="/login" className="switchLink">
            Sign in →
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default Register;
