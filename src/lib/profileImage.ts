/**
 * Resolves a user's profile image URL.
 * Priority: profileImageKey (R2) > image (OAuth) > fallback avatar.
 */
export function resolveProfileImageUrl(
  profileImageKey?: string | null,
  oauthImage?: string | null,
  fallbackInitial?: string
): string {
  if (profileImageKey) {
    const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
    return `${r2Base}/${profileImageKey}`;
  }
  if (oauthImage) {
    return oauthImage;
  }
  // If nothing, return empty string — caller handles fallback UI
  return "";
}
