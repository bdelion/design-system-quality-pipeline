/**
 * @module snapshots.history
 * Reconstruit les états historiques et les séries temporelles des versions et métriques.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type {
  NormalizedData,
  Snapshot,
  Version,
  VersionHistoricalState,
  VersionHistoricalView
} from '../domain/types.js';
import { applyComponentVersionVerdicts } from '../analytics/component-versions.js';

/**
 * Builds release-time and current-knowledge views without rewriting business dates.
 * Release-time facts are selected only from explicit business timestamps.
 */
export function buildVersionHistoricalStates(data: NormalizedData): VersionHistoricalState[] {
  return (data.versions ?? [])
    .filter((version): version is Version & { releasedAt: string } => version.releasedAt !== undefined)
    .sort(
      (left, right) =>
        left.releasedAt.localeCompare(right.releasedAt) || left.versionId.localeCompare(right.versionId)
    )
    .map((version) => ({
      versionId: version.versionId,
      releasedAt: version.releasedAt,
      atRelease: buildVersionView(data, version, version.releasedAt),
      currentKnowledge: buildVersionView(data, version)
    }));
}

/**
 * Construit version view dans le contexte du pipeline de qualité.
 *
 * @param data - Valeur de « data » utilisée par ce traitement.
 * @param version - Valeur de « version » utilisée par ce traitement.
 * @param cutoff - Valeur de « cutoff » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function buildVersionView(data: NormalizedData, version: Version, cutoff?: string): VersionHistoricalView {
  const versionIds = new Set(
    (data.versions ?? [])
      .filter((candidate) => candidate.libraryId === version.libraryId)
      .map((candidate) => candidate.versionId)
  );
  const componentVersions = structuredClone(
    (data.componentVersions ?? []).filter((relation) => relation.versionId === version.versionId)
  );
  const componentIds = new Set(componentVersions.map((relation) => relation.componentId));
  const audits = structuredClone(
    data.audits.filter(
      (audit) =>
        componentIds.has(audit.componentId) &&
        audit.versionId !== undefined &&
        versionIds.has(audit.versionId) &&
        isAtOrBeforeTargetVersion(data, audit.versionId, version) &&
        (cutoff === undefined || (audit.completedAt !== undefined && audit.completedAt <= cutoff))
    )
  );
  const auditIds = new Set(audits.map((audit) => audit.auditId));
  const anomalies = structuredClone(
    data.anomalies.filter(
      (anomaly) =>
        anomaly.origin === 'AUDIT' &&
        anomaly.auditId !== undefined &&
        auditIds.has(anomaly.auditId) &&
        (cutoff === undefined || anomaly.detectedAt <= cutoff)
    )
  );

  const projection: NormalizedData = {
    libraries: structuredClone(data.libraries),
    components: structuredClone(data.components),
    issues: structuredClone(data.issues ?? []),
    versions: structuredClone(data.versions ?? []),
    componentVersions,
    audits,
    anomalies,
    auditImprovements: [],
    pullRequests: []
  };
  applyComponentVersionVerdicts(projection);

  return {
    versionId: version.versionId,
    releasedAt: version.releasedAt!,
    componentVersions: projection.componentVersions ?? [],
    audits,
    anomalies
  };
}

/**
 * Définit le contrat de données « SnapshotCompatibility » utilisé par le pipeline.
 */
export interface SnapshotCompatibility {
  scope: string;
  modelVersion: string;
  ruleVersion: string;
}

/** Selects the latest snapshot that can be compared without mixing rule/model semantics. */
export function latestComparableSnapshot(
  snapshots: Snapshot[],
  target: SnapshotCompatibility
): Snapshot | undefined {
  return snapshots
    .filter(
      (snapshot) =>
        snapshot.scope === target.scope &&
        snapshot.modelVersion === target.modelVersion &&
        snapshot.ruleVersion === target.ruleVersion
    )
    .sort((left, right) => right.capturedAt.localeCompare(left.capturedAt))[0];
}

/**
 * Vérifie at or before target version dans le contexte du pipeline de qualité.
 *
 * @param data - Valeur de « data » utilisée par ce traitement.
 * @param auditVersionId - Valeur de « auditVersionId » utilisée par ce traitement.
 * @param target - Valeur de « target » utilisée par ce traitement.
 * @returns Indique si la condition est satisfaite.
 */
function isAtOrBeforeTargetVersion(data: NormalizedData, auditVersionId: string, target: Version): boolean {
  const auditVersion = (data.versions ?? []).find((candidate) => candidate.versionId === auditVersionId);
  if (!auditVersion || auditVersion.libraryId !== target.libraryId) return false;
  return compareProdVersions(auditVersion.number, target.number) <= 0;
}

/**
 * Compare prod versions dans le contexte du pipeline de qualité.
 *
 * @param left - Valeur de « left » utilisée par ce traitement.
 * @param right - Valeur de « right » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function compareProdVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index]! - rightParts[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}

/**
 * Définit le contrat de données « MetricHistoryPoint » utilisé par le pipeline.
 */
export interface MetricHistoryPoint {
  snapshotId: string;
  capturedAt: string;
  modelVersion: string;
  ruleVersion: string;
  value: number | 'unknown';
  reliability: string;
}

/** Reads stored metric values as-is; historical snapshots are never recalculated. */
export function metricHistory(
  snapshots: Snapshot[],
  metricId: string,
  target: SnapshotCompatibility
): MetricHistoryPoint[] {
  return snapshots
    .filter(
      (snapshot) =>
        snapshot.scope === target.scope &&
        snapshot.modelVersion === target.modelVersion &&
        snapshot.ruleVersion === target.ruleVersion
    )
    .flatMap((snapshot) => {
      const metric = snapshot.analytics.metrics[metricId];
      return metric
        ? [
            {
              snapshotId: snapshot.snapshotId,
              capturedAt: snapshot.capturedAt,
              modelVersion: snapshot.modelVersion,
              ruleVersion: snapshot.ruleVersion,
              value: metric.value,
              reliability: metric.reliability.status
            }
          ]
        : [];
    })
    .sort((left, right) => left.capturedAt.localeCompare(right.capturedAt));
}
