import { resolve } from "node:path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import pkg from "./package.json";

const banner = `/**
 * ${pkg.name}
 * ${pkg.description}
 * @version: ${pkg.version}
 * @author: ${pkg.author}
 * @license: ${pkg.license}
 **/
`;
export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, "src/ayame.ts"),
      fileName: "ayame",
      formats: ["es"],
      name: "Ayame",
    },
    manifest: true,
    minify: "esbuild",
    outDir: resolve(__dirname, "./dist"),
    rollupOptions: {
      output: {
        // 本来不要なはず
        banner: banner,
        entryFileNames: "ayame.mjs",
      },
    },
    target: "es2023",
  },
  define: {
    __AYAME_WEB_SDK_VERSION__: JSON.stringify(pkg.version),
  },
  envDir: resolve(__dirname, "./"),
  plugins: [
    dts({
      copyDtsFiles: true,
      include: ["src/**/*"],
    }),
  ],
  root: resolve(__dirname, "./"),
});
