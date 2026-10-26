import type { Snapshot } from '../domain/types.js';

/** Échappe les textes issus des preuves avant restitution HTML. */
function escape(value: unknown): string {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!
  );
}

/** Présente les synthèses métier calculées par Analytics, sans recalcul de conformité côté navigateur. */
export function businessReviewContent(snapshot: Snapshot): string {
  const summary = snapshot.analytics.businessReview;
  if (!summary) return '';
  const data = snapshot.normalizedData;
  const libraries = new Map(data.libraries.map((item) => [item.libraryId, item.repository]));
  /** Produit un lien ciblé vers les preuves sans ambiguïté entre versions auditée et corrigée. */
  const link = (value: number, params: Record<string, string>) =>
    `<a data-review-slot="s4v" href="issues.html?${escape(new URLSearchParams(params).toString())}">${value}</a>`;
  const componentRows = summary.components
    .map((row) => {
      const repo = libraries.get(row.libraryId) ?? '';
      const audit = data.audits.find((item) => item.auditId === row.latestAuditId);
      return `<tr data-review-slot="s4w" data-review-row data-context="${escape(JSON.stringify({ repo, componentIds: [row.componentId], components: [row.name] }))}"><td data-review-slot="s4x">${escape(repo)}</td><td data-review-slot="s4y">${escape(row.name)}</td><td data-review-slot="s4z">${audit ? escape(audit.version + ' · ' + audit.objectiveAuditResult) : 'Aucun audit terminé'}</td><td data-review-slot="s50">${link(row.accessibility, { repository: repo, component: row.componentId, kind: 'accessibility' })}</td><td data-review-slot="s51">${row.pendingAccessibility}</td><td data-review-slot="s52">${link(row.corrected, { repository: repo, component: row.componentId, review: 'corrected' })}</td><td data-review-slot="s53">${link(row.withoutAudit, { repository: repo, component: row.componentId, review: 'no-audit' })}</td></tr>`;
    })
    .join('');
  const auditRows = summary.audits
    .map((row) => {
      const repo = libraries.get(row.libraryId) ?? '';
      const component = data.components.find((item) => item.componentId === row.componentId);
      return `<tr data-review-slot="s54" data-review-row data-context="${escape(JSON.stringify({ repo, componentIds: [row.componentId], components: [component?.name], versions: [row.version], auditIds: [row.auditId] }))}"><td data-review-slot="s55">${escape(repo)}</td><td data-review-slot="s56">${escape(component?.name)}</td><td data-review-slot="s57">${escape(row.version)}</td><td data-review-slot="s58">${row.detected}</td><td data-review-slot="s59">${link(row.corrected, { repository: repo, component: row.componentId, audit: row.auditId, review: 'corrected' })}</td><td data-review-slot="s5a">${row.verified}</td><td data-review-slot="s5b">${link(row.improvements, { repository: repo, audit: row.auditId, review: 'improvements' })}</td></tr>`;
    })
    .join('');
  return `<section data-review-slot="s5c" class="panel" id="business-review"><h2 data-review-slot="s5d">Résultats d’audit et bugs connus</h2><p data-review-slot="s5e">${summary.occurrences} occurrences par composant ; ${summary.distinctBugs} issues de bug distinctes. ${link(summary.withoutComponent, { review: 'no-component' })} anomalies sans composant, hors total des occurrences. Les catégories accessibilité et fonctionnel peuvent se recouvrir.</p><p data-review-slot="s5f">Une correction confirmée exige Done et une PR liée fusionnée. Elle ne prouve ni publication ni conformité. La synthèse privilégie la version auditée terminée la plus récente.</p><div data-review-slot="s5g" class="table-wrap" tabindex="0" role="region" aria-label="Audits et bugs connus par composant"><table data-review-slot="s5h"><thead data-review-slot="s5i"><tr data-review-slot="s5j">${['Repository', 'Composant', 'Résultat du dernier audit', 'Bugs d’accessibilité connus non neutralisés', 'Sans vérification confirmée', 'Corrections confirmées', 'Bugs sans audit rattaché'].map((name, field) => '<th data-review-key="' + field + '" data-review-slot="s5k" scope="col">' + name + '</th>').join('')}</tr></thead><tbody data-review-slot="s5l">${componentRows}</tbody></table></div><h3 data-review-slot="s5m">Corrections par version auditée</h3><div data-review-slot="s5n" class="table-wrap" tabindex="0" role="region" aria-label="Corrections et améliorations par audit"><table data-review-slot="s5o"><thead data-review-slot="s5p"><tr data-review-slot="s5q">${['Repository', 'Composant', 'Version auditée', 'Anomalies détectées', 'Corrections confirmées', 'Vérifiées par audit ultérieur', 'Améliorations proposées'].map((name, field) => '<th data-review-key="' + field + '" data-review-slot="s5r" scope="col">' + name + '</th>').join('')}</tr></thead><tbody data-review-slot="s5s">${auditRows}</tbody></table></div></section>`;
}
