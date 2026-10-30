import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rezerch Sequence Lab",
    short_name: "Rezerch",
    description:
      "DNA and RNA sequence analysis workbench for composition, translation, mutation detection, and interpretation.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6ff",
    theme_color: "#050D42",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
