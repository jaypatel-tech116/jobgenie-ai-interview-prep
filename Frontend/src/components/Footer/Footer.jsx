import { NavLink } from "react-router";
import { Globe, Mail, Zap } from "lucide-react";
import styles from "./Footer.module.scss";
import SmallLogo from "../../images/SmallLogo.png";
import { useAuth } from "../../features/auth/hooks/useAuth";

const Footer = () => {
  const { user } = useAuth(); // ✅ now valid

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <img src={SmallLogo} alt="JobGenie" className={styles.logo} />
          <p className={styles.tagline}>
            Your AI-powered career genie - turning resumes into opportunities.
          </p>
          <p className={styles.copy}>
            © {new Date().getFullYear()} JobGenie. All rights reserved.
          </p>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <nav className={`${styles.colLinks} ${!user ? styles.singleCol : ""}`}>
            <NavLink to="/" className={styles.colLink}>
              Home
            </NavLink>

            {user && (
              <>
                <NavLink to="/dashboard" className={styles.colLink}>
                  Dashboard
                </NavLink>
                <NavLink to="/interview" className={styles.colLink}>
                  Analyze Resume
                </NavLink>
                <NavLink to="/ats-check" className={styles.colLink}>
                  ATS Score
                </NavLink>
                <NavLink to="/mock-interview" className={styles.colLink}>
                  Mock Practice
                </NavLink>
                <NavLink to="/recent" className={styles.colLink}>
                  History
                </NavLink>
              </>
            )}

            {!user && (
              <>
                <NavLink to="/login" className={styles.colLink}>
                  Login
                </NavLink>
                <NavLink to="/register" className={styles.colLink}>
                  Register
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Contact</h4>
          <div className={styles.contacts}>
            <a href="mailto:jaypatel010126@gmail.com" className={styles.contact}>
              <Mail size={15} />
              support@jobgenie.ai
            </a>
            <a
              href="https://github.com/jaypatel-tech116/jobgenie-ai-interview-prep"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.contact}
            >
              <Globe size={15} />
              View on GitHub
            </a>
            <div className={styles.contact}>
              <Zap size={15} />
              Powered by AI
            </div>
          </div>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>Built with ✦ for job seekers everywhere</span>
      </div>
    </footer>
  );
};

export default Footer;
