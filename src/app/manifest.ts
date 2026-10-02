import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "잡로그",
    short_name: "잡로그",
    description: "햄스터랑 같이 모으는 나의 취업 기록",
    start_url: "/",
    display: "standalone",
    background_color: "#fffcf7",
    theme_color: "#fffcf7",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
