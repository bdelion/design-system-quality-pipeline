/** Vérifie un dictionnaire JSON sans assimiler une absence à un objet vide. */
function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/** Vérifie une liste de faits nécessaires aux exports et aux filtres. */
function facts(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (row) =>
        record(row) &&
        typeof row.id === 'string' &&
        typeof row.repo === 'string' &&
        typeof row.title === 'string' &&
        [
          'labels',
          'components',
          'componentIds',
          'versions',
          'versionIds',
          'auditIds',
          'anomalyIds',
          'prs'
        ].every((key) => Array.isArray(row[key]) && row[key].every((item) => typeof item === 'string')) &&
        Array.isArray(row.projectContexts) &&
        row.projectContexts.every(record) &&
        ['open', 'closed', 'cancelled'].includes(row.status) &&
        (row.delay === null || Number.isFinite(row.delay))
    )
  );
}
/** Vérifie le contrat avant de le confier aux consommateurs ; aucune règle métier n'est recalculée. */
export function decodePageModel(text, expectedPage) {
  let model;
  try {
    model = JSON.parse(text);
  } catch {
    throw new Error('Données JSON illisibles.');
  }
  if (!record(model) || model.schema !== 'dsq-dashboard-page' || model.version !== 1)
    throw new Error('Version de contrat inconnue ou incompatible.');
  const sections = {
    index: [],
    anomalies: [],
    graph: [],
    history: [],
    quality: ['quality'],
    issues: ['issues'],
    components: ['components'],
    accessibility: ['workspaces'],
    audits: ['workspaces'],
    epics: ['epics']
  };
  if (!Object.hasOwn(sections, expectedPage) || model.page !== expectedPage)
    throw new Error('Contrat destiné à une autre page.');
  if (
    !record(model.snapshot) ||
    !['id', 'capturedAt', 'modelVersion', 'ruleVersion'].every(
      (key) => typeof model.snapshot[key] === 'string'
    ) ||
    !Number.isFinite(Date.parse(model.snapshot.capturedAt)) ||
    !record(model.data)
  )
    throw new Error('Métadonnées du contrat indisponibles.');
  if (
    Object.keys(model.data).some((key) => !sections[expectedPage].includes(key)) ||
    !sections[expectedPage].every((key) => key in model.data)
  )
    throw new Error('Détails requis absents ou hors du parcours.');
  const data = model.data;
  if (
    expectedPage === 'quality' &&
    (!Array.isArray(data.quality) ||
      !data.quality.every(
        (row) =>
          record(row) &&
          [
            'id',
            'ruleId',
            'severity',
            'entityType',
            'entityId',
            'message',
            'action',
            'sourceUrl',
            'issueId'
          ].every((key) => typeof row[key] === 'string') &&
          Array.isArray(row.repositories) &&
          row.repositories.every((repo) => typeof repo === 'string') &&
          Array.isArray(row.impacts) &&
          row.impacts.every(
            (impact) =>
              record(impact) &&
              ['metricId', 'action', 'reason'].every((key) => typeof impact[key] === 'string')
          )
      ))
  )
    throw new Error('Diagnostics de qualité indisponibles.');
  if (
    expectedPage === 'issues' &&
    (!record(data.issues) || !facts(data.issues.items) || typeof data.issues.componentPrefix !== 'string')
  )
    throw new Error('Détails des issues indisponibles.');
  if (
    expectedPage === 'components' &&
    (!Array.isArray(data.components) ||
      !data.components.every(
        (row) =>
          record(row) &&
          typeof row.id === 'string' &&
          typeof row.name === 'string' &&
          typeof row.repository === 'string' &&
          facts(row.items) &&
          Array.isArray(row.auditSources) &&
          row.auditSources.every(record) &&
          Array.isArray(row.versionSummaries)
      ))
  )
    throw new Error('Données de l’explorateur indisponibles.');
  if (
    expectedPage === 'epics' &&
    (!record(data.epics) ||
      data.epics.version !== 1 ||
      !Array.isArray(data.epics.epics) ||
      !data.epics.epics.every(
        (epic) =>
          record(epic) &&
          typeof epic.id === 'string' &&
          typeof epic.title === 'string' &&
          typeof epic.repository === 'string' &&
          typeof epic.referencesCaptured === 'boolean' &&
          Array.isArray(epic.rows) &&
          epic.rows.every(
            (row) =>
              record(row) &&
              typeof row.issueId === 'string' &&
              typeof row.component === 'string' &&
              (row.elapsedHours === null || Number.isFinite(row.elapsedHours))
          )
      ))
  )
    throw new Error('Détails des Epics indisponibles ou version incompatible.');
  if (expectedPage === 'accessibility' || expectedPage === 'audits') {
    const workspace = data.workspaces;
    if (
      !record(workspace) ||
      workspace.version !== 1 ||
      typeof workspace.available !== 'boolean' ||
      !Array.isArray(workspace.scopes) ||
      !workspace.scopes.every(
        (scope) =>
          record(scope) &&
          ['repository', 'component', 'version'].every((key) => typeof scope[key] === 'string') &&
          record(scope.summary) &&
          record(scope.summary.criticalities) &&
          record(scope.summary.categories) &&
          record(scope.summary.byComponent) &&
          [
            'declared',
            'treated',
            'cancelled',
            'remaining',
            'qualified',
            'presumed',
            'unqualified',
            'measured',
            'estimated',
            'actual',
            'components',
            'covered',
            'conform',
            'nonConform',
            'nonCovered',
            'unknown',
            'qualityIssues'
          ].every((key) => Number.isFinite(scope.summary[key])) &&
          ['treatmentRate', 'average', 'median', 'p90', 'coverage', 'conformity'].every(
            (key) => scope.summary[key] === null || Number.isFinite(scope.summary[key])
          ) &&
          Object.values(scope.summary.criticalities).every(
            (item) =>
              record(item) &&
              ['declared', 'treated', 'count'].every((key) => Number.isFinite(item[key])) &&
              (item.average === null || Number.isFinite(item.average))
          )
      )
    )
      throw new Error('Synthèses des espaces indisponibles ou version incompatible.');
    if (
      expectedPage === 'accessibility' &&
      (!facts(workspace.rows) ||
        !facts(workspace.review) ||
        !workspace.rows
          .concat(workspace.review)
          .every(
            (row) =>
              record(row.qualification) &&
              Array.isArray(row.qualification.reasons) &&
              Array.isArray(row.categories) &&
              Array.isArray(row.auditIds)
          ))
    )
      throw new Error('Détails d’accessibilité indisponibles.');
  }
  return model;
}

