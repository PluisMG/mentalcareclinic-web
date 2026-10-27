import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { redirecciones } from "../worker/redirects.mjs";
import { conRobots } from "./encabezado-preview.mjs";

const puerto = 8791;
const origen = `http://127.0.0.1:${puerto}`;
const consulta = "?utm_source=a&utm_medium=b";
const paginas = ["/", "/residencia-puertas-abiertas", "/estabilizacion", "/consulta-externa", "/historia", "/contacto"];
const errors = [];

function fail(message) {
  errors.push(message);
}

function encabezadosDe(texto) {
  const pares = [];
  for (const line of texto.split("\n")) {
    const match = line.match(/^\s+([^:\s][^:]*):\s*(.*?)\s*$/);
    if (match) pares.push([match[1], match[2]]);
  }
  return pares;
}

function sinRobots(texto) {
  return texto
    .replace(/\n\/\*\n  X-Robots-Tag: noindex\n/g, "")
    .replace(/^[ \t]*X-Robots-Tag:.*\n?/gm, "");
}

function detener(child) {
  return new Promise((resolve) => {
    if (!child?.pid || child.exitCode !== null) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
      resolve();
    }, 5000);
    child.once("exit", () => {
      clearTimeout(timer);
      resolve();
    });
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  });
}

function iniciar(args) {
  const bin = path.resolve("node_modules/.bin/wrangler");
  return new Promise((resolve, reject) => {
    const child = spawn(
      bin,
      [
        "dev",
        "--ip",
        "127.0.0.1",
        "--port",
        String(puerto),
        "--inspector-port",
        "9231",
        "--local",
        "--log-level",
        "info",
        "--show-interactive-dev-session",
        "false",
        ...args,
      ],
      {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...process.env, CI: "1", WRANGLER_SEND_METRICS: "false" },
      },
    );
    let texto = "";
    let cerrado = false;
    const fallar = (mensaje) => {
      if (cerrado) return;
      cerrado = true;
      clearTimeout(timer);
      const error = new Error(`${mensaje}\n${texto.slice(-4000)}`);
      error.child = child;
      reject(error);
    };
    const timer = setTimeout(() => fallar("wrangler dev no arrancó"), 90000);
    const alSalir = (code) => fallar(`wrangler dev salió con ${code}`);
    child.once("exit", alSalir);
    const recibir = (chunk) => {
      texto += chunk.toString();
      if (!cerrado && /Ready on http:\/\/127\.0\.0\.1:8791/.test(texto)) {
        cerrado = true;
        clearTimeout(timer);
        child.removeListener("exit", alSalir);
        resolve(child);
      }
    };
    child.stdout.on("data", recibir);
    child.stderr.on("data", recibir);
  });
}

async function pedir(ruta) {
  const respuesta = await fetch(`${origen}${ruta}`, { redirect: "manual" });
  await respuesta.arrayBuffer();
  return respuesta;
}

function ubicacionEsperada(destino) {
  return new URL(destino + consulta, origen).href;
}

async function revisar(preview) {
  for (const { origen: ruta, destino } of redirecciones) {
    for (const variante of [ruta, `${ruta}/`]) {
      const respuesta = await pedir(`${variante}${consulta}`);
      const location = respuesta.headers.get("location");
      if (respuesta.status !== 301) {
        fail(`${variante}: se esperaba 301 y llegó ${respuesta.status}`);
      }
      if (location !== ubicacionEsperada(destino)) {
        fail(`${variante}: Location «${location}» no conserva ${consulta} hacia ${destino}`);
      }
      const robots = respuesta.headers.get("x-robots-tag");
      if (preview && robots !== "noindex") fail(`${variante}: con PREVIEW=1 falta X-Robots-Tag: noindex`);
      if (!preview && robots) fail(`${variante}: producción no debe enviar X-Robots-Tag (${robots})`);
    }
  }

  for (const pagina of paginas) {
    const respuesta = await pedir(pagina);
    if (respuesta.status !== 200) fail(`${pagina}: se esperaba 200 y llegó ${respuesta.status}`);
    const robots = respuesta.headers.get("x-robots-tag");
    if (preview) {
      if (robots !== "noindex") fail(`${pagina}: con PREVIEW=1 el asset debe llevar X-Robots-Tag: noindex`);
    } else if (robots) {
      fail(`${pagina}: producción no debe enviar X-Robots-Tag (${robots})`);
    }
  }

  const ausente = await pedir("/esta-ruta-no-existe");
  if (ausente.status !== 404) fail(`/esta-ruta-no-existe: se esperaba 404 y llegó ${ausente.status}`);

  const inicio = await pedir(`/${consulta}`);
  const encabezados = encabezadosDe(await readFile("public/_headers", "utf8"));
  for (const [nombre, valor] of encabezados) {
    const recibido = inicio.headers.get(nombre);
    if (recibido !== valor) fail(`/: falta ${nombre}: ${valor} (llegó ${recibido})`);
  }
  const redireccion = await pedir(`/erpa${consulta}`);
  for (const [nombre, valor] of encabezados) {
    const recibido = redireccion.headers.get(nombre);
    if (recibido !== valor) fail(`/erpa: el 301 no copia ${nombre} (llegó ${recibido})`);
  }
}

const headers = await readFile("public/_headers", "utf8");
if (headers.includes("X-Robots-Tag")) fail("public/_headers no debe llevar X-Robots-Tag");
const conVista = conRobots(headers);
if (!conVista.includes("X-Robots-Tag: noindex")) fail("PREVIEW=1 no añade X-Robots-Tag: noindex");
for (const [nombre, valor] of encabezadosDe(headers)) {
  if (!conVista.includes(`${nombre}: ${valor}`)) fail(`La vista previa pierde el encabezado ${nombre}`);
}

const copia = path.resolve("dist/_headers");
const original = await readFile(copia, "utf8");
let servidor;
try {
  await writeFile(copia, sinRobots(original));
  servidor = await iniciar([]);
  await revisar(false);
  await detener(servidor);
  servidor = null;

  await writeFile(copia, conRobots(sinRobots(original)));
  servidor = await iniciar(["--var", "PREVIEW:1"]);
  await revisar(true);
} catch (error) {
  if (error?.child) await detener(error.child);
  throw error;
} finally {
  await writeFile(copia, original);
  if (servidor) await detener(servidor);
}

if (errors.length) {
  console.error(`Redirecciones fallidas (${errors.length}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Redirecciones correctas: 301 con utm, páginas 200, ruta ausente 404, encabezados y PREVIEW=1.");
