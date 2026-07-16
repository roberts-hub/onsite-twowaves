/* ═══════════════════════════════════════════════
   ONSITE — interacciones
   Video de fondo · precarga · nav · rotador del
   hero · reveals · índice de eventos · statement
   ═══════════════════════════════════════════════ */

// ── VIDEO DEL HERO ────────────────────────────
// id de Vimeo, proporción real del video (ancho x alto) y segundo de arranque.
// "MAURET & CARLOS" — boda, 1:47.
const VIDEO_HERO = { id: "1210597438", aspecto: "1280x640", inicio: 10 };

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ── VIMEO: utilidades ─────────────────────────
function aVimeo(iframe, metodo, valor) {
  try {
    iframe.contentWindow.postMessage(
      JSON.stringify({ method: metodo, value: valor }), "*"
    );
  } catch (_) {}
}

/**
 * Iframe de Vimeo en modo fondo: silencioso, en loop, sin controles.
 * Si "conf.inicio" viene, el clip se queda en su tramo: cuando el loop
 * regresa al segundo 0, lo devolvemos al arranque.
 * "alArrancar" se llama la primera vez que hay imagen DENTRO del tramo,
 * para no revelar los segundos que queremos saltarnos.
 */
function crearVideoFondo(conf, alArrancar) {
  const iframe = document.createElement("iframe");
  iframe.src =
    "https://player.vimeo.com/video/" + conf.id +
    "?background=1&autoplay=1&muted=1&loop=1&autopause=0&playsinline=1&dnt=1" +
    (conf.inicio ? "#t=" + conf.inicio + "s" : "");
  iframe.allow = "autoplay; fullscreen";
  iframe.title = "";
  iframe.tabIndex = -1;
  iframe.setAttribute("aria-hidden", "true");

  const inicio = conf.inicio || 0;
  let arrancado = false;
  let ultimoSalto = 0;

  const saltarAlInicio = () => {
    if (Date.now() - ultimoSalto < 600) return; // no encimar saltos en vuelo
    ultimoSalto = Date.now();
    aVimeo(iframe, "setCurrentTime", inicio);
  };

  window.addEventListener("message", (ev) => {
    if (ev.source !== iframe.contentWindow) return;
    let d;
    try { d = JSON.parse(ev.data); } catch (_) { return; }
    if (d.event !== "playProgress" || !d.data) return;

    const s = d.data.seconds;
    const duracion = d.data.duration;

    // Damos la vuelta nosotros ANTES del final: si dejamos que Vimeo llegue
    // al 0, alcanza a verse un parpadeo del arranque que queremos saltarnos.
    if (inicio && duracion && s > duracion - 0.5) return saltarAlInicio();
    // Red por si aun así regresó al 0.
    if (inicio && s < inicio - 0.5) return saltarAlInicio();

    if (!arrancado) {
      arrancado = true;
      if (alArrancar) alArrancar();
    }
  });

  // el player solo manda eventos si se los pedimos
  iframe.addEventListener("load", () => aVimeo(iframe, "addEventListener", "playProgress"));

  return iframe;
}

// ── HERO: video de fondo ──────────────────────
const heroFondo = document.querySelector("[data-hero-fondo]");

if (heroFondo && VIDEO_HERO.id && !reducirMovimiento) {
  const [w, h] = VIDEO_HERO.aspecto.split(/[x:]/).map(Number);
  const ar = w && h ? w / h : 16 / 9;

  const iframe = crearVideoFondo(VIDEO_HERO, () => revelarHero());
  iframe.className = "hero_video";
  // recorte tipo "cover": el iframe siempre sobra por un lado
  iframe.style.width = "max(100vw, calc(100svh * " + ar + "))";
  iframe.style.height = "max(100svh, calc(100vw / " + ar + "))";

  // Aparece cuando YA está reproduciendo, para no mostrar un cuadro negro.
  // Al terminar el fundido se suelta la transición: un iframe a pantalla
  // completa con transición viva encarece cada repintado.
  let revelado = false;
  function revelarHero() {
    if (revelado) return;
    revelado = true;
    iframe.classList.add("visible");
    setTimeout(() => {
      iframe.style.transition = "none";
      document.querySelector(".hero").classList.add("video-listo");
    }, 1400);
  }

  // Sin respaldo por tiempo a propósito: sólo revelamos cuando el player
  // confirma que va corriendo DENTRO del tramo. En carga fría Vimeo puede
  // tardar >8s, y revelar antes dejaría ver el iframe en negro o los
  // segundos que queremos saltarnos. Si los eventos nunca llegan (pestaña
  // en segundo plano, API bloqueada), se queda la imagen de respaldo, que
  // es un cuadro del mismo film. En cuanto arranca, entra el video.
  heroFondo.appendChild(iframe);

  // Fuera de pantalla se pausa; al volver, sigue
  new IntersectionObserver(
    (entradas) => aVimeo(iframe, entradas[0].isIntersecting ? "play" : "pause"),
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
// La imagen entra al instante; si el evento trae video (data-video), el clip
// se reproduce encima en cuanto arranca y la caja toma su proporción.
const eventos = document.querySelectorAll(".evento");
const preview = document.getElementById("evento-preview");
const previewImg = preview.querySelector("img");
const conHover = window.matchMedia("(hover: hover) and (min-width: 861px)").matches;

if (conHover) {
  let videoPrev = null; // iframe del último evento con video
  let idPrev = null;

  const soltarVideo = () => {
    if (!videoPrev) return;
    videoPrev.classList.remove("visible");
    aVimeo(videoPrev, "pause");
  };

  eventos.forEach((evento) => {
    const fila = evento.querySelector(".evento_fila");

    fila.addEventListener("mouseenter", () => {
      previewImg.src = evento.dataset.img;
      preview.classList.add("visible");

      const id = evento.dataset.video;
      if (!id) {
        soltarVideo();
        preview.style.removeProperty("--ar-caja");
        return;
      }

      // la caja toma la proporción del video: se ve como cuadro de cine
      const [vw, vh] = (evento.dataset.videoAspecto || "16x9").split(/[x:]/).map(Number);
      preview.style.setProperty("--ar-caja", vw + " / " + vh);

      if (idPrev === id) {
        aVimeo(videoPrev, "play");
        videoPrev.classList.add("visible");
        return;
      }
      // se crea en el primer hover, no al cargar la página
      if (videoPrev) videoPrev.remove();
      const nuevo = crearVideoFondo(
        { id: id, inicio: Number(evento.dataset.videoInicio) || 0 },
        () => nuevo.classList.add("visible")
      );
      nuevo.className = "evento_preview_video";
      preview.appendChild(nuevo);
      videoPrev = nuevo;
      idPrev = id;
    });

    fila.addEventListener("mouseleave", () => {
      preview.classList.remove("visible");
      soltarVideo();
    });
  });

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
