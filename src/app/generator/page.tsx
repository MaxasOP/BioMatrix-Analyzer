import type { Metadata } from "next";
import GeneratorClient from "./GeneratorClient";

export const metadata: Metadata = {
  title: "DNA/RNA Sequence Generator",
  description:
    "Generate random DNA or RNA test sequences of customizable lengths. Easily copy or export generated sequences directly into the analyzer for mock testing.",
  alternates: {
    canonical: "/generator",
  },
  openGraph: {
    title: "DNA/RNA Sequence Generator | BioMatrix AI",
    description:
      "Generate random DNA or RNA test sequences of customizable lengths. Easily copy or export generated sequences directly into the analyzer for mock testing.",
    url: "/generator",
  },
  twitter: {
    title: "DNA/RNA Sequence Generator | BioMatrix AI",
    description:
      "Generate random DNA or RNA test sequences of customizable lengths. Easily copy or export generated sequences directly into the analyzer for mock testing.",
  },
};

export default function GeneratorPage() {
  return <GeneratorClient />;
}