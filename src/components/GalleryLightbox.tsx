"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LightboxProps {
  images: { id: number; title: string; author: string; url: string }[];
}

export default function GalleryLightbox({ images }: LightboxProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = images.find((img) => img.id === selectedId);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "2.5rem" }}>
        {images.map((img, i) => (
          <motion.div
            key={img.id}
            layoutId={`gallery-${img.id}`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -6 }}
            onClick={() => setSelectedId(img.id)}
            className="glass-panel feature-card"
            style={{ padding: "0", overflow: "hidden", position: "relative", cursor: "pointer", border: "1px solid var(--border-subtle)" }}
          >
            <div className="gallery-img-wrap">
              <div style={{ width: "100%", height: "300px", backgroundImage: `url(${img.url})`, backgroundSize: "cover", backgroundPosition: "center" }} />
            </div>
            <div style={{ padding: "1.5rem", background: "rgba(10, 10, 15, 0.8)", position: "absolute", bottom: 0, width: "100%", backdropFilter: "blur(4px)", textAlign: "left" }}>
              <h3 style={{ fontSize: "1.2rem", marginBottom: "0.2rem" }}>{img.title}</h3>
              <p style={{ color: "var(--gold-light)", fontSize: "0.9rem" }}>by {img.author}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedId(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(8px)",
              zIndex: 1000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "zoom-out",
              padding: "2rem",
            }}
          >
            <motion.div
              layoutId={`gallery-${selected.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "90vw",
                maxHeight: "85vh",
                borderRadius: "12px",
                overflow: "hidden",
                position: "relative",
                cursor: "default",
              }}
            >
              <img
                src={selected.url}
                alt={selected.title}
                style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block" }}
              />
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  padding: "1.5rem 2rem",
                  background: "rgba(10, 10, 15, 0.9)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <h3 style={{ fontSize: "1.4rem", marginBottom: "0.3rem", color: "var(--text-primary)" }}>{selected.title}</h3>
                <p style={{ color: "var(--gold-light)", fontSize: "0.95rem" }}>by {selected.author}</p>
              </motion.div>
            </motion.div>

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              onClick={() => setSelectedId(null)}
              style={{
                position: "absolute",
                top: "1.5rem",
                right: "1.5rem",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                color: "white",
                fontSize: "1.2rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
