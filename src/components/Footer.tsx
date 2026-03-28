import Link from 'next/link';

export default function Footer() {
  return (
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
            <Link href="/gallery" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Gallery</Link>
          </div>
        </div>

        {/* Resources */}
        <div>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: '1rem' }}>Resources</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Link href="/learn" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Learn Astronomy</Link>
            <Link href="/learn/quiz" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Quizzes</Link>
            <Link href="/night-sky" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Night Sky Dashboard</Link>
            <Link href="/observations" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>Observations</Link>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--gold)', marginBottom: '1rem' }}>Connect</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>
            <span>📍 MVJCE, Bangalore</span>
            <span>📧 astronomyclub@mvjce.edu.in</span>
            <span>📱 Instagram: @mvjce_astro</span>
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
  );
}
