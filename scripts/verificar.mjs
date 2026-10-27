import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

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
if (joined.includes("/aviso-de-privacidad")) fail("Quedó un enlace al aviso de privacidad");

const redirects = await readFile("public/_redirects", "utf8");
for (const line of redirects.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const parts = trimmed.split(/\s+/);
  if (parts.length < 3 || parts.at(-1) !== "301") fail(`Redirección mal formada: ${trimmed}`);
  const target = parts[1];
  const candidates = resolveInternal(target);
  const list = Array.isArray(candidates) ? candidates : [candidates];
  const ok = await Promise.all(list.map((item) => exists(item)));
  if (!ok.some(Boolean)) fail(`_redirects apunta a ${target}, que no está en dist`);
}

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
