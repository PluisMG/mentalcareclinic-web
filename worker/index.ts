import { politicaCsp } from "./csp-valor.mjs";
import { destinoDe } from "./redirects.mjs";

/** Mismos valores que `public/_headers`. Toda respuesta del Worker los lleva, también el 301. */
const SEGURIDAD = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-Frame-Options", "SAMEORIGIN"],
  [
    "Permissions-Policy",
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
  ],
  ["Strict-Transport-Security", "max-age=31536000"],
  ["Content-Security-Policy", politicaCsp],
] as const;

function aplicarSeguridad(headers: Headers, preview: boolean) {
  for (const [nombre, valor] of SEGURIDAD) headers.set(nombre, valor);
  if (preview) headers.set("X-Robots-Tag", "noindex");
}

export default {
  async fetch(request, env, ctx): Promise<Response> {
    void ctx;
    const url = new URL(request.url);
    const preview = env.PREVIEW === "1";
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
      const headers = new Headers({ Location: location.href });
      aplicarSeguridad(headers, preview);
      return new Response(null, { status: 301, headers });
    }
    const respuesta = await env.ASSETS.fetch(request);
    const headers = new Headers(respuesta.headers);
    headers.delete("content-encoding");
    headers.delete("content-length");
    aplicarSeguridad(headers, preview);
    return new Response(respuesta.body, {
      status: respuesta.status,
      statusText: respuesta.statusText,
      headers,
    });
  },
} satisfies ExportedHandler<Env>;
