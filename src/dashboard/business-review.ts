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
    `<a href="issues.html?${escape(new URLSearchParams(params).toString())}">${value}</a>`;
  const componentRows = summary.components
    .map((row) => {
      const repo = libraries.get(row.libraryId) ?? '';
      const audit = data.audits.find((item) => item.auditId === row.latestAuditId);
      return `<tr data-review-row data-context="${escape(JSON.stringify({ repo, componentIds: [row.componentId], components: [row.name] }))}"><td>${escape(repo)}</td><td>${escape(row.name)}</td><td>${audit ? escape(audit.version + ' · ' + audit.objectiveAuditResult) : 'Aucun audit terminé'}</td><td>${link(row.accessibility, { repository: repo, component: row.componentId, kind: 'accessibility' })}</td><td>${row.pendingAccessibility}</td><td>${link(row.corrected, { repository: repo, component: row.componentId, review: 'corrected' })}</td><td>${link(row.withoutAudit, { repository: repo, component: row.componentId, review: 'no-audit' })}</td></tr>`;
    })
    .join('');
  const auditRows = summary.audits
    .map((row) => {
      const repo = libraries.get(row.libraryId) ?? '';
      const component = data.components.find((item) => item.componentId === row.componentId);
      return `<tr data-review-row data-context="${escape(JSON.stringify({ repo, componentIds: [row.componentId], components: [component?.name], versions: [row.version], auditIds: [row.auditId] }))}"><td>${escape(repo)}</td><td>${escape(component?.name)}</td><td>${escape(row.version)}</td><td>${row.detected}</td><td>${link(row.corrected, { repository: repo, component: row.componentId, audit: row.auditId, review: 'corrected' })}</td><td>${row.verified}</td><td>${link(row.improvements, { repository: repo, audit: row.auditId, review: 'improvements' })}</td></tr>`;
    })
    .join('');
  return `<section class="panel" id="business-review"><h2>Résultats d’audit et bugs connus</h2><p>${summary.occurrences} occurrences par composant ; ${summary.distinctBugs} issues de bug distinctes. ${link(summary.withoutComponent, { review: 'no-component' })} anomalies sans composant, hors total des occurrences. Les catégories accessibilité et fonctionnel peuvent se recouvrir.</p><p>Une correction confirmée exige Done et une PR liée fusionnée. Elle ne prouve ni publication ni conformité. La synthèse privilégie la version auditée terminée la plus récente.</p><div class="table-wrap" tabindex="0" role="region" aria-label="Audits et bugs connus par composant"><table><thead><tr>${['Repository', 'Composant', 'Résultat du dernier audit', 'Bugs d’accessibilité connus non neutralisés', 'Sans vérification confirmée', 'Corrections confirmées', 'Bugs sans audit rattaché'].map((name) => '<th scope="col">' + name + '</th>').join('')}</tr></thead><tbody>${componentRows}</tbody></table></div><h3>Corrections par version auditée</h3><div class="table-wrap" tabindex="0" role="region" aria-label="Corrections et améliorations par audit"><table><thead><tr>${['Repository', 'Composant', 'Version auditée', 'Anomalies détectées', 'Corrections confirmées', 'Vérifiées par audit ultérieur', 'Améliorations proposées'].map((name) => '<th scope="col">' + name + '</th>').join('')}</tr></thead><tbody>${auditRows}</tbody></table></div></section>`;
}
