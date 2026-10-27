# MentalCareClinic

Sitio estático de MentalCareClinic, clínica de salud mental en Tuxtla Gutiérrez, Chiapas. Sirve para que una familia entienda la residencia de puertas abiertas y pida una cita informativa por WhatsApp o por teléfono.

El sitio de ejemplo de la agencia: pocas piezas, carga rápido y se actualiza editando archivos de texto. No usa base de datos ni un framework en el navegador.

## Cómo verlo en local

Requiere Node.js 22 o superior.

```bash
npm install
npm run dev
```

Abre http://127.0.0.1:43123

Para la versión que se publica (imágenes ya optimizadas):

```bash
npm run build
npm run preview
```

`npm run build` deja el sitio en `dist/` y corre la verificación: marcadores, enlaces internos y los 301 del Worker.

## Dónde se edita cada cosa

| Qué cambiar | Archivo |
| --- | --- |
| Teléfono, WhatsApp, correo, dirección, horario, COFEPRIS, redes, IDs de analítica, marcadores | `src/config/site.ts` |
| Textos de inicio | `src/content/home.ts` |
| Residencia de puertas abiertas | `src/content/residencia.ts` |
| Estabilización (antes EREP) | `src/content/estabilizacion.ts` |
| Consulta externa | `src/content/consulta.ts` |
| Historia | `src/content/historia.ts` |
| Contacto | `src/content/contacto.ts` |
| Aviso de privacidad | `src/content/privacidad.ts` |
| Colores y tipografía | `src/styles/global.css` |
| Fotos nuevas | `src/assets/images/` y el componente que las usa |
| Rutas viejas (`/inicio`, `/erpa`, `/erep`) | `worker/redirects.mjs` |

El teléfono de llamada es `961 369 2795` (`tel:+529613692795`). El de WhatsApp es `961 100 3707` y todos los enlaces salen de `whatsappHref()` hacia `https://wa.me/529611003707`, con un mensaje distinto por página.

## Cómo se desplegaría en Cloudflare

No hay credenciales en este repositorio. `wrangler.jsonc` no trae `account_id`, `routes` ni dominio, y `workers_dev` está en `false`. Por eso un despliegue no apunta el DNS ni publica `workers.dev`. No se despliega desde aquí: hace falta que Pedro lo apruebe y que alguien, con la cuenta de Cloudflare ya autenticada, corra los comandos.

1. Compilar: `npm run build`. La salida queda en `dist/`.
2. Publicar el Worker y los assets juntos: `npx wrangler deploy`. Si cambian los bindings, `npm run cf-types` regenera `worker-configuration.d.ts`. Ese archivo no se versiona.
3. El dominio `www` no se engancha solo. Cuando Pedro lo apruebe, el dominio se añade en el panel o con una ruta explícita. Ese paso sí toca DNS y no forma parte de este repositorio.
4. Las rutas viejas responden 301 desde `worker/index.ts`, que copia `url.search`. Así se conservan `utm_source`, `utm_medium` y el resto de la consulta:
   - `/inicio` y `/inicio/` → `/`
   - `/erpa` y `/erpa/` → `/residencia-puertas-abiertas`
   - `/erep` y `/erep/` → `/estabilizacion`
   La lista vive solo en `worker/redirects.mjs`. La comparación no distingue mayúsculas: `/ERPA`, `/Erep` y `/INICIO` también responden 301. `public/_redirects` no declara rutas; el comentario dice que el Worker es el que conserva el query string. Astro sigue generando el HTML de respaldo para `npm run preview`, desde el mismo módulo; esa vista local no es el 301.
5. `public/_headers` agrega las cabeceras de seguridad a los assets. El build añade una `Content-Security-Policy` con hashes del HTML, sin `unsafe-eval` ni `unsafe-inline`. El Worker copia esas cabeceras y la misma CSP en el 301.
6. `html_handling` es `drop-trailing-slash`, igual que `trailingSlash: "never"` de Astro: `/contacto` responde 200 y `/contacto/` vuelve a `/contacto`. `not_found_handling` es `404-page`, el equivalente de la `404.html` que Pages habría detectado solo.
7. `robots.txt` y `sitemap.xml` se generan en el build. En producción permiten el rastreo y el sitemap apunta a `https://www.mentalcareclinic.com`.

## Vista previa (`PREVIEW=1`)

Para una copia que no debe indexarse (por ejemplo una vista previa en Cloudflare), el build se corre así:

```bash
PREVIEW=1 npm run build
```

Solo en ese caso el HTML de todas las páginas lleva `<meta name="robots" content="noindex">`, `dist/_headers` recibe `X-Robots-Tag: noindex` y `robots.txt` queda en:

```
User-agent: *
Disallow: /
```

`public/_headers` no lleva esa cabecera. Para que el 301 del Worker también la envíe, la vista previa local es `npx wrangler dev --var PREVIEW:1` después de ese build. Un despliegue de vista previa, solo si Pedro lo aprueba, sería el mismo build y `npx wrangler deploy --var PREVIEW:1`. En `wrangler.jsonc` la variable queda vacía: producción no manda `noindex`.

Sin `PREVIEW=1`, el build de producción sigue siendo rastreable (`Allow: /` y el sitemap). Las canónicas, el sitemap y Open Graph no cambian: siguen en `https://www.mentalcareclinic.com`. No ponga `PREVIEW=1` en el proyecto de producción.

La redirección del dominio sin `www` se hace en el registrador (Squarespace Domains), no en este sitio. Hoy `https://mentalcareclinic.com` no tiene certificado. No se modificó el DNS.

