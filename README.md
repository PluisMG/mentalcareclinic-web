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

`npm run build` deja el sitio en `dist/`. `npm run verificar` revisa enlaces internos, un solo `h1`, canónicas, WhatsApp con lada 52 y los marcadores pendientes.

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

El teléfono de llamada es `961 369 2795` (`tel:+529613692795`). El de WhatsApp es `961 100 3707` y todos los enlaces salen de `whatsappHref()` hacia `https://wa.me/529611003707`, con un mensaje distinto por página.

## Cómo desplegar en Cloudflare Pages

No hay credenciales en este repositorio y no hay que tocar el dominio ni el DNS desde aquí.

1. En Cloudflare Pages, crear un proyecto con este repositorio.
2. Comando de compilación: `npm run build`.
3. Directorio de salida: `dist`.
4. El archivo `wrangler.toml` ya declara `pages_build_output_dir = "dist"`.
5. `public/_redirects` manda las rutas viejas con 301:
   - `/inicio` → `/`
   - `/erpa` → `/residencia-puertas-abiertas`
   - `/erep` → `/estabilizacion`
6. `public/_headers` agrega cabeceras básicas de seguridad.
7. `robots.txt` y `sitemap.xml` se generan en el build. En producción permiten el rastreo y el sitemap apunta a `https://www.mentalcareclinic.com`.

## Vista previa (`PREVIEW=1`)

Para una copia que no debe indexarse (por ejemplo una vista previa en Cloudflare), el build se corre así:

```bash
PREVIEW=1 npm run build
```

Solo en ese caso el HTML de todas las páginas lleva `<meta name="robots" content="noindex">` y `robots.txt` queda en:

```
User-agent: *
Disallow: /
```

Sin `PREVIEW=1`, el build de producción sigue siendo rastreable (`Allow: /` y el sitemap). Las canónicas, el sitemap y Open Graph no cambian: siguen en `https://www.mentalcareclinic.com`. No ponga `PREVIEW=1` en el proyecto de producción.

La redirección del dominio sin `www` se hace en el registrador (Squarespace Domains), no en este sitio. Hoy `https://mentalcareclinic.com` no tiene certificado. No se modificó el DNS.

## Analítica (GA4 y Meta)

Por defecto no se carga nada: no hay cookies de analítica ni píxel.

Para activarla, en el build tiene que existir un ID válido. Sirven las dos vías; si la variable de entorno trae valor, gana sobre el archivo.

1. Variable de entorno en Cloudflare Pages (o en un `.env` local, a partir de `.env.example`):
   - `PUBLIC_GA4_ID` con forma `G-XXXXXXXX`
   - `PUBLIC_META_PIXEL_ID` solo dígitos
2. O pegar los mismos valores en `analiticaEnArchivo`, dentro de `src/config/site.ts`.

El sitio es estático: cambiar un ID pide un build nuevo.

Si hay al menos un ID, aparece un aviso de cookies. Google Analytics y el píxel de Meta se cargan solo después de pulsar Aceptar. Rechazar no carga nada. La decisión se guarda en el navegador. Los eventos, con nombres neutros y sin datos de salud, son:

- `contacto_whatsapp` (en Meta, evento personalizado `ContactoWhatsapp`)
- `contacto_llamada` (en Meta, `ContactoLlamada`)

Meta puede limitar eventos en sitios de salud. No se envía el texto del mensaje ni información clínica. En GA4 se desactivan las señales publicitarias de Google.

## Rutas

| Ruta | Página |
| --- | --- |
| `/` | Inicio, empujando a la residencia |
| `/residencia-puertas-abiertas` | Estancia Residencial de Puertas Abiertas |
| `/estabilizacion` | Estabilización psiquiátrica (EREP) |
| `/consulta-externa` | Consulta externa |
| `/historia` | Historia, desde Clínica AT |
| `/contacto` | Teléfono, WhatsApp, dirección y mapa |
| `/aviso-de-privacidad` | Borrador del aviso, pendiente de abogado |
| `/404` | Página no encontrada |

