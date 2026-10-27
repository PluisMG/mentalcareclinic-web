import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const tipos = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".mjs", "text/javascript; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".xml", "application/xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".ico", "image/x-icon"],
]);

export function encabezadosBase(texto) {
  const pares = [];
  let activo = false;
  for (const linea of texto.split("\n")) {
    if (!linea.trim() || linea.trim().startsWith("#")) continue;
    if (!linea.startsWith(" ") && !linea.startsWith("\t")) {
      activo = linea.trim() === "/*";
      continue;
    }
    if (!activo) continue;
    const coincidencia = linea.match(/^\s+([^:\s][^:]*):\s*(.*?)\s*$/);
    if (coincidencia) pares.push([coincidencia[1], coincidencia[2]]);
  }
  return pares;
}

async function existe(archivo) {
  try {
    const info = await stat(archivo);
    return info.isFile();
  } catch {
    return false;
  }
}

export async function servir(raiz, puerto) {
  const encabezados = encabezadosBase(await readFile(path.join(raiz, "_headers"), "utf8"));
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    let ruta = decodeURIComponent(url.pathname);
    if (ruta.includes("\0") || ruta.includes("..")) {
      res.writeHead(400);
      res.end();
      return;
    }
    const candidatos = [];
    if (ruta.endsWith("/")) candidatos.push(path.join(raiz, ruta, "index.html"));
    else {
      candidatos.push(path.join(raiz, ruta));
      candidatos.push(path.join(raiz, ruta, "index.html"));
    }
    let archivo = null;
    let estado = 200;
    for (const candidato of candidatos) {
      const relativo = path.relative(raiz, candidato);
      if (relativo.startsWith("..") || path.isAbsolute(relativo)) continue;
      if (await existe(candidato)) {
        archivo = candidato;
        break;
      }
    }
    if (!archivo) {
      archivo = path.join(raiz, "404.html");
      estado = 404;
      if (!(await existe(archivo))) {
        res.writeHead(404);
        res.end("No encontrado");
        return;
      }
    }
    const cabeceras = {
      "content-type": tipos.get(path.extname(archivo)) ?? "application/octet-stream",
    };
    for (const [nombre, valor] of encabezados) cabeceras[nombre] = valor;
    res.writeHead(estado, cabeceras);
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(archivo).pipe(res);
  });
  await new Promise((resolve) => server.listen(puerto, "127.0.0.1", resolve));
  return server;
}

export async function chromeEjecutable() {
  for (const candidato of ["/usr/local/bin/google-chrome", "/usr/bin/google-chrome"]) {
    try {
      await access(candidato);
      return candidato;
    } catch {
      /* sigue */
    }
  }
  throw new Error("No está Google Chrome");
}
