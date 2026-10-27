const CLAVE = "mcc-cookies";

const DENEGADO = {
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: "denied",
  functionality_storage: "denied",
  personalization_storage: "denied",
  security_storage: "denied",
} as const;

type Decision = "aceptada" | "rechazada";

let decision: Decision | null = null;
let ga4Listo = false;

function leer(): Decision | null {
  try {
    const valor = localStorage.getItem(CLAVE);
    if (valor === "aceptada" || valor === "rechazada") return valor;
    return null;
  } catch {
    return null;
  }
}

function guardar(valor: Decision) {
  decision = valor;
  try {
    localStorage.setItem(CLAVE, valor);
  } catch {
    /* Sin almacenamiento no hay forma de recordar la decisión. */
  }
}

function idGa4(): string {
  return document.body.dataset.ga4 || "";
}

function asegurarGtag() {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
  }
}

function aplicarConsentimiento(analiticaConcedida: boolean) {
  asegurarGtag();
  window.gtag?.("consent", "default", DENEGADO);
  window.gtag?.("consent", "update", {
    ...DENEGADO,
    analytics_storage: analiticaConcedida ? "granted" : "denied",
  });
}

function cargarGa4(id: string) {
  aplicarConsentimiento(true);
  if (ga4Listo) return;
  ga4Listo = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  script.dataset.mccGa4 = id;
  document.head.appendChild(script);
  window.gtag?.("js", new Date());
  window.gtag?.("config", id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

function retirarAnalitica() {
  if (typeof window.gtag === "function") aplicarConsentimiento(false);
}

function enviar(nombre: "contacto_whatsapp" | "contacto_llamada") {
  if (decision !== "aceptada" || !ga4Listo || typeof window.gtag !== "function") return;
  window.gtag("event", nombre, { page_path: location.pathname });
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

function tipoDeEnlace(enlace: HTMLAnchorElement): "contacto_whatsapp" | "contacto_llamada" | null {
  const href = enlace.href;
  if (href.includes("wa.me/") || href.includes("api.whatsapp.com/")) return "contacto_whatsapp";
  if (href.startsWith("tel:")) return "contacto_llamada";
  return null;
}

export function iniciarSitio() {
  document.addEventListener("click", (event) => {
    const objetivo = event.target instanceof Element ? event.target : null;
    const enlace = objetivo?.closest("a");
    if (enlace instanceof HTMLAnchorElement) {
      const tipo = tipoDeEnlace(enlace);
      if (tipo) enviar(tipo);
    }
    const mapa = objetivo?.closest("[data-load-map]");
    if (mapa) cargarMapa(mapa);
  });

  const id = idGa4();
  if (!id) return;

  decision = leer();
  if (decision === "aceptada") cargarGa4(id);
  else if (decision !== "rechazada") mostrarBanner();

  document.getElementById("consent-accept")?.addEventListener("click", () => {
    guardar("aceptada");
    ocultarBanner();
    cargarGa4(id);
  });
  document.getElementById("consent-reject")?.addEventListener("click", () => {
    guardar("rechazada");
    ocultarBanner();
    retirarAnalitica();
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
  marco.title = "Mapa de ubicación de MentalCareClinic en Tuxtla Gutiérrez";
  marco.loading = "lazy";
  marco.referrerPolicy = "no-referrer-when-downgrade";
  marco.className = "map-frame";
  slot.hidden = false;
  slot.append(marco);
  if (boton instanceof HTMLElement) boton.hidden = true;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}
