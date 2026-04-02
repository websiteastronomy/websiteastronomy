"use client";

import Link from 'next/link';
import AnimatedSection from './AnimatedSection';

export default function Footer() {
  return (
    <AnimatedSection>
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '4rem 2.5rem 2rem',
        background: 'rgba(8, 12, 22, 0.6)',
        marginTop: '6rem'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem' }}>

          {/* Brand */}
          <div>
            <h3 className="gradient-text" style={{ fontFamily: "'Cinzel', serif", fontSize: '1.3rem', marginBottom: '1rem', letterSpacing: '0.06em' }}>
              Astronomy Club
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7, fontWeight: 300 }}>
              MVJCE Astronomy Club<br />
              Exploring the cosmos, one star at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: '1rem' }}>Quick Links</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Link href="/about" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>About Us</Link>
              <Link href="/events" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Events</Link>
              <Link href="/projects" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Projects</Link>
              <Link href="/media" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Media Hub</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: '1rem' }}>Resources</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <Link href="/education" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Education Base</Link>
              <Link href="/night-sky" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Night Sky Dashboard</Link>
              <Link href="/observations" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Observations</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: '1rem' }}>Connect</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                MVJCE, Bangalore
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                astronomyclub@mvjce.edu.in
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                Instagram: @astronomy.mvj
              </span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1100px', margin: '3rem auto 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 300 }}>
            © 2026 MVJCE Astronomy Club. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/admin" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 300 }}>Admin</Link>
          </div>
        </div>
      </footer>
    </AnimatedSection>
  );
}
