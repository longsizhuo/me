import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.HEIC", "**/*.heic"],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("three") || id.includes("@react-three") || id.includes("maath")) {
            return "vendor-three";
          }
          if (id.includes("@mui") || id.includes("@emotion")) {
            return "vendor-mui";
          }
          if (id.includes("node_modules/motion")) {
            return "vendor-motion";
          }
        },
      },
    },
  },
});
