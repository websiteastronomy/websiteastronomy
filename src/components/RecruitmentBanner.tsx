"use client";

import Link from "next/link";

interface RecruitmentBannerProps {
  isRecruiting: boolean;
}

export default function RecruitmentBanner({ isRecruiting }: RecruitmentBannerProps) {
  if (!isRecruiting) return null;

  return (
    <div
      style={{
        width: "100%",
        background: "linear-gradient(90deg, rgba(201, 168, 76, 0.25) 0%, rgba(13, 22, 40, 0.95) 50%, rgba(201, 168, 76, 0.25) 100%)",
        borderBottom: "1px solid rgba(201, 168, 76, 0.4)",
        padding: "0.6rem 1.5rem",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "1rem",
        fontSize: "0.85rem",
        color: "var(--text-primary)",
        position: "relative",
        zIndex: 90,
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <span style={{ fontSize: "1rem" }}>🚀</span>
        <span>
          <strong style={{ color: "var(--gold-light)", fontWeight: 600 }}>Recruitment Open:</strong> Applications are now open to join the MVJCE Astronomy Club!
        </span>
      </div>
      <Link
        href="/join"
        style={{
          background: "var(--gold)",
          color: "#000000",
          padding: "0.3rem 0.9rem",
          borderRadius: "20px",
          fontWeight: 600,
          fontSize: "0.78rem",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
          transition: "all 0.2s ease",
        }}
      >
        Apply Now →
      </Link>
    </div>
  );
}
