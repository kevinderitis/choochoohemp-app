import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { VitePWA } from "vite-plugin-pwa";

const rootDir = new URL(".", import.meta.url).pathname;

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png"],
      manifest: {
        name: "Choo Choo Hemp",
        short_name: "Choo Choo",
        description: "Premium cannabis club catalog and delivery ordering PWA.",
        theme_color: "#08110d",
        background_color: "#08110d",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
        navigateFallback: "/index.html"
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@shared": path.resolve(rootDir, "../../packages/shared/src")
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5001",
      "/uploads": "http://localhost:5001"
    }
  }
});
