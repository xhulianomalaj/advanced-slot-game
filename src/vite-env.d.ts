/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MODULE_PATH: string
  readonly VITE_GAME_NAME: string
  readonly VITE_ASSETS_BASE_PATH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
