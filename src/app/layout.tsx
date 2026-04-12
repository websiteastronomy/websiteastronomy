import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";
import CursorGlow from "@/components/CursorGlow";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ToastProvider";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSystemAccess } from "@/lib/system-rbac";
import { getFeatureDisplayName, getRestrictedFeatureForPath, isMaintenanceActive } from "@/lib/system-control";
import { getSystemControlSettingsAction } from "@/app/actions/system-control";
import { getSiteSettingsAction } from "@/app/actions/site-settings";
import SystemRestrictionWrapper from "@/components/SystemRestrictionWrapper";

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


  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Starfield />
            <CursorGlow />
            <SystemRestrictionWrapper systemControl={systemControl} user={user} isAdmin={isAdmin}>
              <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
                <Navbar initialIsRecruiting={siteSettings?.isRecruiting ?? false} />
                <main style={{ flex: 1 }}>
                  {children}
                </main>
                <Footer />
              </div>
            </SystemRestrictionWrapper>
            <ScrollToTop />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
