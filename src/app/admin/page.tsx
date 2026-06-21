import type { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "AI‑SQL Admin Dashboard",
  description: "Natural‑language to SQL interface for BioMatrix analytics",
};

// Dynamically import client to keep server bundle light
const AIAgentClient = dynamic(() => import("./AIAgentClient"), { ssr: false });

export default function AdminPage() {
  return <AIAgentClient />;
}
