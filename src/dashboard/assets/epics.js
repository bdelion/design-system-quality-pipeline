import { markReview } from './review-core.js';
import { readPageModel } from './page-model.js';
/* global Blob, URL, location, setTimeout */
(() => {
  const root = document.querySelector('[data-epic-activity]');
  if (!root) return;
  const model = readPageModel()?.data.epics;
  if (!model) return;
  const select = root.querySelector('[data-epic-select]');
  const button = root.querySelector('[data-epic-export]');
  const summary = root.querySelector('[data-epic-summary]');
  /** Échappe le texte affiché dans les cellules. */
  const escape = (value) =>
    String(value ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  /** Fournit les six colonnes calculées avec leurs motifs d'indisponibilité. */
  const cells = (row) => [
    row.component,
    '#' + row.number,
    row.velocity ?? row.velocityReason,
    row.startedAt ?? 'In progress absent',
    row.finishedAt ?? 'Done absent',
    row.elapsedHours ?? row.reason
  ];
  for (const epic of model.epics) {
    const option = markReview('sp', document.createElement('option'));
    option.value = epic.id;
    option.textContent = `${epic.repository} · #${epic.number} · ${epic.title}`;
    select.append(option);
  }
  const requested = new URLSearchParams(location.search).get('epic');
  if (model.epics.some((epic) => epic.id === requested)) select.value = requested;
  /** Restitue uniquement les lignes pré-calculées de l'Epic sélectionnée. */
  function render() {
    const epic = model.epics.find((item) => item.id === select.value);
    button.disabled = !epic?.rows.length;
    summary.textContent = epic
      ? epic.referencesCaptured
        ? `${epic.rows.length} ligne(s) · ${new Set(epic.rows.map((row) => row.issueId)).size} issue(s) distincte(s).`
        : `Rattachements indéterminés : mentions non collectées ou collecte partielle. ${epic.rows.length} ligne(s) observée(s). Refaire la collecte et la préparation.`
      : model.epics.length
        ? 'Choisir une Epic.'
        : 'Aucune Epic disponible ; les anciens snapshots nécessitent un nouveau pipeline.';
    root.querySelector('[data-epic-rows]').innerHTML = (epic?.rows ?? [])
      .map(
        (row) =>
          `<tr data-review-slot="sq" data-review-key="${escape(select.value + ':' + row.issueId + ':' + row.component)}">${cells(
            row
          )
            .map(
              (value, index) =>
                `<td data-review-slot="sr" data-review-key="field:${index}">${index === 1 && /^https:\/\/[^\s"<>]+$/.test(row.url) ? `<a data-review-slot="ss" href="${escape(row.url)}" target="_blank" rel="noopener noreferrer">${escape(value)}</a>` : escape(value)}</td>`
            )
            .join('')}</tr>`
      )
      .join('');
  }
  /** Protège une cellule CSV contre les formules et conserve guillemets et retours à la ligne. */
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  select.addEventListener('change', render);
  button.addEventListener('click', () => {
    const epic = model.epics.find((item) => item.id === select.value);
    if (!epic) return;
    const content = [
      [
        'Repository',
        'Epic',
        'Composant',
        'Issue',
        'Vélocité',
        'Premier In progress',
        'Dernier Done',
        'Temps passé (h)'
      ],
      ...epic.rows.map((row) => [epic.repository, '#' + epic.number, ...cells(row)])
    ]
      .map((row) => row.map(csvCell).join(';'))
      .join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' }));
    const anchor = markReview('st', document.createElement('a'));
    anchor.href = url;
    anchor.download = `epic-${epic.number}.csv`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  render();
})();
