/** Échappe une valeur avant son insertion dans du texte ou un attribut HTML. */
function escape(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
}
/** Restitue les valeurs du tableau sans perdre les motifs ni les identités non résolues. */
export function qualityValues(row) {
  return [
    row.ruleId,
    row.severity,
    row.repositories.join(', ') || 'Non déterminé',
    row.entityType,
    row.entityId,
    row.message,
    row.action,
    row.impacts.map((impact) => `${impact.metricId} · ${impact.action} · ${impact.reason}`).join(' ; ')
  ];
}
/** Filtre la population complète sur les seules relations explicitement projetées. */
export function qualityMatches(row, params) {
  const values = {
    repository: row.repositories.length ? row.repositories : ['__unknown__'],
    dqRule: [row.ruleId],
    dqSeverity: [row.severity],
    dqAction: [row.action],
    dqType: [row.entityType],
    dqMetric: row.impacts.map((impact) => impact.metricId)
  };
  const search = (params.get('dqSearch') || '').toLocaleLowerCase('fr');
  return (
    (!search || qualityValues(row).join(' ').toLocaleLowerCase('fr').includes(search)) &&
    Object.entries(values).every(([key, choices]) => !params.get(key) || choices.includes(params.get(key)))
  );
}
/** Rend une ligne avec ses preuves, y compris sur GitHub Enterprise ; une URL absente reste du texte. */
export function qualityRowHtml(row) {
  const values = qualityValues(row);
  values[4] =
    (/^https:\/\/[^\s"<>]+$/.test(row.sourceUrl)
      ? `<a data-review-slot="s1o" href="${escape(row.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escape(row.entityId)} ↗</a>`
      : escape(row.entityId)) +
    (row.issueId
      ? `<br data-review-slot="s1p"><a data-review-slot="s1q" href="graph.html?issue=${encodeURIComponent(row.issueId)}#traceability">Voir les relations explicites</a>`
      : '');
  values[7] = row.impacts
    .map(
      (impact) =>
        `<span data-review-slot="review-quality-impact" data-review-key="${escape(JSON.stringify([impact.metricId, impact.action]))}">${escape(impact.metricId)} · ${escape(impact.action)}<small data-review-slot="s1r">${escape(impact.reason)}</small></span>`
    )
    .join('');
  return `<tr data-review-slot="s1t" data-quality-row data-review-key="${escape(row.id)}">${values.map((value, index) => `<td data-review-slot="s1u" data-review-key="field:${index}">${index === 4 || index === 7 ? value : escape(value)}</td>`).join('')}</tr>`;
}
