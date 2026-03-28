import Link from 'next/link';

export default function Learn() {
  const dailyFact = {
    text: "Neutron stars are so dense that a teaspoon of their material would weigh about 6 billion tons on Earth.",
    source: "NASA Science"
  };

  const articles = [
    { id: 1, title: "How to Choose Your First Telescope", category: "Beginner Guide", readTime: "5 min" },
    { id: 2, title: "Understanding Constellations: A Beginner's Map", category: "Beginner Guide", readTime: "7 min" },
    { id: 3, title: "Astrophotography with a Smartphone", category: "Tutorial", readTime: "6 min" },
    { id: 4, title: "The Science Behind Rocket Propulsion", category: "Deep Dive", readTime: "10 min" },
    { id: 5, title: "What Makes the James Webb Telescope Special?", category: "News", readTime: "4 min" },
  ];

  const guides = [
    { title: "Constellations", icon: "⭐", description: "Learn to identify major constellations visible from India." },
    { title: "Telescopes", icon: "🔭", description: "Types, setup, maintenance, and best practices." },
    { title: "Rockets", icon: "🚀", description: "From model rockets to orbital mechanics basics." },
  ];

  return (
    <div className="page-container">
      <p className="section-title">Education</p>
      <h1 className="page-title"><span className="gradient-text">Learn Astronomy</span></h1>
      <p className="page-subtitle">
        Daily facts, weekly articles, and beginner guides to kickstart your journey.
      </p>

      {/* Daily Fact */}
      <div style={{ width: '100%', padding: '2rem', borderLeft: '3px solid var(--gold)', background: 'rgba(15, 22, 40, 0.3)', marginBottom: '3rem' }}>
        <p className="section-title" style={{ marginBottom: '0.5rem' }}>✨ Astronomy Fact of the Day</p>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, fontWeight: 300, marginBottom: '0.5rem' }}>{dailyFact.text}</p>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Source: {dailyFact.source}</span>
      </div>

      {/* Beginner Guides */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Beginner Guides</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', width: '100%', marginBottom: '3rem' }}>
        {guides.map((guide) => (
          <div key={guide.title} className="feature-card" style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>{guide.icon}</span>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{guide.title}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 300 }}>{guide.description}</p>
          </div>
        ))}
      </div>

      {/* Articles */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', alignSelf: 'flex-start' }}>Weekly Articles</h2>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '3rem' }}>
        {articles.map((article) => (
          <div key={article.id} style={{ padding: '1.2rem 1.5rem', background: 'rgba(15, 22, 40, 0.3)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', cursor: 'pointer', transition: 'all 0.3s ease', border: '1px solid transparent' }} className="feature-card">
            <div>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--gold)', fontWeight: 600 }}>{article.category}</span>
              <h4 style={{ fontSize: '1rem', marginTop: '0.3rem' }}>{article.title}</h4>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>⏱️ {article.readTime}</span>
          </div>
        ))}
      </div>

      {/* CTA to Quiz */}
      <div className="feature-card" style={{ width: '100%', textAlign: 'center', padding: '3rem' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Test Your Knowledge</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontWeight: 300 }}>Take our daily astronomy quiz and climb the leaderboard!</p>
        <Link href="/learn/quiz" className="btn-primary">Take the Quiz</Link>
      </div>
    </div>
  );
}
