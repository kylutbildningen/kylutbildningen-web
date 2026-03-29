import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/sanity/lib/live";
import { SectionNav } from "@/components/home/SectionNav";
import { CookieBanner } from "@/components/CookieBanner";
import { ChatWidget } from "@/components/ChatWidget";
import { AuthModal } from "@/components/AuthModal";
import { DashboardModal } from "@/components/DashboardModal";
import { Toast } from "@/components/Toast";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-barlow",
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kylutbildningen.se'),
  title: {
    default: 'Kylutbildningen i Göteborg AB — F-gas certifiering',
    template: '%s | Kylutbildningen',
  },
  description: 'INCERT-godkänt examinationscenter för F-gascertifiering i Göteborg sedan 1997. Boka kurser online.',
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const draft = await draftMode();

  return (
    <html lang="sv" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="antialiased min-h-screen flex flex-col">
        {children}
        <SectionNav />
        <SanityLive />
        {draft.isEnabled && <VisualEditing />}
        <CookieBanner />
        <ChatWidget />
        <AuthModal />
        <DashboardModal />
        <Toast />
        <Analytics />
      </body>
    </html>
  );
}
