export default function WeatherWidget() {
  return (
    <div style={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4rem", width: "100%", maxWidth: "1100px", borderLeft: "2px solid var(--gold-dark)", borderRadius: "0", background: "rgba(12, 18, 34, 0.4)", flexWrap: "wrap", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <span style={{ fontSize: "1.8rem", opacity: 0.7 }}>🌙</span>
        <div style={{ textAlign: "left" }}>
          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500, letterSpacing: "0.05em" }}>Current Sky Conditions</h4>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 300 }}>Clear sky, excellent visibility</p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "1rem", fontWeight: 500, color: "var(--gold-light)" }}>Cloud Cover: 5%</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 300 }}>Seeing: 4/5</div>
      </div>
    </div>
  );
}
