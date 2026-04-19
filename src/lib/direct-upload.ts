import { finalizeDirectUploadAction, getStorageRuleAction } from "@/app/actions/storage";
import type { StorageModule, UploadIntent } from "@/lib/storage-upload";

type DirectUploadResult = {
  fileUrl: string;
  fileId: string;
  fileName: string;
  fileKey: string;
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

export async function uploadFileDirect(file: File, intent: UploadIntent): Promise<DirectUploadResult> {
  const storageModule: StorageModule =
    intent.category === "documentation"
      ? "docs"
      : intent.category === "projects"
        ? "projects"
        : intent.category === "forms"
          ? "forms"
          : "general";

  const rule = await getCachedRule(storageModule);
  if (file.size > rule.maxFileSizeMb * 1024 * 1024) {
    throw new Error(`File too large. Maximum allowed for ${storageModule} uploads is ${rule.maxFileSizeMb}MB.`);
  }

  if (!matchesAllowedType(file, rule.allowedFileTypes)) {
    const allowed = rule.allowedFileTypes.includes("*/*") ? "All file types" : rule.allowedFileTypes.join(", ");
    throw new Error(`Unsupported file type. Allowed types for ${storageModule} uploads: ${allowed}.`);
  }

  const requestBody = {
    ...intent,
    fileName: file.name,
    fileType: file.type || "application/octet-stream",
    fileSize: file.size,
  };

  const presignRes = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const presignJson = await presignRes.json();
  if (!presignRes.ok) {
    throw new Error(presignJson?.error || "Failed to prepare upload.");
  }

  const putRes = await fetch(presignJson.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
    body: file,
  });

  if (!putRes.ok) {
    throw new Error("Upload failed while sending the file to storage.");
  }

  const finalized = await finalizeDirectUploadAction({
    ...requestBody,
    fileKey: presignJson.fileKey,
  });

  return {
    ...finalized,
    fileKey: presignJson.fileKey,
  };
}
