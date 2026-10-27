import { readFile } from "node:fs/promises";
import { build } from "astro";
import { chromium } from "playwright-core";
import { calcularPolitica, escribirPolitica } from "./csp.mjs";
import { chromeEjecutable, servir } from "./servir.mjs";

const id = "G-TEST1234";
const puerto = 8795;
const origen = `http://127.0.0.1:${puerto}`;
const google = /googletagmanager|google-analytics|analytics\.google|doubleclick|google\.com\/ccm/i;

function esGoogle(url) {
  return google.test(url);
}

const produccion = await readFile("dist/index.html", "utf8");
if (produccion.includes('id="consent"') || produccion.includes("data-ga4=")) {
  console.error("El dist de producción incluye analítica sin PUBLIC_GA4_ID");
  process.exit(1);
}
if (produccion.includes("facebook.net") || produccion.includes("fbevents")) {
  console.error("El dist incluye el píxel de Meta");
  process.exit(1);
}

process.env.PUBLIC_GA4_ID = id;
delete process.env.PREVIEW;
await build({ outDir: "dist-analitica", logLevel: "error" });
await escribirPolitica("dist-analitica", await calcularPolitica("dist-analitica"));

const servidor = await servir("dist-analitica", puerto);
const navegador = await chromium.launch({
  executablePath: await chromeEjecutable(),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errores = [];
function fallar(mensaje) {
  errores.push(mensaje);
}

async function preparar(pagina) {
  await pagina.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (evento) => {
      window.__csp.push(`${evento.violatedDirective} ${evento.blockedURI}`);
    });
    window.addEventListener(
      "click",
      (evento) => {
        const nodo = evento.target instanceof Element ? evento.target.closest("a") : null;
        if (!(nodo instanceof HTMLAnchorElement)) return;
        const href = nodo.href;
        if (href.startsWith("tel:") || href.includes("wa.me/") || href.includes("api.whatsapp.com/")) {
          evento.preventDefault();
        }
      },
      true,
    );
  });
}

function textoDe(peticion) {
  return `${peticion.url()}\n${peticion.postData() ?? ""}`;
}

async function esperarPeticion(pagina, coincide, accion) {
  const espera = pagina.waitForRequest(coincide, { timeout: 15000 });
  const asentado = espera.then(
    (peticion) => peticion,
    (error) => error,
  );
  await accion();
  const resultado = await asentado;
  if (resultado instanceof Error) throw resultado;
  return resultado;
}

try {
  const aceptar = await navegador.newPage({ viewport: { width: 1280, height: 800 } });
  const peticiones = [];
  aceptar.on("request", (peticion) => peticiones.push(peticion.url()));
  await preparar(aceptar);
  await aceptar.goto(`${origen}/`, { waitUntil: "networkidle" });
  await aceptar.locator("#consent-accept").waitFor({ state: "visible" });
  if (peticiones.some((url) => esGoogle(url))) fallar("Sin consentimiento ya hubo una petición a Google");
  await aceptar.locator("footer a[href^='tel:']").first().click({ noWaitAfter: true });
  await aceptar.waitForTimeout(400);
  if (peticiones.some((url) => esGoogle(url))) fallar("Un clic de teléfono sin consentimiento llamó a Google");

  await esperarPeticion(
    aceptar,
    (peticion) => peticion.url().includes("googletagmanager.com/gtag/js"),
    () => aceptar.locator("#consent-accept").click(),
  );
  await aceptar.waitForRequest((peticion) => peticion.url().includes("/g/collect"), { timeout: 15000 });

  const ordenes = await aceptar.evaluate(() =>
    (window.dataLayer ?? []).map((item) => {
      const lista = item != null && typeof item === "object" && "length" in item ? Array.from(item) : [item];
      return lista.map((parte) => {
        try {
          return JSON.stringify(parte) ?? String(parte);
        } catch {
          return String(parte);
        }
      });
    }),
  );
  const plano = ordenes.flat().join(" ");
  if (!plano.includes('"analytics_storage":"granted"')) fallar("Tras aceptar no se concede analytics_storage");
  if (!plano.includes('"ad_storage":"denied"') || !plano.includes('"ad_user_data":"denied"')) {
    fallar("La publicidad no permanece denegada");
  }
  if (!plano.includes('"allow_google_signals":false')) fallar("allow_google_signals no está en false");

  await esperarPeticion(
    aceptar,
    (peticion) => textoDe(peticion).includes("contacto_llamada"),
    () => aceptar.locator("footer a[href^='tel:']").first().click({ noWaitAfter: true }),
  );
  await aceptar.setViewportSize({ width: 390, height: 844 });
  await esperarPeticion(
    aceptar,
    (peticion) => textoDe(peticion).includes("contacto_whatsapp"),
    () => aceptar.locator("a.float").click({ noWaitAfter: true }),
  );

  const csp = await aceptar.evaluate(() => window.__csp);
  if (csp.length) fallar(`La CSP bloqueó recursos: ${csp.join(" | ")}`);
  await aceptar.close();

  const rechazar = await navegador.newPage({ viewport: { width: 390, height: 844 } });
  const silenciosas = [];
  rechazar.on("request", (peticion) => silenciosas.push(peticion.url()));
  await preparar(rechazar);
  await rechazar.goto(`${origen}/contacto`, { waitUntil: "networkidle" });
  await rechazar.locator("#consent-reject").click();
  const decision = await rechazar.evaluate(() => localStorage.getItem("mcc-cookies"));
  if (decision !== "rechazada") fallar(`La decisión no se recordó: ${decision}`);
  await rechazar.locator("#cookie-prefs").click();
  if ((await rechazar.locator("#consent").getAttribute("hidden")) !== null) {
    fallar("El pie no vuelve a mostrar el aviso");
  }
  await rechazar.locator("#consent-reject").click();
  await rechazar.locator("footer a[href^='tel:']").click({ noWaitAfter: true });
  await rechazar.locator("a.float").click({ noWaitAfter: true });
  await rechazar.waitForTimeout(500);
  if (silenciosas.some((url) => esGoogle(url))) fallar("Rechazar igual cargó Google");
  await rechazar.close();
} catch (error) {
  fallar(error instanceof Error ? error.stack || error.message : String(error));
} finally {
  await navegador.close();
  await new Promise((resolve) => servidor.close(resolve));
}

if (errores.length) {
  console.error(`Analítica fallida (${errores.length}):`);
  for (const error of errores) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Analítica correcta: sin consentimiento no hay Google; al aceptar cargan gtag y los dos eventos.");
