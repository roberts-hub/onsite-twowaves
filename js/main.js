/* ═══════════════════════════════════════════════
   ONSITE — interacciones
   Video de fondo · precarga · nav · rotador del
   hero · reveals · índice de eventos · statement
   ═══════════════════════════════════════════════ */

// ── VIDEO DEL HERO ────────────────────────────
// id de Vimeo, proporción real del video (ancho x alto) y segundo de arranque.
// En celular vertical va otro film: uno de 2:1 a pantalla completa en un
// teléfono deja ver solo el 23% del encuadre y obliga a renderizar un iframe
// de 1688px sobre una pantalla de 390. El reel 9:16 se ve al 82% y pesa menos.
// El póster del hero (index.html) cambia con la misma condición.
// arranca en el segundo 20 (momento elegido del film). Ojo: con offset, Vimeo
// empieza en 0 y hay que ordenarle saltar y bufferear ese punto, así que el
// primer cuadro tarda un poco más que en 0 — es el costo de elegir el inicio.
const VIDEO_ESCRITORIO = { id: "1210597438", aspecto: "1280x640", inicio: 20 };  // MAURET & CARLOS — boda, 1:47
// arranca en el 5: los primeros segundos traen el letrero de neón del festival
// y no queremos otra marca detrás de nuestro titular
const VIDEO_CELULAR = { id: "906462885", aspecto: "1280x2276", inicio: 5 };      // MITA SOUNDS 2023 — reel vertical, 0:24

const celularVertical = window.matchMedia("(max-width: 860px) and (orientation: portrait)").matches;
const VIDEO_HERO = celularVertical ? VIDEO_CELULAR : VIDEO_ESCRITORIO;

// Cuánto puede esperar la precarga a que el video arranque. El logo se
// queda mientras tanto, así al levantarse el hero ya tiene movimiento.
// El tope existe para no dejar a nadie viendo el logo si Vimeo va lento.
const MIN_PRECARGA = 2000;  // lo que tarda la animación del logo
const TOPE_PRECARGA = 7000;

const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Con ahorro de datos o red muy lenta no cargamos el video: son ~MB por
// visita y en esas condiciones ni alcanzaría a arrancar. Queda el póster.
const red = navigator.connection || {};
const redLenta = red.saveData === true || /2g/.test(red.effectiveType || "");

const heroFondo = document.querySelector("[data-hero-fondo]");
// Una sola verdad: la usan el hero y la precarga. Si estuviera escrita dos
// veces y divergieran, la precarga esperaría un video que nunca se creó.
const conVideoHero = !!(heroFondo && VIDEO_HERO.id && !reducirMovimiento && !redLenta);

// La precarga espera este aviso: "el hero ya tiene imagen en movimiento".
const heroListo = { ok: false, avisar: null };
function marcarHeroListo() {
  if (heroListo.ok) return;
  heroListo.ok = true;
  if (heroListo.avisar) heroListo.avisar();
}

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
if (conVideoHero) {
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
    // Si la precarga sigue arriba, el fundido no se vería: entra directo,
    // así al levantarse el logo el video ya está a pantalla completa.
    if (document.body.classList.contains("cargando")) iframe.style.transition = "none";
    iframe.classList.add("visible");
    setTimeout(() => {
      iframe.style.transition = "none";
      document.querySelector(".hero").classList.add("video-listo");
    }, 1400);
    marcarHeroListo();
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
// Se queda mientras el video del hero arranca en segundo plano, para que al
// levantarse ya haya imagen en movimiento y no un cuadro fijo. Nunca menos
// de lo que dura la animación del logo, ni más que TOPE_PRECARGA: si Vimeo
// va lento, se entra igual y el video se suma cuando llegue.
const precarga = document.getElementById("precarga");
const arrancoEn = Date.now();

function quitarPrecarga() {
  if (precarga.classList.contains("fuera")) return;
  precarga.classList.add("fuera");
  document.body.classList.remove("cargando");
}

// sin video (reduce-motion, red lenta o sin id) no hay nada que esperar
if (!conVideoHero) marcarHeroListo();

const esperaHero = new Promise((listo) => {
  if (heroListo.ok) return listo();
  heroListo.avisar = listo;
});
const topeEspera = new Promise((listo) => setTimeout(listo, TOPE_PRECARGA));

Promise.race([esperaHero, topeEspera]).then(() => {
  const falta = Math.max(0, MIN_PRECARGA - (Date.now() - arrancoEn));
  setTimeout(quitarPrecarga, falta);
});

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

// ── FUERA DE PANTALLA: dormir lo que se anima ──
// Animar cosas que nadie ve traba el scroll, sobre todo en celular.
const hero = document.querySelector(".hero");
new IntersectionObserver(
  (entradas) => hero.classList.toggle("dormido", !entradas[0].isIntersecting),
  { threshold: 0 }
).observe(hero);

const marquee = document.querySelector(".marquee");
new IntersectionObserver(
  (entradas) => marquee.classList.toggle("dormido", !entradas[0].isIntersecting),
  { threshold: 0 }
).observe(marquee);

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
  // fuera de pantalla no tiene sentido repintar (y en celular cuesta)
  if (hero.classList.contains("dormido")) return;
  rotador.classList.add("saliendo");
  setTimeout(() => {
    fraseIdx = (fraseIdx + 1) % FRASES.length;
    rotador.textContent = FRASES[fraseIdx];
    rotador.classList.remove("saliendo");
    rotador.classList.add("entrando");
    setTimeout(() => rotador.classList.remove("entrando"), 600);
  }, 450);
}, 3400);

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

