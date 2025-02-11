import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/InvestmentDashboard/",
  plugins: [react(), tailwindcss()], // Remove tailwindcss from plugins
  resolve: {
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@radix-ui/react-dialog",
        "@radix-ui/react-slot",
      ],
    },
  },
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
