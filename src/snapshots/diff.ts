import type { AnomalyStatus, Component, Library, PullRequest, Snapshot } from '../domain/types.js';

export interface EntityDelta<TId extends string = string> {
  added: TId[];
  removed: TId[];
}

export interface AnomalyTransition {
  anomalyId: string;
  from: Exclude<AnomalyStatus, 'cancelled'>;
  to: Exclude<AnomalyStatus, 'cancelled'>;
}

export interface SnapshotDiff {
  fromSnapshotId: string;
  toSnapshotId: string;
  fromCapturedAt: string;
  toCapturedAt: string;
  period: { from: string; to: string };
  libraries: EntityDelta;
  components: EntityDelta;
  audits: EntityDelta;
  anomalies: EntityDelta;
  pullRequests: EntityDelta;
  anomalyTransitions: AnomalyTransition[];
  anomaliesCreated: string[];
  anomaliesCorrected: string[];
  anomaliesReopened: string[];
  anomaliesCancelled: string[];
}

function ids<T>(items: T[], id: (item: T) => string): Set<string> {
  return new Set(items.map(id));
}

function delta<T>(before: T[], after: T[], id: (item: T) => string): EntityDelta {
  const beforeIds = ids(before, id);
  const afterIds = ids(after, id);
  return {
    added: [...afterIds].filter((value) => !beforeIds.has(value)),
    removed: [...beforeIds].filter((value) => !afterIds.has(value))
  };
}

function byId<T>(items: T[], id: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [id(item), item]));
}

function anomalyStatus(snapshot: Snapshot, issueId: string): Exclude<AnomalyStatus, 'cancelled'> | undefined {
  const issue = snapshot.normalizedData.issues.find((candidate) => candidate.issueId === issueId);
  if (!issue) return undefined;
  const values = [...new Set(issue.projectStatuses.flatMap((project) => {
    const raw = (project.status.canonicalValue ?? project.status.rawValue).trim().toLowerCase();
    const value = ({ 'in progress': 'in_progress', 'in-progress': 'in_progress' } as Record<string, string>)[raw] ?? raw;
    return ['open', 'in_progress', 'done', 'reopened'].includes(value) ? [value as Exclude<AnomalyStatus, 'cancelled'>] : [];
  }))];
  return values.length === 1 ? values[0] : undefined;
}

/** Compare deux snapshots et produit uniquement des faits observables entre les deux états. */
export function diffSnapshots(before: Snapshot, after: Snapshot): SnapshotDiff {
  if (before.capturedAt >= after.capturedAt) throw new Error('Snapshot order is invalid: before must precede after.');

  const previousAnomalies = byId(before.normalizedData.anomalies, (item) => item.anomalyId);
  const currentAnomalies = byId(after.normalizedData.anomalies, (item) => item.anomalyId);
  const anomalyTransitions: AnomalyTransition[] = [];
  const anomaliesCorrected: string[] = [];
  const anomaliesReopened: string[] = [];
  const anomaliesCancelled: string[] = [];

  for (const [anomalyId, current] of currentAnomalies) {
    const previous = previousAnomalies.get(anomalyId);
    if (!previous) continue;
    const previousStatus = anomalyStatus(before, previous.issueId);
    const currentStatus = anomalyStatus(after, current.issueId);
    if (previousStatus && currentStatus && previousStatus !== currentStatus) {
      anomalyTransitions.push({ anomalyId, from: previousStatus, to: currentStatus });
      if (currentStatus === 'reopened') anomaliesReopened.push(anomalyId);
    }
    if (!previous.correctedAt && current.correctedAt) anomaliesCorrected.push(anomalyId);
  }

  const anomaliesCreated = delta(before.normalizedData.anomalies, after.normalizedData.anomalies, (item) => item.anomalyId).added;

  return {
    fromSnapshotId: before.snapshotId,
    toSnapshotId: after.snapshotId,
    fromCapturedAt: before.capturedAt,
    toCapturedAt: after.capturedAt,
    period: { from: before.capturedAt, to: after.capturedAt },
    libraries: delta(before.normalizedData.libraries, after.normalizedData.libraries, (item: Library) => item.libraryId),
    components: delta(before.normalizedData.components, after.normalizedData.components, (item: Component) => item.componentId),
    audits: delta(before.normalizedData.audits, after.normalizedData.audits, (item) => item.auditId),
    anomalies: delta(before.normalizedData.anomalies, after.normalizedData.anomalies, (item) => item.anomalyId),
    pullRequests: delta(before.normalizedData.pullRequests, after.normalizedData.pullRequests, (item: PullRequest) => item.pullRequestId),
    anomalyTransitions,
    anomaliesCreated,
    anomaliesCorrected,
    anomaliesReopened,
    anomaliesCancelled
  };
}
