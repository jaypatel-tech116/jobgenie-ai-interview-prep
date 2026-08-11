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
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        document.documentElement.style.scrollBehavior = "";
      } catch {
        window.scrollTo(0, 0);
      }
    };

    // Immediate scroll execution
    handleScroll();

    // Staggered fallbacks to ensure scroll position is reset even after dynamic updates
    const animId = requestAnimationFrame(handleScroll);
    const t1 = setTimeout(handleScroll, 10);
    const t2 = setTimeout(handleScroll, 50);
    const t3 = setTimeout(handleScroll, 150);

    return () => {
      cancelAnimationFrame(animId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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
    <div className="app-shell">
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
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default AppLayout;
