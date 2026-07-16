/* ═══════════════════════════════════════════════
   ONSITE — interacciones
   Precarga · nav · rotador del hero · reveals ·
   índice de eventos (preview + acordeón) · statement
   ═══════════════════════════════════════════════ */

// ── VIDEO DEL HERO ────────────────────────────
// PLACEHOLDER: cambiar el id por el video de eventos de ONSITE.
// "aspecto" son las dimensiones reales del video (ancho x alto).
const VIDEO_HERO = { id: "997119368", aspecto: "3840x1920" };

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroFondo = document.querySelector("[data-hero-fondo]");

if (heroFondo && VIDEO_HERO.id && !reducirMovimiento) {
  const [w, h] = VIDEO_HERO.aspecto.split(/[x:]/).map(Number);
  const ar = w && h ? w / h : 16 / 9;

  const iframe = document.createElement("iframe");
  // Modo fondo de Vimeo: autoplay silencioso, en loop, sin controles ni pausa automática
  iframe.src =
    "https://player.vimeo.com/video/" + VIDEO_HERO.id +
    "?background=1&autoplay=1&muted=1&loop=1&autopause=0&playsinline=1&dnt=1";
  iframe.className = "hero_video";
  iframe.allow = "autoplay; fullscreen";
  iframe.title = "";
  iframe.tabIndex = -1;
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.width = "max(100vw, calc(100svh * " + ar + "))";
  iframe.style.height = "max(100svh, calc(100vw / " + ar + "))";

  // Aparece cuando YA está reproduciendo, para no mostrar un cuadro negro.
  // Al terminar el fundido se suelta la transición: un iframe a pantalla
  // completa con transición viva encarece cada repintado.
  let revelado = false;
  const revelar = () => {
    if (revelado) return;
    revelado = true;
    iframe.classList.add("visible");
    setTimeout(() => {
      iframe.style.transition = "none";
      document.querySelector(".hero").classList.add("video-listo");
    }, 1400);
  };

  const alMensaje = (ev) => {
    if (ev.source !== iframe.contentWindow) return;
    let d;
    try { d = JSON.parse(ev.data); } catch (_) { return; }
    if (d.event === "playProgress" || d.event === "timeupdate") {
      revelar();
      window.removeEventListener("message", alMensaje);
    }
  };
  window.addEventListener("message", alMensaje);

  iframe.addEventListener("load", () => {
    try {
      iframe.contentWindow.postMessage(
        JSON.stringify({ method: "addEventListener", value: "playProgress" }), "*"
      );
    } catch (_) {}
  });

  // Respaldo, aparte del "load": si los eventos de Vimeo no llegan, revela igual.
  // Si la pestaña abrió en segundo plano el video no arranca y el navegador
  // congela los timers, así que ahí esperamos a que se vea de verdad.
  setTimeout(() => {
    if (document.visibilityState === "visible") return revelar();
    document.addEventListener("visibilitychange", function alVerse() {
      if (document.visibilityState !== "visible") return;
      document.removeEventListener("visibilitychange", alVerse);
      setTimeout(revelar, 1500); // margen para que Vimeo arranque solo
    });
  }, 4000);

  heroFondo.appendChild(iframe);

  // Fuera de pantalla se pausa; al volver, sigue
  new IntersectionObserver(
    (entradas) => {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        JSON.stringify({ method: entradas[0].isIntersecting ? "play" : "pause" }), "*"
      );
    },
    { threshold: 0 }
  ).observe(heroFondo);
}

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

// ── EVENTOS: preview flotante al pasar el cursor ──
const eventos = document.querySelectorAll(".evento");
const preview = document.getElementById("evento-preview");
const previewImg = preview.querySelector("img");
const conHover = window.matchMedia("(hover: hover) and (min-width: 861px)").matches;

if (conHover) {
  eventos.forEach((evento) => {
    const fila = evento.querySelector(".evento_fila");
    fila.addEventListener("mouseenter", () => {
      previewImg.src = evento.dataset.img;
      preview.classList.add("visible");
    });
    fila.addEventListener("mouseleave", () => preview.classList.remove("visible"));
  });
}

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
