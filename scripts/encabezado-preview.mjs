import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MARCA = "X-Robots-Tag: noindex";

/**
 * Añade el noindex de la vista previa sin tocar los encabezados de seguridad.
 * @param {string} headers
 */
export function conRobots(headers) {
  if (headers.includes("X-Robots-Tag:")) return headers;
  const salto = headers.endsWith("\n") ? "" : "\n";
  return `${headers}${salto}\n/*\n  ${MARCA}\n`;
}

async function main() {
  const archivo = path.resolve("dist/_headers");
  const cuerpo = await readFile(archivo, "utf8");
  if (process.env.PREVIEW === "1") {
    if (!cuerpo.includes(MARCA)) await writeFile(archivo, conRobots(cuerpo));
    return;
  }
  if (cuerpo.includes("X-Robots-Tag")) {
    console.error("El build de producción no debe llevar X-Robots-Tag en dist/_headers");
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  await main();
}
