import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { redirecciones } from "../worker/redirects.mjs";

const root = path.resolve("dist");
const errors = [];

function fail(message) {
  errors.push(message);
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else files.push(full);
  }
  return files;
}

function resolveInternal(href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean || clean === "/") return path.join(root, "index.html");
  const rel = clean.replace(/^\//, "");
  return [path.join(root, rel, "index.html"), path.join(root, rel), path.join(root, `${rel}.html`)];
}

async function exists(file) {
  try {
    const info = await stat(file);
    return info.isFile();
  } catch {
    return false;
  }
}

const files = (await walk(root)).filter((file) => file.endsWith(".html"));
const htmlFiles = new Map();

for (const file of files) {
  htmlFiles.set(file, await readFile(file, "utf8"));
}

const pageFiles = [];

for (const [file, html] of htmlFiles) {
  const isRedirect = /http-equiv="refresh"/i.test(html) || /<meta http-equiv=.refresh/i.test(html);
  if (isRedirect) {
    const target = html.match(/url=([^"'>\s]+)/i)?.[1];
    if (!target?.startsWith("/")) fail(`${file}: redirección sin destino interno`);
    else {
      const candidates = resolveInternal(target);
      const list = Array.isArray(candidates) ? candidates : [candidates];
      const ok = await Promise.all(list.map((item) => exists(item)));
      if (!ok.some(Boolean)) fail(`${file}: la redirección apunta a ${target}, que no existe`);
    }
    continue;
  }

  pageFiles.push(file);
  const h1 = html.match(/<h1\b/gi) || [];
  if (h1.length !== 1) fail(`${file}: se esperaba un h1 y hay ${h1.length}`);
  if (!html.includes('lang="es-MX"')) fail(`${file}: falta lang="es-MX"`);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  if (!canonical?.startsWith("https://www.mentalcareclinic.com")) {
    fail(`${file}: canónica inválida (${canonical ?? "ausente"})`);
  }
  if (!/<meta name="description" content="[^"]{40,}"/.test(html)) {
    fail(`${file}: falta meta description`);
  }
  if (!html.includes('"@type":"MedicalClinic"')) fail(`${file}: falta JSON-LD MedicalClinic`);
  if (html.includes("MedicalBusiness")) fail(`${file}: JSON-LD no debe incluir MedicalBusiness`);
  if (html.includes("/aviso-de-privacidad")) fail(`${file}: el aviso de privacidad no se publica`);
  if (!html.includes('property="og:image:width" content="1200"')) {
    fail(`${file}: falta og:image:width 1200`);
  }
  if (!html.includes('property="og:image:height" content="630"')) {
    fail(`${file}: falta og:image:height 630`);
  }
  const alts = [...html.matchAll(/<img\b[^>]*>/gi)];
  for (const match of alts) {
    const tag = match[0];
    if (!/\balt="[^"]+"/.test(tag)) fail(`${file}: imagen sin alt: ${tag.slice(0, 140)}`);
  }
  const links = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const link of links) {
    if (link.startsWith("mailto:") || link.startsWith("tel:") || link.startsWith("data:")) continue;
    if (/^https?:\/\//.test(link)) {
      if (link.includes("wa.me/") && !link.includes("wa.me/529611003707")) {
        fail(`${file}: WhatsApp sin 52: ${link}`);
      }
      continue;
    }
    if (link.startsWith("#")) {
      const id = link.slice(1);
      if (id && !html.includes(`id="${id}"`)) fail(`${file}: ancla rota ${link}`);
      continue;
    }
    if (!link.startsWith("/")) continue;
    const hash = link.includes("#") ? link.slice(link.indexOf("#") + 1) : "";
    const candidates = resolveInternal(link);
    const list = Array.isArray(candidates) ? candidates : [candidates];
    const found = [];
    for (const candidate of list) {
      if (await exists(candidate)) found.push(candidate);
    }
    if (!found.length) fail(`${file}: enlace roto ${link}`);
    else if (hash) {
      const targetHtml = htmlFiles.get(found[0]) ?? (await readFile(found[0], "utf8"));
      htmlFiles.set(found[0], targetHtml);
      if (!targetHtml.includes(`id="${hash}"`)) fail(`${file}: ancla rota ${link}`);
    }
  }
}

const forbidden = [
  "autonocimiento",
  "Y debajo:",
  "Más adelante puedes agregar",
  "Esta carpeta es informativa",
  "wa.me/9611003707",
];
const joined = [...htmlFiles.values()].join("\n");
for (const text of forbidden) {
  if (joined.includes(text)) fail(`Aparece texto que debía eliminarse: ${text}`);
}

const textExt = new Set([".html", ".txt", ".xml", ".svg", ".js", ".css", ".json", ".mjs"]);
const distFiles = await walk(root);
for (const file of distFiles) {
  const base = path.basename(file);
  const ext = path.extname(file);
  if (base !== "_headers" && base !== "_redirects" && !textExt.has(ext)) continue;
  const body = await readFile(file, "utf8");
  for (const marker of ["[POR CONFIRMAR", "Dato pendiente", "[REVISAR CON ABOGADO", "{{"]) {
    if (body.includes(marker)) fail(`${file}: contiene «${marker}»`);
  }
  if (body.toLowerCase().includes("casa de medio camino")) {
    fail(`${file}: menciona casa de medio camino sin aprobación`);
  }
}
if (joined.includes("Lee la historia")) fail("Quedó el texto «Lee la historia»");
if (joined.includes("El número del predio")) fail("Quedó la nota interna del mapa");
if (joined.includes("facebook.net") || joined.includes("fbq(") || joined.includes("fbevents")) {
  fail("Quedó el píxel de Meta");
}
if (joined.includes('id="consent"') || joined.includes("data-ga4=")) {
  fail("Sin PUBLIC_GA4_ID no debe haber aviso ni identificador de analítica");
}
if (joined.includes("/aviso-de-privacidad")) fail("Quedó un enlace al aviso de privacidad");

for (const archivo of ["public/_redirects", path.join(root, "_redirects")]) {
  if (!(await exists(archivo))) {
    fail(`Falta ${archivo}: el comentario debe decir que el Worker conserva el query string`);
    continue;
  }
  const texto = await readFile(archivo, "utf8");
  if (!/El Worker es el que responde 301 y conserva el query string/.test(texto)) {
    fail(`${archivo}: el comentario no dice que el Worker conserva el query string`);
  }
  const reglas = texto.split("\n").filter((linea) => linea.trim() && !linea.trim().startsWith("#"));
  if (reglas.length) fail(`${archivo}: no debe declarar redirecciones, solo el comentario`);
}
for (const { origen, destino } of redirecciones) {
  if (!origen.startsWith("/") || !destino.startsWith("/")) fail(`Ruta de redirección inválida: ${origen} → ${destino}`);
  const candidates = resolveInternal(destino);
  const list = Array.isArray(candidates) ? candidates : [candidates];
  const ok = await Promise.all(list.map((item) => exists(item)));
  if (!ok.some(Boolean)) fail(`${origen} apunta a ${destino}, que no está en dist`);
}
const config = JSON.parse(
  (await readFile("wrangler.jsonc", "utf8")).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, ""),
);
if (config.assets?.run_worker_first !== true) {
  fail("run_worker_first debe ser true para que /ERPA, /Erep y /INICIO lleguen al Worker");
}
if (config.assets?.directory !== "./dist" || config.assets?.binding !== "ASSETS") {
  fail("Los assets deben usar directory ./dist y binding ASSETS");
}
if (config.assets?.html_handling !== "drop-trailing-slash" || config.assets?.not_found_handling !== "404-page") {
  fail("html_handling o not_found_handling no coinciden con el sitio");
}
if (config.name !== "mentalcareclinic") fail("El nombre del Worker debe seguir siendo neutro");
if ("account_id" in config || "routes" in config || "route" in config) {
  fail("wrangler.jsonc no debe traer account_id ni routes");
}
if (config.workers_dev !== false) fail("workers_dev debe quedar en false: no hay dominio");
if (config.vars?.PREVIEW === "1") fail("PREVIEW=1 no puede quedar fijo en wrangler.jsonc");
const headersPublicos = await readFile("public/_headers", "utf8");
if (headersPublicos.includes("X-Robots-Tag")) fail("public/_headers no debe llevar X-Robots-Tag");

