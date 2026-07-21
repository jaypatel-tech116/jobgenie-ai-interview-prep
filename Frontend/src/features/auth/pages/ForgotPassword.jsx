import React, { useState } from "react";
import "../auth.form.scss";
import { useNavigate, NavLink } from "react-router";
import { forgotPassword } from "../services/auth.api";
import SmallLogo from "../../../images/SmallLogo.png";
import { useToast } from "../../../components/Toast/ToastContext";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.warning("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      await forgotPassword({ email });
      toast.success("Password reset OTP code sent to your email.");
      // Pass email context to ResetPassword page via route state
      navigate("/reset-password", { state: { email } });
    } catch (err) {
      toast.error(err?.message || "Failed to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="orb orb--violet" />
      <div className="orb orb--gold" />

      <div className="card">
        <div className="cardTop">
          <div className="logoWrap">
            <img src={SmallLogo} alt="JobGenie" className="logo" />
          </div>
          <h2 className="title">Reset Password</h2>
          <p className="sub">Enter your email and we'll send you an OTP to reset your password.</p>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <button className="submitBtn" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Code"}
          </button>
        </form>

        <p className="switchText">
          Remember your password?{" "}
          <NavLink to="/login" className="switchLink">
            Sign In →
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
