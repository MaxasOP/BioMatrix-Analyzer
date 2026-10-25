import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AssistantWidget from "@/components/AssistantWidget";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://biomatrix-analyzer.vercel.app"),
  title: {
    default: "BioMatrix AI",
    template: "%s | BioMatrix AI",
  },
  description:
    "Bioinformatics platform for sequence analysis, mutation detection, and AI explanations.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      ],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
    shortcut: ["/icon"],
  },
  verification: {
    google: "VCBmtD7GlhFh-NGe_74Lz9iO0vcnGW3AXmlqJtr9aYY",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}
      data-theme="dark"
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full bg-[var(--paper)] text-[var(--ink)]">
        <Navbar />
        {children}
        <Footer />
        <AssistantWidget />
      </body>
    </html>
  );
}

