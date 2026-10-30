import type { Metadata } from "next";
import HistoryClient from "./HistoryClient";

export const metadata: Metadata = {
  title: "Cloud Analysis History",
  description:
    "Access and manage your saved bioinformatics analyses. View past sequence properties, mutation summaries, and restore your research workspaces.",
  alternates: {
    canonical: "/history",
  },
  openGraph: {
    title: "Analysis Archive | Rezerch Sequence Lab",
    description:
      "Access and manage your saved bioinformatics analyses. View past sequence properties, mutation summaries, and restore your research workspaces.",
    url: "/history",
  },
  twitter: {
    title: "Analysis Archive | Rezerch Sequence Lab",
    description:
      "Access and manage your saved bioinformatics analyses. View past sequence properties, mutation summaries, and restore your research workspaces.",
  },
};

export default function HistoryPage() {
  return <HistoryClient />;
}
