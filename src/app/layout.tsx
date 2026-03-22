import type { Metadata } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { SanityLive } from "@/sanity/lib/live";
import { SectionNav } from "@/components/home/SectionNav";
import { CookieBanner } from "@/components/CookieBanner";
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
  title: "Kylutbildningen — Boka utbildning",
  description:
    "Boka certifierade kylutbildningar. F-gasförordningen, köldmediehantering, läckagekontroll och mer.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const draft = await draftMode();

  return (
    <html lang="sv" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="antialiased">
        {children}
        <SectionNav />
        <SanityLive />
        {draft.isEnabled && <VisualEditing />}
        <CookieBanner />
      </body>
    </html>
  );
}
