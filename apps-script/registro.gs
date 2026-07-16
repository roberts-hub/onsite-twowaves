/**
 * ONSITE — cotizaciones
 * Recibe las solicitudes de quote.html, las guarda en Google Sheets
 * con formato, y manda un aviso por correo.
 *
 * LA HOJA YA ESTÁ CREADA: "Cotizaciones ONSITE"
 * https://docs.google.com/spreadsheets/d/15sXR6jsCXZCZwn4Mj2k9Q05GcB75tqwamgMU1Te5Fd8/edit
 *
 * CÓMO CONECTARLA (5 min):
 * 1. Abre la hoja de arriba.
 * 2. Extensiones → Apps Script.
 * 3. Borra el código de ejemplo y pega este archivo completo. Guarda.
 * 4. Arriba, en el menú de funciones, elige "configurarHoja" y dale Ejecutar.
 *    → autoriza los permisos (te advierte que la app no está verificada:
 *      Configuración avanzada → Ir a "Cotizaciones ONSITE").
 *    → al terminar, la hoja ya queda con encabezados y formato.
 * 5. Implementar → Nueva implementación → engrane → "Aplicación web":
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier persona
 * 6. Copia la URL del web app (termina en /exec).
 * 7. Pégala en js/form.js → SHEETS_ENDPOINT.
 *
 * OJO: cada vez que edites este código hay que crear una NUEVA implementación
 * (o actualizar la existente) para que los cambios salgan en vivo.
 */

var COLUMNAS = ["fecha_envio", "nombre", "tipo", "fecha", "lugar", "detalles", "email", "telefono"];

var ENCABEZADOS = [
  "FECHA DE ENVÍO", "NOMBRE", "TIPO DE EVENTO", "FECHA DEL EVENTO",
  "LUGAR", "DETALLES", "EMAIL", "TELÉFONO", "ESTADO",
];
var ANCHOS = [150, 170, 140, 160, 230, 340, 210, 140, 130];
var ESTADOS = ["Nuevo", "Contactado", "Cotizado", "Cerrado", "Perdido"];

// Colores de la marca (los mismos del sitio)
var NEGRO = "#0b0a08";
var CREMA = "#f2ecdf";
var AMBAR = "#c49a62";

var CORREO_AVISO = "contacto@twowaves.mx";
var ZONA = "America/Mexico_City";

/**
 * Deja la hoja lista y con formato. Se puede correr cuando quieras:
 * es idempotente (no duplica encabezados ni bandas).
 */
