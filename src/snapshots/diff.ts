/**
 * @module snapshots.diff
 * Compare deux snapshots pour identifier les changements d’entités.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type {
  Audit,
  Anomaly,
  Component,
  ComponentVersion,
  Library,
  PullRequest,
  Snapshot,
  Version
} from '../domain/types.js';

/**
 * Définit le contrat de données « EntityDelta » utilisé par le pipeline.
 */
export interface EntityDelta<TId extends string = string> {
  added: TId[];
  removed: TId[];
}

/**
 * Définit le contrat de données « AnomalyTransition » utilisé par le pipeline.
 */
export interface AnomalyTransition {
  anomalyId: string;
  from: Anomaly['status'];
  to: Anomaly['status'];
}

/**
 * Définit le contrat de données « SnapshotDiff » utilisé par le pipeline.
 */
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
  versions: EntityDelta;
  componentVersions: EntityDelta;
  pullRequests: EntityDelta;
  anomalyTransitions: AnomalyTransition[];
  anomaliesCreated: string[];
  anomaliesCorrected: string[];
  anomaliesReopened: string[];
  anomaliesCancelled: string[];
}

/**
 * Réalise le traitement « ids » dans le pipeline de qualité.
 *
 * @param items - Valeur de « items » utilisée par ce traitement.
 * @param id - Valeur de « id » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function ids<T>(items: T[], id: (item: T) => string): Set<string> {
  return new Set(items.map(id));
}

/**
 * Réalise le traitement « delta » dans le pipeline de qualité.
 *
 * @param before - Valeur de « before » utilisée par ce traitement.
 * @param after - Valeur de « after » utilisée par ce traitement.
 * @param id - Valeur de « id » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function delta<T>(before: T[], after: T[], id: (item: T) => string): EntityDelta {
  const beforeIds = ids(before, id);
  const afterIds = ids(after, id);
  return {
    added: [...afterIds].filter((value) => !beforeIds.has(value)),
    removed: [...beforeIds].filter((value) => !afterIds.has(value))
  };
}

/**
 * Réalise le traitement « by id » dans le pipeline de qualité.
 *
 * @param items - Valeur de « items » utilisée par ce traitement.
 * @param id - Valeur de « id » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function byId<T>(items: T[], id: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [id(item), item]));
}

/** Compare deux snapshots et produit uniquement des faits observables entre les deux états. */
export function diffSnapshots(before: Snapshot, after: Snapshot): SnapshotDiff {
  if (before.capturedAt >= after.capturedAt)
    throw new Error('Snapshot order is invalid: before must precede after.');

  const previousAnomalies = byId(before.normalizedData.anomalies, (item) => item.anomalyId);
  const currentAnomalies = byId(after.normalizedData.anomalies, (item) => item.anomalyId);
  const anomalyTransitions: AnomalyTransition[] = [];
  const anomaliesCorrected: string[] = [];
  const anomaliesReopened: string[] = [];
  const anomaliesCancelled: string[] = [];

  for (const [anomalyId, current] of currentAnomalies) {
    const previous = previousAnomalies.get(anomalyId);
    if (!previous) continue;
    if (previous.status !== current.status) {
      anomalyTransitions.push({ anomalyId, from: previous.status, to: current.status });
    }
    if (!previous.correctedAt && current.correctedAt) anomaliesCorrected.push(anomalyId);
    if (previous.status !== 'reopened' && current.status === 'reopened') anomaliesReopened.push(anomalyId);
    if (!previous.cancelled && current.cancelled) anomaliesCancelled.push(anomalyId);
  }

  const anomaliesCreated = delta(
    before.normalizedData.anomalies,
    after.normalizedData.anomalies,
    (item) => item.anomalyId
  ).added;

  return {
    fromSnapshotId: before.snapshotId,
    toSnapshotId: after.snapshotId,
    fromCapturedAt: before.capturedAt,
    toCapturedAt: after.capturedAt,
    period: { from: before.capturedAt, to: after.capturedAt },
    libraries: delta(
      before.normalizedData.libraries,
      after.normalizedData.libraries,
      (item: Library) => item.libraryId
    ),
    components: delta(
      before.normalizedData.components,
      after.normalizedData.components,
      (item: Component) => item.componentId
    ),
    audits: delta(before.normalizedData.audits, after.normalizedData.audits, (item: Audit) => item.auditId),
    versions: delta(
      before.normalizedData.versions ?? [],
      after.normalizedData.versions ?? [],
      (item: Version) => item.versionId
    ),
    componentVersions: delta(
      before.normalizedData.componentVersions ?? [],
      after.normalizedData.componentVersions ?? [],
      (item: ComponentVersion) => item.componentVersionId
    ),
    anomalies: delta(
      before.normalizedData.anomalies,
      after.normalizedData.anomalies,
      (item: Anomaly) => item.anomalyId
    ),
    pullRequests: delta(
      before.normalizedData.pullRequests,
      after.normalizedData.pullRequests,
      (item: PullRequest) => item.pullRequestId
    ),
    anomalyTransitions,
    anomaliesCreated,
    anomaliesCorrected,
    anomaliesReopened,
    anomaliesCancelled
  };
}
