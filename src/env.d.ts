/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_ADSENSE_CLIENT: string;
  readonly PUBLIC_LEMONSQUEEZY_CHECKOUT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
