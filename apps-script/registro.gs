/**
 * ONSITE — cotizaciones de onsite.twowaves.mx
 *
 * Proyecto INDEPENDIENTE (standalone), a propósito: el libro ya tiene un
 * script con el formulario de contacto de twowaves.mx, y ese script define
 * su propio doPost. Dos doPost en un mismo proyecto se pisan (comparten
 * espacio de nombres), así que meter esto ahí habría roto la captura de
 * leads del sitio principal. Aquí abrimos el libro por id y ya.
 *
 * LIBRO: "TW WEBSITE - DATABASE"
 * https://docs.google.com/spreadsheets/d/1ncotVVLgss4tsZsSJJZN7o1GBF4ewsXsFGHjgLWX7KY/edit
 *
 * CÓMO CONECTARLO (5 min):
 * 1. script.new  (proyecto NUEVO e independiente; NO el del libro).
 * 2. Pega este archivo completo. Nómbralo "ONSITE — cotizaciones". Guarda.
 * 3. Elige la función "configurarHoja" y dale Ejecutar → autoriza los permisos.
 *    Crea la pestaña ONSITE con el mismo formato que la del sitio principal.
 * 4. Implementar → Nueva implementación → engrane → "Aplicación web":
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier persona
 * 5. Copia la URL del web app (termina en /exec) y pégala en
 *    js/form.js → SHEETS_ENDPOINT.
 * 6. Corre "probar": debe aparecer la fila y llegarte el correo.
 *
 * OJO: al editar este código hay que crear una NUEVA implementación (o
 * actualizar la existente) para que los cambios salgan en vivo.
 */

var LIBRO_ID = "1ncotVVLgss4tsZsSJJZN7o1GBF4ewsXsFGHjgLWX7KY";
var HOJA = "ONSITE";                  // pestaña propia: NUNCA la del otro formulario
var CORREO_AVISO = "info@twowaves.mx";
var ZONA = "America/Mexico_City";

// El cuestionario de quote.html, en orden
var COLUMNAS = ["fecha_envio", "nombre", "tipo", "fecha", "lugar", "detalles", "email", "telefono"];
var ENCABEZADOS = [
  "FECHA DE ENVÍO", "NOMBRE", "TIPO DE EVENTO", "FECHA DEL EVENTO",
  "LUGAR", "DETALLES", "EMAIL", "TELÉFONO", "ESTADO",
];
var ANCHOS = [150, 170, 140, 160, 230, 340, 210, 140, 130];
var ESTADOS = ["Nuevo", "Contactado", "Cotizado", "Cerrado", "Perdido"];

// Respaldo por si no hubiera de dónde copiar el formato
var NEGRO = "#000000";
var CREMA = "#ffffff";
var AMBAR = "#c49a62";

function libro_() {
  return SpreadsheetApp.openById(LIBRO_ID);
}

/**
 * La pestaña de ONSITE. Si no existe la crea AL FINAL, nunca al principio:
 * el script del sitio principal escribe en getSheets()[0], así que una
 * pestaña nueva en el índice 0 desviaría sus leads hacia acá.
 */
function hojaOnsite_(libro) {
  return libro.getSheetByName(HOJA) || libro.insertSheet(HOJA, libro.getNumSheets());
}

/** Lee el estilo del encabezado de la pestaña del sitio principal. */
function estiloVecino_(libro) {
  var hojas = libro.getSheets();
  for (var i = 0; i < hojas.length; i++) {
    if (hojas[i].getName() === HOJA) continue;
    if (hojas[i].getLastColumn() === 0) continue; // vacía: nada que copiar
    var cab = hojas[i].getRange(1, 1, 1, Math.max(1, hojas[i].getLastColumn()));
    return {
      fondo: cab.getBackground(),
      color: cab.getFontColor(),
      peso: cab.getFontWeight(),
      tamano: cab.getFontSize(),
      fuente: cab.getFontFamily(),
      alineacion: cab.getHorizontalAlignment(),
      alto: hojas[i].getRowHeight(1),
      congeladas: hojas[i].getFrozenRows() || 1,
      conBandas: hojas[i].getBandings().length > 0,
      de: hojas[i].getName(),
    };
  }
  return null;
}

