"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import AnimatedSection from "@/components/AnimatedSection";
import ObservationImageEditorModal from "@/components/ObservationImageEditorModal";
import { submitObservationAction } from "@/app/actions/observations-engine";
import { buildObservationUploadFiles, formatFileSize } from "@/lib/client-upload-images";
import { uploadFileDirect } from "@/lib/direct-upload";
import {
  readFileAsDataUrl,
  validateObservationImageFile,
} from "@/lib/observationImage";

export default function SubmitObservationPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorObj, setErrorObj] = useState<string | null>(null);
  const [processingWarning, setProcessingWarning] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [celestialTarget, setCelestialTarget] = useState("");
  const [category, setCategory] = useState("Deep Sky");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capturedAt, setCapturedAt] = useState("");

  const [equipment, setEquipment] = useState("");
  const [exposureTime, setExposureTime] = useState("");
  const [iso, setIso] = useState("");
  const [focalLength, setFocalLength] = useState("");
  const [filtersUsed, setFiltersUsed] = useState("");
  const [bortleScale, setBortleScale] = useState("");
  const [framesCount, setFramesCount] = useState("");
  const [processingSoftware, setProcessingSoftware] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editorImageSrc, setEditorImageSrc] = useState<string | null>(null);
  const [pendingSourceFile, setPendingSourceFile] = useState<File | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imagePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      validateObservationImageFile(file);
      const nextImageSrc = await readFileAsDataUrl(file);
      setPendingSourceFile(file);
      setEditorImageSrc(nextImageSrc);
      setIsEditorOpen(true);
      setErrorObj(null);
      setProcessingWarning(null);
    } catch (error: any) {
      setErrorObj(error.message || "Please select a valid image under 10MB.");
    } finally {
      event.target.value = "";
    }
  };

  const handleEditorClose = () => {
    setIsEditorOpen(false);
    setEditorImageSrc(null);
    setPendingSourceFile(null);
  };

  const handleEditorApply = ({
    file,
    previewUrl,
    usedFallback,
  }: {
    file: File;
    previewUrl: string;
    usedFallback: boolean;
  }) => {
    if (imagePreview?.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(previewUrl);
    setProcessingWarning(
      usedFallback
        ? "Automatic enhancement failed, so this upload will use the original image as a fallback."
        : null
    );
    setIsEditorOpen(false);
    setEditorImageSrc(null);
    setPendingSourceFile(null);
    setErrorObj(null);
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!title || !celestialTarget || !capturedAt || !location || !category) {
      setErrorObj("Please fill in all core fields (Title, Target, Date, Location, Category).");
      return;
    }

    if (!imageFile) {
      setErrorObj("You must attach at least one observation image.");
      return;
    }

    setIsSubmitting(true);
    setErrorObj(null);

    try {
      const uploadFiles = await buildObservationUploadFiles(imageFile);
      const variants = [
        await uploadFileDirect(uploadFiles.original, {
          category: "observation_images",
          entityId: "original",
          fileName: uploadFiles.original.name,
          fileType: uploadFiles.original.type,
          fileSize: uploadFiles.original.size,
          isPublic: true,
        }, { onProgress: (value) => setUploadProgress(Math.round(value * 0.34)) }),
        await uploadFileDirect(uploadFiles.compressed, {
          category: "observation_images",
          entityId: "compressed",
          fileName: uploadFiles.compressed.name,
          fileType: uploadFiles.compressed.type,
          fileSize: uploadFiles.compressed.size,
          isPublic: true,
        }, { onProgress: (value) => setUploadProgress(34 + Math.round(value * 0.33)) }),
        await uploadFileDirect(uploadFiles.thumbnail, {
          category: "observation_images",
          entityId: "thumbnail",
          fileName: uploadFiles.thumbnail.name,
          fileType: uploadFiles.thumbnail.type,
          fileSize: uploadFiles.thumbnail.size,
          isPublic: true,
        }, { onProgress: (value) => setUploadProgress(67 + Math.round(value * 0.33)) }),
      ];

      const payload = {
        title,
        celestialTarget,
        category,
        description,
        location,
        capturedAt,
        imageOriginalUrl: variants[0].fileUrl,
        imageCompressedUrl: variants[1].fileUrl,
        imageThumbnailUrl: variants[2].fileUrl,
        equipment,
        exposureTime,
        iso,
        focalLength,
        filtersUsed,
        bortleScale,
        framesCount,
        processingSoftware,
      };

      await submitObservationAction(payload, isDraft);
      router.push("/portal/observations");
    } catch (error: any) {
      setErrorObj(error.message || "Failed to submit observation");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
      <AnimatedSection>
        <Link href="/portal/observations" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-block", marginBottom: "2rem" }}>
          ← Back to My Logs
        </Link>
        <h1 className="page-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>
          Submit <span className="gradient-text">Observation</span>
        </h1>
        <p className="page-subtitle" style={{ fontSize: "1rem", marginBottom: "3rem" }}>
          Add your target capture to the central repository.
        </p>

        {errorObj && (
          <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fca5a5", marginBottom: "2rem" }}>
            {errorObj}
          </div>
        )}

        {processingWarning && (
          <div style={{ padding: "1rem", background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "8px", color: "#fcd34d", marginBottom: "2rem" }}>
            {processingWarning}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", background: "rgba(15, 22, 40, 0.4)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border-subtle)" }}>
          <section>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>1. Capture Upload</h3>
            <div
              onClick={() => !isSubmitting && fileInputRef.current?.click()}
              style={{
                width: "100%",
                height: "250px",
                border: "2px dashed var(--border-subtle)",
                borderRadius: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                position: "relative",
                overflow: "hidden",
                background: "var(--background-alt)",
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Processed preview" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.92 }} />
              ) : (
                <>
                  <div style={{ fontSize: "2rem", color: "var(--gold)", marginBottom: "1rem" }}>📷</div>
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>Click to upload WebP / JPG / PNG (Max 10MB)</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" style={{ display: "none" }} />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.6rem" }}>
              Upload, crop, process, then preview. The image shown here is the exact file that will be stored.
            </p>
            {imageFile ? (
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
                Prepared file size: {formatFileSize(imageFile.size)}
              </p>
            ) : null}
          </section>

          <section>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>2. Core Meta</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Title *</label>
                <input className="input-field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Orion Nebula from Bortle 4" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Celestial Target *</label>
                <input className="input-field" value={celestialTarget} onChange={(event) => setCelestialTarget(event.target.value)} placeholder="e.g. M42" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Category *</label>
                <select className="input-field" value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>Deep Sky</option>
                  <option>Planetary</option>
                  <option>Lunar</option>
                  <option>Solar</option>
                  <option>Widefield / Milky Way</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Captured At *</label>
                <input className="input-field" type="datetime-local" value={capturedAt} onChange={(event) => setCapturedAt(event.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                <label>Location *</label>
                <input className="input-field" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Mauna Kea Summit" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                <label>Description</label>
                <textarea className="input-field" style={{ minHeight: "100px" }} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Notes on the session, weather, setup..." />
              </div>
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>3. Acquisition & Processing (Optional)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1/-1" }}>
                <label>Equipment (Telescope / Camera / Mount)</label>
                <input className="input-field" value={equipment} onChange={(event) => setEquipment(event.target.value)} placeholder="e.g. SkyWatcher 80ED + ASI533MC + HEQ5" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Total Exposure</label>
                <input className="input-field" value={exposureTime} onChange={(event) => setExposureTime(event.target.value)} placeholder="e.g. 5h 30m" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>ISO / Gain</label>
                <input className="input-field" value={iso} onChange={(event) => setIso(event.target.value)} placeholder="e.g. ISO 800 / Gain 100" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Focal Length</label>
                <input className="input-field" value={focalLength} onChange={(event) => setFocalLength(event.target.value)} placeholder="e.g. 600mm" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Filters Used</label>
                <input className="input-field" value={filtersUsed} onChange={(event) => setFiltersUsed(event.target.value)} placeholder="e.g. Optolong L-eXtreme" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Bortle Scale</label>
                <input className="input-field" type="number" min="1" max="9" value={bortleScale} onChange={(event) => setBortleScale(event.target.value)} placeholder="1-9" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Frame Count</label>
                <input className="input-field" type="number" value={framesCount} onChange={(event) => setFramesCount(event.target.value)} placeholder="e.g. 120" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1/-1" }}>
                <label>Processing Software</label>
                <input className="input-field" value={processingSoftware} onChange={(event) => setProcessingSoftware(event.target.value)} placeholder="e.g. PixInsight, Photoshop" />
              </div>
            </div>
          </section>

          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button className="btn-secondary" onClick={() => handleSubmit(true)} disabled={isSubmitting} style={{ flex: 1, padding: "1rem", opacity: isSubmitting ? 0.5 : 1 }}>
              {isSubmitting ? `Uploading ${uploadProgress}%` : "Save as Draft"}
            </button>
            <button className="btn-primary" onClick={() => handleSubmit(false)} disabled={isSubmitting} style={{ flex: 2, padding: "1rem", opacity: isSubmitting ? 0.5 : 1 }}>
              {isSubmitting ? `Uploading ${uploadProgress}%` : "Submit for Review"}
            </button>
          </div>
        </div>
      </AnimatedSection>

      <ObservationImageEditorModal
        isOpen={isEditorOpen}
        imageSrc={editorImageSrc}
        sourceFile={pendingSourceFile}
        onClose={handleEditorClose}
        onApply={handleEditorApply}
      />
    </div>
  );
}