## Analítica (solo GA4, con consentimiento)

Por defecto no se carga nada: `.env.example` deja `PUBLIC_GA4_ID` vacío y el repositorio no guarda ningún ID. No hay píxel de Meta, remarketing ni otras etiquetas.

Para activarla, el build tiene que recibir `PUBLIC_GA4_ID` con forma `G-XXXXXXXX`. El sitio es estático: cambiar el ID pide un build nuevo. Sin esa variable no aparece el aviso ni hay medición.

Si el ID es válido, un aviso de cookies ofrece Aceptar y Rechazar con el mismo peso visual. La decisión se guarda en el navegador y el pie tiene «Cambiar la decisión de cookies». Antes de aceptar no se pide nada a Google. Consent Mode v2 arranca con todo en `denied`. `ad_storage`, `ad_user_data` y `ad_personalization` se quedan en `denied`. `allow_google_signals` queda en `false`. Tras aceptar, solo `analytics_storage` pasa a `granted`.

Los eventos, solo con consentimiento, son `contacto_whatsapp` (cualquier enlace a wa.me) y `contacto_llamada` (cualquier enlace `tel:`). No se envía el texto del mensaje ni información clínica. El aviso no enlaza al aviso de privacidad, que sigue sin publicarse.

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Inicio, empujando a la residencia |
| `/residencia-puertas-abiertas` | Estancia Residencial de Puertas Abiertas |
| `/estabilizacion` | Estabilización psiquiátrica (EREP) |
| `/consulta-externa` | Consulta externa |
| `/historia` | Historia, desde Clínica AT |
| `/contacto` | Teléfono, WhatsApp, dirección confirmada y mapa |
| `/404` | Página no encontrada |

`/aviso-de-privacidad` no se publica. El borrador sigue en `src/content/privacidad.ts` y `src/borradores/aviso-de-privacidad.astro`, fuera de `src/pages`, del sitemap y de los enlaces, hasta que un abogado entregue el texto.

El mapa de contacto no se incrusta hasta que la persona pulsa «Mostrar mapa». También hay un enlace para abrirlo en Google Maps. La consulta del mapa usa la calle en la que coinciden las fuentes (Avenida 15 Norte, entre 4a y 5a Oriente, Col. La Pimienta). El número de la casa no está fijado.

## Sesión grupal en el patio

La foto está en `src/assets/images/patio-grupal.jpg` y el build la optimiza con el pipeline de imágenes de Astro. Se muestra en `/residencia-puertas-abiertas` y en `/estabilizacion`. Es la foto publicitaria original, de 600×600, con los rostros de los residentes ya difuminados. El texto alternativo lo dice. No hay otra versión en el repositorio.

## Datos que todavía no se publican

Están en `pendientes` de `src/config/site.ts`. No salen en el HTML ni en el JSON-LD. `npm run build` corre `scripts/verificar.mjs` y falla si `dist/` contiene `[POR CONFIRMAR`, `Dato pendiente`, `[REVISAR CON ABOGADO` o `{{`.

| Qué falta | Notas |
| --- | --- |
| Número de la casa: #593 o #539 | El sitio muestra solo Av. 15 Norte, entre 4a y 5a Oriente, Col. La Pimienta. El JSON-LD no trae el número, ni `postalCode`, ni `geo`, ni `hasMap`, ni horario, ni `alternateName`. |
| CP: 29034 o 29010 | No se publica. |
| Horario | No se publica un horario de apertura ni el de visitas. |
| Coordenadas | El mapa se abre con la calle confirmada. No hay latitud ni longitud. |
| Aviso o permiso COFEPRIS | No hay bloque de licencia en el pie ni en contacto. |
| Precio desde | El texto dice que el tabulador se acuerda en la valoración. No hay cifra. |
| Nombre, fotografía y cédula del equipo | Se usa el texto neutro del equipo. No hay nombres ni cédulas. La historia sigue nombrando a Pedro Luis Maldonado Gordillo; la cédula y la institución quedan pendientes. |
| Recorrido | Hay fotos de la casa, un consultorio, una habitación, el taller y la sesión del patio. Falta un recorrido. |
| TikTok | No se publica. |
| Casa de medio camino | No se usa. La historia menciona Medio Camino como otro dispositivo, no como nombre de la ERPA. |
| alternateName (Clínica AT, Clínica para el Cuidado Mental) | No va en el JSON-LD hasta que Pedro lo confirme. |
| Aviso de privacidad | El borrador no se publica. Faltan razón social, RFC, domicilio fiscal, correo y teléfono de privacidad, responsable, CURP, facturación, videovigilancia, encargados, aseguradoras, plazos, NOM, PROFECO, menores, fecha y aviso simplificado. Tiene que revisarlo un abogado. |

También faltan, y no viven en el sitio porque son accesos:

- Editor del Google Site actual, si todavía hay que convivir con él.
- Squarespace Domains, para la redirección del dominio sin www.
- Cuenta de Google Analytics (o el ID `G-…`) y zona horaria México.
- Portfolio comercial de Meta, la página de Facebook y confirmación de que `961 100 3707` es WhatsApp Business.
- Permiso para publicar, cuando el abogado y Pedro cierren los marcadores.

## Lo que este sitio no inventa

No hay testimonios, camas, precios, cédulas ni promesa de cura. La frase de portada es: «Una residencia abierta y voluntaria de salud mental en Tuxtla Gutiérrez: el paso entre el hospital y la casa.» Vive en `src/config/site.ts` (`posicionamiento`). La imagen Open Graph sale de la fachada, a 1200×630, y el HTML declara `og:image:width` y `og:image:height`.
