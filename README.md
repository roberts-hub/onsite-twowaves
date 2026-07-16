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

Flujo multi-paso en `js/form.js` → Google Sheets vía Apps Script
(`apps-script/registro.gs`, instrucciones dentro del archivo).
Mientras `SHEETS_ENDPOINT` esté vacío, el formulario abre WhatsApp con el
resumen de respuestas — funciona desde el día uno.

## Flujo de trabajo (dos Macs)

Igual que el mastermind: `git pull` antes de editar, commit + push al
terminar, nunca force-push.
