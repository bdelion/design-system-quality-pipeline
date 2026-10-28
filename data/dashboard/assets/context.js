/** Dimensions de navigation reconnues par toutes les pages. */
export const contextKeys = ['repository', 'component', 'version', 'issue', 'audit', 'anomaly', 'family'];

/**
 * Teste l'intersection des dimensions sur des faits explicites ; une référence inconnue ne correspond à rien.
 * @param {object} fact - Fait ou ligne traçable avec dimensions scalaires ou multiples.
 * @param {URLSearchParams} context - Paramètres du périmètre demandé.
 * @returns {boolean} Vrai si toutes les dimensions renseignées sont satisfaites.
 */
export function matchesFact(fact, context) {
  return contextKeys.every((key) => {
    const expected = context.get(key);
    if (!expected) return true;
    const values = {
      repository: [fact.repo ?? fact.repository],
      component: [...(fact.components ?? []), ...(fact.componentIds ?? [])],
      version: [...(fact.versions ?? []), ...(fact.versionIds ?? [])],
      issue: [fact.id, fact.issueId, fact.key],
      audit: fact.auditIds ?? [],
      anomaly: fact.anomalyIds ?? [],
      family: [fact.family]
    }[key];
    return values?.includes(expected) ?? false;
  });
}

/** Applique le contexte à une ligne HTML sans ignorer une dimension absente. */
export function matchesRow(row, context, fields = contextKeys) {
  if (row.dataset.context) return matchesFact(JSON.parse(row.dataset.context), context);
  return fields.every((field) => {
    const expected = context.get(field);
    if (!expected) return true;
    const multiple = row.getAttribute('data-' + field + 's');
    return multiple
      ? JSON.parse(multiple).includes(expected)
      : row.getAttribute('data-' + field) === expected;
  });
}

/**
 * Transmet le périmètre sans écraser les dimensions explicites du lien cible ni son ancre.
 * @param {string} href - Lien interne original, conservé indépendamment des filtres précédents.
 * @param {URLSearchParams} context - Périmètre courant.
 * @returns {string} Lien enrichi, ou lien externe inchangé.
 */
export function contextualHref(href, context) {
  if (
    !/^(?:index|accessibility|quality|issues|anomalies|components|audits|graph|history)\.html(?:[?#]|$)/.test(
      href
    )
  )
    return href;
  const [withoutHash, hash = ''] = href.split('#', 2);
  const [pathname, search = ''] = withoutHash.split('?', 2);
  const target = new URLSearchParams();
  contextKeys.forEach((key) => {
    if (context.get(key)) target.set(key, context.get(key));
  });
  const explicit = new URLSearchParams(search);
  if (['issue', 'audit', 'anomaly'].some((key) => explicit.has(key)))
    ['issue', 'audit', 'anomaly', 'family', 'version'].forEach((key) => target.delete(key));
  explicit.forEach((value, key) => target.set(key, value));
  return pathname + (target.size ? '?' + target.toString() : '') + (hash ? '#' + hash : '');
}

/** Lit le périmètre courant après toute modification de filtre ou navigation arrière. */
export function currentContext() {
  return new URLSearchParams(window.location.search);
}

/** Met à jour l'URL et notifie toutes les vues lors d'un changement de périmètre. */
export function setContext(values) {
  const params = currentContext();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
    else params.delete(key);
  });
  window.history.replaceState(
    null,
    '',
    window.location.pathname + (params.size ? '?' + params.toString() : '') + window.location.hash
  );
  window.dispatchEvent(new window.CustomEvent('dashboard-context-change'));
}
