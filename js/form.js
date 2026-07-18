/* ═══════════════════════════════════════════════
   COTIZACIÓN (quote.html) — flujo multi-paso, una
   pregunta a la vez → Google Sheets vía Apps Script.
   El envío NO es a ciegas: leemos la confirmación
   del script y, si no quedó guardado, el resumen se
   va por WhatsApp. Un lead nunca se pierde callado.
   ═══════════════════════════════════════════════ */

// URL del web app de Apps Script (proyecto "ONSITE - cotizaciones", desplegado
// como app web con acceso "Cualquiera"). Ver apps-script/registro.gs.
const SHEETS_ENDPOINT = "https://script.google.com/macros/s/AKfycbwYSs8jiqjHcdm_-yycCDLyLCxWZxP4MOOhCA5_Q505wW7fak9gwvJOPsWhEnluHbW31g/exec";

const WHATSAPP = "523331290485";

const form = document.getElementById("form-cotiza");
const estado = document.getElementById("form-estado");
const pasos = Array.from(form.querySelectorAll("[data-paso]"));
const fill = form.querySelector(".flujo_fill");
const atras = form.querySelector(".flujo_atras");
const siguiente = form.querySelector(".flujo_siguiente");
const modal = document.getElementById("modal-gracias");

let actual = 0;
let enviando = false;

// ── NAVEGACIÓN ENTRE PASOS ────────────────────
function mostrar(i, enfocar = true) {
  actual = i;
  pasos.forEach((p, n) => p.classList.toggle("activa", n === i));
  fill.style.width = ((i + 1) / pasos.length) * 100 + "%";
  atras.classList.toggle("visible", i > 0);
  form.classList.toggle("final", i === pasos.length - 1);
  estado.textContent = "";
  if (!enfocar) return; // al cargar la página no roba el foco
  const campo = pasos[i].querySelector("input:not([type=radio]), textarea");
  if (campo) setTimeout(() => campo.focus({ preventScroll: true }), 80);
}

function pasoValido(i) {
  // radios: basta con que haya uno seleccionado en el grupo
  const radios = pasos[i].querySelectorAll("input[type=radio]");
  if (radios.length) {
    if (![...radios].some((r) => r.checked)) {
      estado.textContent = "Pick one to continue";
      return false;
    }
    return true;
  }
  for (const c of pasos[i].querySelectorAll("input, textarea")) {
    if (!c.checkValidity()) {
      c.reportValidity();
      c.classList.add("invalido");
      return false;
    }
    c.classList.remove("invalido");
  }
  return true;
}

siguiente.addEventListener("click", () => {
  if (pasoValido(actual) && actual < pasos.length - 1) mostrar(actual + 1);
});
atras.addEventListener("click", () => {
  if (actual > 0) mostrar(actual - 1);
});

// Enter avanza (excepto en textarea)
form.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
    e.preventDefault();
    if (actual < pasos.length - 1) siguiente.click();
    else form.requestSubmit();
  }
});

// elegir chip avanza solo
form.querySelectorAll("input[type=radio]").forEach((r) =>
  r.addEventListener("change", () => setTimeout(() => siguiente.click(), 250))
);

// ── ENVÍO ─────────────────────────────────────
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!pasoValido(actual) || enviando) return;

  const d = new FormData(form);
  const datos = {
    nombre: d.get("nombre") || "",
    tipo: d.get("tipo") || "",
    fecha: d.get("fecha") || "",
    lugar: d.get("lugar") || "",
    detalles: d.get("detalles") || "",
    email: d.get("email") || "",
    telefono: d.get("telefono") || "",
  };

  // Sin endpoint: abre WhatsApp con el resumen (el sitio sirve desde el día uno)
  if (!SHEETS_ENDPOINT) {
    aWhatsApp(datos);
    abrirModal();
    return;
  }

  enviando = true;
  estado.textContent = "Sending…";

  const resultado = await enviarAlSheet(datos);
  enviando = false;

  if (resultado === "confirmado") {
    form.reset();
    mostrar(0, false);
    abrirModal();
    return;
  }

  // No pudimos confirmar que quedó guardado: no dejamos ir al cliente.
  // Un contacto duplicado es mucho mejor que un lead perdido.
  estado.textContent = "Couldn't reach us — opening WhatsApp…";
  aWhatsApp(datos);
  abrirModal();
});

/**
 * Manda la cotización al Apps Script y DEVUELVE SI QUEDÓ GUARDADA.
 * Con URLSearchParams la petición es "simple" (sin preflight) y el web app
 * responde con Access-Control-Allow-Origin: *, así que sí podemos leer el
 * {"ok":true}. Con no-cors se enviaba a ciegas: si el script fallaba, el
 * lead se perdía en silencio y el cliente veía "gracias".
 * No reintentamos: un reintento tras un error que en realidad sí llegó
 * duplicaría la fila.
 */
async function enviarAlSheet(datos) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const r = await fetch(SHEETS_ENDPOINT, {
      method: "POST",
      body: new URLSearchParams(datos),
      redirect: "follow", // /exec redirige a googleusercontent
      signal: ctrl.signal,
    });
    const txt = await r.text();
    return /"ok"\s*:\s*true/.test(txt) ? "confirmado" : "rechazado";
  } catch (_) {
    return "sin-confirmar"; // pudo llegar o no; tratamos como no llegó
  } finally {
    clearTimeout(t);
  }
}

/** Red de seguridad: el resumen se va por WhatsApp y el lead no se pierde. */
function aWhatsApp(d) {
  const texto = encodeURIComponent(
    "Hi! I'd like a quote for my event:\n" +
      "— Name: " + d.nombre + "\n— Type: " + d.tipo +
      "\n— Date: " + d.fecha + "\n— Place: " + d.lugar +
      "\n— Details: " + (d.detalles || "-") + "\n— Email: " + d.email +
      (d.telefono ? "\n— Phone: " + d.telefono : "")
  );
  window.open("https://wa.me/" + WHATSAPP + "?text=" + texto, "_blank", "noopener");
}

// ── MODAL ─────────────────────────────────────
function abrirModal() {
  modal.hidden = false;
  const foco = modal.querySelector("a, button");
  if (foco) foco.focus();
}
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.hidden = true;
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modal.hidden) modal.hidden = true;
});

mostrar(0, false);
