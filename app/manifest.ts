import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: site.title,
    short_name: "Bidcraft",
    lang: "en-ZA",
    description: site.description,
    start_url: "/#workspace",
    scope: "/",
    display: "standalone",
    background_color: "#F8F6EF",
    theme_color: "#101714",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
