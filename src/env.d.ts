/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA4_ID?: string;
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_INDEXAR?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const process: {
  env: Record<string, string | undefined>;
};
