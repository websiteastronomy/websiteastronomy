"use client";

function extensionForType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Image export failed."));
    }, type, quality);
  });
}

function loadImageFromFile(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image."));
    };

    image.src = objectUrl;
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function optimizeImageFile(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    type?: string;
    quality?: number;
    fileName?: string;
  }
) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const maxWidth = options?.maxWidth ?? 2000;
  const maxHeight = options?.maxHeight ?? 2000;
  const outputType = options?.type ?? (file.type === "image/png" ? "image/png" : "image/webp");
  const outputQuality = options?.quality ?? (outputType === "image/png" ? undefined : 0.82);

  const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable.");
  }

  ctx.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, outputType, outputQuality);

  const nextFile = new File([blob], options?.fileName || file.name.replace(/\.[^/.]+$/, `.${extensionForType(outputType)}`), {
    type: outputType,
    lastModified: Date.now(),
  });

  return nextFile.size <= file.size ? nextFile : file;
}

export async function buildObservationUploadFiles(file: File) {
  const image = await loadImageFromFile(file);

  const createVariant = async (
    targetWidth: number,
    targetHeight: number,
    quality: number,
    name: string
  ) => {
    const scale = Math.min(1, targetWidth / image.width, targetHeight / image.height);
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is unavailable.");

    ctx.fillStyle = "#060b16";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/webp", quality);
    return new File([blob], name, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  };

  return {
    original: await createVariant(1600, 900, 0.9, "original.webp"),
    compressed: await createVariant(1280, 720, 0.82, "compressed.webp"),
    thumbnail: await createVariant(600, 338, 0.74, "thumbnail.webp"),
  };
}
