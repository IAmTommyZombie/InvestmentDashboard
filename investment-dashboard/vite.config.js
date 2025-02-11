// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/investment-dashboard/",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3500",
        changeOrigin: true,
        secure: false,
      },
    },
    hmr: {
      overlay: false,
      timeout: 30000,
    },
  },
});
