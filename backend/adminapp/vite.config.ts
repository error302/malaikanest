import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Django serves Vite's generated index, so hashed assets work without a second server.
export default defineConfig({
  plugins: [react()],
  base: "/static/adminapp/",
  build: { outDir: "../static/adminapp", emptyOutDir: true },
  server: { port: 5175, host: "127.0.0.1", proxy: { "/api": "http://127.0.0.1:8000" } },
});
