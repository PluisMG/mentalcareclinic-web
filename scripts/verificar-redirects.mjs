import http from "node:http";
import { readFile } from "node:fs/promises";
import { servir } from "./servir.mjs";

const puerto = 8791;
const consulta = "?utm_source=a&utm_medium=b";
const consultaX = "?utm_source=x&utm_medium=y";
const paginas = ["/", "/residencia-puertas-abiertas", "/estabilizacion", "/consulta-externa", "/historia", "/contacto"];
const errores = [];

function fallar(mensaje) {
  errores.push(mensaje);
}

function pedir(ruta, host = `127.0.0.1:${puerto}`) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: puerto,
        path: ruta,
        method: "GET",
        headers: { Host: host },
      },
      (res) => {
        res.resume();
        res.on("end", () => resolve(res));
      },
    );
    req.on("error", reject);
    req.end();
  });
}

function encabezado(res, nombre) {
  const valor = res.headers[nombre.toLowerCase()];
  if (Array.isArray(valor)) return valor.join(", ");
  return valor ?? null;
}

function exigirSeguridad(ruta, res, pares) {
  for (const [nombre, valor] of pares) {
    const recibido = encabezado(res, nombre);
    if (recibido !== valor) fallar(`${ruta}: falta ${nombre}: ${valor} (llegó ${recibido})`);
  }
}

function exigirRobots(ruta, res, vistaPrevia) {
  const robots = encabezado(res, "x-robots-tag");
  if (vistaPrevia && robots !== "noindex") fallar(`${ruta}: con Host de vercel.app falta X-Robots-Tag: noindex`);
  if (!vistaPrevia && robots) fallar(`${ruta}: este host no debe enviar X-Robots-Tag (${robots})`);
}

function ubicacionBien(location, pathname, search) {
  if (!location) return false;
  const url = new URL(location);
  return url.pathname === pathname && url.search === search;
}

const vercel = JSON.parse(await readFile("vercel.json", "utf8"));
const seguridad = (vercel.headers ?? [])
  .filter((regla) => !regla.has)
  .flatMap((regla) => (regla.headers ?? []).map((item) => [item.key, item.value]));

const servidor = await servir("dist", puerto);
try {
  const reglas = [
    ["/inicio", "/"],
    ["/erpa", "/residencia-puertas-abiertas"],
    ["/erep", "/estabilizacion"],
  ];
  for (const search of [consulta, consultaX]) {
    for (const [origen, destino] of reglas) {
      const respuesta = await pedir(`${origen}${search}`);
      if (respuesta.statusCode !== 301) fallar(`${origen}${search}: se esperaba 301 y llegó ${respuesta.statusCode}`);
      const location = encabezado(respuesta, "location");
      if (!ubicacionBien(location, destino, search)) {
        fallar(`${origen}${search}: Location «${location}» no conserva la consulta hacia ${destino}`);
      }
      exigirSeguridad(`${origen}${search}`, respuesta, seguridad);
      exigirRobots(`${origen}${search}`, respuesta, false);

      const conBarra = await pedir(`${origen}/${search}`);
      if (conBarra.statusCode !== 308) {
        fallar(`${origen}/${search}: se esperaba 308 y llegó ${conBarra.statusCode}`);
      }
      const locationBarra = encabezado(conBarra, "location");
      if (!ubicacionBien(locationBarra, origen, search)) {
        fallar(`${origen}/${search}: Location «${locationBarra}» no quita la barra final conservando la consulta`);
      }
      exigirSeguridad(`${origen}/${search}`, conBarra, seguridad);
      const siguiente = await pedir(`${origen}${search}`);
      if (siguiente.statusCode !== 301) fallar(`${origen}/ luego sin barra: se esperaba 301`);
    }
  }

  const vista = await pedir(`/erpa${consulta}`, "x.vercel.app");
  if (vista.statusCode !== 301) fallar(`Host x.vercel.app /erpa: se esperaba 301 y llegó ${vista.statusCode}`);
  exigirSeguridad("x.vercel.app /erpa", vista, seguridad);
  exigirRobots("x.vercel.app /erpa", vista, true);
  if (!ubicacionBien(encabezado(vista, "location"), "/residencia-puertas-abiertas", consulta)) {
    fallar("Host x.vercel.app /erpa no conserva el query string");
  }

  for (const pagina of paginas) {
    const respuesta = await pedir(pagina);
    if (respuesta.statusCode !== 200) fallar(`${pagina}: se esperaba 200 y llegó ${respuesta.statusCode}`);
    const location = encabezado(respuesta, "location");
    if (location) fallar(`${pagina}: no debe redirigir (Location ${location})`);
    exigirSeguridad(pagina, respuesta, seguridad);
    exigirRobots(pagina, respuesta, false);
    const preview = await pedir(pagina, "x.vercel.app");
    exigirSeguridad(`${pagina} preview`, preview, seguridad);
    exigirRobots(`${pagina} preview`, preview, true);
  }

  const ausente = await pedir("/no-existe");
  if (ausente.statusCode !== 404) fallar(`/no-existe: se esperaba 404 y llegó ${ausente.statusCode}`);
  exigirSeguridad("/no-existe", ausente, seguridad);
  exigirRobots("/no-existe", ausente, false);
  const ausentePreview = await pedir("/no-existe", "x.vercel.app");
  exigirRobots("/no-existe preview", ausentePreview, true);
  exigirSeguridad("/no-existe preview", ausentePreview, seguridad);
} finally {
  await new Promise((resolve) => servidor.close(resolve));
}

if (errores.length) {
  console.error(`Redirecciones fallidas (${errores.length}):`);
  for (const error of errores) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Redirecciones correctas: 301 con utm, barra final en 308, 200 sin redirección, 404 y X-Robots-Tag solo en *.vercel.app.");
