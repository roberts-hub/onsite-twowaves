/**
 * ONSITE — cotizaciones
 * Recibe las solicitudes del formulario, las guarda en Google Sheets
 * y avisa por correo.
 *
 * CÓMO ACTIVARLO (5 min):
 * 1. Crea un Google Sheet nuevo llamado "Cotizaciones ONSITE".
 * 2. En el Sheet: Extensiones → Apps Script.
 * 3. Borra el código de ejemplo y pega este archivo completo.
 * 4. Implementar → Nueva implementación → tipo "Aplicación web":
 *      - Ejecutar como: Tú
 *      - Acceso: Cualquier persona
 * 5. Autoriza los permisos y copia la URL del web app.
 * 6. Pega esa URL en js/form.js → SHEETS_ENDPOINT.
 */

var COLUMNAS = ["fecha_envio", "nombre", "tipo", "fecha", "lugar", "detalles", "email", "telefono"];
var CORREO_AVISO = "contacto@twowaves.mx";

function doPost(e) {
  var datos = {};
  try {
    datos = JSON.parse(e.postData.contents);
  } catch (err) {
    datos = e.parameter || {};
  }
  datos.fecha_envio = new Date();

  var hoja = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS.map(function (c) { return c.toUpperCase(); }));
  }
  hoja.appendRow(COLUMNAS.map(function (campo) {
    return (datos[campo] || "").toString().trim();
  }));

  try {
    MailApp.sendEmail({
      to: CORREO_AVISO,
      subject: "( ONSITE ) Nueva cotización — " + (datos.tipo || "evento") + " · " + (datos.nombre || ""),
      body:
        "Nombre: " + (datos.nombre || "-") + "\n" +
        "Tipo: " + (datos.tipo || "-") + "\n" +
        "Fecha: " + (datos.fecha || "-") + "\n" +
        "Lugar: " + (datos.lugar || "-") + "\n" +
        "Detalles: " + (datos.detalles || "-") + "\n" +
        "Email: " + (datos.email || "-") + "\n" +
        "Teléfono: " + (datos.telefono || "-"),
    });
  } catch (err) {
    // si falla el correo, la fila ya quedó guardada en el Sheet
  }

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}
