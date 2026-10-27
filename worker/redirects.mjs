/**
 * Única lista de redirecciones del sitio anterior (Google Sites).
 * La leen el Worker, la config de Astro y las pruebas.
 * No hay `_redirects`: ese formato no conserva el query string.
 * @type {ReadonlyArray<{ readonly origen: string, readonly destino: string }>}
 */
export const redirecciones = Object.freeze([
  Object.freeze({ origen: "/inicio", destino: "/" }),
  Object.freeze({ origen: "/erpa", destino: "/residencia-puertas-abiertas" }),
  Object.freeze({ origen: "/erep", destino: "/estabilizacion" }),
]);

/**
 * @param {string} pathname
 */
export function normalizarRuta(pathname) {
  if (pathname.length > 1 && pathname.endsWith("/")) return pathname.slice(0, -1);
  return pathname;
}

/**
 * @param {string} pathname
 * @returns {string | null}
 */
export function destinoDe(pathname) {
  const ruta = normalizarRuta(pathname);
  const regla = redirecciones.find((item) => item.origen === ruta);
  return regla ? regla.destino : null;
}

/** Rutas que deben entrar al Worker antes que al HTML de Astro. */
export function rutasDelWorker() {
  return redirecciones.flatMap(({ origen }) => [origen, `${origen}/`]);
}