El mapa de contacto no se incrusta hasta que la persona pulsa «Mostrar mapa». También hay un enlace para abrirlo en Google Maps. La consulta del mapa usa la calle en la que coinciden las fuentes (Avenida 15 Norte, entre 4a y 5a Oriente, Col. La Pimienta). El número de la casa no está fijado.

## Sesión grupal en el patio

La foto está en `src/assets/images/patio-grupal.jpg` y el build la optimiza con el pipeline de imágenes de Astro. Se muestra en `/residencia-puertas-abiertas` y en `/estabilizacion`. Es la foto publicitaria original, de 600×600, con los rostros de los residentes ya difuminados. El texto alternativo lo dice. No hay otra versión en el repositorio.

## Marcadores pendientes

Están en el objeto `pendientes` de `src/config/site.ts`. En el sitio se ven con el rótulo «Dato pendiente» y el texto entre corchetes.

| Marcador | Dónde se ve | Qué falta |
| --- | --- | --- |
| `[DIRECCIÓN POR CONFIRMAR: Av. 15 Norte #593 o #539]` | Pie, contacto, aviso, datos estructurados | El sitio anterior dice #593. Directorios de Maps y Facebook dicen #539. |
| `[CP POR CONFIRMAR: 29034 o 29010]` | Pie, contacto, aviso | 29034 en fichas de Maps, 29010 en Facebook. No va en el JSON-LD hasta que sea un código real. |
| `[HORARIO POR CONFIRMAR]` | Pie y contacto | No hay horario general de la clínica en el contenido. Las visitas de la ERPA sí: sábado de 11:00 a 15:00, ajustable. Ese dato no se usó como horario de apertura. |
| `[POR CONFIRMAR: coordenadas para el mapa]` | Contacto | No hay latitud ni longitud en el contenido, así que el JSON-LD no trae `geo`. |
| `[POR CONFIRMAR: número de aviso o permiso COFEPRIS]` | Pie y contacto | No está en el sitio anterior. |
| `[POR CONFIRMAR: precio desde]` | Residencia y estabilización | No hay tarifa publicada. Se menciona que el tabulador se acuerda en la valoración. |
| `[POR CONFIRMAR: nombre, fotografía y cédula profesional del equipo]` | Inicio, residencia, estabilización y consulta | Hay áreas profesionales, no nombres ni cédulas. |
| `[POR CONFIRMAR: recorrido y fotos de las instalaciones]` | Residencia y estabilización | Están la fachada, un consultorio, una habitación, una pintura del taller y la sesión grupal del patio, con los rostros difuminados. Falta un recorrido y faltan más espacios. |
| `[POR CONFIRMAR: cuenta de TikTok, si existe]` | Solo en la configuración | El ícono viejo apuntaba a Instagram. No se publica hasta tener la cuenta. |
| `[POR CONFIRMAR: si la residencia debe presentarse también como casa de medio camino]` | Solo en la configuración | La historia menciona Medio Camino como otro dispositivo, no como sinónimo de la ERPA. No se agregó al título. |
| Datos del aviso de privacidad (razón social, RFC, domicilio fiscal, correo y teléfono de privacidad, responsable, CURP, facturación, videovigilancia, encargados, aseguradoras, plazos, NOM, PROFECO, menores, fecha, aviso simplificado) | `/aviso-de-privacidad` | El texto es un borrador del 26 de octubre de 2026, con la ley publicada en el DOF el 20 de marzo de 2025. Tiene que revisarlo un abogado antes de tratarlo como aviso definitivo. |

También faltan, y no viven en el sitio porque son accesos:

- Editor del Google Site actual, si todavía hay que convivir con él.
- Squarespace Domains, para la redirección del dominio sin www.
- Cuenta de Google Analytics (o el ID `G-…`) y zona horaria México.
- Portfolio comercial de Meta, la página de Facebook y confirmación de que `961 100 3707` es WhatsApp Business.
- Permiso para publicar, cuando el abogado y Pedro cierren los marcadores.

## Lo que este sitio no inventa

No hay testimonios, camas, precios, cédulas ni promesa de cura. La frase de portada —la única residencia abierta y voluntaria de salud mental en Chiapas, el paso entre el hospital y la casa— es el posicionamiento pedido para la ERPA. Si no se sostiene, se cambia en `src/config/site.ts` (`posicionamiento`).
