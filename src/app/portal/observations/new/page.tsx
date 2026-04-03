"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AnimatedSection from "@/components/AnimatedSection";
import { processAndUploadObservationImageAction } from "@/app/actions/uploadObservation";
import { submitObservationAction } from "@/app/actions/observations-engine";
import Link from 'next/link';

export default function SubmitObservationPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorObj, setErrorObj] = useState<string | null>(null);
  
  // Basic Fields
  const [title, setTitle] = useState("");
  const [celestialTarget, setCelestialTarget] = useState("");
  const [category, setCategory] = useState("Deep Sky");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [capturedAt, setCapturedAt] = useState("");
  
  // Tech Fields
  const [equipment, setEquipment] = useState("");
  const [exposureTime, setExposureTime] = useState("");
  const [iso, setIso] = useState("");
  const [focalLength, setFocalLength] = useState("");
  const [filtersUsed, setFiltersUsed] = useState("");
  const [bortleScale, setBortleScale] = useState("");
  const [framesCount, setFramesCount] = useState("");
  const [processingSoftware, setProcessingSoftware] = useState("");
  
  // Image
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImageFrontend = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          const MAX_DIM = 4000; // Limit to 4K max size for performance before sending to backend
          if (width > MAX_DIM || height > MAX_DIM) {
            if (width > height) {
              height *= MAX_DIM / width;
              width = MAX_DIM;
            } else {
              width *= MAX_DIM / height;
              height = MAX_DIM;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas blob failed"));
          }, file.type, 0.95);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      setErrorObj("Please select an image under 20MB.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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
      // 1. Process & Upload Image to R2
      const compressedBlob = await compressImageFrontend(imageFile);
      const formData = new FormData();
      formData.append("file", new File([compressedBlob], imageFile.name, { type: imageFile.type }));
      
      const uploadRes = await processAndUploadObservationImageAction(formData);
      
      // 2. Transmit to Postgres Observation Engine
      const payload = {
        title, celestialTarget, category, description, location, capturedAt,
        imageOriginalUrl: uploadRes.urls.original,
        imageCompressedUrl: uploadRes.urls.compressed,
        imageThumbnailUrl: uploadRes.urls.thumbnail,
        equipment, exposureTime, iso, focalLength, filtersUsed, bortleScale, framesCount, processingSoftware
      };

      await submitObservationAction(payload, isDraft);
      
      router.push("/portal/observations");
    } catch (err: any) {
      setErrorObj(err.message || "Failed to submit observation");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ padding: "4rem 2rem", maxWidth: "800px", margin: "0 auto" }}>
      <AnimatedSection>
        <Link href="/portal/observations" style={{ color: "var(--text-muted)", textDecoration: "none", display: "inline-block", marginBottom: "2rem" }}>
          ← Back to My Logs
        </Link>
        <h1 className="page-title" style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>Submit <span className="gradient-text">Observation</span></h1>
        <p className="page-subtitle" style={{ fontSize: "1rem", marginBottom: "3rem" }}>
          Add your target capture to the central repository.
        </p>

        {errorObj && (
          <div style={{ padding: "1rem", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "8px", color: "#fca5a5", marginBottom: "2rem" }}>
            {errorObj}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", background: "rgba(15, 22, 40, 0.4)", padding: "2rem", borderRadius: "16px", border: "1px solid var(--border-subtle)" }}>
          
          {/* IMAGE SECION */}
          <section>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>1. Capture Upload</h3>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ 
                width: "100%", height: "250px", border: "2px dashed var(--border-subtle)", borderRadius: "12px", 
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
                cursor: "pointer", position: "relative", overflow: "hidden", background: "var(--background-alt)"
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
              ) : (
                <>
                  <div style={{ fontSize: "2rem", color: "var(--gold)", marginBottom: "1rem" }}>📷</div>
                  <p style={{ color: "var(--text-muted)", margin: 0 }}>Click or drag to upload WebP / JPG / PNG (Max 10MB)</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" style={{ display: "none" }} />
            </div>
          </section>

          {/* BASIC INFO */}
          <section>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>2. Core Meta</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Title *</label>
                <input className="input-field" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Orion Nebula from Bortle 4" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Celestial Target *</label>
                <input className="input-field" value={celestialTarget} onChange={(e) => setCelestialTarget(e.target.value)} placeholder="e.g. M42" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Category *</label>
                <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>Deep Sky</option>
                  <option>Planetary</option>
                  <option>Lunar</option>
                  <option>Solar</option>
                  <option>Widefield / Milky Way</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Captured At *</label>
                <input className="input-field" type="datetime-local" value={capturedAt} onChange={(e) => setCapturedAt(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                <label>Location *</label>
                <input className="input-field" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mauna Kea Summit" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
                <label>Description</label>
                <textarea className="input-field" style={{ minHeight: "100px" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes on the session, weather, setup..." />
              </div>
            </div>
          </section>

          {/* EXIF / TECH INFO */}
          <section>
            <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "0.5rem" }}>3. Acquisition & Processing (Optional)</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1/-1" }}>
                <label>Equipment (Telescope / Camera / Mount)</label>
                <input className="input-field" value={equipment} onChange={(e) => setEquipment(e.target.value)} placeholder="e.g. SkyWatcher 80ED + ASI533MC + HEQ5" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Total Exposure</label>
                <input className="input-field" value={exposureTime} onChange={(e) => setExposureTime(e.target.value)} placeholder="e.g. 5h 30m" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>ISO / Gain</label>
                <input className="input-field" value={iso} onChange={(e) => setIso(e.target.value)} placeholder="e.g. ISO 800 / Gain 100" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Focal Length</label>
                <input className="input-field" value={focalLength} onChange={(e) => setFocalLength(e.target.value)} placeholder="e.g. 600mm" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Filters Used</label>
                <input className="input-field" value={filtersUsed} onChange={(e) => setFiltersUsed(e.target.value)} placeholder="e.g. Optolong L-eXtreme" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Bortle Scale</label>
                <input className="input-field" type="number" min="1" max="9" value={bortleScale} onChange={(e) => setBortleScale(e.target.value)} placeholder="1-9" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label>Frame Count</label>
                <input className="input-field" type="number" value={framesCount} onChange={(e) => setFramesCount(e.target.value)} placeholder="e.g. 120" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1/-1" }}>
                <label>Processing Software</label>
                <input className="input-field" value={processingSoftware} onChange={(e) => setProcessingSoftware(e.target.value)} placeholder="e.g. PixInsight, Photoshop" />
              </div>
            </div>
          </section>

          {/* SUBMIT */}
          <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
            <button 
              className="btn-secondary" 
              onClick={() => handleSubmit(true)} 
              disabled={isSubmitting}
              style={{ flex: 1, padding: "1rem", opacity: isSubmitting ? 0.5 : 1 }}
            >
              {isSubmitting ? "Uploading..." : "Save as Draft"}
            </button>
            <button 
              className="btn-primary" 
              onClick={() => handleSubmit(false)} 
              disabled={isSubmitting}
              style={{ flex: 2, padding: "1rem", opacity: isSubmitting ? 0.5 : 1 }}
            >
              {isSubmitting ? "Uploading..." : "Submit for Review"}
            </button>
          </div>

        </div>
      </AnimatedSection>
    </div>
  );
}
