"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";
import { uploadFileDirect } from "@/lib/direct-upload";

type CropPixels = { x: number; y: number; width: number; height: number };

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  helperText?: string;
};

export default function AdminImageCropUploadField({
  label,
  value,
  onChange,
  helperText,
}: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropPixels | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (sourceUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(sourceUrl);
      }
    };
  }, [sourceUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedback("Only image files can be uploaded.");
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    setSourceUrl((current) => {
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      return nextUrl;
    });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setFeedback(null);
    setEditorOpen(true);
  };

  const handleCropComplete = (_croppedArea: unknown, areaPixels: CropPixels) => {
    setCroppedAreaPixels(areaPixels);
  };

  const handleUpload = async () => {
    if (!sourceUrl || !croppedAreaPixels) {
      setFeedback("Choose an image and crop it before uploading.");
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    try {
      const croppedBlob = await getCroppedImg(sourceUrl, croppedAreaPixels);
      if (!croppedBlob) {
        throw new Error("Failed to process the selected image.");
      }

      const croppedFile = new File([croppedBlob], `${label.toLowerCase().replace(/\s+/g, "-")}.jpg`, { type: "image/jpeg" });
      const result = await uploadFileDirect(croppedFile, {
        category: "general",
        entityId: "about-page",
        isPublic: true,
        fileName: croppedFile.name,
        fileType: croppedFile.type,
        fileSize: croppedFile.size,
      });
      onChange(result.fileUrl);
      setEditorOpen(false);
    } catch (error) {
      console.error(error);
      setFeedback(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
        <label style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{label}</label>
        <label
          style={{
            border: "1px solid rgba(201,168,76,0.35)",
            color: "var(--gold)",
            padding: "0.55rem 0.9rem",
            borderRadius: "8px",
            cursor: isUploading ? "not-allowed" : "pointer",
            fontSize: "0.82rem",
            opacity: isUploading ? 0.6 : 1,
          }}
        >
          {value ? "Replace Image" : "Upload Image"}
          <input type="file" accept="image/*" onChange={handleFileChange} disabled={isUploading} style={{ display: "none" }} />
        </label>
      </div>
      {helperText ? <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.78rem" }}>{helperText}</p> : null}
      {feedback ? (
        <div
          style={{
            padding: "0.75rem 0.85rem",
            borderRadius: "8px",
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.35)",
            color: "#fca5a5",
            fontSize: "0.8rem",
          }}
        >
          {feedback}
        </div>
      ) : null}
      {value ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid var(--border-subtle)",
            background: "rgba(8,12,22,0.72)",
          }}
        >
          <img src={value} alt={`${label} preview`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      ) : null}
      {editorOpen && sourceUrl ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5,8,16,0.8)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
        >
          <div
            style={{
              width: "min(900px, 100%)",
              background: "rgba(12,18,34,0.98)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "18px",
              padding: "1.25rem",
              display: "grid",
              gap: "1rem",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Crop {label}</h3>
              <p style={{ margin: "0.35rem 0 0", color: "var(--text-muted)", fontSize: "0.82rem" }}>
                Adjust the image before upload. The preview below matches what will be saved.
              </p>
            </div>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#050810", borderRadius: "14px", overflow: "hidden" }}>
              <Cropper
                image={sourceUrl}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>
            <div style={{ display: "grid", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Zoom</label>
              <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ background: "transparent", cursor: "pointer" }}
                onClick={() => setEditorOpen(false)}
              >
                Cancel
              </button>
              <button type="button" className="btn-primary" style={{ cursor: "pointer" }} onClick={handleUpload} disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload Cropped Image"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
