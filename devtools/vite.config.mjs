import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@open-ayame/ayame-web-sdk': resolve(__dirname, '../dist/ayame.mjs'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
      },
    },
  },
  envDir: resolve(__dirname, '..'),
})
