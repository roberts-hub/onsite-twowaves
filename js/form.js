/* ═══════════════════════════════════════════════
   COTIZACIÓN — flujo multi-paso (una pregunta a la
   vez) → Google Sheets vía Apps Script.
   Sin endpoint configurado, cae a WhatsApp con el
   resumen de respuestas para no perder al cliente.
   ═══════════════════════════════════════════════ */

// Pega aquí la URL del web app de Apps Script
// (ver apps-script/registro.gs para el código y pasos)
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
  if (!enfocar) return; // al cargar la página no roba el foco (scrollearía hasta aquí)
  const campo = pasos[i].querySelector("input:not([type=radio]), textarea");
  if (campo) setTimeout(() => campo.focus({ preventScroll: true }), 80);
}

function pasoValido(i) {
  const campos = pasos[i].querySelectorAll("input, textarea");
  // radios: basta con que haya uno seleccionado en el grupo
  const radios = pasos[i].querySelectorAll("input[type=radio]");
  if (radios.length) {
    const marcado = [...radios].some((r) => r.checked);
    if (!marcado) {
      estado.textContent = "Pick one to continue";
      return false;
    }
    return true;
  }
  for (const c of campos) {
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

  const datos = Object.fromEntries(new FormData(form).entries());

  // sin endpoint: abre WhatsApp con el resumen (el sitio funciona desde el día uno)
  if (!SHEETS_ENDPOINT) {
    const texto = encodeURIComponent(
      `Hi! I'd like a quote for my event:\n` +
        `— Name: ${datos.nombre}\n— Type: ${datos.tipo}\n— Date: ${datos.fecha}\n` +
        `— Place: ${datos.lugar}\n— Details: ${datos.detalles || "-"}\n` +
        `— Email: ${datos.email}${datos.telefono ? "\n— Phone: " + datos.telefono : ""}`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${texto}`, "_blank", "noopener");
    abrirModal();
    return;
  }

  enviando = true;
  estado.textContent = "Sending…";
  try {
    await fetch(SHEETS_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos),
    });
    abrirModal();
    form.reset();
    mostrar(0, false);
  } catch {
    estado.textContent = "Something failed — try WhatsApp below.";
  } finally {
    enviando = false;
  }
});

// ── MODAL ─────────────────────────────────────
function abrirModal() {
  modal.hidden = false;
  modal.querySelector("[data-cerrar-modal]").focus();
}
modal.querySelector("[data-cerrar-modal]").addEventListener("click", () => {
  modal.hidden = true;
});
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.hidden = true;
});

mostrar(0, false);
