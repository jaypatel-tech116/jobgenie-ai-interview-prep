import { Outlet, useLocation, useNavigate } from "react-router";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { useEffect, useRef } from "react";
import ScrollToTop from "../ScrollToTop/ScrollToTop";
import { useAuth } from "../../features/auth/hooks/useAuth";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const bannerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } catch {
        window.scrollTo(0, 0);
      }
      try {
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } catch {
        document.documentElement.scrollTo(0, 0);
      }
      try {
        document.body.scrollTo({ top: 0, left: 0, behavior: "instant" });
      } catch {
        document.body.scrollTo(0, 0);
      }
    };

    // Run instantly
    handleScroll();

    // Fallbacks to bypass React concurrent render DOM lag
    const animId = requestAnimationFrame(handleScroll);
    const timeoutId = setTimeout(handleScroll, 50);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(timeoutId);
    };
  }, [location.pathname, location.search]);

  const showVerifyBanner = user && user.provider === "local" && !user.isEmailVerified;

  useEffect(() => {
    if (showVerifyBanner && bannerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const borderHeight = entry.target.getBoundingClientRect().height;
          document.documentElement.style.setProperty(
            "--verify-banner-height",
            `${borderHeight}px`
          );
        }
      });
      resizeObserver.observe(bannerRef.current);
      return () => resizeObserver.disconnect();
    } else {
      document.documentElement.style.setProperty(
        "--verify-banner-height",
        "0px"
      );
    }
  }, [showVerifyBanner]);

  return (
    <>
      {showVerifyBanner && (
        <div
          ref={bannerRef}
          className="verify-email-banner"
          style={{
            background: "rgba(212, 160, 23, 0.12)",
            borderBottom: "1px solid rgba(212, 160, 23, 0.25)",
            padding: "8px 16px",
            textAlign: "center",
            color: "var(--text-primary)",
            fontSize: "0.88rem",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "12px",
            position: "relative",
            zIndex: 210,
          }}
        >
          <span>⚠️ Your email is not verified. Please verify your email address to enable all actions.</span>
          <button
            onClick={() => navigate("/verify-email")}
            type="button"
            style={{
              padding: "4px 12px",
              fontSize: "0.8rem",
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              background: "var(--gold-mid)",
              color: "#140927",
              fontWeight: "600",
            }}
          >
            Verify Now
          </button>
        </div>
      )}
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </>
  );
};

export default AppLayout;
