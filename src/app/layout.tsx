import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import ClickFeedback from "@/components/ClickFeedback";
import GlobalIntro from "@/components/GlobalIntro";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";
import "./studio.css";

export const metadata: Metadata = {
  title: "Armoire — Your Closet, Styled by Intelligence",
  description: "Upload your clothes, pick your styles, and let AI build premium outfits for you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/playfair-display-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/space-grotesk-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/ibm-plex-mono-400-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <GlobalIntro />
        <SmoothScroll />
        <ClickFeedback />
        {children}
      </body>
    </html>
  );
}
