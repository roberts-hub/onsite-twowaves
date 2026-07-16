/* ═══════════════════════════════════════════════
   COTIZACIÓN (quote.html) — flujo multi-paso, una
   pregunta a la vez → Google Sheets vía Apps Script.
   Mismo patrón que el formulario de twowaves.mx:
   POST con URLSearchParams y no-cors.
   Sin endpoint configurado cae a WhatsApp con el
   resumen, para no perder al cliente.
   ═══════════════════════════════════════════════ */

// Pega aquí la URL del web app de Apps Script (termina en /exec).
// Ver apps-script/registro.gs para el código y los pasos.
const SHEETS_ENDPOINT = "";

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
    const texto = encodeURIComponent(
      "Hi! I'd like a quote for my event:\n" +
        "— Name: " + datos.nombre + "\n— Type: " + datos.tipo +
        "\n— Date: " + datos.fecha + "\n— Place: " + datos.lugar +
        "\n— Details: " + (datos.detalles || "-") + "\n— Email: " + datos.email +
        (datos.telefono ? "\n— Phone: " + datos.telefono : "")
    );
    window.open("https://wa.me/" + WHATSAPP + "?text=" + texto, "_blank", "noopener");
    abrirModal();
    return;
  }

  enviando = true;
  estado.textContent = "Sending…";
  try {
    // no-cors: no leemos la respuesta, pero el POST llega y se procesa.
    // El doPost guarda la fila y manda el aviso por correo.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    await fetch(SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      signal: ctrl.signal,
      body: new URLSearchParams(datos),
    });
    clearTimeout(t);
  } catch (_) {
    /* red lenta o caída: el POST pudo haber llegado igual; seguimos */
  }
  enviando = false;
  form.reset();
  mostrar(0, false);
  abrirModal();
});

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
