import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/InvestmentDashboard/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "dist",
    cssCodeSplit: true,
    rollupOptions: {
      external: [], // Remove external configuration
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "index.css") return "assets/[name][extname]";
          return "assets/[name]-[hash][extname]";
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
      },
    },
  },
});
