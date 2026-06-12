import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "BioMatrix AI - Bioinformatics Sequence & Mutation Analyzer",
  description:
    "Explore and analyze DNA and RNA sequences with BioMatrix AI. Detect mutations, translate codons, find open reading frames (ORFs), and get instant AI-generated interpretations.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BioMatrix AI - Bioinformatics Sequence & Mutation Analyzer",
    description:
      "Explore and analyze DNA and RNA sequences with BioMatrix AI. Detect mutations, translate codons, find open reading frames (ORFs), and get instant AI-generated interpretations.",
    url: "/",
    siteName: "BioMatrix AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BioMatrix AI - Bioinformatics Sequence & Mutation Analyzer",
    description:
      "Explore and analyze DNA and RNA sequences with BioMatrix AI. Detect mutations, translate codons, find open reading frames (ORFs), and get instant AI-generated interpretations.",
  },
};

export default function Home() {
  return <HomeClient />;
}