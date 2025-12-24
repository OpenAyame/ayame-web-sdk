/// <reference types="vite/client" />

interface ImportMetaEnv {
  VITE_AYAME_SIGNALING_URL: string;
  VITE_AYAME_ROOM_ID_PREFIX: string;
  VITE_AYAME_ROOM_NAME: string;
  VITE_AYAME_SIGNALING_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
