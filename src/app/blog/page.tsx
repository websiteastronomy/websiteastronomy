export default function Blog() {
  const posts = [
    { id: 1, title: "How to Choose Your First Telescope", category: "Guide", date: "Mar 10, 2026", readTime: "5 min read" },
    { id: 2, title: "Processing Deep Space Images in Lightroom", category: "Tutorial", date: "Feb 28, 2026", readTime: "8 min read" },
    { id: 3, title: "Understanding the James Webb Space Telescope", category: "News", date: "Feb 15, 2026", readTime: "4 min read" },
    { id: 4, title: "The Best Stargazing Spots Near Campus", category: "Local", date: "Jan 22, 2026", readTime: "3 min read" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 2rem" }}>
      <div style={{ width: "100%", maxWidth: "800px" }}>
        <h1 className="glow-text" style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>Educational <span className="gradient-text">Resources</span></h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>
          Guides, news, and tutorials written by club members.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {posts.map((post) => (
            <div key={post.id} className="glass-panel" style={{ padding: "2rem", transition: "transform 0.3s", cursor: "pointer" }} >
              <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--gold-light)", fontWeight: "bold" }}>{post.category}</span>
              <h2 style={{ fontSize: "1.5rem", margin: "0.5rem 0 1rem 0" }}>{post.title}</h2>
              <div style={{ display: "flex", gap: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                <span>📅 {post.date}</span>
                <span>⏱️ {post.readTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
