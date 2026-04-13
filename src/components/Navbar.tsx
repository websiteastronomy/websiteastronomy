"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "@/components/NotificationBell";

type NavbarProps = {
  initialIsRecruiting?: boolean;
};

export default function Navbar({ initialIsRecruiting = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isRecruiting, setIsRecruiting] = useState(initialIsRecruiting);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  useEffect(() => {
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

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/events", label: "Events" },
    { href: "/education", label: "Education" },
    { href: "/projects", label: "Projects" },
    ...(isRecruiting ? [{ href: "/join", label: "Join" }] : []),
    { href: "/night-sky", label: "Night Sky" },
    { href: "/contact", label: "Contact" },
  ];

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
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link" style={navLinkStyle(link.href)} prefetch={false}>
              {link.label}
            </Link>
          ))}

          {user && <NotificationBell />}

          <Link href="/portal" className="btn-primary" style={{ padding: "0.5rem 1.2rem", fontSize: "0.75rem", marginLeft: "0.5rem" }} prefetch={false}>
            {user ? "Portal" : "Login"}
          </Link>
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
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="site-mobile-nav-link" style={navLinkStyle(link.href)} onClick={closeMobileMenu}>
              {link.label}
            </Link>
          ))}
          <Link
            href="/portal"
            className="btn-primary mobile-nav-cta"
            style={{ width: "100%", textAlign: "center", marginTop: "1rem", display: "block", boxSizing: "border-box" }}
            onClick={closeMobileMenu}
          >
            {user ? "Portal" : "Login"}
          </Link>
        </div>
      </div>
    </>
  );
}
