import { resolve } from "node:path";
import { defineConfig } from "vite-plus";
import dts from "vite-plugin-dts";
import pkg from "./package.json" with { type: "json" };

const __dirname = import.meta.dirname;

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
    minify: "oxc",
    outDir: resolve(__dirname, "./dist"),
    rolldownOptions: {
      output: {
        // 本来不要なはず
        banner: banner,
        entryFileNames: "ayame.js",
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
  // vp 0.2.x 以降、lint/fmt の設定はワークスペースルートのこのファイルで一元管理される。
  // devtools のソースもここで対象に含め、ビルド出力のみ除外する。
  lint: {
    ignorePatterns: ["dist/**", "devtools/dist/**", "tests/**", ".claude/**", ".codex/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    ignorePatterns: ["dist/**", "devtools/dist/**", ".claude/**", ".codex/**"],
  },
});
