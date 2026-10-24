import { consolidationSnapshot } from './consolidation.js';

/** Produit 120 issues et 3 000 diagnostics fictifs, dont 120 correspondent au filtre cible. */
export function paginationSnapshot() {
  const snapshot = consolidationSnapshot();
  snapshot.snapshotId = 'pagination-synthetic-v1';
  const base = snapshot.normalizedData.issues!.at(-1)!;
  snapshot.normalizedData.issues = Array.from({ length: 120 }, (_, index) => ({
    ...structuredClone(base),
    issueId: `pagination-issue-${index + 1}`,
    number: index + 1,
    title: `Issue synthétique ${index + 1}`,
    labels: ['Lot'],
    url: `https://github.enterprise.test/acme/ds-react/issues/${index + 1}`,
    provenance: { ...base.provenance, sourceId: `pagination-issue-${index + 1}` }
  }));
  snapshot.dataQuality.issues = Array.from({ length: 3000 }, (_, index) => ({
    id: `pagination-diagnostic-${index + 1}`,
    ruleId: index < 120 ? 'CIBLE' : 'AUTRE',
    severity: 'WARNING',
    action: 'include',
    entityType: 'Issue',
    entityId: `pagination-issue-${(index % 120) + 1}`,
    message: `Diagnostic synthétique ${index + 1}`,
    detectedAt: snapshot.capturedAt,
    impacts: [{ metricId: 'test.metric', action: 'include', reason: 'Preuve synthétique intégrale' }]
  }));
  snapshot.dataQuality.summary = { INFO: 0, WARNING: 3000, ERROR: 0 };
  snapshot.reliability = 'partial';
  delete snapshot.analytics.workspaces;
  return snapshot;
}