// ── REPRODUCTOR ───────────────────────────────
// Los films abren aquí, no en Vimeo: mismo patrón que twowaves.mx.
// El href a Vimeo del enlace queda como respaldo si el JS no carga.
const repro = document.getElementById("reproductor");

if (repro) {
  const marco = repro.querySelector("[data-marco]");
  const elTitulo = repro.querySelector("[data-repro-titulo]");
  const elTipo = repro.querySelector("[data-repro-tipo]");
  const elDesc = repro.querySelector("[data-repro-desc]");

  // Nada debe seguir corriendo detrás del reproductor
  const pausarFondo = (metodo) => {
    document.querySelectorAll(".hero_video, .evento_preview_video").forEach((f) => aVimeo(f, metodo));
  };

  function abrirRepro(film) {
    const [w, h] = (film.dataset.videoAspecto || "16x9").split(/[x:]/).map(Number);
    marco.style.setProperty("--ar-film", w + " / " + h);
    elTitulo.textContent = film.dataset.titulo || "";
    elTipo.textContent = film.dataset.tipo || "—";
    elDesc.textContent = film.dataset.desc || "";

    // con controles y sonido: aquí sí se ve el film, no es un fondo
    marco.innerHTML =
      '<iframe src="https://player.vimeo.com/video/' + film.dataset.video +
      '?autoplay=1&title=0&byline=0&portrait=0&dnt=1" allow="autoplay; fullscreen; picture-in-picture" ' +
      'allowfullscreen title="' + (film.dataset.titulo || "") + '"></iframe>';

    pausarFondo("pause");
    document.body.style.overflow = "hidden";
    document.body.classList.add("repro-abierto");
    repro.showModal();
  }

  function cerrarRepro() {
    repro.classList.add("cerrando");
    setTimeout(() => {
      marco.innerHTML = ""; // detiene la reproducción
      repro.classList.remove("cerrando");
      repro.close();
      document.body.style.overflow = "";
      document.body.classList.remove("repro-abierto");
      pausarFondo("play");
    }, 320);
  }

  document.addEventListener("click", (e) => {
    const film = e.target.closest("[data-film]");
    if (film && film.dataset.video) {
      e.preventDefault();
      return abrirRepro(film);
    }
    if (e.target.closest("[data-cerrar-repro]")) cerrarRepro();
  });
  // Esc
  repro.addEventListener("cancel", (e) => {
    e.preventDefault();
    cerrarRepro();
  });
}

// ── EVENTOS: preview flotante al pasar el cursor ──
// La imagen entra al instante; si el evento trae video (data-video), el clip
// se reproduce encima en cuanto arranca y la caja toma su proporción.
const eventos = document.querySelectorAll(".evento");
const preview = document.getElementById("evento-preview");
const previewImg = preview.querySelector("img");
const conHover = window.matchMedia("(hover: hover) and (min-width: 861px)").matches;

if (conHover) {
  // Un iframe por evento, guardado tras el primer hover: alternar entre
  // eventos no debe recargar el player de Vimeo desde cero.
  const videos = new Map(); // id → iframe
  let activo = null;

  const apagar = () => {
    if (!activo) return;
    activo.classList.remove("visible");
    aVimeo(activo, "pause");
    activo = null;
  };

  eventos.forEach((evento) => {
    const fila = evento.querySelector(".evento_fila");

    fila.addEventListener("mouseenter", () => {
      previewImg.src = evento.dataset.img;
      preview.classList.add("visible");

      const id = evento.dataset.video;
      if (!id) {
        apagar();
        preview.style.removeProperty("--ar-caja");
        return;
      }

      // la caja toma la proporción del clip: se ve completo, sin recorte
      const [vw, vh] = (evento.dataset.videoAspecto || "16x9").split(/[x:]/).map(Number);
      preview.style.setProperty("--ar-caja", vw + " / " + vh);

      let vid = videos.get(id);
      if (vid && vid === activo) return;
      apagar();

      if (vid) {
        aVimeo(vid, "play");
        vid.classList.add("visible");
      } else {
        // se crea en el primer hover, no al cargar la página
        vid = crearVideoFondo(
          { id: id, inicio: Number(evento.dataset.videoInicio) || 0 },
          () => vid.classList.add("visible")
        );
        vid.className = "evento_preview_video";
        preview.appendChild(vid);
        videos.set(id, vid);
      }
      activo = vid;
    });

    fila.addEventListener("mouseleave", () => {
      preview.classList.remove("visible");
      apagar();
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
