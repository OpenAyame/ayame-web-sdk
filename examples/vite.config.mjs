import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// root が examples なので examples/dist にビルドされる

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
        sendrecv: resolve(__dirname, 'sendrecv/index.html'),
        sendonly: resolve(__dirname, 'sendonly/index.html'),
        recvonly: resolve(__dirname, 'recvonly/index.html'),
      },
    },
  },
  envDir: resolve(__dirname, '..'),
})
