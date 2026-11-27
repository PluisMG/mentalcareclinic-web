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

async function existe(archivo) {
  try {
    const info = await stat(archivo);
    return info.isFile();
  } catch {
    return false;
  }
}

function hostDe(valor) {
  return String(valor ?? "").split(":")[0];
}

function fuenteCoincide(source, pathname) {
  if (source === "/(.*)") return true;
  return source === pathname;
}

function condicionCumple(condicion, host) {
  if (condicion.type !== "host") return false;
  return new RegExp(`^(?:${condicion.value})$`).test(host);
}

function encabezadosPara(config, pathname, host) {
  const nombre = hostDe(host);
  const salida = {};
  for (const regla of config.headers ?? []) {
    if (!fuenteCoincide(regla.source, pathname)) continue;
    if (regla.has?.length && !regla.has.every((condicion) => condicionCumple(condicion, nombre))) continue;
    for (const encabezado of regla.headers ?? []) salida[encabezado.key] = encabezado.value;
  }
  return salida;
}

function absoluto(host, ruta) {
  const base = `http://${host || "127.0.0.1"}`;
  return new URL(ruta, base).href;
}

export async function servir(raiz, puerto) {
  const config = JSON.parse(await readFile(path.resolve("vercel.json"), "utf8"));
  const server = http.createServer(async (req, res) => {
    const host = req.headers.host ?? `127.0.0.1:${puerto}`;
    const url = new URL(req.url ?? "/", `http://${host}`);
    let ruta = url.pathname;
    try {
      ruta = decodeURIComponent(ruta);
    } catch {
      /* La ruta ya venía sin un escape válido. */
    }
    if (ruta.includes("\0") || ruta.includes("..")) {
      res.writeHead(400);
      res.end();
      return;
    }

    const cabeceras = () => encabezadosPara(config, ruta, host);

    if (config.trailingSlash === false && ruta.length > 1 && ruta.endsWith("/")) {
      const destino = absoluto(host, `${ruta.slice(0, -1)}${url.search}`);
      res.writeHead(308, { ...cabeceras(), Location: destino });
      res.end();
      return;
    }

    const redireccion = (config.redirects ?? []).find((regla) => regla.source === ruta);
    if (redireccion) {
      const destino = absoluto(host, `${redireccion.destination}${url.search}`);
      res.writeHead(redireccion.statusCode ?? 307, { ...cabeceras(), Location: destino });
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
        res.writeHead(404, cabeceras());
        res.end("No encontrado");
        return;
      }
    }
    const cabecerasArchivo = {
      "content-type": tipos.get(path.extname(archivo)) ?? "application/octet-stream",
      ...cabeceras(),
    };
    res.writeHead(estado, cabecerasArchivo);
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
