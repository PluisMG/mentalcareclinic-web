// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://www.mentalcareclinic.com",
  trailingSlash: "never",
  compressHTML: true,
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
  redirects: {
    "/inicio": "/",
    "/erpa": "/residencia-puertas-abiertas",
    "/erep": "/estabilizacion",
  },
});
