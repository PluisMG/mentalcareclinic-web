/**
 * Datos de la clínica. Los textos de cada página están en src/content/.
 * `pendientes` guarda datos sin confirmar. No se interpolan en el HTML ni en el JSON-LD.
 *
 * La medición de visitas solo sale de PUBLIC_GA4_ID en el build. Si no viene,
 * no hay aviso ni script de analítica. No hay píxel de Meta.
 */

export const pendientes = {
  direccion: "[DIRECCIÓN POR CONFIRMAR: Av. 15 Norte #593 o #539]",
  codigoPostal: "[CP POR CONFIRMAR: 29034 o 29010]",
  horario: "[HORARIO POR CONFIRMAR]",
  cofepris: "[POR CONFIRMAR: número de aviso o permiso COFEPRIS]",
  precioDesde: "[POR CONFIRMAR: precio desde]",
  equipo: "[POR CONFIRMAR: nombre, fotografía y cédula profesional del equipo]",
  recorrido: "[POR CONFIRMAR: recorrido y fotos de las instalaciones]",
  razonSocial: "[POR CONFIRMAR: razón social o nombre de la persona física titular]",
  rfc: "[POR CONFIRMAR: RFC]",
  domicilioFiscal: "[POR CONFIRMAR: domicilio fiscal]",
  correoPrivacidad: "[POR CONFIRMAR: correo de privacidad]",
  telefonoPrivacidad: "[POR CONFIRMAR: teléfono de privacidad]",
  responsableDatos: "[POR CONFIRMAR: persona o área responsable de datos personales]",
  curp: "[POR CONFIRMAR: si se pide CURP]",
  facturacion: "[POR CONFIRMAR: RFC, datos de facturación y forma de pago]",
  otrosSensibles:
    "[POR CONFIRMAR: otros datos sensibles que se recaben, por ejemplo creencias religiosas o vida sexual]",
  videovigilancia: "[POR CONFIRMAR: si hay videovigilancia]",
  aseguradoras: "[POR CONFIRMAR: transferencias a aseguradoras, solo si aplica]",
  terceros: "[POR CONFIRMAR: terceros y finalidad de otras transferencias]",
  encargados: "[POR CONFIRMAR: sistema de expediente y otros encargados]",
  horarioArco: "[POR CONFIRMAR: horario para presentar solicitudes ARCO]",
  fechaAviso: "[POR CONFIRMAR: fecha de publicación del aviso revisado por un abogado]",
  plazoExpediente: "[POR CONFIRMAR CON ABOGADO: plazo de conservación del expediente clínico]",
  nom004: "[POR CONFIRMAR CON ABOGADO: NOM-004-SSA3-2012]",
  profeco: "[POR CONFIRMAR: vigencia del Registro Público para Evitar Publicidad de PROFECO]",
  menores: "[POR CONFIRMAR CON ABOGADO: reglas para menores y personas que no pueden consentir]",
  tiktok: "[POR CONFIRMAR: cuenta de TikTok, si existe]",
  coordenadas: "[POR CONFIRMAR: coordenadas para el mapa]",
  casaDeMedioCamino:
    "[POR CONFIRMAR: si la residencia debe presentarse también como casa de medio camino]",
  avisoSimplificado: "[POR CONFIRMAR CON ABOGADO: texto del aviso de privacidad simplificado]",
} as const;

export const site = {
  nombre: "MentalCareClinic",
  url: "https://www.mentalcareclinic.com",
  locale: "es-MX",
  idioma: "es-MX",
  email: "info@mentalcareclinic.com",
  emailHref: "mailto:info@mentalcareclinic.com",
  descripcionCorta:
    "Clínica de salud mental en Tuxtla Gutiérrez, Chiapas. Consulta externa y estancia residencial.",
  posicionamiento:
    "Una residencia abierta y voluntaria de salud mental en Tuxtla Gutiérrez: el paso entre el hospital y la casa.",
  telefono: {
    display: "961 369 2795",
    e164: "+529613692795",
    href: "tel:+529613692795",
  },
  whatsapp: {
    display: "961 100 3707",
    numero: "529611003707",
  },
  direccion: {
    calle: "Av. 15 Norte",
    entre: "entre 4a y 5a Oriente",
    colonia: "Col. La Pimienta",
    ciudad: "Tuxtla Gutiérrez",
    estado: "Chiapas",
    pais: "México",
    paisCodigo: "MX",
  },
  /** Calles en las que coinciden el sitio anterior y los directorios. El número no. */
  mapaConsulta:
    "Avenida 15 Norte entre 4a y 5a Oriente, Colonia La Pimienta, Tuxtla Gutiérrez, Chiapas, México",
  visitasErpa:
    "Las visitas se organizan en el horario que autoriza la clínica y pueden ajustarse según la evolución, el reglamento vigente y el criterio de la clínica.",
  redes: [
    {
      nombre: "Facebook",
      href: "https://www.facebook.com/mentalcareclinic",
    },
    {
      nombre: "Instagram",
      href: "https://www.instagram.com/mentalcare_clinic",
    },
  ],
  ogImage: "/og.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt:
    "Estancia Residencial de Puertas Abiertas (ERPA): casa de MentalCareClinic en Tuxtla Gutiérrez",
} as const;

