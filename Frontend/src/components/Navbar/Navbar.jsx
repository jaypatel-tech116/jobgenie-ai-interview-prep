import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router";
import styles from "./Navbar.module.scss";
import MainLogo from "../../images/MainLogo.png";
import { useAuth } from "../../features/auth/hooks/useAuth";

const Navbar = () => {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const dropRef = useRef(null);
  const mobileRef = useRef(null);
  const burgerRef = useRef(null);
  const lockedScrollYRef = useRef(0);

  useEffect(() => {
    Promise.resolve().then(() => {
      setAvatarFailed(false);
    });
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      // Close avatar dropdown
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      // Close mobile hamburger menu
      if (
        mobileOpen &&
        mobileRef.current &&
        !mobileRef.current.contains(e.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [mobileOpen]);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 720) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      lockedScrollYRef.current = window.scrollY || 0;
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollYRef.current}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
    } else {
      const y = lockedScrollYRef.current || 0;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      window.scrollTo({ top: y, left: 0, behavior: "auto" });
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
    };
  }, [mobileOpen]);

  const handleNavClick = () => {
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  const handleUserLogout = async () => {
    await handleLogout();
    setDropdownOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const getInitials = (name) => {
    if (!name) return "<>";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const navLinks = [
    { to: "/", label: "Home", end: true },
  ];
  if (user) {
    navLinks.push({ to: "/dashboard", label: "Dashboard", end: false });
    navLinks.push({ to: "/interview", label: "Analyze", end: false });
    navLinks.push({ to: "/ats-check", label: "ATS Score", end: false });
    navLinks.push({ to: "/mock-interview", label: "Mock Practice", end: false });
    navLinks.push({ to: "/recent", label: "History", end: false });
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <NavLink to="/" className={styles.logo} onClick={handleNavClick}>
          <img src={MainLogo} alt="JobGenie" height={34} />
        </NavLink>

        {/* Desktop links */}
        <ul className={styles.links}>
          {navLinks.map(({ to, label, end, badge }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${styles.link} ${isActive ? styles.linkActive : ""}`
                }
              >
                <span className={styles.linkText}>{label}</span>
                {badge && <span className={styles.badge}>{badge}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop auth */}
        <div className={styles.auth}>
          {user ? (
            <div className={styles.avatarWrap} ref={dropRef}>
              <button
                className={styles.avatar}
                onClick={() => setDropdownOpen((p) => !p)}
                aria-label="User menu"
                aria-expanded={dropdownOpen}
              >
                {user?.avatar && !avatarFailed ? (
                  <img
                    src={user.avatar}
                    alt="User"
                    className={styles.avatarImg}
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span>
                    {getInitials(user.username || user.email.split("@")[0])}
                  </span>
                )}
                <span className={styles.onlineDot} />
              </button>

              {dropdownOpen && (
                <div className={styles.dropdown}>
                  {/* User info */}
                  <div className={styles.dropHeader}>
                    <div className={styles.dropAvatar}>
                      {user?.avatar && !avatarFailed ? (
                        <img
                          src={user.avatar}
                          alt="User"
                          className={styles.avatarImg}
                          onError={() => setAvatarFailed(true)}
                        />
                      ) : (
                        <span>
                          {getInitials(
                            user.username || user.email.split("@")[0],
                          )}
                        </span>
                      )}
                    </div>
                    <div className={styles.dropMeta}>
                      <div className={styles.dropName}>
                        {user.username || "User"}
                      </div>
                      <div className={styles.dropEmail}>{user.email}</div>
                    </div>
                  </div>

                  <div className={styles.dropDivider} />

                  {/* Only logout */}
                  <button
                    className={styles.dropLogout}
                    onClick={handleUserLogout}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authBtns}>
              <NavLink to="/login" className={styles.btnLogin}>
                Sign In
              </NavLink>
              <NavLink to="/register" className={styles.btnRegister}>
                Get Started
              </NavLink>
            </div>
          )}
        </div>

        {/* Hamburger */}
        <button
          ref={burgerRef}
          className={`${styles.burger} ${mobileOpen ? styles.burgerOpen : ""}`}
          onClick={() => setMobileOpen((p) => !p)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        ref={mobileRef}
        className={`${styles.mobile} ${mobileOpen ? styles.mobileOpen : ""}`}
      >
        <div className={styles.mobileInner}>
          {/* Drawer top */}
          <div className={styles.mobileTop}>
            <NavLink
              to="/"
              className={styles.mobileLogo}
              onClick={handleNavClick}
            >
              <img src={MainLogo} alt="JobGenie" height={32} />
            </NavLink>
            <button
              type="button"
              className={styles.mobileClose}
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Nav links */}
          <nav className={styles.mobileNav} aria-label="Mobile navigation">
            {navLinks.map(({ to, label, end, badge }, i) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                style={{ animationDelay: `${i * 60}ms` }}
                className={({ isActive }) =>
                  `${styles.mobileLink} ${isActive ? styles.mobileLinkActive : ""}`
                }
                onClick={handleNavClick}
              >
                <span className={styles.mobileLinkText}>{label}</span>
                {badge && <span className={styles.mobileBadge}>{badge}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Bottom: user or auth */}
          <div className={styles.mobileBottom}>
            {user ? (
              <div className={styles.mobileUser}>
                <div className={styles.mobileUserCard}>
                  <div className={styles.mobileAvatar}>
                    {user?.avatar && !avatarFailed ? (
                      <img
                        src={user.avatar}
                        alt="User"
                        className={styles.avatarImg}
                        onError={() => setAvatarFailed(true)}
                      />
                    ) : (
                      <span>
                        {getInitials(user.username || user.email.split("@")[0])}
                      </span>
                    )}
                    <span className={styles.onlineDot} />
                  </div>
                  <div className={styles.mobileUserMeta}>
                    <div className={styles.dropName}>
                      {user.username || "User"}
                    </div>
                    <div className={styles.dropEmail}>{user.email}</div>
                  </div>
                </div>

                <button
                  className={styles.mobileSignOut}
                  onClick={handleUserLogout}
                  type="button"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className={styles.mobileAuth}>
                <NavLink
                  to="/login"
                  className={styles.btnLogin}
                  onClick={handleNavClick}
                >
                  Sign In
                </NavLink>
                <NavLink
                  to="/register"
                  className={styles.btnRegister}
                  onClick={handleNavClick}
                >
                  Get Started
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
