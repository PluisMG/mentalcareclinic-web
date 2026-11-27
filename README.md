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

`npm run build` deja el sitio en `dist/` y corre la verificación en Node: marcadores, enlaces internos, canónicas y `vercel.json`. Las pruebas con Chrome (`npm run test:e2e`) no forman parte del build.

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
| Rutas viejas (`/inicio`, `/erpa`, `/erep`) | `vercel.json` |

El teléfono de llamada es `961 369 2795` (`tel:+529613692795`). El de WhatsApp es `961 100 3707` y todos los enlaces salen de `whatsappHref()` hacia `https://wa.me/529611003707`, con un mensaje distinto por página. En pantallas de menos de 1080 px el enlace del pie es una barra de ancho completo, al final del documento y sin `position: fixed`: así no tapa «Llamar» ni «Dirección» mientras se hace scroll. A partir de 1080 px esa barra se oculta; el encabezado ya muestra WhatsApp.

## Vercel (sin desplegar sin AP)

No hay credenciales en este repositorio y este cambio no conecta el proyecto a Vercel, no crea el subdominio y no toca el DNS. `vercel.json` es la única fuente de redirecciones y encabezados. No se despliega desde aquí: hace falta una AP de Pedro.

1. Compilar: `npm run build`. La salida queda en `dist/`. El build solo usa Node. Chrome corre en `npm run test:e2e` y en GitHub Actions.
2. La URL canónica sale de `PUBLIC_SITE_URL`. AP-2026-11-26-10 la fija en `https://app.mentalcareclinic.com` (está en `.env.example` y en el CI, en claro). En local, si la variable no llega al proceso, el build usa `http://127.0.0.1:43123`. Con `VERCEL_ENV=production` y sin URL, el build sale con error.
3. Las rutas viejas responden 301 desde `vercel.json`, con `statusCode: 301`. Vercel conserva el query string. Así se mantienen `utm_source`, `utm_medium` y el resto de la consulta:
   - `/inicio` → `/`
   - `/erpa` → `/residencia-puertas-abiertas`
   - `/erep` → `/estabilizacion`
   `/consulta-externa` e `/historia` responden 200: son las mismas rutas del sitio nuevo. `trailingSlash: false` manda la barra final (`/erpa/`) a la ruta sin barra con 308 y después aplica el 301. Las mayúsculas (`/ERPA`) no tienen regla: el diseño (D7) no las cubre.
4. Los encabezados de seguridad (HSTS de dos años, `nosniff`, `DENY`, COOP, Permissions-Policy y la CSP) van en `vercel.json` para `/(.*)`. La CSP la calcula `scripts/csp.mjs` con los hashes del HTML y `npm run build` comprueba que coincida. En un host `*.vercel.app` se suma `X-Robots-Tag: noindex`.
5. `robots.txt` y `sitemap.xml` se generan en el build. El sitemap sale de `rutasPublicas`. Mientras `PUBLIC_INDEXAR` no sea `1` en un build de producción, todas las páginas llevan `noindex` y `robots.txt` queda en `Disallow: /`.

## Vista previa

No hay proyecto de Vercel ni vista previa publicada. En local, `scripts/servir.mjs` lee `vercel.json` y simula los 301, la barra final y los encabezados. Lo cubren `scripts/verificar-redirects.mjs` y `scripts/recorridos.mjs`, dentro de `npm run test:e2e`.

La indexación sigue apagada (AP-2026-11-26-10). Solo un build con `VERCEL_ENV=production` y `PUBLIC_INDEXAR=1` quita el `noindex`, y ese valor no se carga sin una AP de Pedro.

La redirección del dominio sin `www` se hace en el registrador (Squarespace Domains), no en este sitio. Hoy `https://mentalcareclinic.com` no tiene certificado. No se modificó el DNS.

## Analítica (solo GA4, con consentimiento)

Por defecto no se carga nada: `.env.example` deja `PUBLIC_GA4_ID` vacío y el repositorio no guarda ningún ID. No hay píxel de Meta, remarketing ni otras etiquetas.

Para activarla, el build tiene que recibir `PUBLIC_GA4_ID` con forma `G-XXXXXXXX`. El sitio es estático: cambiar el ID pide un build nuevo. Sin esa variable no aparece el aviso ni hay medición.

Si el ID es válido, un aviso de cookies ofrece Aceptar y Rechazar con el mismo peso visual. La decisión se guarda en el navegador y el pie tiene «Cambiar la decisión de cookies». Antes de aceptar no se pide nada a Google. Consent Mode v2 arranca con todo en `denied`. `ad_storage`, `ad_user_data` y `ad_personalization` se quedan en `denied`. `allow_google_signals` queda en `false`. Tras aceptar, solo `analytics_storage` pasa a `granted`. Al revocar, el sitio borra `_ga` y `_ga_*` en el host actual y en el dominio padre (`.mentalcareclinic.com`), con `path=/`.

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

## Fachada en el móvil

En la portada, `sizes` es `(min-width: 1080px) 462px, calc(100vw - 2rem)` y el `srcset` ofrece 400, 480 y 600. A 390 px de CSS, `100vw - 2rem` son unos 358 px. Con DPR 3 el navegador necesita unos 1074 px de dispositivo, así que elige el candidato más grande: el AVIF de 600, unos 41 KB. Es la elección correcta: un archivo más ancho pesaría más, y 480 se vería blando a ese DPR. En escritorio, a partir de 1080 px, el hueco es de 462 px y se sirve el de 480.

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
