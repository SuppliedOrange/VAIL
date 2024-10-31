/// <reference types="vite/client" />
interface ImportMetaEnv {
    readonly VITE_WEBSERVER_ENDPOINT: string
    readonly VITE_DIAMNET_MODE: string
}
interface ImportMeta {
    readonly env: ImportMetaEnv
}