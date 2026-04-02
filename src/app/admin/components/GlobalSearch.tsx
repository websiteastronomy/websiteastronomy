"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { globalSearchAction, SearchResult } from "@/app/actions/search";
import Link from "next/link";

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      try {
        const data = await globalSearchAction(query);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      fetchResults();
    }, 300);

    return () => clearTimeout(debounce);
  }, [query]);

  const getIcon = (type: string) => {
    switch (type) {
      case "member": return "👤";
      case "project": return "🚀";
      case "event": return "📅";
      default: return "🔍";
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", zIndex: 50 }}>
      <div style={{ position: "relative", width: "300px" }}>
        <input
          type="text"
          placeholder="Global search (commands, members, projects)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          style={{
            width: "100%",
            padding: "0.5rem 1rem 0.5rem 2.5rem",
            background: "rgba(15, 22, 40, 0.7)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "20px",
            color: "var(--text-primary)",
            fontSize: "0.85rem",
            outline: "none"
          }}
        />
        <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", fontSize: "0.9rem" }}>🔍</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              width: "100%",
              marginTop: "0.5rem",
              background: "rgba(11, 16, 30, 0.95)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "12px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              maxHeight: "400px",
              overflowY: "auto",
              padding: "0.5rem"
            }}
          >
            {loading && <div style={{ padding: "1rem", textAlign: "center", color: "var(--gold)", fontSize: "0.85rem" }}>Searching...</div>}
            
            {!loading && results.length === 0 && (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>No results found.</div>
            )}

            {!loading && results.map((res) => (
              <Link key={`${res.type}-${res.id}`} href={res.url} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.6rem 0.8rem",
                    borderRadius: "8px", cursor: "pointer", transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  onClick={() => setIsOpen(false)}
                >
                  <span style={{ fontSize: "1.2rem" }}>{getIcon(res.type)}</span>
                  <div>
                    <h4 style={{ fontSize: "0.9rem", color: "var(--text-primary)", marginBottom: "0.1rem" }}>{res.title}</h4>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{res.subtitle}</p>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: "0.65rem", textTransform: "uppercase", color: "var(--gold-dark)" }}>{res.type}</span>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
