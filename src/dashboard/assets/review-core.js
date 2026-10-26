/** Associe une clé de rôle permanente à un élément créé par un modèle de rendu. */
export function markReview(slot, node) {
  node.setAttribute('data-review-slot', slot);
  return node;
}

/** Construit une référence sans hachage ni perte d’information, indépendante des valeurs affichées. */
export function reviewId(site, presentation, page, segments) {
  return ['DSQ1', site, presentation, page, ...segments]
    .map((part) => encodeURIComponent(String(part)))
    .join('/');
}

/** Extrait uniquement les clés d’identité explicites ; aucun texte affiché ni numéro de ligne n’est utilisé. */
export function reviewEntity(node) {
  if (node.dataset.reviewKey !== undefined) return node.dataset.reviewKey;
  if (node.localName === 'option') return 'option:' + node.value;
  if (node.id) return 'id:' + node.id;
  for (const key of [
    'space',
    'issueCheck',
    'componentCheck',
    'identity',
    'componentId',
    'metricId',
    'tableId',
    'workspaceKpi',
    'workspaceRatio',
    'teamCount',
    'pagination',
    'contextFilter',
    'qualityFilter',
    'issueFilter',
    'componentFilter',
    'issueColumn',
    'issueColumnSort',
    'componentSort',
    'reviewOrigin'
  ]) {
    if (node.dataset[key]) return key + ':' + node.dataset[key];
  }
  if (node.dataset.context) {
    try {
      const fact = JSON.parse(node.dataset.context);
      if (fact.id) return 'entity:' + fact.id;
      const identity = Object.fromEntries(
        ['repository', 'repo', 'componentIds', 'versionIds', 'issueIds', 'anomalyIds', 'auditIds']
          .filter((key) => fact[key] !== undefined)
          .map((key) => [key, fact[key]])
      );
      if (Object.keys(identity).length) return JSON.stringify(identity);
    } catch {
      /* Un contexte illisible ne devient pas une identité inventée. */
    }
  }
  if (node.localName === 'tr') {
    const check = node.querySelector('[data-issue-check], [data-component-check]');
    if (check) return reviewEntity(check);
  }
  return '';
}