function configurarHoja() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getActiveSheet();
  libro.setSpreadsheetTimeZone(ZONA); // las fechas se ven en hora de GDL
  hoja.setName("Cotizaciones");

  // ── encabezados ──
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
  } else {
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setValues([ENCABEZADOS]);
  }

  // ── sobra de columnas y filas: fuera, para que se vea limpia ──
  if (hoja.getMaxColumns() > ENCABEZADOS.length) {
    hoja.deleteColumns(ENCABEZADOS.length + 1, hoja.getMaxColumns() - ENCABEZADOS.length);
  }

  // ── franja de encabezado: negro con texto crema, como el sitio ──
  var cabecera = hoja.getRange(1, 1, 1, ENCABEZADOS.length);
  cabecera
    .setBackground(NEGRO)
    .setFontColor(CREMA)
    .setFontWeight("bold")
    .setFontSize(10)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("left");
  hoja.setRowHeight(1, 38);
  hoja.setFrozenRows(1);

  // ── anchos por columna ──
  for (var i = 0; i < ANCHOS.length; i++) {
    hoja.setColumnWidth(i + 1, ANCHOS[i]);
  }

  var maxFilas = hoja.getMaxRows();
  var cuerpo = hoja.getRange(2, 1, maxFilas - 1, ENCABEZADOS.length);

  // ── bandas alternadas (se quitan las previas para no encimarlas) ──
  var bandas = hoja.getBandings();
  for (var b = 0; b < bandas.length; b++) bandas[b].remove();
  cuerpo.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);

  // ── legibilidad ──
  cuerpo.setVerticalAlignment("top").setFontSize(10);
  hoja.getRange(2, 1, maxFilas - 1, 1).setNumberFormat("yyyy-mm-dd hh:mm"); // fecha de envío
  hoja.getRange(2, 6, maxFilas - 1, 1).setWrap(true);                       // detalles
  hoja.getRange(2, 5, maxFilas - 1, 1).setWrap(true);                       // lugar

  // ── ESTADO: menú desplegable para dar seguimiento ──
  var reglaEstado = SpreadsheetApp.newDataValidation()
    .requireValueInList(ESTADOS, true)
    .setAllowInvalid(false)
    .build();
  hoja.getRange(2, 9, maxFilas - 1, 1).setDataValidation(reglaEstado).setHorizontalAlignment("center");

  // "Nuevo" resaltado en ámbar para que salte lo que falta atender
  var reglas = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Nuevo")
      .setBackground(AMBAR)
      .setFontColor(NEGRO)
      .setBold(true)
      .setRanges([hoja.getRange(2, 9, maxFilas - 1, 1)])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Cerrado")
      .setBackground("#d9ead3")
      .setRanges([hoja.getRange(2, 9, maxFilas - 1, 1)])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo("Perdido")
      .setBackground("#efefef")
      .setFontColor("#888888")
      .setRanges([hoja.getRange(2, 9, maxFilas - 1, 1)])
      .build(),
  ];
  hoja.setConditionalFormatRules(reglas);

  // ── filtro para ordenar y buscar leads ──
  var filtro = hoja.getFilter();
  if (filtro) filtro.remove();
  hoja.getRange(1, 1, maxFilas, ENCABEZADOS.length).createFilter();

  SpreadsheetApp.flush();
  return "Hoja lista";
}

function doPost(e) {
  var datos = (e && e.parameter) || {};
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // primera vez: deja la hoja con encabezados y formato
  if (hoja.getLastRow() === 0) configurarHoja();

  var fila = COLUMNAS.map(function (campo) {
    if (campo === "fecha_envio") return new Date();
    return (datos[campo] || "").toString().trim();
  });
  fila.push("Nuevo"); // ESTADO

  hoja.appendRow(fila);

  // el aviso es "best effort": si falla, la fila ya quedó guardada
  try {
    MailApp.sendEmail({
      to: CORREO_AVISO,
      subject: "( ONSITE ) Nueva cotización — " + (datos.tipo || "evento") + " · " + (datos.nombre || ""),
      body:
        "Nombre: " + (datos.nombre || "-") + "\n" +
        "Tipo de evento: " + (datos.tipo || "-") + "\n" +
        "Fecha del evento: " + (datos.fecha || "-") + "\n" +
        "Lugar: " + (datos.lugar || "-") + "\n" +
        "Detalles: " + (datos.detalles || "-") + "\n" +
        "Email: " + (datos.email || "-") + "\n" +
        "Teléfono: " + (datos.telefono || "-") + "\n\n" +
        "Ver todas: https://docs.google.com/spreadsheets/d/15sXR6jsCXZCZwn4Mj2k9Q05GcB75tqwamgMU1Te5Fd8/edit\n" +
        "— onsite.twowaves.mx",
    });
  } catch (err) {}

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Prueba rápida desde el editor: elige "probar" y dale Ejecutar.
 * Debe aparecer una fila de prueba, ya formateada, en la hoja.
 */
function probar() {
  doPost({ parameter: {
    nombre: "Prueba ONSITE", tipo: "Wedding", fecha: "Dec 12, 2026",
    lugar: "Guadalajara — Hacienda El Carmen", detalles: "250 invitados, ceremonia 5pm",
    email: "prueba@ejemplo.com", telefono: "3312345678",
  }});
}
