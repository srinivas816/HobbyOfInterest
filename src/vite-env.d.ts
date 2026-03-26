/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Set to "1" or "true" for instructor-first MVP navigation and simplified surfaces */
  readonly VITE_MVP_INSTRUCTOR_FOCUS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
