import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

function sha256(texto) {
  return createHash("sha256").update(texto, "utf8").digest("base64");
}

function textoComoDom(valor) {
  return valor
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
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

function esJavaScript(atributos) {
  const tipo = atributos.match(/\btype\s*=\s*["']([^"']+)["']/i)?.[1]?.trim().toLowerCase() ?? "";
  if (!tipo) return true;
  return tipo === "module" || tipo === "text/javascript" || tipo === "application/javascript" || tipo === "text/ecmascript";
}

function bloques(html, etiqueta) {
  const expresion = new RegExp(`<${etiqueta}\\b([^>]*)>([\\s\\S]*?)</${etiqueta}>`, "gi");
  const salida = [];
  for (const coincidencia of html.matchAll(expresion)) {
    const atributos = coincidencia[1] ?? "";
    if (etiqueta === "script" && /\ssrc\s*=/.test(atributos)) continue;
    // El JSON-LD lleva la URL canónica. No se ejecuta: no entra en el hash,
    // para que la CSP no cambie al cambiar PUBLIC_SITE_URL.
    if (etiqueta === "script" && !esJavaScript(atributos)) continue;
    const cuerpo = textoComoDom(coincidencia[2] ?? "");
    if (cuerpo.trim()) salida.push(cuerpo);
  }
  return salida;
}

export function politicaCsp(scripts, estilos) {
  const hashesScript = [...scripts].map((hash) => `'sha256-${hash}'`).join(" ");
  const hashesEstilo = [...estilos].map((hash) => `'sha256-${hash}'`).join(" ");
  return [
    "default-src 'self'",
    `script-src 'self' https://www.googletagmanager.com ${hashesScript}`,
    `style-src 'self' ${hashesEstilo}`,
    "img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://www.googletagmanager.com",
    "font-src 'self'",
    "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.googletagmanager.com",
    // El diseño pide frame-src 'none'. El código abre un iframe de Google Maps
    // (src/scripts/consent.ts, «Mostrar mapa»). Sin estos orígenes el mapa no se ve.
    "frame-src https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "frame-ancestors 'none'",
    "worker-src 'none'",
  ].join("; ");
}

export async function calcularPolitica(directorio) {
  const htmls = (await walk(directorio)).filter((archivo) => archivo.endsWith(".html"));
  const scripts = new Set();
  const estilos = new Set();
  for (const archivo of htmls) {
    const html = await readFile(archivo, "utf8");
    for (const bloque of bloques(html, "script")) scripts.add(sha256(bloque));
    for (const bloque of bloques(html, "style")) estilos.add(sha256(bloque));
  }
  if (!scripts.size || !estilos.size) {
    throw new Error(`No hay scripts o estilos en ${directorio} para firmar la CSP`);
  }
  const politica = politicaCsp(scripts, estilos);
  if (politica.includes("unsafe-eval") || politica.includes("unsafe-inline")) {
    throw new Error("La CSP no debe usar unsafe-eval ni unsafe-inline");
  }
  return politica;
}

function leerPolitica(json) {
  for (const regla of json.headers ?? []) {
    for (const encabezado of regla.headers ?? []) {
      if (encabezado.key === "Content-Security-Policy") return encabezado.value;
    }
  }
  return "";
}

export async function escribirVercelJson(politica) {
  const archivo = path.resolve("vercel.json");
  const json = JSON.parse(await readFile(archivo, "utf8"));
  let encontrado = false;
  for (const regla of json.headers ?? []) {
    for (const encabezado of regla.headers ?? []) {
      if (encabezado.key === "Content-Security-Policy") {
        encabezado.value = politica;
        encontrado = true;
      }
    }
  }
  if (!encontrado) throw new Error("vercel.json no tiene Content-Security-Policy");
  await writeFile(archivo, `${JSON.stringify(json, null, 2)}\n`);
}

async function main() {
  const politica = await calcularPolitica(path.resolve("dist"));
  if (process.argv.includes("--check")) {
    const json = JSON.parse(await readFile(path.resolve("vercel.json"), "utf8"));
    if (leerPolitica(json) !== politica) {
      console.error("La CSP de vercel.json no coincide con dist. Corre npm run csp y sube vercel.json.");
      process.exit(1);
    }
    console.log("CSP de vercel.json coincide con dist.");
    return;
  }
  await escribirVercelJson(politica);
  console.log("CSP escrita en vercel.json.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
