"use client";

export const OBSERVATION_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const OBSERVATION_IMAGE_OUTPUT_WIDTH = 1280;
export const OBSERVATION_IMAGE_OUTPUT_HEIGHT = 720;
export const OBSERVATION_IMAGE_OUTPUT_TYPE = "image/webp";
export const OBSERVATION_IMAGE_OUTPUT_QUALITY = 0.86;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function validateObservationImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, and WebP images are allowed.");
  }

  if (file.size > OBSERVATION_IMAGE_MAX_BYTES) {
    throw new Error("Please select an image under 10MB.");
  }
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Canvas export failed."));
    }, type, quality);
  });
}

export async function processObservationImage(
  imageSrc: string,
  pixelCrop: PixelCrop
): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = OBSERVATION_IMAGE_OUTPUT_WIDTH;
  outputCanvas.height = OBSERVATION_IMAGE_OUTPUT_HEIGHT;

  const ctx = outputCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable.");
  }

  ctx.fillStyle = "#060b16";
  ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  ctx.filter = "contrast(1.07) brightness(0.96) saturate(1.03)";
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputCanvas.width,
    outputCanvas.height
  );
  ctx.filter = "none";

  const gradient = ctx.createRadialGradient(
    outputCanvas.width / 2,
    outputCanvas.height / 2,
    outputCanvas.height * 0.2,
    outputCanvas.width / 2,
    outputCanvas.height / 2,
    outputCanvas.width * 0.72
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.72, "rgba(0, 0, 0, 0.06)");
  gradient.addColorStop(1, "rgba(2, 6, 14, 0.32)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, outputCanvas.width, outputCanvas.height);

  return canvasToBlob(
    outputCanvas,
    OBSERVATION_IMAGE_OUTPUT_TYPE,
    OBSERVATION_IMAGE_OUTPUT_QUALITY
  );
}

export async function createFallbackObservationFile(file: File): Promise<File> {
  const fallbackType = ALLOWED_IMAGE_TYPES.has(file.type) ? file.type : "image/jpeg";
  const extension = fallbackType === "image/png" ? "png" : fallbackType === "image/webp" ? "webp" : "jpg";
  return new File([file], `observation-fallback.${extension}`, {
    type: fallbackType,
    lastModified: file.lastModified,
  });
}

export async function createProcessedObservationFile(
  imageSrc: string,
  pixelCrop: PixelCrop
): Promise<File> {
  const blob = await processObservationImage(imageSrc, {
    x: Math.round(clamp(pixelCrop.x, 0, Number.MAX_SAFE_INTEGER)),
    y: Math.round(clamp(pixelCrop.y, 0, Number.MAX_SAFE_INTEGER)),
    width: Math.max(1, Math.round(pixelCrop.width)),
    height: Math.max(1, Math.round(pixelCrop.height)),
  });

  return new File([blob], "observation.webp", {
    type: OBSERVATION_IMAGE_OUTPUT_TYPE,
    lastModified: Date.now(),
  });
}
