/**
 * ONSITE — cotizaciones de onsite.twowaves.mx
 *
 * Vive en el MISMO libro que los leads del sitio principal, en su propia
 * pestaña, y copia el formato de la pestaña que ya existe para que las dos
 * se vean iguales.
 *
 * LIBRO:
 * https://docs.google.com/spreadsheets/d/1ncotVVLgss4tsZsSJJZN7o1GBF4ewsXsFGHjgLWX7KY/edit
 *
 * CÓMO CONECTARLO (5 min):
 * 1. Abre el libro de arriba.
 * 2. Extensiones → Apps Script.
 * 3. Pega este archivo completo (si ya hay código de otro formulario, agrégalo
 *    como archivo nuevo: + → Script, y nómbralo "onsite"). Guarda.
 * 4. Elige la función "configurarHoja" y dale Ejecutar.
 *      → autoriza los permisos (advierte que la app no está verificada:
 *        Configuración avanzada → Ir a ...).
 *      → crea la pestaña ONSITE con encabezados y formato.
 * 5. Implementar → Nueva implementación → engrane → "Aplicación web":
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier persona
 * 6. Copia la URL del web app (termina en /exec).
 * 7. Pégala en js/form.js → SHEETS_ENDPOINT.
 * 8. Corre "probar" y revisa que aparezca la fila de prueba y te llegue el correo.
 *
 * OJO: al editar este código hay que crear una NUEVA implementación (o
 * actualizar la existente) para que los cambios salgan en vivo.
 */

var HOJA = "ONSITE";                  // pestaña propia: NUNCA escribimos en la del otro formulario
var CORREO_AVISO = "contacto@twowaves.mx";
var ZONA = "America/Mexico_City";

// El cuestionario de quote.html, en orden
var COLUMNAS = ["fecha_envio", "nombre", "tipo", "fecha", "lugar", "detalles", "email", "telefono"];
var ENCABEZADOS = [
  "FECHA DE ENVÍO", "NOMBRE", "TIPO DE EVENTO", "FECHA DEL EVENTO",
  "LUGAR", "DETALLES", "EMAIL", "TELÉFONO", "ESTADO",
];
var ANCHOS = [150, 170, 140, 160, 230, 340, 210, 140, 130];
var ESTADOS = ["Nuevo", "Contactado", "Cotizado", "Cerrado", "Perdido"];

// Respaldo por si la pestaña de al lado no tuviera formato del cual copiar
var NEGRO = "#0b0a08";
var CREMA = "#f2ecdf";
var AMBAR = "#c49a62";

/** La pestaña de ONSITE. La crea si no existe. */
function hojaOnsite_(libro) {
  return libro.getSheetByName(HOJA) || libro.insertSheet(HOJA);
}

/**
 * Lee el estilo del encabezado de la pestaña que ya existe, para que la de
 * ONSITE se vea igual sin tener que adivinar colores.
 */
function estiloVecino_(libro) {
  var hojas = libro.getSheets();
  for (var i = 0; i < hojas.length; i++) {
    if (hojas[i].getName() === HOJA) continue;
    if (hojas[i].getLastRow() === 0) continue; // vacía: no hay nada que copiar
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
 * Deja la pestaña ONSITE lista y con el mismo formato que su vecina.
 * Es idempotente: se puede correr las veces que quieras.
 */
function configurarHoja() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = hojaOnsite_(libro);
  var estilo = estiloVecino_(libro);

  // ── encabezados ──
  if (hoja.getMaxColumns() < ENCABEZADOS.length) {
    hoja.insertColumnsAfter(hoja.getMaxColumns(), ENCABEZADOS.length - hoja.getMaxColumns());
  }
  hoja.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]);

  // columnas de sobra fuera, para que se vea limpia
  if (hoja.getMaxColumns() > ENCABEZADOS.length) {
    hoja.deleteColumns(ENCABEZADOS.length + 1, hoja.getMaxColumns() - ENCABEZADOS.length);
  }

  // ── franja de encabezado: la copiamos de la pestaña de al lado ──
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
      .setFontSize(10).setVerticalAlignment("middle").setHorizontalAlignment("left");
    hoja.setRowHeight(1, 38);
    hoja.setFrozenRows(1);
  }

  // ── anchos ──
  for (var i = 0; i < ANCHOS.length; i++) hoja.setColumnWidth(i + 1, ANCHOS[i]);

  var maxFilas = hoja.getMaxRows();
  var cuerpo = hoja.getRange(2, 1, maxFilas - 1, ENCABEZADOS.length);

  // ── bandas alternadas (se quitan las previas para no encimarlas) ──
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

  // ── ESTADO: menú para dar seguimiento ──
  var regla = SpreadsheetApp.newDataValidation()
    .requireValueInList(ESTADOS, true).setAllowInvalid(false).build();
  hoja.getRange(2, 9, maxFilas - 1, 1).setDataValidation(regla).setHorizontalAlignment("center");

  var rangoEstado = hoja.getRange(2, 9, maxFilas - 1, 1);
  hoja.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Nuevo").setBackground(AMBAR).setFontColor(NEGRO).setBold(true)
      .setRanges([rangoEstado]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Cerrado").setBackground("#d9ead3").setRanges([rangoEstado]).build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Perdido").setBackground("#efefef").setFontColor("#888888")
      .setRanges([rangoEstado]).build(),
  ]);

  // ── filtro para ordenar y buscar ──
  var filtro = hoja.getFilter();
  if (filtro) filtro.remove();
  hoja.getRange(1, 1, maxFilas, ENCABEZADOS.length).createFilter();

  libro.setSpreadsheetTimeZone(ZONA);
  SpreadsheetApp.flush();
  return estilo ? "Pestaña ONSITE lista, con el formato de '" + estilo.de + "'" : "Pestaña ONSITE lista";
}

/** Recibe la cotización de quote.html. */
function doPost(e) {
  var datos = (e && e.parameter) || {};

  // Dos envíos al mismo tiempo podrían pisarse: uno a la vez.
  var candado = LockService.getScriptLock();
  try { candado.waitLock(20000); } catch (err) {}

  try {
    var libro = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = libro.getSheetByName(HOJA);
    // Nunca getActiveSheet(): en un libro con varias pestañas escribiría en la
    // que esté abierta, y los leads de ONSITE acabarían en la del otro sitio.
    if (!hoja) {
      configurarHoja();
      hoja = libro.getSheetByName(HOJA);
    }
    if (hoja.getLastRow() === 0) configurarHoja();

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

  // El aviso va DESPUÉS y aparte: si el correo falla, la fila ya está guardada.
  try { avisar_(datos); } catch (err3) {}

  return respuesta_({ ok: true });
}

function respuesta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Correo del lead: se responde directo al cliente y trae todo a la vista. */
function avisar_(d) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
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
    '<h2 style="margin:0 0 16px;font-size:22px">' + nombre + ' — ' + tipo + '</h2><table cellpadding="6" style="border-collapse:collapse;font-size:14px">';
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

/**
 * Prueba de punta a punta desde el editor: elige "probar" y dale Ejecutar.
 * Debe aparecer una fila en la pestaña ONSITE y llegarte el correo.
 */
function probar() {
  var r = doPost({ parameter: {
    nombre: "Prueba ONSITE", tipo: "Wedding", fecha: "Dec 12, 2026",
    lugar: "Guadalajara — Hacienda El Carmen", detalles: "Fila de prueba: bórrala",
    email: "prueba@ejemplo.com", telefono: "3312345678",
  }});
  Logger.log(r.getContent()); // debe decir {"ok":true}
}