/**
 * Deja la pestaña ONSITE lista y con el formato de su vecina.
 * Es idempotente: se puede correr las veces que quieras.
 */
function configurarHoja() {
  var libro = libro_();
  var estilo = estiloVecino_(libro);   // se lee ANTES de crear la nuestra
  var hoja = hojaOnsite_(libro);

  // ── encabezados ──
  if (hoja.getMaxColumns() < ENCABEZADOS.length) {
    hoja.insertColumnsAfter(hoja.getMaxColumns(), ENCABEZADOS.length - hoja.getMaxColumns());
  }
  hoja.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]);
  if (hoja.getMaxColumns() > ENCABEZADOS.length) {
    hoja.deleteColumns(ENCABEZADOS.length + 1, hoja.getMaxColumns() - ENCABEZADOS.length);
  }

  // ── franja de encabezado: copiada de la pestaña del sitio principal ──
  var cabecera = hoja.getRange(1, 1, 1, ENCABEZADOS.length);
  if (estilo) {
    cabecera
      .setBackground(estilo.fondo)
      .setFontColor(estilo.color)
      .setFontWeight(estilo.peso)
      .setFontSize(estilo.tamano)
      .setFontFamily(estilo.fuente)
      .setHorizontalAlignment(estilo.alineacion)
      .setVerticalAlignment("middle");
    hoja.setRowHeight(1, estilo.alto);
    hoja.setFrozenRows(estilo.congeladas);
  } else {
    cabecera
      .setBackground(NEGRO).setFontColor(CREMA).setFontWeight("bold")
      .setFontSize(11).setVerticalAlignment("middle").setHorizontalAlignment("left");
    hoja.setRowHeight(1, 38);
    hoja.setFrozenRows(1);
  }

  for (var i = 0; i < ANCHOS.length; i++) hoja.setColumnWidth(i + 1, ANCHOS[i]);

  var maxFilas = hoja.getMaxRows();
  var cuerpo = hoja.getRange(2, 1, maxFilas - 1, ENCABEZADOS.length);

  // ── bandas alternadas (sin encimar las previas) ──
  var bandas = hoja.getBandings();
  for (var b = 0; b < bandas.length; b++) bandas[b].remove();
  if (!estilo || estilo.conBandas) {
    cuerpo.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
  }

  // ── legibilidad ──
  cuerpo.setVerticalAlignment("top").setFontSize(10);
  hoja.getRange(2, 1, maxFilas - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm"); // fecha de envío
  hoja.getRange(2, 5, maxFilas - 1, 1).setWrap(true);                       // lugar
  hoja.getRange(2, 6, maxFilas - 1, 1).setWrap(true);                       // detalles
  hoja.getRange(2, 2, maxFilas - 1, 7).setNumberFormat("@");                // texto: no "arreglar" teléfonos

  // ── ESTADO: menú para dar seguimiento ──
  var regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(ESTADOS, true).setAllowInvalid(false).build();
  var rangoEstado = hoja.getRange(2, 9, maxFilas - 1, 1);
  rangoEstado.setDataValidation(regla).setHorizontalAlignment("center");

  hoja.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Nuevo").setBackground(AMBAR).setFontColor("#000000").setBold(true)
      .setRanges([rangoEstado]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Cerrado").setBackground("#d9ead3").setRanges([rangoEstado]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Perdido").setBackground("#efefef").setFontColor("#888888")
      .setRanges([rangoEstado]).build(),
  ]);

  var filtro = hoja.getFilter();
  if (filtro) filtro.remove();
  hoja.getRange(1, 1, maxFilas, ENCABEZADOS.length).createFilter();

  SpreadsheetApp.flush();
  return estilo
    ? "Pestaña ONSITE lista, con el formato de '" + estilo.de + "'"
    : "Pestaña ONSITE lista (sin vecina de la cual copiar)";
}

