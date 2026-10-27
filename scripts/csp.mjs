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

function bloques(html, etiqueta) {
  const expresion = new RegExp(`<${etiqueta}\\b([^>]*)>([\\s\\S]*?)</${etiqueta}>`, "gi");
  const salida = [];
  for (const coincidencia of html.matchAll(expresion)) {
    const atributos = coincidencia[1] ?? "";
    if (etiqueta === "script" && /\ssrc\s*=/.test(atributos)) continue;
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
    "frame-src https://www.google.com https://maps.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
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

export async function escribirPolitica(directorio, politica) {
  const archivo = path.join(directorio, "_headers");
  const cuerpo = await readFile(archivo, "utf8");
  const sin = cuerpo.replace(/^[ \t]*Content-Security-Policy:.*\n?/m, "");
  const base = sin.endsWith("\n") ? sin : `${sin}\n`;
  await writeFile(archivo, `${base}  Content-Security-Policy: ${politica}\n`);
}

export async function escribirModulo(politica) {
  const destino = path.resolve("worker/csp-valor.mjs");
  const contenido = `/* Generado por scripts/csp.mjs a partir del HTML de dist. */\nexport const politicaCsp = ${JSON.stringify(politica)};\n`;
  await writeFile(destino, contenido);
}

async function main() {
  const directorio = path.resolve("dist");
  const politica = await calcularPolitica(directorio);
  await escribirPolitica(directorio, politica);
  await escribirModulo(politica);
  console.log("CSP escrita en dist/_headers y worker/csp-valor.mjs.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
