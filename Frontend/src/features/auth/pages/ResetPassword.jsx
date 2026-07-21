import React, { useState } from "react";
import "../auth.form.scss";
import { useNavigate, useLocation, NavLink } from "react-router";
import { resetPassword } from "../services/auth.api";
import SmallLogo from "../../../images/SmallLogo.png";
import { useToast } from "../../../components/Toast/ToastContext";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  // Populate email from navigation state if available
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !otp.trim() || !newPassword.trim()) {
      toast.warning("Please fill in all fields.");
      return;
    }

    if (otp.length !== 6) {
      toast.warning("OTP code must be exactly 6 digits.");
      return;
    }

    if (newPassword.length < 8) {
      toast.warning("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ email, otp, newPassword });
      toast.success("Password reset successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err?.message || "Failed to reset password.");
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
          <h2 className="title">New Password</h2>
          <p className="sub">Enter the code sent to your email and your new password.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email field */}
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

          {/* OTP field */}
          <div className="field">
            <label htmlFor="otp" className="label">
              Reset Code (OTP)
            </label>
            <div className="inputWrap">
              <svg className="inputIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="text"
                maxLength={6}
                name="otp"
                id="otp"
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                required
                style={{ letterSpacing: "4px" }}
              />
            </div>
          </div>

          {/* New Password field */}
          <div className="field">
            <label htmlFor="newPassword" className="label">
              New Password
            </label>
            <div className="inputWrap">
              <svg className="inputIcon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 letter, 1 number"
                required
              />
            </div>
          </div>

          <button className="submitBtn" disabled={loading}>
            {loading ? "Resetting..." : "Update Password"}
          </button>
        </form>

        <p className="switchText">
          Back to{" "}
          <NavLink to="/login" className="switchLink">
            Sign In
          </NavLink>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
