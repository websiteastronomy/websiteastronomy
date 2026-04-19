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

async function renderImageToFile(
  image: HTMLImageElement,
  width: number,
  height: number,
  type: string,
  quality: number | undefined,
  fileName: string
) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas is unavailable.");
  }

  ctx.drawImage(image, 0, 0, width, height);
  const blob = await canvasToBlob(canvas, type, quality);

  return new File([blob], fileName, {
    type,
    lastModified: Date.now(),
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
  const nextFile = await renderImageToFile(
    image,
    width,
    height,
    outputType,
    outputQuality,
    options?.fileName || file.name.replace(/\.[^/.]+$/, `.${extensionForType(outputType)}`)
  );

  return nextFile.size <= file.size ? nextFile : file;
}

function preferredOutputType(file: File, allowedTypes?: string[]) {
  const normalized = (allowedTypes || []).map((value) => value.toLowerCase());
  if (normalized.includes("image/webp") || normalized.includes("image/*") || normalized.includes("*/*")) {
    return "image/webp";
  }
  if (normalized.includes("image/jpeg")) {
    return "image/jpeg";
  }
  if (normalized.includes("image/png")) {
    return "image/png";
  }
  return file.type || "image/jpeg";
}

export async function compressImageToFitLimit(
  file: File,
  options: {
    maxBytes: number;
    maxWidth?: number;
    maxHeight?: number;
    allowedTypes?: string[];
    preferredType?: string;
    fileName?: string;
  }
) {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.size <= options.maxBytes) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const outputType = options.preferredType || preferredOutputType(file, options.allowedTypes);
  const outputName =
    options.fileName || file.name.replace(/\.[^/.]+$/, `.${extensionForType(outputType)}`);
  const maxWidth = options.maxWidth ?? image.width;
  const maxHeight = options.maxHeight ?? image.height;

  let scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
  let bestCandidate = file;

  for (let pass = 0; pass < 8; pass += 1) {
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const qualitySteps = outputType === "image/png" ? [undefined] : [0.86, 0.8, 0.72, 0.64, 0.56, 0.48, 0.4];

    for (const quality of qualitySteps) {
      const candidate = await renderImageToFile(image, width, height, outputType, quality, outputName);
      if (candidate.size < bestCandidate.size) {
        bestCandidate = candidate;
      }
      if (candidate.size <= options.maxBytes) {
        return candidate;
      }
    }

    scale *= 0.82;
  }

  return bestCandidate;
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
