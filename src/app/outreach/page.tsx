export default function Outreach() {
  const activities = [
    {
      title: "School Telescope Demonstrations",
      description: "Bringing portable telescopes to local schools and introducing students to the night sky. We've visited 12 schools this year.",
      icon: "🏫",
      impact: "500+ students reached"
    },
    {
      title: "Orphanage Stargazing Nights",
      description: "Monthly visits to local orphanages for stargazing sessions, storytelling about constellations, and inspiring curiosity.",
      icon: "🌟",
      impact: "8 sessions completed"
    },
    {
      title: "Public Telescope Events",
      description: "Open-to-all telescope viewing sessions during astronomical events — eclipses, meteor showers, planetary conjunctions.",
      icon: "🔭",
      impact: "1000+ attendees"
    },
    {
      title: "Astronomy Awareness Week",
      description: "Annual campus-wide event featuring talks, exhibitions, planetarium shows, and hands-on workshops.",
      icon: "🎪",
      impact: "3 days, 20+ events"
    },
  ];

  return (
    <div className="page-container">
      <p className="section-title">Community</p>
      <h1 className="page-title"><span className="gradient-text">Outreach</span></h1>
      <p className="page-subtitle">
        Spreading the wonder of astronomy beyond campus — school visits, public events, and community engagement.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', width: '100%' }}>
        {activities.map((item) => (
          <div key={item.title} className="feature-card" style={{ textAlign: 'left' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{item.icon}</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, fontWeight: 300, marginBottom: '1.2rem' }}>{item.description}</p>
            <span className="gradient-text" style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
