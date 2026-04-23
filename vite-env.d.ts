/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BOT_API: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}