import { resolve } from "node:path";
import { preact } from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite-plus";

const __dirname = import.meta.dirname;

export default defineConfig({
  base: process.env.NODE_ENV === "production" ? "/ayame-web-sdk/devtools/" : "/",
  envDir: resolve(__dirname, ".."),
  plugins: [preact(), tailwindcss()],
  publicDir: resolve(__dirname, "dist"),
  resolve: {
    alias: {
      "@open-ayame/ayame-web-sdk": resolve(__dirname, "../dist/ayame.mjs"),
    },
  },
  root: resolve(__dirname),
});
