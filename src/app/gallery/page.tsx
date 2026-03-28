import Link from 'next/link';

export default function Gallery() {
  const images = [
    { id: 1, title: "Orion Nebula", author: "Alex Nova", url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800&q=80" },
    { id: 2, title: "Andromeda Galaxy", author: "Jordan Orion", url: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?w=800&q=80" },
    { id: 3, title: "Lunar Surface", author: "Taylor Vega", url: "https://images.unsplash.com/photo-1522030299830-16b8d3d049febb?w=800&q=80" },
    { id: 4, title: "Milky Way over Mountains", author: "Sam Eclipse", url: "https://images.unsplash.com/photo-1464802686167-b939a6910659?w=800&q=80" },
    { id: 5, title: "Saturn's Rings", author: "Alex Nova", url: "https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=800&q=80" },
    { id: 6, title: "Pleiades Star Cluster", author: "Jordan Orion", url: "https://images.unsplash.com/photo-1506443432602-ac2fcd6f54e0?w=800&q=80" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 2rem" }}>
      <div style={{ width: "100%", maxWidth: "1200px" }}>
        <Link href="/" style={{ color: "var(--text-secondary)", marginBottom: "2rem", display: "inline-block" }}>
          &larr; Back to Home
        </Link>
        <h1 className="glow-text" style={{ fontSize: "3.5rem", marginBottom: "1rem", textAlign: "center" }}>Member <span className="gradient-text">Gallery</span></h1>
        <p style={{ textAlign: "center", color: "var(--text-secondary)", marginBottom: "3rem", fontSize: "1.1rem" }}>
          A showcase of deep-space and planetary observations captured by our club members.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2.5rem" }}>
          {images.map((img) => (
            <div key={img.id} className="glass-panel feature-card" style={{ padding: "0", overflow: "hidden", position: "relative", cursor: "pointer", border: "1px solid var(--border-light)" }}>
              <div 
                style={{ width: "100%", height: "300px", backgroundImage: `url(${img.url})`, backgroundSize: "cover", backgroundPosition: "center", transition: "transform 0.5s ease" }} 
                className="gallery-img"
              ></div>
              <div style={{ padding: "1.5rem", background: "rgba(10, 10, 15, 0.8)", position: "absolute", bottom: 0, width: "100%", backdropFilter: "blur(4px)", textAlign: "left" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>{img.title}</h3>
                <p style={{ color: "var(--gold-light)", fontSize: "0.9rem" }}>by {img.author}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
