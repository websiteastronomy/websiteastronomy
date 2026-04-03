"use client";

import React, { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/cropImage";
import { uploadProfileImageAction } from "@/app/actions/uploadProfile";

type Mode = "select" | "camera" | "crop";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AvatarCropperModal({ isOpen, onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<Mode>("select");
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Camera video ref
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setMode("camera");
    } catch (err: any) {
      alert("Microphone/Camera access denied or unavailable: " + err.message);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setImageSrc(dataUrl);
      stopCamera();
      setMode("crop");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setMode("crop");
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const uploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImageBlob) throw new Error("Failed to crop image.");

      const formData = new FormData();
      formData.append("file", new File([croppedImageBlob], "profile.jpg", { type: "image/jpeg" }));

      await uploadProfileImageAction(formData);
      onSuccess();
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const resetStateAndClose = () => {
    stopCamera();
    setImageSrc(null);
    setMode("select");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "var(--background-alt)", border: "1px solid var(--border-subtle)", borderRadius: "12px", width: "100%", maxWidth: "500px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.1rem", fontFamily: "'Cinzel', serif" }}>
            {mode === "select" ? "Update Profile Image" : mode === "camera" ? "Take a Photo" : "Crop Image"}
          </h3>
          <button onClick={resetStateAndClose} style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ padding: "2rem", minHeight: "350px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
          
          {mode === "select" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
              <button 
                onClick={() => fileInputRef.current?.click()}
                style={{ padding: "1rem", background: "rgba(201,168,76,0.1)", border: "1px dashed var(--gold)", color: "var(--gold)", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
              >
                📁 Upload from Device
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
              
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.8rem", margin: "0.5rem 0" }}>OR</div>
              
              <button 
                onClick={startCamera}
                style={{ padding: "1rem", background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "8px", cursor: "pointer", fontSize: "1rem" }}
              >
                📸 Take a Photo
              </button>
            </div>
          )}

          {mode === "camera" && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div style={{ width: "100%", maxWidth: "400px", aspectRatio: "1/1", background: "#000", borderRadius: "50%", overflow: "hidden", position: "relative" }}>
                <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
              </div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button onClick={capturePhoto} style={{ padding: "0.8rem 2rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Capture</button>
                <button onClick={() => { stopCamera(); setMode("select"); }} style={{ padding: "0.8rem 2rem", background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
              </div>
            </div>
          )}

          {mode === "crop" && imageSrc && (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ position: "relative", width: "100%", height: "300px", background: "#000", borderRadius: "8px", overflow: "hidden" }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
              
              <div style={{ width: "100%", marginTop: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Zoom:</span>
                <input 
                  type="range" 
                  value={zoom} min={1} max={3} step={0.1} 
                  onChange={(e) => setZoom(Number(e.target.value))} 
                  style={{ flex: 1, accentColor: "var(--gold)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem", width: "100%" }}>
                <button 
                  onClick={() => { setMode("select"); setImageSrc(null); }} 
                  style={{ flex: 1, padding: "0.8rem", background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", borderRadius: "8px", cursor: "pointer" }}
                >
                  Back
                </button>
                <button 
                  onClick={uploadCroppedImage} 
                  disabled={isUploading}
                  style={{ flex: 2, padding: "0.8rem", background: "var(--gold)", color: "#000", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: isUploading ? "not-allowed" : "pointer" }}
                >
                  {isUploading ? "Uploading..." : "Save Profile Image"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
