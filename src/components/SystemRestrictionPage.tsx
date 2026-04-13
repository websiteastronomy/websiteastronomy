type Props = {
  variant: "maintenance" | "lockdown" | "feature";
  title?: string;
  message?: string | null;
  until?: string | null;
};

export default function SystemRestrictionPage({ variant, title, message, until }: Props) {
  const isMaintenance = variant === "maintenance";
  const isLockdown = variant === "lockdown";
  const heading =
    title ||
    (isMaintenance
      ? "Under Maintenance"
      : isLockdown
        ? "System Temporarily Restricted"
        : "Feature Temporarily Unavailable");
  const body =
    message ||
    (isMaintenance
      ? "We are making a few updates right now. Please check back later."
      : isLockdown
        ? "Access is temporarily limited while the system is under controlled restriction."
        : "This section is currently unavailable.");

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", background: "radial-gradient(circle at top, rgba(201,168,76,0.14), rgba(8,12,22,1) 55%)" }}>
      <div style={{ width: "100%", maxWidth: "720px", padding: "3rem", borderRadius: "20px", border: "1px solid rgba(201,168,76,0.2)", background: "rgba(8,12,22,0.82)", boxShadow: "0 30px 80px rgba(0,0,0,0.35)", textAlign: "center" }}>
        <p style={{ margin: 0, color: "var(--gold)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.18em" }}>
          {isMaintenance ? "Maintenance Mode" : isLockdown ? "Lockdown Mode" : "Feature Control"}
        </p>
        <h1 style={{ fontSize: "2.6rem", margin: "1rem 0", fontFamily: "'Cinzel', serif" }}>{heading}</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.8, margin: "0 auto", maxWidth: "560px" }}>{body}</p>
        {until ? (
          <p suppressHydrationWarning style={{ marginTop: "1.2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Expected until: {new Date(until).toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            })} IST
          </p>
        ) : null}

        <div style={{ marginTop: "2.5rem", paddingTop: "2rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginBottom: "1.2rem" }}>
            If you are an administrator, please log in to access the system and manage settings.
          </p>
          <a href="/portal" style={{ display: "inline-block", padding: "0.75rem 1.7rem", borderRadius: "8px", background: "var(--gold)", color: "#000", fontWeight: "bold", textDecoration: "none", fontSize: "0.95rem", transition: "all 0.2s ease" }}>
            Admin Login
          </a>
        </div>
      </div>
    </div>
  );
}
