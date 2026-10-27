const CLAVE = "mcc-cookies";

function leer(): string | null {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
}

function guardar(valor: "aceptada" | "rechazada") {
  try {
    localStorage.setItem(CLAVE, valor);
  } catch {
    /* El navegador puede bloquear el almacenamiento. Sin eso, no hay analítica. */
  }
}

function gtag(...args: unknown[]) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(args);
}

function cargarGa4(id: string) {
  if (document.querySelector(`script[data-mcc-ga4="${id}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.mccGa4 = id;
  document.head.appendChild(script);
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, {
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

function cargarMeta(id: string) {
  if (window.fbq) return;
  const n = function (...args: unknown[]) {
    n.callMethod ? n.callMethod(...args) : n.queue.push(args);
  } as Fbq;
  n.queue = [];
  n.loaded = true;
  n.version = "2.0";
  window.fbq = n;
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
  window.fbq("init", id);
  window.fbq("track", "PageView");
}

function cargarAnalitica() {
  const cuerpo = document.body;
  const ga4 = cuerpo.dataset.ga4 || "";
  const meta = cuerpo.dataset.meta || "";
  if (ga4) cargarGa4(ga4);
  if (meta) cargarMeta(meta);
}

function enviar(nombre: "contacto_whatsapp" | "contacto_llamada") {
  if (typeof window.gtag === "function") {
    window.gtag("event", nombre, { page_path: location.pathname });
  }
  if (typeof window.fbq === "function") {
    window.fbq("trackCustom", nombre === "contacto_whatsapp" ? "ContactoWhatsapp" : "ContactoLlamada");
  }
}

function banner(): HTMLElement | null {
  return document.getElementById("consent");
}

function mostrarBanner() {
  const nodo = banner();
  if (!nodo) return;
  nodo.hidden = false;
  document.body.classList.add("has-consent");
}

function ocultarBanner() {
  const nodo = banner();
  if (nodo) nodo.hidden = true;
  document.body.classList.remove("has-consent");
}

function hayIds(): boolean {
  const cuerpo = document.body;
  return Boolean(cuerpo.dataset.ga4 || cuerpo.dataset.meta);
}

export function iniciarSitio() {
  document.addEventListener("click", (event) => {
    const objetivo = event.target instanceof Element ? event.target : null;
    const rastreo = objetivo?.closest("[data-track]")?.getAttribute("data-track");
    if (rastreo === "whatsapp") enviar("contacto_whatsapp");
    if (rastreo === "llamada") enviar("contacto_llamada");

    const mapa = objetivo?.closest("[data-load-map]");
    if (mapa) cargarMapa(mapa);
  });

  if (!hayIds()) return;

  const decision = leer();
  if (decision === "aceptada") {
    cargarAnalitica();
  } else if (decision !== "rechazada") {
    mostrarBanner();
  }

  document.getElementById("consent-accept")?.addEventListener("click", () => {
    guardar("aceptada");
    ocultarBanner();
    cargarAnalitica();
  });
  document.getElementById("consent-reject")?.addEventListener("click", () => {
    guardar("rechazada");
    ocultarBanner();
  });
  document.getElementById("cookie-prefs")?.addEventListener("click", () => {
    mostrarBanner();
    document.getElementById("consent-accept")?.focus();
  });
}

function cargarMapa(boton: Element) {
  const raiz = boton.closest("[data-map]");
  const consulta = raiz?.getAttribute("data-map-query");
  const slot = raiz?.querySelector("[data-map-slot]");
  if (!consulta || !(slot instanceof HTMLElement) || slot.querySelector("iframe")) return;
  const marco = document.createElement("iframe");
  marco.src = `https://www.google.com/maps?q=${encodeURIComponent(consulta)}&hl=es&z=16&output=embed`;
  marco.title = "Mapa de la zona de MentalCareClinic en Tuxtla Gutiérrez. El número del predio está por confirmar.";
  marco.loading = "lazy";
  marco.referrerPolicy = "no-referrer-when-downgrade";
  marco.className = "map-frame";
  slot.hidden = false;
  slot.append(marco);
  if (boton instanceof HTMLElement) boton.hidden = true;
}

type Fbq = ((...args: unknown[]) => void) & {
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded?: boolean;
  version?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: Fbq;
  }
}
