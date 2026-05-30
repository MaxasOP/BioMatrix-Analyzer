import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "BioMatrix AI",
  description:
    "Bioinformatics platform for sequence analysis, mutation detection, and AI explanations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plexMono.variable} h-full antialiased`}
    >
      <head>
        {/* Theme init script: set data-theme before React hydrates */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var prefers=window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s|| (prefers? 'dark':'light');document.documentElement.setAttribute('data-theme', t);document.documentElement.style.colorScheme = t;}catch(e){}})();`,
          }}
        />
      </head>

      <body className="min-h-full bg-[var(--paper)] text-[var(--ink)]">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[var(--paper)] focus:px-3 focus:py-2 focus:rounded-md">
          Skip to main content
        </a>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
