"use client";

import { motion } from "framer-motion";

export default function CosmicLoader() {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "60vh",
      flexDirection: "column",
      gap: "2rem",
    }}>
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        {/* Outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "var(--gold)",
            borderRightColor: "rgba(201, 168, 76, 0.3)",
          }}
        />
        {/* Middle ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: "10px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "var(--gold-light)",
            borderLeftColor: "rgba(223, 192, 122, 0.2)",
          }}
        />
        {/* Inner ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: "20px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: "var(--gold-dark)",
          }}
        />
        {/* Center dot */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--gold-light)",
          }}
        />
      </div>
      <motion.p
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ color: "var(--text-muted)", fontSize: "0.85rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
      >
        Loading...
      </motion.p>
    </div>
  );
}
