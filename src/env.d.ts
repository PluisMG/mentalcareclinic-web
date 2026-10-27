/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GA4_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare const process: {
  env: Record<string, string | undefined>;
};
