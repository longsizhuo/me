import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  assetsInclude: ["**/*.HEIC", "**/*.heic"],
  server: {
    host: "0.0.0.0", // 监听所有IP地址
    port: 5173, // 可选：设置你希望的端口
  },
});
