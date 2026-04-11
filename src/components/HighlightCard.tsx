"use client";

import Link from "next/link";
import { motion } from "framer-motion";

type HighlightCardProps = {
  item?: {
    id: string;
    title: string;
    image: string | null;
    type: string;
    description: string;
    link: string;
  };
  variant?: "featured" | "compact";
  index?: number;
  loading?: boolean;
};

function labelForType(type: string) {
  if (type === "article") return "Article";
  if (type === "observation") return "Observation";
  if (type === "event") return "Event";
  if (type === "project") return "Project";
  return "Highlight";
}

export default function HighlightCard({
  item,
  variant = "compact",
  index = 0,
  loading = false,
}: HighlightCardProps) {
  const featured = variant === "featured";
  const minHeight = featured ? 420 : 200;

  if (loading) {
    return (
      <div
        style={{
          minHeight,
          borderRadius: "18px",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(135deg, rgba(20,28,48,0.9), rgba(10,14,24,0.96))",
          position: "relative",
        }}
      >
        <motion.div
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(110deg, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.03) 70%)",
          }}
        />
      </div>
    );
  }

  if (!item) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      whileHover={{ scale: featured ? 1.02 : 1.04 }}
      style={{ height: "100%" }}
    >
      <Link
        href={item.link}
        style={{
          display: "block",
          minHeight,
          height: "100%",
          position: "relative",
          overflow: "hidden",
          borderRadius: "18px",
          textDecoration: "none",
          color: "inherit",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.28)",
          background: "linear-gradient(180deg, rgba(15,22,40,0.1), rgba(8,12,22,0.92))",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 260ms ease, filter 260ms ease",
                filter: featured ? "brightness(0.82)" : "brightness(0.76)",
              }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "radial-gradient(circle at top, rgba(201,168,76,0.22), rgba(15,22,40,0.96) 55%)" }} />
          )}
        </div>
        <div style={{ position: "absolute", inset: 0, background: featured ? "linear-gradient(180deg, rgba(6,10,18,0.05) 0%, rgba(7,10,18,0.45) 38%, rgba(7,10,18,0.96) 100%)" : "linear-gradient(180deg, rgba(6,10,18,0.16) 0%, rgba(7,10,18,0.58) 48%, rgba(7,10,18,0.96) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, padding: featured ? "1.4rem" : "1rem", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "0.6rem" }}>
          <span style={{ alignSelf: "flex-start", padding: "0.35rem 0.7rem", borderRadius: "999px", background: "rgba(12,18,34,0.55)", backdropFilter: "blur(10px)", color: "var(--gold-light)", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700 }}>
            {labelForType(item.type)}
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: featured ? "1.8rem" : "1rem", lineHeight: featured ? 1.1 : 1.25, color: "#fff", fontFamily: featured ? "'Cinzel', serif" : "inherit" }}>
              {item.title}
            </h3>
            <p
              style={{
                margin: "0.55rem 0 0",
                color: "rgba(236,240,255,0.82)",
                fontSize: featured ? "0.98rem" : "0.82rem",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: featured ? 3 : 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.description}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
