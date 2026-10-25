import type { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "BioMatrix Sequence Lab - DNA/RNA Analysis Workbench",
  description:
    "Inspect DNA and RNA sequences, compare mutations, translate codons, and locate open reading frames in one focused workbench.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BioMatrix Sequence Lab - DNA/RNA Analysis Workbench",
    description:
      "Inspect DNA and RNA sequences, compare mutations, translate codons, and locate open reading frames in one focused workbench.",
    url: "/",
    siteName: "BioMatrix Sequence Lab",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BioMatrix Sequence Lab - DNA/RNA Analysis Workbench",
    description:
      "Inspect DNA and RNA sequences, compare mutations, translate codons, and locate open reading frames in one focused workbench.",
  },
};

export default function Home() {
  return <HomeClient />;
}
