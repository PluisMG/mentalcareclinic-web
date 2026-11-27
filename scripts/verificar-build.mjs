import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

const directorio = path.resolve("scripts/build-checks");
const archivos = (await readdir(directorio))
  .filter((nombre) => nombre.endsWith(".mjs"))
  .sort((a, b) => a.localeCompare(b, "en"));

if (!archivos.length) {
  console.error("No hay scripts en scripts/build-checks.");
  process.exit(1);
}

let fallos = 0;
for (const archivo of archivos) {
  const ruta = path.join(directorio, archivo);
  console.log(`\n--- ${archivo} ---`);
  const codigo = await new Promise((resolve) => {
    const hijo = spawn(process.execPath, [ruta], { stdio: "inherit" });
    hijo.on("exit", (salida, senal) => resolve(senal ? 1 : (salida ?? 1)));
  });
  if (codigo !== 0) {
    fallos += 1;
    console.error(`${archivo} salió con ${codigo}`);
  }
}

if (fallos) {
  console.error(`Verificaciones de build fallidas: ${fallos}`);
  process.exit(1);
}

console.log("Verificaciones de build correctas.");
