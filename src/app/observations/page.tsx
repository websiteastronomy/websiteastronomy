import Link from 'next/link';

export default function Observations() {
  const categories = [
    { title: "Moon Observations", icon: "🌙", count: 24, description: "Lunar surface photography, phase tracking, and crater mapping." },
    { title: "Planetary Observations", icon: "🪐", count: 18, description: "Jupiter's bands, Saturn's rings, Mars opposition captures." },
    { title: "Astrophotography", icon: "📷", count: 42, description: "Deep-sky objects — nebulae, galaxies, and star clusters." },
    { title: "Observation Logs", icon: "📓", count: 67, description: "Detailed session logs including equipment, conditions, and notes." },
  ];

  const recentLogs = [
    { date: "Mar 15, 2026", target: "Orion Nebula (M42)", observer: "Alex Nova", conditions: "Clear, Seeing 4/5" },
    { date: "Mar 12, 2026", target: "Jupiter & Galilean Moons", observer: "Jordan Orion", conditions: "Partly cloudy, Seeing 3/5" },
    { date: "Mar 8, 2026", target: "Lunar Crater Tycho", observer: "Taylor Vega", conditions: "Clear, Seeing 5/5" },
  ];

  return (
    <div className="page-container">
      <p className="section-title">Members Only</p>
      <h1 className="page-title"><span className="gradient-text">Observations</span></h1>
      <p className="page-subtitle">
        Moon observations, planetary imaging, astrophotography, and session logs by our members.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', width: '100%', marginBottom: '4rem' }}>
        {categories.map((cat) => (
          <div key={cat.title} className="feature-card" style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '2rem' }}>{cat.icon}</span>
            <h3 style={{ fontSize: '1.2rem', margin: '1rem 0 0.5rem' }}>{cat.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300, lineHeight: 1.6, marginBottom: '1rem' }}>{cat.description}</p>
            <span style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 600 }}>{cat.count} entries</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Recent Observation Logs</h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {recentLogs.map((log, i) => (
          <div key={i} style={{ padding: '1.2rem 1.5rem', borderLeft: '2px solid var(--gold-dark)', background: 'rgba(15, 22, 40, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.3rem' }}>{log.target}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 300 }}>by {log.observer} · {log.conditions}</p>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
