import { readPageModel } from './page-model.js';
import { currentContext, matchesFact, setContext } from './context.js';
/* global Blob, URL */
import { presentWorkspaceKpi } from './kpi-presentation.js';
import { presentWorkspaceVersions } from './version-presentation.js';
const model = readPageModel()?.data.workspaces ?? null;
const distributionSorts = { category: 'label-asc', component: 'label-asc' };
document.addEventListener('change', (event) => {
  const control = event.target;
  const dimension = control?.dataset?.distributionSort;
  if (
    !(dimension in distributionSorts) ||
    !['label-asc', 'label-desc', 'count-asc', 'count-desc'].includes(control.value)
  )
    return;
  distributionSorts[dimension] = control.value;
  renderWorkspace();
  document.querySelector(`[data-distribution-sort="${dimension}"]`)?.focus();
});
/** Échappe les textes des ventilations avant leur insertion dans le HTML. */
function escape(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
}
/** Affiche un résultat pré-calculé sans assimiler une absence à zéro. */
function format(value) {
  return typeof value === 'number'
    ? value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })
    : 'Indisponible';
}
/** Trie chaque répartition selon son choix ; les égalités de nombre suivent l’intitulé croissant. */
function sortedEntries(values, dimension) {
  const mode = distributionSorts[dimension];
  return Object.entries(values).sort(([left, leftCount], [right, rightCount]) => {
    const label = left.localeCompare(right, 'fr', { numeric: true });
    if (mode.startsWith('count-'))
      return (mode === 'count-desc' ? rightCount - leftCount : leftCount - rightCount) || label;
    return mode === 'label-desc' ? -label : label;
  });
}
/** Résout les alias lisibles des anciennes URLs vers les identités du contrat Analytics. */
function canonicalContext() {
  const params = currentContext();
  return {
    repository: params.get('repository') || '',
    component: params.get('component') || '',
    version: params.get('version') || ''
  };
}
/** Présente une ventilation avec son choix de tri accessible, sans recalculer les dénombrements. */
function distributionChart(title, entries, note, dimension) {
  const maximum = Math.max(0, ...entries.map(([, value]) => value));
  return (
    '<figure class="distribution-chart" data-distribution="' +
    dimension +
    '"><figcaption>' +
    escape(title) +
    '</figcaption>' +
    (dimension in distributionSorts
      ? `<label>Trier par <select data-distribution-sort="${dimension}" aria-label="Tri : ${escape(title)}">${Object.entries(
          {
            'label-asc': 'Intitulé croissant',
            'label-desc': 'Intitulé décroissant',
            'count-asc': 'Nombre croissant',
            'count-desc': 'Nombre décroissant'
          }
        )
          .map(
            ([value, label]) =>
              `<option value="${value}"${distributionSorts[dimension] === value ? ' selected' : ''}>${label}</option>`
          )
          .join('')}</select></label>`
      : '') +
    '<ul class="distribution-bars">' +
    (entries.length
      ? entries
          .map(
            ([label, value]) =>
              '<li class="distribution-row"><span class="distribution-label">' +
              escape(label) +
              '</span><span class="bar-track" aria-hidden="true"><i style="width:' +
              (maximum > 0 ? (value / maximum) * 100 : 0) +
              '%"></i></span><strong>' +
              format(value) +
              '</strong></li>'
          )
          .join('')
      : '<li>Aucune donnée de répartition disponible.</li>') +
    '</ul><p class="panel-note">' +
    escape(note) +
    '</p></figure>'
  );
}
/** Restitue les KPI du périmètre exact avec unités, populations et réserves, puis les répartitions. */
function renderWorkspace() {
  renderQuality();
  if (!model) return;
  const params = currentContext(),
    context = canonicalContext();
  const focused = [
    'issue',
    'audit',
    'anomaly',
    'family',
    'progress',
    'result',
    'criticality',
    'category',
    'status'
  ].some((key) => params.has(key));
  const summary =
    model.available && !focused
      ? model.scopes.find(
          (scope) =>
            scope.repository === context.repository &&
            scope.component === context.component &&
            scope.version === context.version
        )?.summary
      : null;
  document.querySelectorAll('[data-workspace-cards]').forEach((node) => {
    node.hidden = focused;
  });
  document.querySelectorAll('[data-workspace-version-context]').forEach((node) => {
    node.textContent = presentWorkspaceVersions(summary?.versionSelection);
  });
  document.querySelectorAll('[data-workspace-kpi]').forEach((node) => {
    const key = node.dataset.workspaceKpi;
    node.textContent = presentWorkspaceKpi(key, summary).value;
  });
  document.querySelectorAll('[data-workspace-ratio]').forEach((node) => {
    node.textContent = presentWorkspaceKpi(node.dataset.workspaceRatio, summary).population;
  });
  document.querySelectorAll('[data-workspace-reserve]').forEach((node) => {
    node.textContent = presentWorkspaceKpi(node.dataset.workspaceReserve, summary).reserve;
  });
  document.querySelectorAll('[data-workspace-unavailable]').forEach((node) => {
    const key = node.dataset.workspaceUnavailable;
    node.textContent = presentWorkspaceKpi(key, summary).unavailable;
  });
  const info = document.querySelector('[data-workspace-summary]');
  if (info)
    info.textContent = focused
      ? 'Objet ciblé : liste de preuves uniquement ; revenir à un périmètre pour les agrégats.'
      : summary
        ? `${summary.declared} anomalies d’accessibilité non annulées ; ${summary.qualified} qualifiées et ${summary.presumed} présumées (annulations comprises dans ces qualifications). Délais : ${summary.actual} dates Done, ${summary.estimated} estimations, ${summary.measured} calculables. ${summary.qualityIssues} réserves de données liées ; ${summary.unknown} présences/verdicts de composant inconnus.`
        : 'Périmètre ou données indisponibles ; aucun résultat global n’est substitué.';
  const breakdowns = document.querySelector('[data-workspace-breakdowns]');
  if (breakdowns)
    breakdowns.innerHTML = summary
      ? '<div class="distribution-grid">' +
        distributionChart(
          'Répartition par criticité',
          Object.entries(summary.criticalities).map(([key, item]) => [
            { blocking: 'Bloquante', major: 'Majeure', minor: 'Mineure', unknown: 'Inconnue' }[key] ?? key,
            item.declared
          ]),
          'Anomalies d’accessibilité non annulées ; les criticités inconnues restent visibles.',
          'criticality'
        ) +
        distributionChart(
          'Critères d’accessibilité',
          sortedEntries(summary.categories, 'category'),
          'Multi-étiquettes : une anomalie peut appartenir à plusieurs catégories. Une catégorie absente ne vaut pas zéro.',
          'category'
        ) +
        distributionChart(
          'Répartition par composant',
          sortedEntries(summary.byComponent, 'component'),
          'Relations explicites uniquement ; une anomalie peut concerner plusieurs composants.',
          'component'
        ) +
        '</div><details class="distribution-details"><summary>Voir les détails des répartitions</summary>' +
        `<h3>Par criticité</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Répartition par criticité"><table><thead><tr><th scope="col">Criticité</th><th scope="col">Déclarées</th><th scope="col">Traitées</th><th scope="col">Délai moyen</th><th scope="col">Calculables</th></tr></thead><tbody>${Object.entries(
          summary.criticalities
        )
          .map(
            ([key, item]) =>
              `<tr><td>${escape({ blocking: 'Bloquante', major: 'Majeure', minor: 'Mineure', unknown: 'Inconnue' }[key])}</td><td>${item.declared}</td><td>${item.treated}</td><td>${format(item.average)} j</td><td>${item.count}</td></tr>`
          )
          .join('')}</tbody></table></div><h3>Par catégorie</h3><ul>${
          sortedEntries(summary.categories, 'category')
            .map(([key, count]) => `<li>${escape(key)} : ${count}</li>`)
            .join('') || '<li>Aucune catégorie reconnue</li>'
        }</ul><h3>Par composant</h3><ul>${
          sortedEntries(summary.byComponent, 'component')
            .map(([key, count]) => `<li>${escape(key)} : ${count}</li>`)
            .join('') || '<li>Aucun composant explicitement relié</li>'
        }</ul></details>`
      : '<p>Ventilations indisponibles pour ce périmètre.</p>';
  document.querySelectorAll('[data-workspace-row]').forEach((row) => {
    const fact = JSON.parse(row.dataset.context);
    const detailsMatch = ['criticality', 'category', 'status', 'progress', 'result'].every((key) => {
      const expected = params.get(key);
      if (!expected) return true;
      const values = key === 'category' ? fact.categories : [fact[key]];
      return values?.includes(expected) ?? false;
    });
    row.hidden = !matchesFact(fact, params) || !detailsMatch;
  });
  for (const kind of ['review', 'population']) {
    const count = document.querySelector(`[data-workspace-count="${kind}"]`);
    if (count)
      count.textContent = `${[...document.querySelectorAll(`[data-workspace-row][data-review="${kind === 'review'}"]`)].filter((row) => !row.hidden).length} issues distinctes affichées (annulations visibles).`;
  }
  const filtered = [
    'repository',
    'component',
    'version',
    'issue',
    'audit',
    'anomaly',
    'family',
    'progress',
    'result',
    'criticality',
    'category',
    'status'
  ].some((key) => params.get(key));
  document.querySelectorAll('[data-global-only]').forEach((node) => {
    node.hidden = filtered;
  });
  // Un lien d'espace remet les dimensions d'un objet ciblé à zéro ; ses filtres métier restent explicites.
  document.querySelectorAll('[data-workspace-nav]').forEach((link) => {
    const target = new URL(link.href);
    const keep = /\/(?:quality|index)\.html$/.test(target.pathname)
      ? []
      : target.pathname.endsWith('history.html')
        ? ['repository']
        : ['repository', 'component', 'version'];
    target.search = '';
    for (const key of keep) if (params.get(key)) target.searchParams.set(key, params.get(key));
    link.setAttribute('href', target.pathname.split('/').pop() + target.search);
  });
}
/** Exporte uniquement les sources visibles avec leurs preuves, sans changer leur qualification. */
function exportPopulation(kind) {
  const params = currentContext();
  const rows = (
    kind === 'review' ? model.review : model.rows.filter((row) => row.qualification.status !== 'unqualified')
  ).filter((row) => matchesFact(row, params));
  /** Neutralise les formules de tableur dans les champs textuels du CSV. */
  const cell = (value) =>
    '"' +
    String(value ?? '')
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  const content = [
    [
      'Repository',
      'Numéro',
      'Titre',
      'URL',
      'Labels',
      'Qualification',
      'Motifs',
      'Criticité',
      'Catégories',
      'Composants',
      'Audits explicites',
      'Origine',
      'État'
    ],
    ...rows.map((row) => [
      row.repo,
      row.number,
      row.title,
      row.url,
      row.labels.join(' | '),
      row.qualification.status,
      row.qualification.reasons.join(' | '),
      row.criticality,
      row.categories.join(' | '),
      row.components.join(' | '),
      row.auditIds.join(' | '),
      row.origin,
      row.status
    ])
  ]
    .map((row) => row.map(cell).join(';'))
    .join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `accessibilite-${kind}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
window.addEventListener('dashboard-context-change', renderWorkspace);
window.addEventListener('popstate', renderWorkspace);
document
  .querySelectorAll('[data-accessibility-export]')
  .forEach((button) =>
    button.addEventListener('click', () => exportPopulation(button.dataset.accessibilityExport))
  );
renderWorkspace();

/** Filtre les diagnostics sur les dimensions prouvées et annonce le nombre de résultats. */
function renderQuality() {
  const params = currentContext();
  const controls = [...document.querySelectorAll('[data-quality-filter]')];
  if (!controls.length) return;
  for (const control of controls) {
    const value = params.get(control.dataset.qualityFilter) || '';
    if (
      control.tagName === 'SELECT' &&
      value &&
      ![...control.options].some((option) => option.value === value)
    ) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = 'Référence inconnue : ' + value;
      control.append(option);
    }
    control.value = value;
  }
  const query = (params.get('dqSearch') || '').toLocaleLowerCase('fr');
  const rows = [...document.querySelectorAll('[data-quality-row]')];
  for (const row of rows) {
    const context = JSON.parse(row.dataset.qualityContext);
    row.hidden =
      (!!query && !row.textContent.toLocaleLowerCase('fr').includes(query)) ||
      controls.some((control) => {
        const key = control.dataset.qualityFilter;
        const expected = params.get(key);
        return key !== 'dqSearch' && expected && !context[key]?.includes(expected);
      });
  }
  document.querySelector('[data-quality-count]').textContent = rows.filter((row) => !row.hidden).length;
}
/** Applique les filtres de diagnostic à l’URL sans toucher au snapshot. */
function updateQuality(event) {
  const control = event.target;
  setContext({ [control.dataset.qualityFilter]: control.value });
}
for (const control of document.querySelectorAll('[data-quality-filter]')) {
  control.addEventListener('input', updateQuality);
  control.addEventListener('change', updateQuality);
}
document
  .querySelector('[data-quality-reset]')
  ?.addEventListener('click', () =>
    setContext(
      Object.fromEntries(
        [...document.querySelectorAll('[data-quality-filter]')].map((control) => [
          control.dataset.qualityFilter,
          ''
        ])
      )
    )
  );
renderQuality();
