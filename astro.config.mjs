// @ts-check
import { defineConfig } from "astro/config";
import { redirecciones } from "./worker/redirects.mjs";

export default defineConfig({
  site: "https://www.mentalcareclinic.com",
  trailingSlash: "never",
  compressHTML: true,
  build: {
    format: "directory",
    inlineStylesheets: "always",
  },
  // El 301 que conserva el query string lo hace el Worker. Esto solo deja el HTML de respaldo en `astro preview`.
  redirects: Object.fromEntries(redirecciones.map((regla) => [regla.origen, regla.destino])),
});
