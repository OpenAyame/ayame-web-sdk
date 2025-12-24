import { resolve } from "node:path";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact(), tailwindcss()],
  base: process.env.NODE_ENV === "production" ? "/ayame-web-sdk/devtools/" : "/",
  root: resolve(__dirname),
  publicDir: resolve(__dirname, "dist"),
  resolve: {
    alias: {
      "@open-ayame/ayame-web-sdk": resolve(__dirname, "../dist/ayame.mjs"),
    },
  },
  envDir: resolve(__dirname, ".."),
});
