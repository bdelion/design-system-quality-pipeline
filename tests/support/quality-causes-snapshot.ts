import { paginationSnapshot } from './pagination-snapshot.js';

/** Prépare six causes distinctes, dont 120 occurrences de criticité absente et des sources/actions inconnues. */
export function qualityCausesSnapshot() {
  const snapshot = paginationSnapshot();
  snapshot.snapshotId = 'quality-causes-synthetic-v1';
  const base = {
    ...snapshot.dataQuality.issues[0]!,
    ruleId: 'DQ-001',
    severity: 'ERROR' as const,
    action: 'exclude' as const,
    message: 'Anomaly has no criticality.',
    impacts: [{ metricId: 'anomaly.byCriticality', action: 'exclude' as const, reason: 'Criticité absente' }]
  };
  snapshot.dataQuality.issues = Array.from({ length: 120 }, (_, index) => ({
    ...structuredClone(base),
    id: `missing-criticality-${index}`,
    entityId: `pagination-issue-${index + 1}`
  }));
  snapshot.dataQuality.issues.push(
    {
      ...structuredClone(base),
      id: 'conflict',
      ruleId: 'DQ-002',
      message: 'Anomaly has incompatible multiple criticalities.'
    },
    {
      ...structuredClone(base),
      id: 'orphan-audit',
      ruleId: 'DQ-029',
      message: 'Audit contains an unresolved normalized reference.'
    },
    {
      ...structuredClone(base),
      id: 'orphan-anomaly',
      ruleId: 'DQ-029',
      message: 'Anomaly contains an unresolved normalized reference.'
    },
    {
      ...structuredClone(base),
      id: 'unknown',
      ruleId: 'PERSONNALISEE',
      entityId: 'sans-source',
      message: 'Message technique spécifique sans action documentée.'
    },
    { ...structuredClone(base), id: 'unresolved', entityId: 'autre-source-absente' }
  );
  // Simule une ancienne capture contenant une action étrangère au contrat courant.
  Reflect.set(
    snapshot.dataQuality.issues.find((issue) => issue.id === 'unknown')!,
    'action',
    'unknown'
  );
  snapshot.dataQuality.summary = { INFO: 0, WARNING: 0, ERROR: 125 };
  return snapshot;
}
