import type { BusinessTransition, Snapshot } from '../domain/types.js';
import { auditProgress, issueBusinessState, lastDoneAt } from '../domain/business.js';

/**
 * Construit un journal de changements observés entre deux snapshots comparables.
 * La date de collecte n'est jamais présentée comme date d'une transition métier.
 * @param before - État antérieur immuable.
 * @param after - État courant immuable.
 * @returns Changements d'issues, audits, anomalies et verdicts par couple.
 */
export function businessTransitions(before: Snapshot, after: Snapshot): BusinessTransition[] {
  const records: BusinessTransition[] = [];
  /** Compare une population par identifiant stable et conserve les preuves temporelles disponibles. */
  const compare = <T>(
    entityType: BusinessTransition['entityType'],
    previous: T[],
    current: T[],
    id: (item: T) => string,
    state: (item: T, snapshot: Snapshot) => string,
    issueId: (item: T) => string | undefined
  ) => {
    const old = new Map(previous.map((item) => [id(item), item]));
    for (const item of current) {
      const prior = old.get(id(item));
      if (!prior) continue;
      const from = state(prior, before),
        to = state(item, after);
      if (from === to) continue;
      const sourceId = issueId(item);
      const issue = after.normalizedData.issues?.find((candidate) => candidate.issueId === sourceId);
      const date =
        to === 'treated' || to.startsWith('completed')
          ? issue
            ? lastDoneAt(issue)
            : undefined
          : issue?.projectContexts
              .flatMap((context) => context.statusHistory)
              .filter((entry) => Number.isFinite(Date.parse(entry.transitionedAt)))
              .sort((a, b) => Date.parse(a.transitionedAt) - Date.parse(b.transitionedAt))
              .at(-1)?.transitionedAt;
      records.push({
        entityType,
        entityId: id(item),
        from,
        to,
        observedAt: after.capturedAt,
        fromSnapshotId: before.snapshotId,
        toSnapshotId: after.snapshotId,
        ...(sourceId ? { issueId: sourceId } : {}),
        ...(date &&
        Date.parse(date) > Date.parse(before.capturedAt) &&
        Date.parse(date) <= Date.parse(after.capturedAt)
          ? { businessAt: date }
          : {})
      });
    }
  };
  compare(
    'issue',
    before.normalizedData.issues ?? [],
    after.normalizedData.issues ?? [],
    (item) => item.issueId,
    issueBusinessState,
    (item) => item.issueId
  );
  compare(
    'audit',
    before.normalizedData.audits,
    after.normalizedData.audits,
    (item) => item.auditId,
    (item, snapshot) => {
      const progress = auditProgress(item, snapshot.normalizedData.issues ?? []);
      return progress === 'completed' ? `${progress}:${item.objectiveAuditResult}` : progress;
    },
    (item) => item.issueId
  );
  compare(
    'anomaly',
    before.normalizedData.anomalies,
    after.normalizedData.anomalies,
    (item) => item.anomalyId,
    (item) => item.status,
    (item) => item.issueId
  );
  compare(
    'componentVersion',
    before.normalizedData.componentVersions ?? [],
    after.normalizedData.componentVersions ?? [],
    (item) => item.componentVersionId,
    (item) => item.verdict ?? 'NON_COUVERT',
    () => undefined
  );
  return records.sort(
    (a, b) => a.entityType.localeCompare(b.entityType) || a.entityId.localeCompare(b.entityId)
  );
}
