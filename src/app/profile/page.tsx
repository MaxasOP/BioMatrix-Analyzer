import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "User Profile & Cloud Workspace",
  description:
    "Manage your Rezerch Sequence Lab account and saved analysis archive.",
  alternates: {
    canonical: "/profile",
  },
  openGraph: {
    title: "Research Account | Rezerch Sequence Lab",
    description:
      "Manage your Rezerch Sequence Lab account and saved analysis archive.",
    url: "/profile",
  },
  twitter: {
    title: "Research Account | Rezerch Sequence Lab",
    description:
      "Manage your Rezerch Sequence Lab account and saved analysis archive.",
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
