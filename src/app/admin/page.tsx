import type { Metadata } from "next";
import AIAgentClient from "./AIAgentClient";

export const metadata: Metadata = {
  title: "Administrative Data Query Console",
  description: "Natural‑language to SQL interface for Rezerch analytics",
};

export default function AdminPage() {
  return <AIAgentClient />;
}
