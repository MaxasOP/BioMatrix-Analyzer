import type { Metadata } from "next";
import { Suspense } from "react";

import AnalyzeClient from "./AnalyzeClient";

export const metadata: Metadata = {
  title: "Sequence Analysis Tool",
  description:
    "Paste DNA/RNA sequences to calculate GC content, analyze transcription/translation, map restriction sites, detect mutations, and get professional AI explanations.",
  alternates: {
    canonical: "/analyze",
  },
  openGraph: {
    title: "Sequence Analysis Tool | BioMatrix AI",
    description:
      "Paste DNA/RNA sequences to calculate GC content, analyze transcription/translation, map restriction sites, detect mutations, and get professional AI explanations.",
    url: "/analyze",
  },
  twitter: {
    title: "Sequence Analysis Tool | BioMatrix AI",
    description:
      "Paste DNA/RNA sequences to calculate GC content, analyze transcription/translation, map restriction sites, detect mutations, and get professional AI explanations.",
  },
};

export default function AnalyzePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-6xl px-6 py-12 text-slate-200">
          Loading analysis tools...
        </main>
      }
    >
      <AnalyzeClient />
    </Suspense>
  );
}