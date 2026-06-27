/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ADSENSE_CLIENT: string;
  readonly PUBLIC_GA_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
