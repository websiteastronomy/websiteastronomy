"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

type NavbarProps = {
  initialIsRecruiting?: boolean;
};

export default function Navbar({ initialIsRecruiting = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExploreMobileOpen, setIsExploreMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const { user } = useAuth();
  const [features, setFeatures] = useState({ quizzesEnabled: true, observationsEnabled: true, eventsEnabled: true });
  const [isRecruiting, setIsRecruiting] = useState(initialIsRecruiting);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  useEffect(() => {
    import("@/app/actions/system-control")
      .then(({ getSystemControlPublicSnapshotAction }) => getSystemControlPublicSnapshotAction())
      .then((settings) => {
        setFeatures(settings.features);
      })
      .catch((error) => {
        console.error("[Navbar] system control fetch failed:", error);
      });

    import("@/app/actions/site-settings")
      .then(({ getSiteSettingsAction }) => getSiteSettingsAction())
      .then((settings) => {
        setIsRecruiting(settings.isRecruiting);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const navLinkStyle = (href: string) => ({
    color: isActive(href) ? "var(--gold-light)" : undefined,
  });

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
        className="site-navbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: scrolled ? "0.6rem 2.5rem" : "1rem 2.5rem",
          background: scrolled ? "rgba(8, 12, 22, 0.95)" : "rgba(12, 18, 34, 0.85)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 100,
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
          transition: "padding 0.3s ease, background 0.3s ease",
        }}
      >
        <Link
          href="/"
          className="site-navbar-brand"
          style={{ display: "flex", alignItems: "center", gap: "0.8rem", textDecoration: "none" }}
          prefetch={false}
        >
          <motion.img
            src="/logo.png"
            alt="Logo"
            className="site-navbar-logo"
            style={{
              height: scrolled ? "28px" : "36px",
              width: "auto",
              borderRadius: "50%",
              opacity: 0.9,
              transition: "height 0.3s ease",
            }}
          />
          <div className="site-navbar-brand-copy" style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
            <span
              className="gradient-text"
              style={{
                fontSize: scrolled ? "0.9rem" : "1rem",
                fontWeight: 700,
                fontFamily: "'Cinzel', serif",
                letterSpacing: "0.08em",
                transition: "font-size 0.3s ease",
              }}
            >
              Astronomy Club
            </span>
            <span
              style={{
                fontSize: "0.55rem",
                color: "var(--text-muted)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontWeight: 400,
              }}
            >
              MVJCE
            </span>
          </div>
        </Link>

        <div className="site-navbar-desktop" style={{ display: "flex", gap: "1.8rem", alignItems: "center" }}>
          <Link href="/" className="nav-link" style={navLinkStyle("/")} prefetch={false}>
            Home
          </Link>
          <Link href="/about" className="nav-link" style={navLinkStyle("/about")} prefetch={false}>
            About
          </Link>

          <div className="nav-dropdown">
            <span
              className="nav-link"
              style={{
                cursor: "default",
                color: isActive("/projects") || isActive("/observations") || isActive("/outreach") ? "var(--gold-light)" : undefined,
              }}
            >
              Explore v
            </span>
            <div className="dropdown-menu">
              <Link href="/projects" className="dropdown-item" style={isActive("/projects") ? { color: "var(--gold-light)" } : {}} prefetch={false}>
                Projects
              </Link>
              <Link href="/observations" className="dropdown-item" style={isActive("/observations") ? { color: "var(--gold-light)" } : {}} prefetch={false}>
                Observation
              </Link>
              <Link href="/events" className="dropdown-item" style={isActive("/events") ? { color: "var(--gold-light)" } : {}} prefetch={false}>
                Event
              </Link>
              <Link href="/education/quizzes" className="dropdown-item" style={isActive("/education/quizzes") ? { color: "var(--gold-light)" } : {}} prefetch={false}>
                Quiz
              </Link>
              <Link href="/documentation" className="dropdown-item" style={isActive("/documentation") ? { color: "var(--gold-light)" } : {}} prefetch={false}>
                Documentation
              </Link>
              <Link href="/outreach" className="dropdown-item" style={isActive("/outreach") ? { color: "var(--gold-light)" } : {}} prefetch={false}>
                Outreach
              </Link>
            </div>
          </div>

          {features.eventsEnabled && (
            <Link href="/events" className="nav-link" style={navLinkStyle("/events")} prefetch={false}>
              Events
            </Link>
          )}
          <Link href="/education" className="nav-link" style={navLinkStyle("/education")} prefetch={false}>
            Education
          </Link>
          {features.observationsEnabled && (
            <Link href="/observations" className="nav-link" style={navLinkStyle("/observations")} prefetch={false}>
              Observations
            </Link>
          )}
          {features.quizzesEnabled && (
            <Link href="/education/quizzes" className="nav-link" style={navLinkStyle("/education/quizzes")} prefetch={false}>
              Quizzes
            </Link>
          )}
          <Link href="/night-sky" className="nav-link" style={navLinkStyle("/night-sky")} prefetch={false}>
            Night Sky
          </Link>

          {isRecruiting && (
            <Link href="/join" className="nav-link" style={navLinkStyle("/join")} prefetch={false}>
              Join
            </Link>
          )}

          {user && <NotificationBell />}

          {user && (
            <Link href="/app" className="nav-link" style={navLinkStyle("/app")} prefetch={false}>
              Dashboard
            </Link>
          )}
          {!user && (
            <Link href="/portal" className="btn-primary" style={{ padding: "0.5rem 1.2rem", fontSize: "0.75rem", marginLeft: "0.5rem" }} prefetch={false}>
              Login
            </Link>
          )}
        </div>

        <button
          type="button"
          className={`site-navbar-toggle${isMobileMenuOpen ? " open" : ""}`}
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation-menu"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </motion.nav>

      <div className={`site-mobile-nav-backdrop${isMobileMenuOpen ? " open" : ""}`} onClick={closeMobileMenu} aria-hidden={!isMobileMenuOpen} />

      <div id="mobile-navigation-menu" className={`site-mobile-nav-panel${isMobileMenuOpen ? " open" : ""}`} aria-hidden={!isMobileMenuOpen}>
        <div className="site-mobile-nav-header">
          <span className="site-mobile-nav-title">Navigation</span>
          <button type="button" className="site-mobile-nav-close" aria-label="Close navigation menu" onClick={closeMobileMenu}>
            X
          </button>
        </div>

        <div className="site-mobile-nav-links">
          <Link href="/" className="site-mobile-nav-link" style={navLinkStyle("/")} onClick={closeMobileMenu}>
            Home
          </Link>
          <Link href="/about" className="site-mobile-nav-link" style={navLinkStyle("/about")} onClick={closeMobileMenu}>
            About
          </Link>

          <button
            type="button"
            aria-expanded={isExploreMobileOpen}
            onClick={() => setIsExploreMobileOpen((open) => !open)}
            className="site-mobile-nav-link"
            style={{
              background: "transparent",
              border: "none",
              textAlign: "left",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              color: "var(--text-primary)",
              padding: "0.8rem 1.2rem",
              fontFamily: "inherit",
              fontSize: "inherit",
              marginTop: "0.2rem",
            }}
          >
            Explore{" "}
            <span style={{ transform: isExploreMobileOpen ? "rotate(180deg)" : "none", transition: "transform 0.3s ease", fontSize: "0.8em" }}>
              ▼
            </span>
          </button>

          <AnimatePresence>
            {isExploreMobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                  paddingLeft: "1.5rem",
                  borderLeft: "1px solid rgba(255,255,255,0.1)",
                  marginLeft: "1rem",
                  marginTop: "0.2rem",
                  marginBottom: "0.5rem",
                }}
              >
                <Link href="/projects" className="site-mobile-nav-link" style={navLinkStyle("/projects")} onClick={closeMobileMenu}>
                  Projects
                </Link>
                {features.observationsEnabled && (
                  <Link href="/observations" className="site-mobile-nav-link" style={navLinkStyle("/observations")} onClick={closeMobileMenu}>
                    Observations
                  </Link>
                )}
                {features.eventsEnabled && (
                  <Link href="/events" className="site-mobile-nav-link" style={navLinkStyle("/events")} onClick={closeMobileMenu}>
                    Events
                  </Link>
                )}
                {features.quizzesEnabled && (
                  <Link href="/education/quizzes" className="site-mobile-nav-link" style={navLinkStyle("/education/quizzes")} onClick={closeMobileMenu}>
                    Quizzes
                  </Link>
                )}
                <Link href="/documentation" className="site-mobile-nav-link" style={navLinkStyle("/documentation")} onClick={closeMobileMenu}>
                  Documentation
                </Link>
                <Link href="/outreach" className="site-mobile-nav-link" style={navLinkStyle("/outreach")} onClick={closeMobileMenu}>
                  Outreach
                </Link>
                <Link href="/education" className="site-mobile-nav-link" style={navLinkStyle("/education")} onClick={closeMobileMenu}>
                  Education
                </Link>
                <Link href="/night-sky" className="site-mobile-nav-link" style={navLinkStyle("/night-sky")} onClick={closeMobileMenu}>
                  Night Sky
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          {isRecruiting && (
            <Link href="/join" className="site-mobile-nav-link" style={navLinkStyle("/join")} onClick={closeMobileMenu}>
              Join
            </Link>
          )}
          {user && (
            <Link href="/app" className="site-mobile-nav-link site-mobile-nav-dashboard-link" style={navLinkStyle("/app")} onClick={closeMobileMenu}>
              Dashboard
            </Link>
          )}
          {!user && (
            <Link
              href="/portal"
              className="btn-primary mobile-nav-cta"
              style={{ width: "100%", textAlign: "center", marginTop: "1rem", display: "block", boxSizing: "border-box" }}
              onClick={closeMobileMenu}
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
