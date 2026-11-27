import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const json = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));

test("las rutas viejas responden 301 y las que ya existen no redirigen", () => {
  const porOrigen = new Map((json.redirects ?? []).map((regla) => [regla.source, regla]));
  assert.deepEqual([...porOrigen.keys()].sort(), ["/erep", "/erpa", "/inicio"]);
  for (const origen of ["/inicio", "/erpa", "/erep"]) {
    const regla = porOrigen.get(origen);
    assert.equal(regla.statusCode, 301);
    assert.equal("permanent" in regla, false);
  }
  assert.equal(porOrigen.get("/inicio").destination, "/");
  assert.equal(porOrigen.get("/erpa").destination, "/residencia-puertas-abiertas");
  assert.equal(porOrigen.get("/erep").destination, "/estabilizacion");
  assert.equal(porOrigen.has("/consulta-externa"), false);
  assert.equal(porOrigen.has("/historia"), false);
  assert.equal(json.trailingSlash, false);
});

test("los encabezados de seguridad y el noindex de vista previa están declarados", () => {
  const reglas = json.headers ?? [];
  const generales = reglas.find((regla) => regla.source === "/(.*)" && !regla.has);
  const valores = new Map((generales?.headers ?? []).map((item) => [item.key, item.value]));
  assert.equal(valores.get("Strict-Transport-Security"), "max-age=63072000");
  assert.equal(valores.get("X-Content-Type-Options"), "nosniff");
  assert.equal(valores.get("Referrer-Policy"), "strict-origin-when-cross-origin");
  assert.equal(valores.get("X-Frame-Options"), "DENY");
  assert.equal(valores.get("Cross-Origin-Opener-Policy"), "same-origin");
  assert.match(valores.get("Permissions-Policy") ?? "", /browsing-topics=\(\)/);
  const csp = valores.get("Content-Security-Policy") ?? "";
  assert.equal(csp.includes("unsafe-inline") || csp.includes("unsafe-eval"), false);
  assert.match(csp, /form-action 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  const vista = reglas.find((regla) => regla.has?.some((item) => item.type === "host"));
  assert.equal(vista.has[0].value, "(?:.+\\.)?vercel\\.app");
  assert.equal(vista.headers[0].key, "X-Robots-Tag");
  assert.equal(vista.headers[0].value, "noindex");
});

test("el repositorio no conserva wrangler ni el Worker", () => {
  const listado = spawnSync("git", ["ls-files"], { encoding: "utf8" });
  assert.equal(listado.status, 0, listado.stderr);
  const restos = listado.stdout.split("\n").filter((linea) => /wrangler|worker\//.test(linea));
  assert.deepEqual(restos, []);
});

test(".env.example deja PUBLIC_INDEXAR vacío y publica la URL canónica", async () => {
  const ejemplo = await readFile(new URL("../.env.example", import.meta.url), "utf8");
  const lineas = ejemplo.split("\n");
  assert.equal(lineas.includes("PUBLIC_INDEXAR="), true);
  assert.equal(lineas.includes("PUBLIC_SITE_URL=https://app.mentalcareclinic.com"), true);
});
