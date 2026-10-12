import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wayfarer — Your personal map of the world",
    short_name: "Wayfarer",
    description:
      "A personal travel journal: track the places you have been, your trips, memories, and stats.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e1a24",
    theme_color: "#0e1a24",
    icons: [
      {
        src: "/icon-512.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
