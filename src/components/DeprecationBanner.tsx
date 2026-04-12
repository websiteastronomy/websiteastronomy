"use client";

import Link from "next/link";
import { useState } from "react";

type DeprecationBannerProps = {
  currentPath: string;
  newPath?: string;
};

export default function DeprecationBanner({
  currentPath,
  newPath = "/app",
}: DeprecationBannerProps) {
  const [show, setShow] = useState(true);

  if (!show) return null;

  return (
    <div style={{
      width: "100%",
      background: "rgba(201, 168, 76, 0.15)",
      borderBottom: "1px solid rgba(201, 168, 76, 0.3)",
      padding: "0.75rem 1rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      zIndex: 1000,
      position: "relative"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontSize: "1.2rem" }}>⚠️</span>
        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
          <b>Notice:</b> The system has unified into a single dashboard. You are viewing the legacy {currentPath} route.
        </span>
      </div>
      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <Link 
          href={newPath}
          onClick={() => setShow(false)}
          className="btn-primary" 
          style={{ padding: "0.4rem 1rem", fontSize: "0.8rem", textDecoration: "none" }}
          prefetch={false}
        >
          Go to new Dashboard
        </Link>
        <button 
          onClick={() => setShow(false)}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem", padding: "0 0.5rem" }}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
