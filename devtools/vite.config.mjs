import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: resolve(__dirname),
  resolve: {
    alias: {
      '@open-ayame/ayame-web-sdk': resolve(__dirname, '../dist/ayame.mjs'),
    },
  },
  envDir: resolve(__dirname, '..'),
})
