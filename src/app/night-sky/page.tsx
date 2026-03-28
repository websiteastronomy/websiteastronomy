export default function NightSky() {
  const moonPhase = { phase: "Waning Gibbous", illumination: "78%", icon: "🌖" };

  const visiblePlanets = [
    { name: "Jupiter", constellation: "Taurus", magnitude: -2.3, icon: "🟤" },
    { name: "Saturn", constellation: "Aquarius", magnitude: 0.9, icon: "🟡" },
    { name: "Mars", constellation: "Gemini", magnitude: 1.2, icon: "🔴" },
    { name: "Venus", constellation: "Pisces", magnitude: -3.9, icon: "⚪" },
  ];

  const upcomingEvents = [
    { event: "Eta Aquariid Meteor Shower", date: "May 4-5, 2026", peak: "~30 meteors/hr" },
    { event: "Total Lunar Eclipse", date: "May 26, 2026", peak: "Visible from India" },
    { event: "Saturn at Opposition", date: "Sep 8, 2026", peak: "Best visibility all year" },
  ];

  return (
    <div className="page-container">
      <p className="section-title">Tonight's Sky</p>
      <h1 className="page-title"><span className="gradient-text">Night Sky Dashboard</span></h1>
      <p className="page-subtitle">
        Real-time sky conditions, moon phase, visible planets, and upcoming celestial events.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', width: '100%', marginBottom: '3rem' }}>
        
        {/* Moon Phase */}
        <div className="feature-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>{moonPhase.icon}</span>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Moon Phase</h3>
          <p style={{ color: 'var(--gold-light)', fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.3rem' }}>{moonPhase.phase}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Illumination: {moonPhase.illumination}</p>
        </div>

        {/* Visible Planets */}
        <div className="feature-card" style={{ textAlign: 'left', padding: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: '1.2rem' }}>Visible Planets Tonight</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {visiblePlanets.map((planet) => (
              <div key={planet.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span>{planet.icon}</span>
                  <div>
                    <span style={{ fontWeight: 500 }}>{planet.name}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block' }}>in {planet.constellation}</span>
                  </div>
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>mag {planet.magnitude}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ISS Tracker placeholder */}
        <div className="feature-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛸</span>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>ISS Tracker</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 300, marginBottom: '1rem' }}>
            Track the International Space Station in real-time.
          </p>
          <span style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 500 }}>Coming Soon</span>
        </div>
      </div>

      {/* Upcoming Celestial Events */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Upcoming Celestial Events</h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {upcomingEvents.map((evt, i) => (
          <div key={i} style={{ padding: '1.2rem 1.5rem', borderLeft: '2px solid var(--gold-dark)', background: 'rgba(15, 22, 40, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>{evt.event}</h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 300 }}>{evt.peak}</p>
            </div>
            <span style={{ color: 'var(--gold-light)', fontSize: '0.85rem', fontWeight: 500 }}>{evt.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
