import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { chromeEjecutable, servir } from "./servir.mjs";

const puerto = 8794;
const origen = `http://127.0.0.1:${puerto}`;
const paginas = ["/", "/estabilizacion", "/contacto"];
const vistas = [
  { nombre: "móvil", width: 390, height: 844 },
  { nombre: "escritorio", width: 1280, height: 800 },
];
const errores = [];

function fallar(mensaje) {
  errores.push(mensaje);
}

const servidor = await servir("dist", puerto);
const navegador = await chromium.launch({
  executablePath: await chromeEjecutable(),
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const contexto = await navegador.newContext();

try {
  const pagina = await contexto.newPage();
  for (const vista of vistas) {
    await pagina.setViewportSize({ width: vista.width, height: vista.height });
    for (const ruta of paginas) {
      await pagina.goto(`${origen}${ruta}`, { waitUntil: "networkidle" });
      const axe = await new AxeBuilder({ page: pagina }).analyze();
      for (const hallazgo of axe.violations) {
        fallar(`${ruta} ${vista.nombre}: axe ${hallazgo.id} (${hallazgo.impact}) ${hallazgo.nodes.length}`);
      }
      const pequenos = await pagina.evaluate(() => {
        const nodos = [...document.querySelectorAll("a, button, summary")];
        const lista = [];
        for (const nodo of nodos) {
          const estilo = getComputedStyle(nodo);
          if (estilo.display === "none" || estilo.visibility === "hidden") continue;
          const rect = nodo.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) continue;
          if (rect.width < 24 || rect.height < 24) {
            const texto = (nodo.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 48);
            lista.push(`${nodo.tagName} «${texto}» ${Math.round(rect.width)}×${Math.round(rect.height)}`);
          }
        }
        return lista;
      });
      for (const item of pequenos) fallar(`${ruta} ${vista.nombre}: blanco táctil ${item}`);

      const imagenes = await pagina.locator("main img").evaluateAll((nodos) =>
        nodos.map((img) => ({
          loading: img.getAttribute("loading"),
          prioridad: img.getAttribute("fetchpriority"),
          ancho: img.getAttribute("width"),
          alto: img.getAttribute("height"),
        })),
      );
      for (const [indice, datos] of imagenes.entries()) {
        if (!datos.ancho || !datos.alto) fallar(`${ruta}: la imagen ${indice + 1} no declara dimensiones`);
        if (datos.prioridad === "high" && datos.loading === "lazy") {
          fallar(`${ruta}: la imagen ${indice + 1} pide prioridad alta y a la vez lazy`);
        }
      }
      if (ruta === "/") {
        const principal = imagenes[0];
        if (!principal) fallar("/: falta la imagen de la fachada, que es el LCP");
        else if (principal.loading === "lazy" || principal.prioridad !== "high") {
          fallar("/: la fachada (LCP) debe ir eager y con fetchpriority=high");
        }
      }
    }
  }

  await pagina.setViewportSize({ width: 390, height: 844 });
  await pagina.goto(`${origen}/contacto`, { waitUntil: "networkidle" });
  await pagina.getByRole("button", { name: "Mostrar mapa" }).click();
  const titulo = await pagina.locator("iframe").getAttribute("title");
  if (titulo !== "Mapa de ubicación de MentalCareClinic en Tuxtla Gutiérrez") {
    fallar(`Título del mapa: ${titulo}`);
  }
  if (titulo?.includes("por confirmar") || titulo?.includes("predio")) {
    fallar("El título del mapa conserva una nota interna");
  }

  await pagina.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const tapa = await pagina.evaluate(() => {
    const flotante = document.querySelector(".float")?.getBoundingClientRect();
    const pie = document.querySelector(".footer-base")?.getBoundingClientRect();
    if (!flotante || !pie) return "falta el botón o el pie";
    const cruza = !(pie.bottom <= flotante.top + 1 || pie.top >= flotante.bottom - 1);
    return cruza ? `el pie queda bajo el botón (${Math.round(pie.bottom)} / ${Math.round(flotante.top)})` : "";
  });
  if (tapa) fallar(`/contacto móvil: ${tapa}`);
  await pagina.close();
} catch (error) {
  fallar(error instanceof Error ? error.message : String(error));
} finally {
  await contexto.close();
  await navegador.close();
  await new Promise((resolve) => servidor.close(resolve));
}

if (errores.length) {
  console.error(`Accesibilidad fallida (${errores.length}):`);
  for (const error of errores) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Accesibilidad correcta: axe, blancos de 24 px, imagen principal, mapa y pie libre en móvil.");
