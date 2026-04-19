import { finalizeDirectUploadAction, getStorageRuleAction } from "@/app/actions/storage";
import { compressImageToFitLimit } from "@/lib/client-upload-images";
import { inferStorageModule, type StorageModule, type UploadIntent } from "@/lib/storage-upload.shared";

type DirectUploadResult = {
  fileUrl: string;
  fileId: string;
  fileName: string;
  fileKey: string;
  fileType: string;
  fileSize: number;
  wasCompressed?: boolean;
};

type UploadFileDirectOptions = {
  onProgress?: (progress: number) => void;
};

const storageRuleCache = new Map<StorageModule, Awaited<ReturnType<typeof getStorageRuleAction>>>();

function extensionFromName(fileName: string): string {
  return fileName.match(/\.[^./\\]+$/)?.[0]?.toLowerCase() || "";
}

function matchesAllowedType(file: File, allowedTypes: string[]) {
  const mime = (file.type || "").toLowerCase();
  const ext = extensionFromName(file.name);

  return allowedTypes.some((allowed) => {
    const normalized = allowed.trim().toLowerCase();
    if (!normalized || normalized === "*/*" || normalized === "*") return true;
    if (normalized.endsWith("/*")) return mime.startsWith(normalized.slice(0, normalized.length - 1));
    if (normalized.startsWith(".")) return ext === normalized;
    if (!normalized.includes("/")) return ext === `.${normalized.replace(/^\.+/, "")}`;
    return mime === normalized;
  });
}

async function getCachedRule(module: StorageModule) {
  const cached = storageRuleCache.get(module);
  if (cached) return cached;
  const nextRule = await getStorageRuleAction(module);
  storageRuleCache.set(module, nextRule);
  return nextRule;
}

async function fetchUploadToSignedUrl(uploadUrl: string, file: File) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed while sending the file to storage (${response.status}).`);
  }
}

function isRecoverableStorageUploadError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("upload failed while sending the file to storage") ||
    normalized.includes("access denied") ||
    normalized.includes("forbidden")
  );
}

function uploadFileThroughProxy(
  file: File,
  intent: UploadIntent,
  onProgress?: (progress: number) => void
) {
  return new Promise<{
    fileKey: string;
    fileName: string;
    fileUrl: string;
  }>((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", intent.category);
    formData.append("fileName", file.name);
    formData.append("fileType", file.type || "application/octet-stream");
    formData.append("fileSize", String(file.size));
    if (intent.entityId) formData.append("entityId", intent.entityId);
    if (intent.projectId) formData.append("projectId", intent.projectId);
    if (typeof intent.isGlobal === "boolean") formData.append("isGlobal", String(intent.isGlobal));
    if (typeof intent.isPublic === "boolean") formData.append("isPublic", String(intent.isPublic));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload-proxy");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      try {
        const json = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve(json);
          return;
        }
        reject(new Error(json?.error || "Upload failed while sending the file through the app."));
      } catch {
        reject(new Error("Upload failed while sending the file through the app."));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Upload failed while sending the file through the app."));
    };

    xhr.send(formData);
  });
}

function uploadFileToSignedUrl(uploadUrl: string, file: File, onProgress?: (progress: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) return;
      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)));
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }

      fetchUploadToSignedUrl(uploadUrl, file)
        .then(() => {
          onProgress?.(100);
          resolve();
        })
        .catch((error) => {
          reject(error instanceof Error ? error : new Error("Upload failed while sending the file to storage."));
        });
    };

    xhr.onerror = () => {
      fetchUploadToSignedUrl(uploadUrl, file)
        .then(() => {
          onProgress?.(100);
          resolve();
        })
        .catch((error) => {
          reject(error instanceof Error ? error : new Error("Upload failed while sending the file to storage."));
        });
    };
    xhr.send(file);
  });
}

export async function uploadFileDirect(
  file: File,
  intent: UploadIntent,
  options?: UploadFileDirectOptions
): Promise<DirectUploadResult> {
  const storageModule = inferStorageModule(intent.category);
  const rule = await getCachedRule(storageModule);
  const maxBytes = rule.maxFileSizeMb * 1024 * 1024;
  const preparedFile =
    file.type.startsWith("image/") && file.size > maxBytes
      ? await compressImageToFitLimit(file, {
          maxBytes,
          allowedTypes: rule.allowedFileTypes,
          maxWidth: storageModule === "profile_images" ? 720 : 2000,
          maxHeight: storageModule === "profile_images" ? 720 : 2000,
        })
      : file;

  if (preparedFile.size > maxBytes) {
    throw new Error(`File too large. Maximum allowed for ${storageModule} uploads is ${rule.maxFileSizeMb}MB.`);
  }

  if (!matchesAllowedType(preparedFile, rule.allowedFileTypes)) {
    const allowed = rule.allowedFileTypes.includes("*/*") ? "All file types" : rule.allowedFileTypes.join(", ");
    throw new Error(`Unsupported file type. Allowed types for ${storageModule} uploads: ${allowed}.`);
  }

  const requestBody = {
    ...intent,
    fileName: preparedFile.name,
    fileType: preparedFile.type || "application/octet-stream",
    fileSize: preparedFile.size,
  };

  let uploadedFileKey = "";
  let uploadedFileName = preparedFile.name;

  try {
    const presignRes = await fetch("/api/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const presignJson = await presignRes.json();
    if (!presignRes.ok) {
      throw new Error(presignJson?.error || "Failed to prepare upload.");
    }

    uploadedFileKey = presignJson.fileKey;
    uploadedFileName = presignJson.fileName || preparedFile.name;
    await uploadFileToSignedUrl(presignJson.uploadUrl, preparedFile, options?.onProgress);
  } catch (error) {
    if (!isRecoverableStorageUploadError(error)) {
      throw error;
    }

    const proxiedUpload = await uploadFileThroughProxy(preparedFile, intent, options?.onProgress);
    uploadedFileKey = proxiedUpload.fileKey;
    uploadedFileName = proxiedUpload.fileName || preparedFile.name;
  }

  const finalized = await finalizeDirectUploadAction({
    ...requestBody,
    fileName: uploadedFileName,
    fileKey: uploadedFileKey,
  });

  return {
    ...finalized,
    fileKey: uploadedFileKey,
    fileType: preparedFile.type || "application/octet-stream",
    fileSize: preparedFile.size,
    wasCompressed: preparedFile.size < file.size || preparedFile.type !== file.type || preparedFile.name !== file.name,
  };
}