const sitemapPath = path.join(root, "sitemap.xml");
if (!(await exists(sitemapPath))) fail("Falta dist/sitemap.xml");
else {
  const sitemap = await readFile(sitemapPath, "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  if (locs.length !== 6) fail(`sitemap.xml tiene ${locs.length} URLs; se esperaban 6`);
  if (sitemap.includes("aviso-de-privacidad")) fail("sitemap incluye el aviso de privacidad");
  for (const loc of locs) {
    if (!loc.startsWith("https://www.mentalcareclinic.com")) fail(`URL de sitemap inesperada: ${loc}`);
    const pathname = new URL(loc).pathname;
    const candidates = resolveInternal(pathname);
    const list = Array.isArray(candidates) ? candidates : [candidates];
    const ok = await Promise.all(list.map((item) => exists(item)));
    if (!ok.some(Boolean)) fail(`sitemap apunta a una ruta sin HTML: ${loc}`);
  }
}

const robots = await readFile(path.join(root, "robots.txt"), "utf8");
const esPreview = robots.includes("Disallow: /") && !robots.includes("Allow: /");
if (esPreview) {
  for (const file of pageFiles) {
    const html = htmlFiles.get(file);
    if (!html?.includes('<meta name="robots" content="noindex">')) {
      fail(`${file}: la vista previa debe llevar meta robots noindex`);
    }
  }
} else if (!robots.includes("Sitemap: https://www.mentalcareclinic.com/sitemap.xml")) {
  fail("robots.txt no declara el sitemap");
}
const headersDist = await readFile(path.join(root, "_headers"), "utf8");
const csp = headersDist.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1] ?? "";
if (!csp.includes("script-src") || !csp.includes("frame-src https://www.google.com")) {
  fail("Falta la Content-Security-Policy en dist/_headers");
}
if (csp.includes("unsafe-eval") || csp.includes("unsafe-inline")) {
  fail("La CSP no debe usar unsafe-eval ni unsafe-inline");
}
if (esPreview) {
  if (!headersDist.includes("X-Robots-Tag: noindex")) {
    fail("La vista previa debe añadir X-Robots-Tag: noindex en dist/_headers");
  }
} else if (headersDist.includes("X-Robots-Tag")) {
  fail("dist/_headers de producción no debe llevar X-Robots-Tag");
}

const altPatio =
  "Sesión grupal en el patio de MentalCareClinic, con los rostros de los residentes difuminados";
if (!joined.includes(altPatio)) fail("Falta la foto de la sesión grupal con rostros difuminados");
if (joined.includes("no-publicar") || joined.includes("caras reconocibles")) {
  fail("Quedó texto que trata la foto grupal como no publicable");
}

if (!joined.includes("529611003707")) fail("No aparece el WhatsApp con 52");
if (!joined.includes("tel:+529613692795")) fail("No aparece el teléfono de llamada");

if (errors.length) {
  console.error(`Verificación fallida (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Verificación correcta: ${pageFiles.length} páginas HTML, redirecciones, sitemap y marcadores.`);
