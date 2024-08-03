import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // 监听所有IP地址
    port: 5173, // 可选：设置你希望的端口
  }
});
