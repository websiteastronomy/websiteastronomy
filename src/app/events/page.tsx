import Link from 'next/link';

export default function Events() {
  const events = [
    { id: 1, title: "Jupiter Opposition Observation", date: "April 15, 2026", time: "22:00", location: "Campus Observatory", type: "Stargazing" },
    { id: 2, title: "Introduction to Astrophotography", date: "April 20, 2026", time: "18:00", location: "Science Hall 204", type: "Workshop" },
    { id: 3, title: "Meteor Shower Watch Party", date: "May 5, 2026", time: "23:30", location: "Dark Sky Reserve (Off-campus)", type: "Field Trip" },
    { id: 4, title: "Guest Lecture: Exoplanets", date: "May 12, 2026", time: "19:00", location: "Main Auditorium", type: "Lecture" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "6rem 2rem" }}>
      <div style={{ width: "100%", maxWidth: "900px" }}>
        <Link href="/" style={{ color: "var(--text-secondary)", marginBottom: "2rem", display: "inline-block" }}>
          &larr; Back to Home
        </Link>
        <h1 className="glow-text" style={{ fontSize: "3.5rem", marginBottom: "3rem", textAlign: "center" }}>Upcoming <span className="gradient-text">Events</span></h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {events.map((event) => (
            <div key={event.id} className="glass-panel" style={{ padding: "2rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2rem", borderLeft: "4px solid var(--gold)", borderRadius: "8px" }}>
              <div style={{ flex: "1 1 auto" }}>
                <span style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--gold-light)", fontWeight: "bold" }}>{event.type}</span>
                <h2 style={{ fontSize: "1.8rem", margin: "0.5rem 0" }}>{event.title}</h2>
                <div style={{ display: "flex", gap: "1.5rem", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  <span>📅 {event.date}</span>
                  <span>⏰ {event.time}</span>
                  <span>📍 {event.location}</span>
                </div>
              </div>
              <button className="btn-primary" style={{ cursor: "pointer" }}>RSVP</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
