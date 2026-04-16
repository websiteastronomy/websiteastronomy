"use client";

import { useEffect, useRef, useState } from "react";

interface ScanResult {
  status: "success" | "duplicate" | "not_found" | "error";
  name?: string;
  usn?: string;
  message?: string;
}

interface Props {
  sessionId: string;
  sessionName: string;
  adminPassword: string;
  onClose: () => void;
}

export default function QrScannerClient({ sessionId, sessionName, adminPassword, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const html5QrRef = useRef<any>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(true);
  const [lastToken, setLastToken] = useState("");

  useEffect(() => {
    let scanner: unknown;
    let mounted = true;

    const startScanner = async () => {
      // Dynamically import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      if (!mounted || !scannerRef.current) return;

      scanner = new Html5Qrcode("qr-reader");
      html5QrRef.current = scanner;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (scanner as any).start(
          { facingMode: "environment" },
          { fps: 8, qrbox: { width: 250, height: 250 } },
          async (decodedText: string) => {
            const token = decodedText.trim();
            // Debounce: skip if same token scanned in last 3s
            if (token === lastToken) return;
            setLastToken(token);
            setTimeout(() => setLastToken(""), 3000);

            await processToken(token);
          },
          undefined
        );
      } catch {
        if (mounted) {
          setResult({ status: "error", message: "Camera access denied or unavailable." });
          setScanning(false);
        }
      }
    };

    void startScanner();

    return () => {
      mounted = false;
      if (html5QrRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          void (html5QrRef.current as any).stop().catch(() => {});
        } catch { /* ignore */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processToken = async (token: string) => {
    try {
      const res = await fetch("/api/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId, adminPassword }),
      });
      const data = await res.json() as ScanResult;
      setResult(data);
    } catch {
      setResult({ status: "error", message: "Network error. Try again." });
    }
  };

  const resultColor =
    result?.status === "success" ? "#22c55e" :
    result?.status === "duplicate" ? "#ef4444" :
    result?.status === "not_found" ? "#f59e0b" : "#667788";

  const resultBg =
    result?.status === "success" ? "rgba(34, 197, 94, 0.1)" :
    result?.status === "duplicate" ? "rgba(239, 68, 68, 0.1)" :
    result?.status === "not_found" ? "rgba(245, 158, 11, 0.1)" : "rgba(120,120,120,0.1)";

  const resultIcon =
    result?.status === "success" ? "✅" :
    result?.status === "duplicate" ? "🔴" :
    result?.status === "not_found" ? "⚠️" : "❌";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Session header */}
      <div style={{
        background: "rgba(201,168,76,0.08)",
        border: "1px solid rgba(201,168,76,0.2)",
        borderRadius: "10px",
        padding: "0.8rem 1rem",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <div>
          <div style={{ color: "#c9a84c", fontWeight: 700, fontSize: "0.95rem" }}>📋 {sessionName}</div>
          <div style={{ color: "#667788", fontSize: "0.78rem", marginTop: "0.2rem" }}>Session active • Camera scanning</div>
        </div>
        <button
          id="scanner-close-btn"
          onClick={onClose}
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#ef4444",
            borderRadius: "8px",
            padding: "0.5rem 0.8rem",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          End Session
        </button>
      </div>

      {/* QR Scanner viewfinder */}
      <div style={{
        position: "relative",
        borderRadius: "16px",
        overflow: "hidden",
        border: "2px solid rgba(201,168,76,0.3)",
        background: "#000",
      }}>
        <div
          id="qr-reader"
          ref={scannerRef}
          style={{ width: "100%", minHeight: "280px" }}
        />
        {/* Scan guide overlay */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}>
          <div style={{
            width: 200,
            height: 200,
            border: "2px solid rgba(201,168,76,0.7)",
            borderRadius: "12px",
            boxShadow: "0 0 0 4000px rgba(0,0,0,0.3)",
          }} />
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#556677", fontSize: "0.82rem", margin: 0 }}>
        Point the camera at the member&apos;s QR code
      </p>

      {/* Result display */}
      {result && (
        <div style={{
          background: resultBg,
          border: `1.5px solid ${resultColor}30`,
          borderRadius: "14px",
          padding: "1.2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          animation: "att-fadeIn 0.2s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1.5rem" }}>{resultIcon}</span>
            <span style={{ color: resultColor, fontWeight: 700, fontSize: "1rem" }}>
              {result.status === "success" ? "Attendance Marked!" :
               result.status === "duplicate" ? "Already Marked" :
               result.status === "not_found" ? "QR Not Found" : "Error"}
            </span>
          </div>
          {result.name && (
            <div style={{ paddingLeft: "2.1rem" }}>
              <div style={{ color: "#e0e0f0", fontWeight: 600, fontSize: "1rem" }}>{result.name}</div>
              <div style={{ color: "#8899aa", fontSize: "0.85rem" }}>{result.usn}</div>
            </div>
          )}
          {!result.name && result.message && (
            <div style={{ paddingLeft: "2.1rem", color: "#8899aa", fontSize: "0.85rem" }}>{result.message}</div>
          )}
        </div>
      )}

      {!scanning && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "10px",
          padding: "1rem",
          color: "#ef4444",
          textAlign: "center",
          fontSize: "0.9rem",
        }}>
          {result?.message || "Camera unavailable"}
        </div>
      )}

      <style>{`
        @keyframes att-fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        #qr-reader video { object-fit: cover; width: 100% !important; }
        #qr-reader { min-height: 280px; }
      `}</style>
    </div>
  );
}
