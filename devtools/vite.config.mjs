import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? "/ayame-web-sdk/devtools/" : "/",
  root: resolve(__dirname),
  dist: resolve(__dirname, "dist"),
  resolve: {
    alias: {
      "@open-ayame/ayame-web-sdk": resolve(__dirname, "../dist/ayame.mjs"),
    },
  },
  envDir: resolve(__dirname, ".."),
});