/** Recibe la cotización de quote.html. */
function doPost(e) {
  var datos = (e && e.parameter) || {};

  var candado = LockService.getScriptLock();
  try { candado.waitLock(20000); } catch (err) {}

  try {
    var libro = libro_();
    var hoja = libro.getSheetByName(HOJA);
    // Por NOMBRE, nunca por índice ni getActiveSheet().
    if (!hoja || hoja.getLastRow() === 0) {
      configurarHoja();
      hoja = libro.getSheetByName(HOJA);
    }

    var fila = COLUMNAS.map(function (campo) {
      if (campo === "fecha_envio") return new Date();
      return (datos[campo] || "").toString().trim();
    });
    fila.push("Nuevo"); // ESTADO

    hoja.appendRow(fila);
    SpreadsheetApp.flush(); // que quede escrito antes de responder
  } catch (err) {
    return respuesta_({ ok: false, error: String(err) });
  } finally {
    try { candado.releaseLock(); } catch (err2) {}
  }

  // Aparte y después: si el correo falla, la fila ya está guardada.
  try { avisar_(datos); } catch (err3) {}

  return respuesta_({ ok: true });
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Correo del lead: se responde directo al cliente y trae todo a la vista. */
function avisar_(d) {
  var libro = libro_();
  var hoja = libro.getSheetByName(HOJA);
  var enlaceHoja = libro.getUrl() + "#gid=" + hoja.getSheetId();

  var tipo = d.tipo || "evento";
  var nombre = d.nombre || "(sin nombre)";
  var tel = (d.telefono || "").replace(/[^0-9]/g, "");
  var wa = tel ? "https://wa.me/" + (tel.length === 10 ? "52" + tel : tel) : "";

  var filas = [
    ["Tipo de evento", d.tipo], ["Fecha del evento", d.fecha], ["Lugar", d.lugar],
    ["Detalles", d.detalles], ["Email", d.email], ["Teléfono", d.telefono],
  ];
  var html = '<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px">' +
    '<p style="font-size:12px;letter-spacing:.12em;color:#888;margin:0 0 4px">( ONSITE ) NUEVA COTIZACIÓN</p>' +
    '<h2 style="margin:0 0 16px;font-size:22px">' + nombre + ' — ' + tipo + '</h2>' +
    '<table cellpadding="6" style="border-collapse:collapse;font-size:14px">';
  for (var i = 0; i < filas.length; i++) {
    html += '<tr><td style="color:#888;white-space:nowrap;vertical-align:top">' + filas[i][0] +
            '</td><td><b>' + (filas[i][1] || "—") + '</b></td></tr>';
  }
  html += '</table><p style="margin:18px 0 0">' +
    (d.email ? '<a href="mailto:' + d.email + '">Responder por correo</a>' : "") +
    (wa ? ' &nbsp;·&nbsp; <a href="' + wa + '">WhatsApp</a>' : "") +
    ' &nbsp;·&nbsp; <a href="' + enlaceHoja + '">Ver en el Sheet</a></p>' +
    '<p style="color:#aaa;font-size:12px;margin-top:18px">onsite.twowaves.mx</p></div>';

  var texto = "( ONSITE ) Nueva cotización\n\n" +
    "Nombre: " + nombre + "\nTipo: " + (d.tipo || "-") + "\nFecha: " + (d.fecha || "-") +
    "\nLugar: " + (d.lugar || "-") + "\nDetalles: " + (d.detalles || "-") +
    "\nEmail: " + (d.email || "-") + "\nTeléfono: " + (d.telefono || "-") +
    "\n\nVer en el Sheet: " + enlaceHoja;

  MailApp.sendEmail({
    to: CORREO_AVISO,
    subject: "( ONSITE ) Nueva cotización — " + tipo + " · " + nombre,
    body: texto,
    htmlBody: html,
    name: "ONSITE — onsite.twowaves.mx",
    replyTo: d.email || CORREO_AVISO, // responder va directo al cliente
  });
}

/** Prueba de punta a punta desde el editor. */
function probar() {
  var r = doPost({ parameter: {
    nombre: "Prueba ONSITE", tipo: "Wedding", fecha: "Dec 12, 2026",
    lugar: "Guadalajara — Hacienda El Carmen", detalles: "Fila de prueba: bórrala",
    email: "prueba@ejemplo.com", telefono: "3312345678",
  }});
  Logger.log(r.getContent()); // debe decir {"ok":true}
}
