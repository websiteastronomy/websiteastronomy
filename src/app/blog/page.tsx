"use client";

import AnimatedSection from '@/components/AnimatedSection';

export default function Blog() {
  const posts = [
    { id: 1, title: "How to Choose Your First Telescope", category: "Guide", date: "Mar 10, 2026", readTime: "5 min read", img: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=800&q=80" },
    { id: 2, title: "Processing Deep Space Images in Lightroom", category: "Tutorial", date: "Feb 28, 2026", readTime: "8 min read", img: "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?w=800&q=80" },
    { id: 3, title: "Understanding the James Webb Space Telescope", category: "News", date: "Feb 15, 2026", readTime: "4 min read", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80" },
    { id: 4, title: "The Best Stargazing Spots Near Campus", category: "Local", date: "Jan 22, 2026", readTime: "3 min read", img: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&q=80" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 2rem" }}>
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <AnimatedSection>
          <h1 className="glow-text breathing-glow" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>
            Educational <span className="gradient-text">Resources</span>
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>
            Guides, news, and tutorials written by club members.
          </p>
        </AnimatedSection>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {posts.map((post, i) => (
            <AnimatedSection key={post.id} direction="up" delay={i * 0.1}>
              <div className="glass-panel feature-card" style={{ padding: 0, overflow: 'hidden', cursor: "pointer", borderLeft: "3px solid transparent", textAlign: 'left' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderLeftColor = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderLeftColor = "transparent";
                }}
              >
                <div className="gallery-img-wrap" style={{ width: '100%', height: '180px', overflow: 'hidden' }}>
                  <img src={post.img} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }} className="gallery-img" />
                </div>
                <div style={{ padding: '1.5rem 2rem' }}>
                  <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--gold-light)", fontWeight: "bold" }}>{post.category}</span>
                  <h2 style={{ fontSize: "1.5rem", margin: "0.5rem 0 1rem 0" }}>{post.title}</h2>
                  <div style={{ display: "flex", gap: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem", alignItems: 'center' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {post.date}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  );
}
