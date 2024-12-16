/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_AYAME_SIGNALING_URL: string
  VITE_AYAME_ROOM_ID: string
  VITE_AYAME_CLIENT_ID: string
  VITE_AYAME_SIGNALING_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
