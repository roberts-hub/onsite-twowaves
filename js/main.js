/* ═══════════════════════════════════════════════
   ONSITE — interacciones
   Precarga · nav · rotador del hero · reveals ·
   índice de eventos (preview + acordeón) · statement
   ═══════════════════════════════════════════════ */

// ── PRECARGA ──────────────────────────────────
const precarga = document.getElementById("precarga");
window.addEventListener("load", () => {
  setTimeout(() => {
    precarga.classList.add("fuera");
    document.body.classList.remove("cargando");
  }, 1600);
});
// red de seguridad por si "load" tarda demasiado (imágenes remotas)
setTimeout(() => {
  precarga.classList.add("fuera");
  document.body.classList.remove("cargando");
}, 4000);

// ── NAV: fondo al hacer scroll ────────────────
const nav = document.getElementById("nav");
const alScroll = () => nav.classList.toggle("pegada", window.scrollY > 30);
window.addEventListener("scroll", alScroll, { passive: true });
alScroll();

// ── MENÚ MÓVIL ────────────────────────────────
const hamburguesa = document.querySelector(".nav_hamburguesa");
hamburguesa.addEventListener("click", () => {
  const abierto = document.body.classList.toggle("menu-abierto");
  hamburguesa.setAttribute("aria-expanded", abierto);
});
document.querySelectorAll(".menu-movil a").forEach((a) =>
  a.addEventListener("click", () => {
    document.body.classList.remove("menu-abierto");
    hamburguesa.setAttribute("aria-expanded", "false");
  })
);

// ── HERO: línea rotativa ──────────────────────
const FRASES = [
  "your graduation.",
  "your wedding day.",
  "your brand event.",
  "your celebration.",
];
const rotador = document.querySelector("[data-rotador]");
let fraseIdx = 0;
setInterval(() => {
  rotador.classList.add("saliendo");
  setTimeout(() => {
    fraseIdx = (fraseIdx + 1) % FRASES.length;
    rotador.textContent = FRASES[fraseIdx];
    rotador.classList.remove("saliendo");
    rotador.classList.add("entrando");
    setTimeout(() => rotador.classList.remove("entrando"), 600);
  }, 450);
}, 3400);

// ── HERO: pausar fondo fuera de pantalla ──────
const hero = document.querySelector(".hero");
new IntersectionObserver(
  (entradas) => hero.classList.toggle("dormido", !entradas[0].isIntersecting),
  { threshold: 0 }
).observe(hero);

// ── REVEALS ───────────────────────────────────
const observador = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("visto");
        observador.unobserve(e.target);
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll(".revelar").forEach((el) => observador.observe(el));

// ── STATEMENT: palabras que se encienden ──────
const statement = document.querySelector("[data-palabras]");
if (statement) {
  const palabras = statement.textContent.trim().split(/\s+/);
  statement.textContent = "";
  palabras.forEach((p, i) => {
    const span = document.createElement("span");
    span.className = "palabra";
    span.textContent = p;
    statement.appendChild(span);
    if (i < palabras.length - 1) statement.appendChild(document.createTextNode(" "));
  });
  const spans = statement.querySelectorAll(".palabra");
  const obsStatement = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (e.isIntersecting) {
          spans.forEach((s, i) =>
            setTimeout(() => s.classList.add("encendida"), i * 110)
          );
          obsStatement.disconnect();
        }
      });
    },
    { threshold: 0.5 }
  );
  obsStatement.observe(statement);
}

// ── EVENTOS: acordeón + preview flotante ──────
const eventos = document.querySelectorAll(".evento");
const preview = document.getElementById("evento-preview");
const previewImg = preview.querySelector("img");
const conHover = window.matchMedia("(hover: hover) and (min-width: 861px)").matches;

eventos.forEach((evento) => {
  const fila = evento.querySelector(".evento_fila");

  fila.addEventListener("click", () => {
    const abierto = evento.classList.contains("abierto");
    eventos.forEach((e) => {
      e.classList.remove("abierto");
      e.querySelector(".evento_fila").setAttribute("aria-expanded", "false");
    });
    if (!abierto) {
      evento.classList.add("abierto");
      fila.setAttribute("aria-expanded", "true");
    }
  });

  if (conHover) {
    fila.addEventListener("mouseenter", () => {
      previewImg.src = evento.dataset.img;
      preview.classList.add("visible");
    });
    fila.addEventListener("mouseleave", () => preview.classList.remove("visible"));
  }
});

if (conHover) {
  window.addEventListener(
    "mousemove",
    (e) => {
      if (!preview.classList.contains("visible")) return;
      preview.style.left = e.clientX + 28 + "px";
      preview.style.top = e.clientY - preview.offsetHeight / 2 + "px";
    },
    { passive: true }
  );
}
