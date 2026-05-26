import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiTarget = process.env.VITE_DEV_API_PROXY ?? "http://127.0.0.1:8000";

/** Keep the browser Host (localhost:5173) so OAuth session cookies match the callback URL. */
const proxyOpts = {
  target: apiTarget,
  changeOrigin: false,
  secure: false,
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": proxyOpts,
      "/auth": proxyOpts,
    },
  },
});
