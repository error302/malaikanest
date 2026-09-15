import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served by Django at /static/adminapp/ — fixed filenames so the Django
// shell template can reference them without reading the build manifest.
export default defineConfig({
  plugins: [react()],
  base: "/static/adminapp/",
  build: {
    outDir: "../static/adminapp",
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: "assets/admin.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/admin.[ext]",
      },
    },
  },
  server: {
    port: 5175,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
