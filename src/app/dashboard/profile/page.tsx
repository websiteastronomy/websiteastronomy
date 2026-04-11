"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import AvatarCropperModal from "@/components/AvatarCropperModal";

export default function DashboardProfilePage() {
  const { user } = useAuth();
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const displayImage = profileImageUrl || user?.image || null;

  return (
    <div style={{ maxWidth: "600px" }}>
      <h1 style={{ fontSize: "1.4rem", fontFamily: "'Cinzel', serif", marginBottom: "0.4rem" }}>
        <span className="gradient-text">Profile</span>
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
        Manage your profile information.
      </p>

      {/* Profile card */}
      <div style={{ padding: "2rem", borderRadius: "16px", border: "1px solid var(--border-subtle)", background: "rgba(12,18,34,0.55)", textAlign: "center" }}>
        {/* Avatar */}
        <div
          onClick={() => setIsCropperOpen(true)}
          style={{
            width: "90px", height: "90px", borderRadius: "50%", margin: "0 auto 1.2rem",
            background: "linear-gradient(135deg, var(--gold-dark), var(--gold))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: 700, color: "#0c1222",
            cursor: "pointer", overflow: "hidden", position: "relative",
            border: "3px solid rgba(201,168,76,0.3)",
          }}
        >
          {displayImage && !imgError ? (
            <img
              src={displayImage}
              alt={user?.name || "Profile"}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setImgError(true)}
            />
          ) : (
            (user?.name || "U").charAt(0).toUpperCase()
          )}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: "rgba(0,0,0,0.6)", color: "#fff",
            fontSize: "0.6rem", padding: "0.15rem 0", textAlign: "center",
          }}>
            Edit
          </div>
        </div>

        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.3rem" }}>{user?.name || "Club Member"}</h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>{user?.email}</p>

        {/* Info fields */}
        <div style={{ textAlign: "left", display: "grid", gap: "0.8rem" }}>
          <div style={{ padding: "0.8rem 1rem", borderRadius: "10px", background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Name</div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{user?.name || "—"}</div>
          </div>
          <div style={{ padding: "0.8rem 1rem", borderRadius: "10px", background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Email</div>
            <div style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{user?.email || "—"}</div>
          </div>
          <div style={{ padding: "0.8rem 1rem", borderRadius: "10px", background: "rgba(15,22,40,0.4)", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>User ID</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>{user?.id || "—"}</div>
          </div>
        </div>
      </div>

      <AvatarCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onSuccess={(imageUrl) => {
          setProfileImageUrl(imageUrl);
          setImgError(false);
          setIsCropperOpen(false);
        }}
      />
    </div>
  );
}
