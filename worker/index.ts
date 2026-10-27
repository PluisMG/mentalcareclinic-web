import { destinoDe } from "./redirects.mjs";

/** Mismos valores que `public/_headers`. El 301 no pasa por los assets, así que hay que copiarlos. */
const SEGURIDAD = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-Frame-Options", "SAMEORIGIN"],
  [
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  ],
  ["Strict-Transport-Security", "max-age=31536000"],
] as const;

function encabezadosDeRedireccion(location: string, preview: boolean): Headers {
  const headers = new Headers({ Location: location });
  for (const [nombre, valor] of SEGURIDAD) headers.set(nombre, valor);
  if (preview) headers.set("X-Robots-Tag", "noindex");
  return headers;
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);
    const destino = destinoDe(url.pathname);
    if (destino) {
      const location = new URL(destino, url);
      location.search = url.search;
      console.log(
        JSON.stringify({
          message: "redireccion",
          origen: url.pathname,
          destino,
          status: 301,
        }),
      );
      return new Response(null, {
        status: 301,
        headers: encabezadosDeRedireccion(location.href, env.PREVIEW === "1"),
      });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
