import Link from "next/link";
import WeatherWidget from "@/components/WeatherWidget";

export default function Home() {
  const coreTeam = [
    { name: "Alex Nova", role: "President", icon: "🔭" },
    { name: "Jordan Orion", role: "Vice President", icon: "🌌" },
    { name: "Taylor Vega", role: "Equipment Head", icon: "📷" },
    { name: "Sam Eclipse", role: "Events Lead", icon: "📅" },
  ];

  const featuredProjects = [
    { title: "Weather Balloon Project", status: "Active", icon: "🎈" },
    { title: "Rocketry Experiments", status: "In Development", icon: "🚀" },
    { title: "CubeSat Mission Planning", status: "Planning", icon: "🛰️" },
  ];

  const upcomingEvents = [
    { title: "Jupiter Opposition Observation", date: "Apr 15", type: "Stargazing" },
    { title: "Intro to Astrophotography", date: "Apr 20", type: "Workshop" },
    { title: "Meteor Shower Watch Party", date: "May 5", type: "Field Trip" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem" }}>
      {/* Hero */}
      <section style={{ textAlign: "center", maxWidth: "900px", marginTop: "10vh", marginBottom: "8rem" }}>
        <div style={{ marginBottom: "2.5rem" }}>
          <img src="/logo.png" alt="MVJCE Astronomy Club" style={{ height: "150px", width: "auto", borderRadius: "50%", opacity: 0.95 }} />
        </div>
        <p className="hero-subtitle" style={{ marginBottom: "1.5rem" }}>
          MVJCE &nbsp;&middot;&nbsp; Explore the Cosmos
        </p>
        <h1 className="hero-title glow-text" style={{ fontSize: "4.2rem", marginBottom: "1.5rem", lineHeight: 1.15 }}>
          <span className="gradient-text">Astronomy Club</span>
        </h1>
        <div className="gold-divider" style={{ marginBottom: "2rem" }}></div>
        <p style={{ fontSize: "1.05rem", color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: "520px", margin: "0 auto 3rem auto", fontWeight: 300 }}>
          Whether you&apos;re a seasoned astrophotographer or gazing at the stars for the very first time — there&apos;s a place for you here.
        </p>
        <div style={{ display: "flex", gap: "1.2rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/about" className="btn-primary">About Us</Link>
          <Link href="/events" className="btn-secondary">View Events</Link>
        </div>
      </section>

      {/* Sky Conditions */}
      <WeatherWidget />

      {/* Core Team Preview */}
      <section style={{ width: "100%", maxWidth: "1100px", marginBottom: "5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem" }}>Core Team</h2>
          <Link href="/about" style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>View All &rarr;</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.2rem" }}>
          {coreTeam.map((member) => (
            <div key={member.name} className="feature-card" style={{ padding: "1.5rem", textAlign: "center" }}>
              <span style={{ fontSize: "2rem", display: "block", marginBottom: "0.8rem" }}>{member.icon}</span>
              <h4 style={{ fontSize: "1rem", marginBottom: "0.2rem" }}>{member.name}</h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", fontWeight: 300 }}>{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section style={{ width: "100%", maxWidth: "1100px", marginBottom: "5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem" }}>Featured Projects</h2>
          <Link href="/projects" style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>All Projects &rarr;</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.2rem" }}>
          {featuredProjects.map((proj) => (
            <Link href="/projects" key={proj.title} className="feature-card" style={{ textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ fontSize: "1.8rem" }}>{proj.icon}</span>
                <span style={{ fontSize: "0.65rem", padding: "0.2rem 0.7rem", borderRadius: "20px", background: "rgba(201, 168, 76, 0.1)", color: "var(--gold-light)", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" }}>{proj.status}</span>
              </div>
              <h3 style={{ fontSize: "1.1rem" }}>{proj.title}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section style={{ width: "100%", maxWidth: "1100px", marginBottom: "4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.5rem" }}>Upcoming Events</h2>
          <Link href="/events" style={{ color: "var(--gold)", fontSize: "0.8rem", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" }}>All Events &rarr;</Link>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {upcomingEvents.map((evt) => (
            <Link href="/events" key={evt.title} style={{ padding: "1.2rem 1.5rem", borderLeft: "2px solid var(--gold-dark)", background: "rgba(15, 22, 40, 0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", transition: "all 0.3s ease" }}>
              <div>
                <span style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--gold)", fontWeight: 600 }}>{evt.type}</span>
                <h4 style={{ fontSize: "1rem", marginTop: "0.2rem" }}>{evt.title}</h4>
              </div>
              <span style={{ color: "var(--gold-light)", fontSize: "0.9rem", fontWeight: 500 }}>{evt.date}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
