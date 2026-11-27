// @ts-check
import { defineConfig } from "astro/config";
import { urlDelSitio } from "./scripts/sitio-url.mjs";

export default defineConfig({
  site: urlDelSitio(),
  trailingSlash: "never",
  compressHTML: true,
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
});
