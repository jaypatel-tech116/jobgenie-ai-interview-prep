import React, { useState, useEffect } from "react";
import "../auth.form.scss";
import { useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { requestEmailVerification, confirmEmailVerification } from "../services/auth.api";
import SmallLogo from "../../../images/SmallLogo.png";
import { useToast } from "../../../components/Toast/ToastContext";

const VerifyEmail = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Guard: if user is not logged in or already verified, redirect
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.isEmailVerified) {
      toast.info("Your email is already verified.");
      navigate("/dashboard");
    }
  }, [user, navigate, toast]);

  // Handle countdown for resend timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSendOtp = async () => {
    setSendingOtp(true);
    try {
      await requestEmailVerification();
      toast.success("Verification OTP code sent to your email.");
      setCooldown(60); // 60s cooldown
    } catch (err) {
      toast.error(err?.error || err?.message || "Failed to send OTP code.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleConfirmOtp = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.warning("Please enter a valid 6-digit OTP code.");
      return;
    }

    setVerifyingOtp(true);
    try {
      await confirmEmailVerification({ otp });
      toast.success("Email verified successfully! Opening Dashboard...");
      // Update local context state
      setUser((prev) => (prev ? { ...prev, isEmailVerified: true } : null));
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.error || err?.message || "Verification failed. Try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (!user) return null;

  return (
    <div className="page">
      <div className="orb orb--violet" />
      <div className="orb orb--gold" />

      <div className="card">
        <div className="cardTop">
          <div className="logoWrap">
            <img src={SmallLogo} alt="JobGenie" className="logo" />
          </div>
          <h2 className="title">Verify Your Email</h2>
          <p className="sub">Please verify your email address to access JobGenie features.</p>
        </div>

        <form onSubmit={handleConfirmOtp}>
          <div className="field">
            <label htmlFor="otp" className="label">
              Enter 6-Digit Code
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
                style={{ letterSpacing: "8px", textAlign: "center", fontSize: "1.2rem", fontWeight: "bold" }}
              />
            </div>
          </div>

          <button className="submitBtn" disabled={verifyingOtp || sendingOtp || otp.length !== 6}>
            {verifyingOtp ? "Verifying..." : "Verify Code"}
          </button>
        </form>

        <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
          <button
            onClick={handleSendOtp}
            disabled={verifyingOtp || sendingOtp || cooldown > 0}
            style={{
              background: "none",
              border: "none",
              color: cooldown > 0 || sendingOtp || verifyingOtp ? "var(--text-muted)" : "var(--gold-light)",
              cursor: cooldown > 0 || sendingOtp || verifyingOtp ? "default" : "pointer",
              fontWeight: "600",
            }}
            type="button"
          >
            {sendingOtp ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Request New Code"}
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              textDecoration: "underline",
            }}
            type="button"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
