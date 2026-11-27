import http from "node:http";
import { chromium } from "playwright-core";
import { chromeEjecutable, servir } from "./servir.mjs";

const puerto = 8796;
const origen = `http://127.0.0.1:${puerto}`;
const consulta = "?utm_source=a&utm_medium=b";
const errores = [];

function fallar(mensaje) {
  errores.push(mensaje);
}

function pedir(ruta, host = `127.0.0.1:${puerto}`) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "127.0.0.1", port: puerto, path: ruta, method: "GET", headers: { Host: host } },
      (res) => {
        const trozos = [];
        res.on("data", (trozo) => trozos.push(trozo));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: Buffer.concat(trozos).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function header(respuesta, nombre) {
  const valor = respuesta.headers[nombre.toLowerCase()];
  return Array.isArray(valor) ? valor.join(", ") : (valor ?? "");
}

function destinoBien(location, pathname, search) {
  if (!location) return false;
  const url = new URL(location);
  return url.pathname === pathname && url.search === search;
}

const claves = [
  "strict-transport-security",
  "content-security-policy",
  "x-frame-options",
  "x-content-type-options",
];

const servidor = await servir("dist", puerto);
const navegador = await chromium.launch({
  executablePath: await chromeEjecutable(),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const reglas = [
    ["/inicio", "/"],
    ["/erep", "/estabilizacion"],
    ["/erpa", "/residencia-puertas-abiertas"],
  ];
  for (const [ruta, destino] of reglas) {
    const primera = await pedir(`${ruta}${consulta}`);
    if (primera.status !== 301 || !destinoBien(header(primera, "location"), destino, consulta)) {
      fallar(`R6 ${ruta}: se esperaba 301 a ${destino} conservando ${consulta}`);
    }
    const final = await pedir(`${destino === "/" ? "/" : destino}${consulta}`);
    if (final.status !== 200) fallar(`R6 ${destino}: el destino debe responder 200`);
    const conBarra = await pedir(`${ruta}/${consulta}`);
    if (conBarra.status !== 308 || !destinoBien(header(conBarra, "location"), ruta, consulta)) {
      fallar(`R6 ${ruta}/: se esperaba 308 a la ruta sin barra, conservando la consulta`);
    }
  }

  const ausente = await pedir("/no-existe");
  if (ausente.status !== 404) fallar(`R7: se esperaba 404 y llegó ${ausente.status}`);
  for (const clave of claves) {
    if (!header(ausente, clave)) fallar(`R7: falta el encabezado ${clave} en la 404`);
  }
  if (header(ausente, "x-frame-options") !== "DENY") fallar("R7: X-Frame-Options debe ser DENY");
  if (header(ausente, "x-content-type-options") !== "nosniff") fallar("R7: falta nosniff");
  const pagina = await navegador.newPage();
  await pagina.goto(`${origen}/no-existe`, { waitUntil: "networkidle" });
  const cta = pagina.locator("a[href*='wa.me/'], a[href^='tel:']");
  if ((await cta.count()) < 1) fallar("R7: la 404 no muestra un CTA");
  await pagina.close();

  const inicio = await pedir("/");
  if (!inicio.body.includes('<meta name="robots" content="noindex">')) {
    fallar("R9: falta meta robots noindex");
  }
  const robots = await pedir("/robots.txt");
  if (!robots.body.includes("Disallow: /")) fallar("R9: robots.txt no lleva Disallow: /");
  const vista = await pedir("/", "x.vercel.app");
  if (header(vista, "x-robots-tag") !== "noindex") fallar("R9: Host x.vercel.app no envía X-Robots-Tag: noindex");
} catch (error) {
  fallar(error instanceof Error ? error.message : String(error));
} finally {
  await navegador.close();
  await new Promise((resolve) => servidor.close(resolve));
}

if (errores.length) {
  console.error(`Recorridos fallidos (${errores.length}):`);
  for (const error of errores) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Recorridos R6, R7 y R9 correctos. R1 a R5 y R8 quedan para los PRs siguientes.");
