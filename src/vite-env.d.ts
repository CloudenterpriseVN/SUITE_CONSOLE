/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  // optional envs
  readonly VITE_SOME_FLAG?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// asset modules (tuỳ dự án bạn có thể mở rộng)
declare module '*.svg' {
  const src: string
  export default src
}
declare module '*.png'
declare module '*.jpg'
declare module '*.css'