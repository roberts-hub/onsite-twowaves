/**
 * ONSITE — cotizaciones
 * Recibe las solicitudes de quote.html, las guarda en Google Sheets
 * y manda un aviso por correo.
 *
 * LA HOJA YA ESTÁ CREADA: "Cotizaciones ONSITE"
 * https://docs.google.com/spreadsheets/d/15sXR6jsCXZCZwn4Mj2k9Q05GcB75tqwamgMU1Te5Fd8/edit
 *
 * CÓMO CONECTARLA (5 min):
 * 1. Abre la hoja de arriba.
 * 2. Extensiones → Apps Script.
 * 3. Borra el código de ejemplo y pega este archivo completo. Guarda.
 * 4. Implementar → Nueva implementación → engrane → tipo "Aplicación web":
 *      - Ejecutar como: Yo
 *      - Quién tiene acceso: Cualquier persona
 * 5. Autoriza los permisos (te va a advertir que la app no está verificada:
 *    Configuración avanzada → Ir a "Cotizaciones ONSITE").
 * 6. Copia la URL del web app (termina en /exec).
 * 7. Pégala en js/form.js → SHEETS_ENDPOINT.
 *
 * OJO: cada vez que edites este código hay que crear una NUEVA implementación
 * (o actualizar la existente) para que los cambios salgan en vivo.
 */

var COLUMNAS = ["fecha_envio", "nombre", "tipo", "fecha", "lugar", "detalles", "email", "telefono"];
var ENCABEZADOS = ["FECHA DE ENVÍO", "NOMBRE", "TIPO DE EVENTO", "FECHA DEL EVENTO", "LUGAR", "DETALLES", "EMAIL", "TELÉFONO"];
var CORREO_AVISO = "contacto@twowaves.mx";

function doPost(e) {
  var datos = (e && e.parameter) || {};
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // encabezados la primera vez
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(ENCABEZADOS);
    hoja.getRange(1, 1, 1, ENCABEZADOS.length).setFontWeight("bold");
    hoja.setFrozenRows(1);
  }

  hoja.appendRow(COLUMNAS.map(function (campo) {
    if (campo === "fecha_envio") {
      return Utilities.formatDate(new Date(), "America/Mexico_City", "yyyy-MM-dd HH:mm");
    }
    return (datos[campo] || "").toString().trim();
  }));

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
        "— onsite.twowaves.mx",
    });
  } catch (err) {}

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Prueba rápida desde el editor: menú Ejecutar → probar.
 * Debe aparecer una fila de prueba en la hoja.
 */
function probar() {
  doPost({ parameter: {
    nombre: "Prueba ONSITE", tipo: "Wedding", fecha: "Dec 12, 2026",
    lugar: "Guadalajara — Hacienda", detalles: "Fila de prueba",
    email: "prueba@ejemplo.com", telefono: "3300000000",
  }});
}
