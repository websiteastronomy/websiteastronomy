"use client";

import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '1rem 2.5rem',
      background: 'rgba(12, 18, 34, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid rgba(255, 255, 255, 0.04)'
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', textDecoration: 'none' }}>
        <img src="/logo.png" alt="Logo" style={{ height: '36px', width: 'auto', borderRadius: '50%', opacity: 0.9 }} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span className="gradient-text" style={{ fontSize: '1rem', fontWeight: 700, fontFamily: "'Cinzel', serif", letterSpacing: '0.08em' }}>
            Astronomy Club
          </span>
          <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.25em', textTransform: 'uppercase', fontWeight: 400 }}>
            MVJCE
          </span>
        </div>
      </Link>

      {/* Desktop Nav */}
      <div style={{ display: 'flex', gap: '1.8rem', alignItems: 'center' }}>
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/about" className="nav-link">About</Link>

        {/* Explore Dropdown */}
        <div className="nav-dropdown">
          <span className="nav-link" style={{ cursor: 'default' }}>Explore ▾</span>
          <div className="dropdown-menu">
            <Link href="/projects" className="dropdown-item">Projects</Link>
            <Link href="/observations" className="dropdown-item">Observations</Link>
            <Link href="/outreach" className="dropdown-item">Outreach</Link>
            <Link href="/gallery" className="dropdown-item">Gallery</Link>
          </div>
        </div>

        <Link href="/events" className="nav-link">Events</Link>

        {/* Learn Dropdown */}
        <div className="nav-dropdown">
          <span className="nav-link" style={{ cursor: 'default' }}>Learn ▾</span>
          <div className="dropdown-menu">
            <Link href="/learn" className="dropdown-item">Articles & Guides</Link>
            <Link href="/learn/quiz" className="dropdown-item">Quizzes</Link>
            <Link href="/night-sky" className="dropdown-item">Night Sky Dashboard</Link>
          </div>
        </div>

        <Link href="/portal" className="btn-primary" style={{ padding: '0.5rem 1.2rem', fontSize: '0.75rem' }}>Member Portal</Link>
      </div>
    </nav>
  );
}
