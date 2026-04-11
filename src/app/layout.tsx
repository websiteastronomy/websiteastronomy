import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CursorGlow from "@/components/CursorGlow";
import { AuthProvider } from "@/context/AuthContext";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSystemAccess } from "@/lib/system-rbac";
import { getFeatureDisplayName, getRestrictedFeatureForPath, isMaintenanceActive } from "@/lib/system-control";
import { getSystemControlSettingsAction } from "@/app/actions/system-control";
import { getSiteSettingsAction } from "@/app/actions/site-settings";
import SystemRestrictionPage from "@/components/SystemRestrictionPage";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "MVJCE Astronomy Club | Explore the Cosmos",
  description: "Join the MVJCE Astronomy Club for stargazing events, astrophotography, and exploring the universe together.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || "/";
  const session = await auth.api.getSession({ headers: headerStore });
  const user = session?.user ?? null;
  const access = user?.id ? await getSystemAccess(user.id).catch(() => null) : null;
  const systemControl = await getSystemControlSettingsAction().catch(() => null);
  const siteSettings = await getSiteSettingsAction().catch(() => null);

  const isAdmin = Boolean(access?.isAdmin);
  const isMaintenance = systemControl ? isMaintenanceActive(systemControl) : false;
  const isLockdown = Boolean(systemControl?.lockdownEnabled);
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname.startsWith("/portal") || pathname.startsWith("/dashboard") || isAdminRoute;
  const restrictedFeature = systemControl ? getRestrictedFeatureForPath(pathname, systemControl) : null;

  if (systemControl) {
    if (isLockdown && !isAdmin) {
      return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
          <body>
            <SystemRestrictionPage variant="lockdown" title="🔒 System Temporarily Restricted" message={systemControl.lockdownReason} />
          </body>
        </html>
      );
    }

    if (isMaintenance && !user && !isAuthRoute) {
      return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
          <body>
            <SystemRestrictionPage
              variant="maintenance"
              title="🚧 Under Maintenance"
              message={systemControl.maintenanceReason}
              until={systemControl.maintenanceUntil}
            />
          </body>
        </html>
      );
    }

    if (restrictedFeature && !isAdmin && !isAdminRoute) {
      return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
          <body>
            <SystemRestrictionPage
              variant="feature"
              title={`${getFeatureDisplayName(restrictedFeature)} Unavailable`}
              message={`${getFeatureDisplayName(restrictedFeature)} is currently disabled by the system administrator.`}
            />
          </body>
        </html>
      );
    }
  }

  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AuthProvider>
          <Starfield />
          <CursorGlow />
          <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
            <Navbar initialIsRecruiting={siteSettings?.isRecruiting ?? false} />
            <main style={{ flex: 1 }}>
              {children}
            </main>
            <Footer />
          </div>
          <ScrollToTop />
        </AuthProvider>
      </body>
    </html>
  );
}
