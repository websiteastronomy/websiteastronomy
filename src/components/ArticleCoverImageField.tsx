"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import ObservationImageEditorModal from "@/components/ObservationImageEditorModal";
import { cleanupReplacedUploadsAction } from "@/app/actions/storage";
import { optimizeImageFile } from "@/lib/client-upload-images";
import { uploadFileDirect } from "@/lib/direct-upload";
import { validateObservationImageFile } from "@/lib/observationImage";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
};

export default function ArticleCoverImageField({
  value,
  onChange,
  label = "Cover Image",
}: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(value || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(null);

  useEffect(() => {
    setPreviewUrl(value || "");
  }, [value]);

  useEffect(() => {
    return () => {
      if (editorSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(editorSrc);
      }
    };
  }, [editorSrc]);

  const helperText = useMemo(
    () =>
      previewUrl
        ? "The processed image shown below is the exact file that will be stored."
        : "Upload, crop, and process the cover image before saving the article.",
    [previewUrl]
  );

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }

    try {
      validateObservationImageFile(file);
      const nextSrc = URL.createObjectURL(file);
      setSourceFile(file);
      setEditorSrc(nextSrc);
      setEditorOpen(true);
      setFeedback(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Only image files up to 10MB are allowed.";
      setFeedback({ type: "error", message });
    }
  };

  const handleProcessed = async (result: {
    file: File;
    previewUrl: string;
    usedFallback: boolean;
  }) => {
    setEditorOpen(false);
    setPreviewUrl(result.previewUrl);
    setIsUploading(true);
    setFeedback(null);

    try {
      const optimizedFile = await optimizeImageFile(result.file, {
        maxWidth: 1600,
        maxHeight: 900,
        type: "image/webp",
        quality: 0.84,
        fileName: "article-cover.webp",
      });
      const response = await uploadFileDirect(
        optimizedFile,
        {
          category: "article_images",
          entityId: "cover",
          fileName: optimizedFile.name,
          fileType: optimizedFile.type,
          fileSize: optimizedFile.size,
          isPublic: true,
        },
        {
          onProgress: setUploadProgress,
        }
      );
      const finalUrl = response.fileUrl;
      if (value && value !== finalUrl) {
        await cleanupReplacedUploadsAction({ urls: [value] });
      }
      onChange(finalUrl);
      setPreviewUrl(finalUrl);

      if (result.usedFallback) {
        setFeedback({
          type: "success",
          message: "Automatic enhancement fell back to the uploaded image, but the article can still be saved.",
        });
      }
    } catch (error) {
      console.error(error);
      setFeedback({ type: "error", message: "Cover image upload failed. Please try again." });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSourceFile(null);
      if (editorSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(editorSrc);
      }
      setEditorSrc(null);
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center" }}>
        <label style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>{label}</label>
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
          {isUploading ? `Uploading ${uploadProgress}%` : previewUrl ? "Replace Image" : "Upload Image"}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={isUploading}
            style={{ display: "none" }}
          />
        </label>
      </div>
      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.8rem" }}>{helperText}</p>
      {feedback ? (
        <div style={{
          padding: "0.8rem 0.9rem",
          borderRadius: "8px",
          border: `1px solid ${feedback.type === "error" ? "rgba(239,68,68,0.35)" : "rgba(34,197,94,0.35)"}`,
          background: feedback.type === "error" ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
          color: feedback.type === "error" ? "#fca5a5" : "#86efac",
          fontSize: "0.8rem",
        }}>
          {feedback.message}
        </div>
      ) : null}
      {previewUrl ? (
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
          <img
            src={previewUrl}
            alt="Article cover preview"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      ) : null}
      <ObservationImageEditorModal
        isOpen={editorOpen}
        imageSrc={editorSrc}
        sourceFile={sourceFile}
        onClose={() => {
          setEditorOpen(false);
          setFeedback(null);
        }}
        onApply={handleProcessed}
      />
    </div>
  );
}