let cached;
/** Explique un échec de lecture et désactive les interactions sans présenter de faux résultats. */
function showPageError(message) {
  const main = document.querySelector('main');
  if (!main) return;
  const error = document.createElement('p');
  error.className = 'panel';
  error.setAttribute('role', 'alert');
  error.dataset.pageDataError = '';
  error.textContent = `${message} Données interactives indisponibles : régénérez le dashboard complet avec ses assets. Les tableaux statiques ne constituent pas un résultat filtré actualisé.`;
  main.prepend(error);
  main.querySelectorAll('input, select, button').forEach((control) => {
    control.disabled = true;
  });
  main
    .querySelectorAll('[data-workspace-kpi], [data-issue-kpi], [data-component-count], [data-quality-count]')
    .forEach((node) => {
      node.textContent = 'Indisponible';
    });
  main.querySelectorAll('[data-workspace-ratio]').forEach((node) => {
    node.textContent = 'Ratio indisponible';
  });
  main.querySelectorAll('[data-quality-group-summary], [data-quality-cause-selection]').forEach((node) => {
    node.textContent = 'Indisponible';
  });
  main.querySelectorAll('[data-workspace-breakdowns]').forEach((node) => {
    node.textContent = 'Ventilations indisponibles.';
  });
  main
    .querySelectorAll('[data-workspace-summary], [data-issue-summary], [data-epic-summary]')
    .forEach((node) => {
      node.textContent = 'Détails indisponibles : aucun zéro ne peut être conclu.';
    });
}
/** Lit et valide une seule fois le JSON propre au document ; aucune promesse de cache entre navigations. */
export function readPageModel() {
  if (cached !== undefined) return cached;
  try {
    const payload = document.getElementById('dashboard-page-data');
    if (!payload) throw new Error('Contrat de page absent.');
    cached = decodePageModel(payload.textContent, document.body.dataset.dashboardPage);
  } catch (error) {
    cached = null;
    showPageError(error.message);
  }
  return cached;
}
