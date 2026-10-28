import { markReview } from './review-core.js';
/* global Blob, URL */
/** Encode un CSV complet en UTF-8 avec BOM, guillemets et protection des formules. */
export function csvText(rows) {
  return (
    '\ufeff' +
    rows
      .map((row) =>
        row
          .map((value) => {
            const text = String(value ?? '');
            return '"' + (/^[=+@\-\t\r]/.test(text) ? "'" : '') + text.replace(/"/g, '""') + '"';
          })
          .join(';')
      )
      .join('\r\n')
  );
}
/** Déclenche un téléchargement local sans limiter les lignes à la page montée dans le DOM. */
export function downloadCsv(filename, rows) {
  const url = URL.createObjectURL(new Blob([csvText(rows)], { type: 'text/csv;charset=utf-8' }));
  const link = markReview('so', document.createElement('a'));
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
