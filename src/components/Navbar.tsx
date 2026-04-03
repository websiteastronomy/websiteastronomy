"use client";

import Link from 'next/link';
import { useState } from 'react';
import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import NotificationBell from '@/components/NotificationBell';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const { user } = useAuth();

  const isRecruiting = true;

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 50);
  });

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const navLinkStyle = (href: string) => ({
    color: isActive(href) ? 'var(--gold-light)' : undefined,
  });

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.4, 0.25, 1] }}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: scrolled ? '0.6rem 2.5rem' : '1rem 2.5rem',
        background: scrolled ? 'rgba(8, 12, 22, 0.95)' : 'rgba(12, 18, 34, 0.85)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        transition: 'padding 0.3s ease, background 0.3s ease',
      }}
    >
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
        <motion.img
          src="/logo.png"
          alt="Logo"
          style={{
            height: scrolled ? '28px' : '36px',
            width: 'auto',
            borderRadius: '50%',
            opacity: 0.9,
            transition: 'height 0.3s ease',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span className="gradient-text" style={{ fontSize: scrolled ? '0.9rem' : '1rem', fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em', transition: 'font-size 0.3s ease' }}>
            Astronomy Club
          </span>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 400 }}>
            MVJCE
          </span>
        </div>
      </Link>

      {/* Desktop Nav */}
      <div style={{ display: 'flex', gap: '1.8rem', alignItems: 'center' }}>
        <Link href="/" className="nav-link" style={navLinkStyle('/')}>Home</Link>
        <Link href="/about" className="nav-link" style={navLinkStyle('/about')}>About</Link>

        <div className="nav-dropdown">
          <span className="nav-link" style={{ cursor: 'default', color: isActive('/projects') || isActive('/observations') || isActive('/outreach') ? 'var(--gold-light)' : undefined }}>Explore ▾</span>
          <div className="dropdown-menu">
            <Link href="/projects" className="dropdown-item" style={isActive('/projects') ? { color: 'var(--gold-light)' } : {}}>Projects</Link>
            <Link href="/observations" className="dropdown-item" style={isActive('/observations') ? { color: 'var(--gold-light)' } : {}}>Observations</Link>
            <Link href="/outreach" className="dropdown-item" style={isActive('/outreach') ? { color: 'var(--gold-light)' } : {}}>Outreach</Link>
          </div>
        </div>

        <Link href="/events" className="nav-link" style={navLinkStyle('/events')}>Events</Link>
        <Link href="/education" className="nav-link" style={navLinkStyle('/education')}>Education</Link>
        <Link href="/education/quizzes" className="nav-link" style={navLinkStyle('/education/quizzes')}>Quizzes</Link>
        <Link href="/night-sky" className="nav-link" style={navLinkStyle('/night-sky')}>Night Sky</Link>

        {isRecruiting && (
          <Link href="/join" className="nav-link" style={navLinkStyle('/join')}>Join</Link>
        )}

        {/* Notification Bell — only for authenticated users */}
        {user && <NotificationBell />}

        <Link href="/portal" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}>Member Portal</Link>
      </div>
    </motion.nav>
  );
}