/** Textos visibles mientras faltan datos que no deben publicarse. */
export const copiaPublica = {
  equipo:
    "Nuestro equipo de psiquiatría, psicología, enfermería y acompañamiento le atiende de forma coordinada.",
  fotos:
    "Estas son algunas áreas de la casa. Puede conocerlas en persona en la cita informativa.",
} as const;

export const navegacion = [
  { href: "/", label: "Inicio" },
  { href: "/residencia-puertas-abiertas", label: "Residencia" },
  { href: "/estabilizacion", label: "Estabilización" },
  { href: "/consulta-externa", label: "Consulta" },
  { href: "/historia", label: "Historia" },
  { href: "/contacto", label: "Contacto" },
] as const;

export const rutasPublicas = [
  "/",
  "/residencia-puertas-abiertas",
  "/estabilizacion",
  "/consulta-externa",
  "/historia",
  "/contacto",
] as const;

const GA4_RE = /^G-[A-Z0-9]+$/i;

function leerGa4(): string {
  const desdeProceso = process.env.PUBLIC_GA4_ID;
  if (typeof desdeProceso === "string" && desdeProceso.trim()) return desdeProceso.trim();
  return (import.meta.env.PUBLIC_GA4_ID ?? "").trim();
}

function idGa4(valor: string): string {
  const limpio = valor.trim();
  if (!limpio) return "";
  if (!GA4_RE.test(limpio)) {
    console.warn("[analítica] Se ignoró PUBLIC_GA4_ID porque no tiene el formato esperado.");
    return "";
  }
  return limpio;
}

export const analitica = {
  ga4: idGa4(leerGa4()),
};

export function hayAnalitica(): boolean {
  return Boolean(analitica.ga4);
}

/** Vista previa: `PREVIEW=1 npm run build`. No indexa. Las canónicas no cambian. */
export function esVistaPrevia(): boolean {
  return process.env["PREVIEW"] === "1";
}

export function whatsappHref(mensaje: string): string {
  return `https://wa.me/${site.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;
}

export function canonical(path: string): string {
  if (path === "/") return `${site.url}/`;
  return `${site.url}${path}`;
}

export function mapaExternoHref(): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.mapaConsulta)}`;
}

export function datosEstructurados(pagina: { path: string; titulo: string; descripcion: string }) {
  const clinicaId = `${site.url}/#clinica`;
  const sitioId = `${site.url}/#sitio`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "MedicalClinic",
        "@id": clinicaId,
        name: site.nombre,
        url: `${site.url}/`,
        logo: `${site.url}/favicon.svg`,
        image: `${site.url}${site.ogImage}`,
        description: site.descripcionCorta,
        foundingDate: "2014",
        telephone: site.telefono.e164,
        email: site.email,
        medicalSpecialty: "Psychiatric",
        address: {
          "@type": "PostalAddress",
          streetAddress: `${site.direccion.calle}, ${site.direccion.entre}, ${site.direccion.colonia}`,
          addressLocality: site.direccion.ciudad,
          addressRegion: site.direccion.estado,
          addressCountry: site.direccion.paisCodigo,
        },
        areaServed: [
          { "@type": "City", name: site.direccion.ciudad },
          { "@type": "State", name: site.direccion.estado },
        ],
        sameAs: site.redes.map((red) => red.href),
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: site.telefono.e164,
            contactType: "customer service",
            availableLanguage: "es",
            areaServed: "MX",
          },
          {
            "@type": "ContactPoint",
            telephone: `+${site.whatsapp.numero}`,
            contactType: "customer service",
            url: `https://wa.me/${site.whatsapp.numero}`,
            availableLanguage: "es",
            areaServed: "MX",
          },
        ],
        availableService: [
          {
            "@type": "MedicalTherapy",
            name: "Estancia Residencial de Puertas Abiertas (ERPA)",
            url: canonical("/residencia-puertas-abiertas"),
          },
          {
            "@type": "MedicalTherapy",
            name: "Estancia Residencial de Estabilización Psiquiátrica (EREP)",
            url: canonical("/estabilizacion"),
          },
          {
            "@type": "MedicalTherapy",
            name: "Consulta externa: psiquiatría, psicología clínica, psicoterapia y medicina general",
            url: canonical("/consulta-externa"),
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": sitioId,
        url: site.url,
        name: site.nombre,
        inLanguage: "es-MX",
        publisher: { "@id": clinicaId },
      },
      {
        "@type": "WebPage",
        "@id": `${canonical(pagina.path)}#pagina`,
        url: canonical(pagina.path),
        name: pagina.titulo,
        description: pagina.descripcion,
        inLanguage: "es-MX",
        isPartOf: { "@id": sitioId },
        about: { "@id": clinicaId },
      },
    ],
  };
}
