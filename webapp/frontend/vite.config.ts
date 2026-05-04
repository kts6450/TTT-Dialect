import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // /api 호출은 FastAPI(8088)로 프록시 — CORS 우회
    proxy: {
      "/api": "http://localhost:8088",
    },
  },
});
