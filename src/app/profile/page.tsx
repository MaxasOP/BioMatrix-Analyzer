import type { Metadata } from "next";
import ProfileClient from "./ProfileClient";

export const metadata: Metadata = {
  title: "User Profile & Cloud Workspace",
  description:
    "Manage your BioMatrix AI account. Sign in with secure passwordless OTP to save your sequence analysis workspace and sync history across devices.",
  alternates: {
    canonical: "/profile",
  },
  openGraph: {
    title: "User Profile & Cloud Workspace | BioMatrix AI",
    description:
      "Manage your BioMatrix AI account. Sign in with secure passwordless OTP to save your sequence analysis workspace and sync history across devices.",
    url: "/profile",
  },
  twitter: {
    title: "User Profile & Cloud Workspace | BioMatrix AI",
    description:
      "Manage your BioMatrix AI account. Sign in with secure passwordless OTP to save your sequence analysis workspace and sync history across devices.",
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}