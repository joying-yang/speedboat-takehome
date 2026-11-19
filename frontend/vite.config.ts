import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Read secrets from the repository-level .env without exposing them through
  // VITE_* variables. The browser talks to /api; only this dev proxy adds auth.
  const env = loadEnv(mode, "..", "");
  // Docker/Railway can provide a container-network target without overriding
  // PARASAIL_BASE_URL, whose localhost default is correct for host-side dev.
  const target = process.env.PARASAIL_PROXY_TARGET
    ?? process.env.PARASAIL_BASE_URL
    ?? env.PARASAIL_BASE_URL
    ?? "http://localhost:3001";
  const apiKey = process.env.PARASAIL_API_KEY ?? env.PARASAIL_API_KEY ?? "psk-mock-mockkey";

  return {
    plugins: [react()],
    envDir: "..",
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
  };
});
