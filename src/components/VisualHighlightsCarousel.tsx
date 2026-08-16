"use client";

import Link from "next/link";
import type { HighlightItem } from "@/app/actions/highlights";

interface VisualHighlightsCarouselProps {
  highlights: HighlightItem[];
}

export default function VisualHighlightsCarousel({ highlights }: VisualHighlightsCarouselProps) {
  if (!highlights || highlights.length === 0) {
    return null;
  }

  // Duplicate items to ensure seamless infinite scroll marquee effect
  const marqueeItems = [...highlights, ...highlights, ...highlights];

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case "project":
        return { bg: "rgba(6, 182, 212, 0.15)", border: "rgba(6, 182, 212, 0.4)", color: "#38bdf8", label: "PROJECT" };
      case "event":
        return { bg: "rgba(249, 115, 22, 0.15)", border: "rgba(249, 115, 22, 0.4)", color: "#fb923c", label: "EVENT" };
      case "outreach":
        return { bg: "rgba(34, 197, 94, 0.15)", border: "rgba(34, 197, 94, 0.4)", color: "#4ade80", label: "OUTREACH" };
      default:
        return { bg: "rgba(201, 168, 76, 0.15)", border: "rgba(201, 168, 76, 0.4)", color: "var(--gold-light)", label: type.toUpperCase() };
    }
  };

  return (
    <section style={{ width: "100%", padding: "4rem 0", overflow: "hidden" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto 2.5rem", padding: "0 1.5rem", textAlign: "center" }}>
        <p className="hero-subtitle" style={{ marginBottom: "0.5rem" }}>Live Club Activity</p>
        <h2 className="gradient-text" style={{ fontSize: "2.2rem", fontFamily: "'Cinzel', serif" }}>
          Visual Highlights
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginTop: "0.6rem", fontWeight: 300 }}>
          Automatically updated showcase of our latest projects, events, and community outreach.
        </p>
      </div>

      <div className="marquee-container">
        <div className="marquee-track">
          {marqueeItems.map((item, idx) => {
            const badge = getTypeBadgeStyle(item.type);
            const displayImage = item.image || "/logo.png";
            return (
              <div
                key={`${item.id}-${idx}`}
                style={{
                  width: "320px",
                  flexShrink: 0,
                  background: "rgba(15, 15, 15, 0.8)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.3s ease",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
                className="carousel-card"
              >
                <div style={{ width: "100%", height: "170px", position: "relative", overflow: "hidden", background: "#050505" }}>
                  <img
                    src={displayImage}
                    alt={item.title}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      transition: "transform 0.5s ease",
                    }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      top: "12px",
                      left: "12px",
                      background: badge.bg,
                      border: `1px solid ${badge.border}`,
                      color: badge.color,
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                      padding: "0.25rem 0.6rem",
                      borderRadius: "12px",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", marginBottom: "0.5rem", color: "var(--text-primary)", fontWeight: 600, lineClamp: 2 }}>
                      {item.title}
                    </h3>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                        fontWeight: 300,
                        marginBottom: "1rem",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <Link
                    href={item.link}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      color: "var(--gold-light)",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Explore Details →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
