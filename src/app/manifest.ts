import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BioMatrix AI",
    short_name: "BioMatrix",
    description:
      "Bioinformatics platform for sequence analysis, mutation detection, and AI explanations.",
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
