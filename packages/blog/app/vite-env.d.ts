/// <reference types="vite/client" />

interface ImportMetaEnv {
  [x: string]: string;
  readonly VITE_API_URL: string;
  readonly VITE_SERVER_URL: string;
  readonly VITE_PORT: string;
  // 在此定义其他环境变量...
}
