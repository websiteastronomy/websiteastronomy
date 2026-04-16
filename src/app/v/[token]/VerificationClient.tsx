"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  token: string;
  email: string;
  initialName: string | null;
  initialUsn: string | null;
}

type Step = "form" | "qr" | "loading";

export default function VerificationClient({ token, email, initialName, initialUsn }: Props) {
  const [step, setStep] = useState<Step>(initialName && initialUsn ? "qr" : "form");
  const [name, setName] = useState(initialName ?? "");
  const [usn, setUsn] = useState(initialUsn ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawQR = async (canvas: HTMLCanvasElement) => {
    await QRCode.toCanvas(canvas, token, {
      width: canvas.width,
      margin: 2,
      color: { dark: "#0b101e", light: "#ffffff" },
    });
  };

  useEffect(() => {
    if (step === "qr" && canvasRef.current) {
      drawQR(canvasRef.current).catch(() => {});
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !usn.trim()) {
      setError("Both Full Name and USN are required.");
      return;
    }
    if (usn.trim().length < 4) {
      setError("Please enter a valid USN.");
      return;
    }

    setSubmitting(true);
    setStep("loading");

    try {
      const res = await fetch("/api/attendance/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), usn: usn.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Verification failed. Please try again.");
        setStep("form");
        return;
      }

      setStep("qr");
    } catch {
      setError("Network error. Please check your connection.");
      setStep("form");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `astronomy-qr-${usn || "code"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const toggleFullscreen = () => setFullscreen((f) => !f);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&family=Cinzel:wght@600&display=swap');

        .v-root {
          min-height: 100vh;
          background: #080d1a;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          font-family: 'Outfit', sans-serif;
          position: relative;
          overflow: hidden;
        }
        .v-root::before {
          content: '';
          position: fixed;
          inset: 0;
          background: radial-gradient(ellipse at 30% 20%, rgba(201,168,76,0.06) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.05) 0%, transparent 60%);
          pointer-events: none;
        }
        .v-card {
          background: rgba(12, 18, 36, 0.92);
          border: 1px solid rgba(201, 168, 76, 0.2);
          border-radius: 20px;
          padding: 2.5rem 2rem;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 0 60px rgba(201, 168, 76, 0.07), 0 20px 40px rgba(0,0,0,0.5);
          backdrop-filter: blur(20px);
          position: relative;
          z-index: 1;
        }
        .v-logo {
          text-align: center;
          margin-bottom: 2rem;
        }
        .v-logo h1 {
          font-family: 'Cinzel', serif;
          color: #c9a84c;
          font-size: 1.15rem;
          margin: 0 0 0.3rem;
          letter-spacing: 0.05em;
        }
        .v-logo p {
          color: #667788;
          font-size: 0.8rem;
          margin: 0;
        }
        .v-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #e8e8f0;
          margin: 0 0 0.5rem;
          text-align: center;
        }
        .v-subtitle {
          font-size: 0.85rem;
          color: #667788;
          text-align: center;
          margin: 0 0 1.8rem;
          line-height: 1.5;
        }
        .v-email-badge {
          background: rgba(201, 168, 76, 0.08);
          border: 1px solid rgba(201, 168, 76, 0.2);
          border-radius: 8px;
          padding: 0.5rem 1rem;
          text-align: center;
          font-size: 0.8rem;
          color: #c9a84c;
          margin-bottom: 1.5rem;
          word-break: break-all;
        }
        .v-label {
          display: block;
          font-size: 0.82rem;
          color: #8899aa;
          margin-bottom: 0.4rem;
          font-weight: 600;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }
        .v-input {
          width: 100%;
          padding: 0.85rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(201, 168, 76, 0.15);
          border-radius: 10px;
          color: #e0e0f0;
          font-size: 1rem;
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          box-sizing: border-box;
          min-height: 48px;
        }
        .v-input:focus {
          border-color: rgba(201, 168, 76, 0.5);
          background: rgba(201, 168, 76, 0.04);
        }
        .v-input::placeholder { color: #445566; }
        .v-field { margin-bottom: 1.2rem; }
        .v-btn-primary {
          width: 100%;
          padding: 0.9rem;
          background: linear-gradient(135deg, #c9a84c, #b8942f);
          color: #080d1a;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          min-height: 48px;
          transition: opacity 0.2s, transform 0.15s;
          margin-top: 0.5rem;
        }
        .v-btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .v-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .v-btn-secondary {
          flex: 1;
          padding: 0.8rem;
          background: rgba(255,255,255,0.05);
          color: #c9a84c;
          border: 1.5px solid rgba(201, 168, 76, 0.3);
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          min-height: 48px;
          transition: background 0.2s;
        }
        .v-btn-secondary:hover { background: rgba(201, 168, 76, 0.1); }
        .v-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 0.7rem 1rem;
          color: #ef4444;
          font-size: 0.85rem;
          margin-bottom: 1rem;
        }
        .v-qr-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
        }
        .v-qr-canvas-wrap {
          background: #fff;
          border-radius: 16px;
          padding: 1rem;
          box-shadow: 0 0 40px rgba(201,168,76,0.15);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .v-qr-canvas-wrap:hover { transform: scale(1.02); }
        .v-qr-name {
          text-align: center;
        }
        .v-qr-name strong {
          display: block;
          font-size: 1.2rem;
          color: #e8e8f0;
          font-weight: 700;
        }
        .v-qr-name span {
          font-size: 0.9rem;
          color: #c9a84c;
        }
        .v-btn-row {
          display: flex;
          gap: 0.8rem;
          width: 100%;
        }
        .v-success-badge {
          background: rgba(34, 197, 94, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.25);
          border-radius: 8px;
          padding: 0.6rem 1rem;
          color: #22c55e;
          font-size: 0.82rem;
          text-align: center;
        }
        .v-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 2rem 0;
        }
        .v-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(201,168,76,0.2);
          border-top-color: #c9a84c;
          border-radius: 50%;
          animation: v-spin 0.8s linear infinite;
        }
        @keyframes v-spin { to { transform: rotate(360deg); } }

        /* Fullscreen overlay */
        .v-fullscreen {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.97);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          padding: 2rem;
        }
        .v-fullscreen canvas {
          max-width: min(90vw, 90vh);
          max-height: min(90vw, 90vh);
          border-radius: 16px;
        }
        .v-close-btn {
          position: fixed;
          top: 1.5rem;
          right: 1.5rem;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          font-size: 1.3rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>

      <div className="v-root">
        <div className="v-card">
          <div className="v-logo">
            <h1>🔭 MVJCE Astronomy Club</h1>
            <p>Attendance Verification System</p>
          </div>

          {step === "loading" && (
            <div className="v-loading">
              <div className="v-spinner" />
              <p style={{ color: "#667788", fontSize: "0.9rem" }}>Verifying your details…</p>
            </div>
          )}

          {step === "form" && (
            <form onSubmit={(e) => { void handleSubmit(e); }}>
              <h2 className="v-title">Enter Your Details</h2>
              <p className="v-subtitle">Please enter your information to receive your personal attendance QR code.</p>

              <div className="v-email-badge">📧 {email}</div>

              {error && <div className="v-error">⚠️ {error}</div>}

              <div className="v-field">
                <label htmlFor="att-name" className="v-label">Full Name</label>
                <input
                  id="att-name"
                  type="text"
                  className="v-input"
                  placeholder="e.g. Shashank N M"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>

              <div className="v-field">
                <label htmlFor="att-usn" className="v-label">USN</label>
                <input
                  id="att-usn"
                  type="text"
                  className="v-input"
                  placeholder="e.g. 1MV21CS001"
                  value={usn}
                  onChange={(e) => setUsn(e.target.value.toUpperCase())}
                  autoComplete="off"
                  required
                />
              </div>

              <button
                id="att-submit-btn"
                type="submit"
                className="v-btn-primary"
                disabled={submitting}
              >
                {submitting ? "Verifying…" : "Get My QR Code →"}
              </button>
            </form>
          )}

          {step === "qr" && (
            <div className="v-qr-wrap">
              <h2 className="v-title">Your QR Code</h2>
              <p className="v-subtitle">Show this QR code to the admin for attendance scanning.</p>

              <div className="v-qr-name">
                <strong>{name || initialName}</strong>
                <span>{usn || initialUsn}</span>
              </div>

              <div className="v-qr-canvas-wrap" onClick={toggleFullscreen} title="Tap for fullscreen">
                <canvas
                  ref={canvasRef}
                  width={260}
                  height={260}
                  style={{ display: "block", borderRadius: "8px" }}
                />
              </div>

              <div className="v-success-badge">
                ✅ QR code sent to {email} — check your inbox!
              </div>

              <div className="v-btn-row">
                <button id="att-download-btn" className="v-btn-secondary" onClick={handleDownload}>
                  ⬇ Download
                </button>
                <button id="att-fullscreen-btn" className="v-btn-secondary" onClick={toggleFullscreen}>
                  ⛶ Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {fullscreen && (
        <div className="v-fullscreen" onClick={toggleFullscreen}>
          <FullscreenQR token={token} />
          <button className="v-close-btn" onClick={toggleFullscreen} aria-label="Close">✕</button>
          <p style={{ color: "#667788", fontSize: "0.85rem" }}>Tap anywhere to close</p>
        </div>
      )}
    </>
  );
}

function FullscreenQR({ token }: { token: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, token, {
      width: 500,
      margin: 2,
      color: { dark: "#0b101e", light: "#ffffff" },
    }).catch(() => {});
  }, [token]);

  return (
    <div style={{ background: "#fff", borderRadius: "16px", padding: "1rem" }}>
      <canvas ref={canvasRef} width={500} height={500} style={{ display: "block" }} />
    </div>
  );
}
