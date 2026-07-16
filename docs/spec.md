# ONSITE — Landing de eventos (spec)

Fecha: 2026-07-16 · Aprobado en conversación con Roberto.

## Qué es

Landing page de **ONSITE** (marca de eventos de Two Waves): fotografía y video
para graduaciones, bodas, eventos corporativos y sociales. Sitio estático
(HTML/CSS/JS, sin frameworks), repo propio con GitHub Pages, dominio
`onsite.twowaves.mx` (CNAME en Squarespace DNS → GitHub Pages).

## Decisiones

- **Idioma:** inglés (consistente con twowaves.mx).
- **Conversión principal:** formulario de cotización multi-paso (estilo
  Typeform, adaptado del mastermind) → Apps Script → Google Sheet + correo.
  WhatsApp flotante como canal secundario (+52 33 3129 0485).
- **Identidad:** logos de la carpeta del Desktop (wordmark extendida +
  paréntesis). Crema `#f2ecdf` sobre negro cálido `#0b0a08`, acento ámbar
  discreto. Tipografía: Archivo (eje de anchura, Expanded Black para títulos,
  como la wordmark), Instrument Serif itálica para palabras emotivas,
  IBM Plex Mono para etiquetas. Motivo `( … )` como elemento de UI.
- **Estética:** oscura y moody pero profesional (ref: IG @onsite.tw).
- **Videos:** placeholders con miniaturas del portafolio de Two Waves,
  marcados con `PLACEHOLDER` en el HTML; se reemplazan cuando Roberto pase
  los links reales de Vimeo/YouTube.

## Secciones

1. Preloader breve con paréntesis + wordmark.
2. Nav: logo, links ancla (Work, Events, Process, Contact), CTA "Get a quote",
   sello "by Two Waves".
3. Hero: fondo cinematográfico con zoom lento + grain, titular grande con
   línea rotativa por tipo de evento, CTA.
4. Marquee de tipos de evento con motivo de paréntesis.
5. Event types: índice editorial interactivo (hover = preview de imagen
   flotante; click = expande detalle). Graduations / Weddings / Corporate /
   Social & more.
6. Statement grande con reveal por palabra (estilo mastermind).
7. Recent events: grid de videos (placeholders).
8. Process: 3 pasos ( 01 ) ( 02 ) ( 03 ).
9. Quote form multi-paso: nombre → tipo de evento → fecha → ciudad/venue →
   detalles → contacto. Endpoint Apps Script en `js/form.js`
   (`SHEETS_ENDPOINT`, vacío hasta crear el script; mientras, fallback a
   WhatsApp).
10. Footer: logo, by Two Waves (link a twowaves.mx), Instagram, correo.

## Publicación (pendiente de confirmación)

Crear repo en GitHub (roberts-hub), activar Pages, agregar CNAME
`onsite.twowaves.mx` y registro CNAME en Squarespace DNS.
