import type { Metadata } from "next";
import AIAgentClient from "./AIAgentClient";

export const metadata: Metadata = {
  title: "AI‑SQL Admin Dashboard",
  description: "Natural‑language to SQL interface for BioMatrix analytics",
};

export default function AdminPage() {
  return <AIAgentClient />;
}
