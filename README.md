# ( ONSITE ) — landing de eventos

Landing de **ONSITE**, la marca de eventos de Two Waves: fotografía y video
para graduaciones, bodas, eventos corporativos y sociales.

- Sitio estático: `index.html` + `css/estilo.css` + `js/`
- Dominio previsto: `onsite.twowaves.mx`
- Instagram: [@onsite.tw](https://www.instagram.com/onsite.tw/)

## Editar contenido

Todo el contenido vive en `index.html`, con comentarios `PLACEHOLDER` donde
van los videos/stills reales (hoy usa miniaturas del portafolio Two Waves).

## Formulario de cotización

Vive en su propia página: `quote.html` (flujo multi-paso, `js/form.js`).

Los leads caen en el **mismo libro que los del sitio principal**, en su propia
pestaña (`ONSITE`):
https://docs.google.com/spreadsheets/d/1ncotVVLgss4tsZsSJJZN7o1GBF4ewsXsFGHjgLWX7KY/edit

Falta conectarlo (5 min): abre el libro → Extensiones → Apps Script → pega
`apps-script/registro.gs` (como archivo nuevo si ya hay otro código) →
**Ejecutar `configurarHoja`** (crea la pestaña con formato) → Implementar como
aplicación web ("Cualquier persona") → copia la URL `/exec` → pégala en
`js/form.js` → `SHEETS_ENDPOINT` → corre `probar`. Los pasos detallados están
dentro de `apps-script/registro.gs`.

`configurarHoja()` **copia el estilo del encabezado de la pestaña vecina**
(fondo, color, peso, fuente, alto de fila, fila fija, bandas), así las dos se
ven iguales sin adivinar colores. Encima agrega lo propio de ONSITE: anchos por
columna, texto ajustado en `LUGAR` y `DETALLES`, filtro, y una columna `ESTADO`
con menú (Nuevo / Contactado / Cotizado / Cerrado / Perdido) donde "Nuevo" se
resalta. Es idempotente: puedes correrla cuando quieras.

### Que no se pierda ningún lead

- `doPost` escribe **siempre en la pestaña `ONSITE`** por nombre, nunca en la
  que esté activa: con dos formularios en un libro, `getActiveSheet()` habría
  escrito en la pestaña equivocada.
- Un `LockService` evita que dos envíos simultáneos se pisen.
- La fila se guarda **antes** de mandar el correo: si el correo falla, el lead
  ya está.
- El sitio **lee la confirmación** del script (`{"ok":true}`) — el web app de
  Apps Script responde con `Access-Control-Allow-Origin: *`, así que no hace
  falta enviar a ciegas con `no-cors`. Si no se confirma, se abre WhatsApp con
  el resumen: un contacto duplicado es mejor que un lead perdido.

### Correo prioritario

Apps Script no puede marcar un correo como prioritario (`MailApp`/`GmailApp` no
exponen cabeceras de prioridad). Lo que sí funciona es un filtro en Gmail, una
sola vez:

> Gmail → buscar → `subject:"( ONSITE ) Nueva cotización"` → Crear filtro →
> marcar **Marcar como importante**, **Destacar**, **No enviar nunca a Spam**
> y (opcional) etiqueta `ONSITE`.

El correo llega con asunto `( ONSITE ) Nueva cotización — <tipo> · <nombre>` y
`replyTo` del cliente: al responder, le contestas directo a él.

Mientras `SHEETS_ENDPOINT` esté vacío, el formulario abre WhatsApp con el
resumen de respuestas — funciona desde el día uno.

## Flujo de trabajo (dos Macs)

Igual que el mastermind: `git pull` antes de editar, commit + push al
terminar, nunca force-push.
