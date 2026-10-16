import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "রক্তবন্ধু — কাছের রক্তদাতা খুঁজুন",
    short_name: "রক্তবন্ধু",
    description: "লোকেশন অনুযায়ী কাছের রক্তদাতা খুঁজুন",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#dc2626",
    lang: "bn",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
