"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";
import Cropper from "react-easy-crop";
import {
  createFallbackObservationFile,
  createProcessedObservationFile,
  PixelCrop,
} from "@/lib/observationImage";

type Props = {
  isOpen: boolean;
  imageSrc: string | null;
  sourceFile: File | null;
  onClose: () => void;
  onApply: (result: {
    file: File;
    previewUrl: string;
    usedFallback: boolean;
  }) => void;
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(3, 7, 18, 0.86)",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1.5rem",
};

const panelStyle: CSSProperties = {
  width: "min(920px, 100%)",
  background: "linear-gradient(180deg, rgba(12,18,32,0.98), rgba(6,10,22,0.98))",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "20px",
  boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
  overflow: "hidden",
};

export default function ObservationImageEditorModal({
  isOpen,
  imageSrc,
  sourceFile,
  onClose,
  onApply,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
      setIsApplying(false);
    }
  }, [isOpen]);

  const onCropComplete = useCallback((_croppedArea: unknown, areaPixels: PixelCrop) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const canApply = useMemo(
    () => Boolean(imageSrc && sourceFile && croppedAreaPixels && !isApplying),
    [croppedAreaPixels, imageSrc, isApplying, sourceFile]
  );

  const handleApply = useCallback(async () => {
    if (!imageSrc || !sourceFile || !croppedAreaPixels) {
      return;
    }

    setIsApplying(true);

    try {
      const processedFile = await createProcessedObservationFile(imageSrc, croppedAreaPixels);
      onApply({
        file: processedFile,
        previewUrl: URL.createObjectURL(processedFile),
        usedFallback: false,
      });
    } catch {
      const fallbackFile = await createFallbackObservationFile(sourceFile);
      onApply({
        file: fallbackFile,
        previewUrl: URL.createObjectURL(fallbackFile),
        usedFallback: true,
      });
    } finally {
      setIsApplying(false);
    }
  }, [croppedAreaPixels, imageSrc, onApply, sourceFile]);

  if (!isOpen || !imageSrc) {
    return null;
  }

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>
        <div
          style={{
            padding: "1.2rem 1.5rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontFamily: "'Cinzel', serif" }}>
              Frame Observation Image
            </h3>
            <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.88rem" }}>
              16:9 crop, theme-aware processing, and WebP output happen before upload.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isApplying}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "var(--text-muted)",
              borderRadius: "999px",
              width: "2.25rem",
              height: "2.25rem",
              cursor: isApplying ? "not-allowed" : "pointer",
            }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: "1.5rem" }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: "16px",
              overflow: "hidden",
              background:
                "radial-gradient(circle at top, rgba(47,60,89,0.55), rgba(4,7,15,0.96))",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              showGrid={true}
              objectFit="contain"
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>

          <div
            style={{
              marginTop: "1.25rem",
              display: "grid",
              gap: "1rem",
              gridTemplateColumns: "1fr auto",
              alignItems: "center",
            }}
          >
            <label style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", minWidth: "3rem" }}>
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                style={{ width: "100%", accentColor: "var(--gold)" }}
              />
            </label>
            <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Drag to reframe
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="btn-secondary"
              style={{ flex: 1, padding: "0.95rem", opacity: isApplying ? 0.55 : 1 }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!canApply}
              className="btn-primary"
              style={{ flex: 1.3, padding: "0.95rem", opacity: canApply ? 1 : 0.55 }}
            >
              {isApplying ? "Processing..." : "Apply"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
