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

La hoja **"Cotizaciones ONSITE"** ya está creada:
https://docs.google.com/spreadsheets/d/15sXR6jsCXZCZwn4Mj2k9Q05GcB75tqwamgMU1Te5Fd8/edit

Falta conectarla (5 min): abre la hoja → Extensiones → Apps Script → pega
`apps-script/registro.gs` → Implementar como aplicación web ("Cualquier
persona") → copia la URL `/exec` → pégala en `js/form.js` → `SHEETS_ENDPOINT`.
Los pasos detallados están dentro de `apps-script/registro.gs`.

Mientras `SHEETS_ENDPOINT` esté vacío, el formulario abre WhatsApp con el
resumen de respuestas — funciona desde el día uno.

## Flujo de trabajo (dos Macs)

Igual que el mastermind: `git pull` antes de editar, commit + push al
terminar, nunca force-push.
