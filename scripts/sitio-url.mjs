/** URL canónica. AP-2026-11-26-10 fija https://app.mentalcareclinic.com en CI y en .env.example. */
export const URL_LOCAL = "http://127.0.0.1:43123";

export function urlDelSitio() {
  const valor = (process.env.PUBLIC_SITE_URL ?? "").trim().replace(/\/+$/, "");
  if (process.env.VERCEL_ENV === "production" && !valor) {
    console.error("Falta PUBLIC_SITE_URL en el build de producción.");
    process.exit(1);
  }
  return valor || URL_LOCAL;
}
