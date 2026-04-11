"use client";

import { useState } from "react";
import AvatarCropperModal from "@/components/AvatarCropperModal";
import PortalProfile from "@/components/portal/PortalProfile";
import { usePortalData } from "@/components/portal/usePortalData";
import { useAuth } from "@/context/AuthContext";
import { canAccessAdminPage as canAccessAdminDashboard } from "@/lib/admin-access";

export default function DashboardProfilePage() {
  const { user, logout, hasPermission, isAdmin } = useAuth();
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [quoteFeedback, setQuoteFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [contactFeedback, setContactFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const canAccessAdminPage = canAccessAdminDashboard({ isAdmin, hasPermission });

  const portalData = usePortalData(
    user
      ? {
          id: user.id,
          image: user.image ?? null,
          name: user.name ?? null,
          email: user.email ?? null,
          profileImageKey: (user as { profileImageKey?: string | null }).profileImageKey ?? null,
          quote: (user as { quote?: string | null }).quote ?? null,
        }
      : null,
  );

  if (!user) {
    return null;
  }

  return (
    <>
      <div style={{ maxWidth: "420px" }}>
        <PortalProfile
          user={{
            id: user.id,
            image: user.image ?? null,
            name: user.name ?? null,
            email: user.email ?? null,
            profileImageKey: (user as { profileImageKey?: string | null }).profileImageKey ?? null,
            quote: (user as { quote?: string | null }).quote ?? null,
          }}
          profileImageUrl={portalData.profileImageUrl}
          imgError={portalData.imgError}
          onImageError={() => portalData.setImgError(true)}
          onOpenCropper={() => setIsCropperOpen(true)}
          quoteFeedback={quoteFeedback}
          contactFeedback={contactFeedback}
          onQuoteFeedbackChange={setQuoteFeedback}
          onContactFeedbackChange={setContactFeedback}
          onLogout={logout}
          systemControl={portalData.systemControl}
          disabledFeatures={portalData.disabledFeatures}
          hasPermission={hasPermission}
          canAccessAdminPage={canAccessAdminPage}
          showDashboardLink={false}
        />
      </div>

      <AvatarCropperModal
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onSuccess={(imageUrl) => {
          portalData.setProfileImageUrl(imageUrl);
          portalData.setImgError(false);
          setIsCropperOpen(false);
        }}
      />
    </>
  );
}
