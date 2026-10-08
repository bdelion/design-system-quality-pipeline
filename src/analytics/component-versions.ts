import type { Audit, ComponentVersion, NormalizedData, Version } from '../domain/types.js';

/**
 * Materialise D-220..D-228 on historical Component x Version relations.
 *
 * Applicability is inherited across later PROD versions for the same stable
 * Component identity. When several completed Audits exist, the latest audited
 * PROD version at or before the target version supersedes older audit cohorts;
 * every completed Audit in that latest cohort contributes to the verdict.
 */
export function applyComponentVersionVerdicts(data: NormalizedData): void {
  const versions = data.versions ?? [];
  const versionById = new Map(versions.map((version) => [version.versionId, version]));
  const completedAudits = data.audits.filter(isCompletedAudit);

  for (const relation of data.componentVersions ?? []) {
    const targetVersion = versionById.get(relation.versionId);
    if (!targetVersion) continue;
    const applicable = latestApplicableAuditCohort(relation, targetVersion, completedAudits, versionById);
    relation.applicableAuditIds = applicable.map((audit) => audit.auditId).sort();
    relation.verdict =
      applicable.length === 0
        ? 'NON_COUVERT'
        : auditCohortIsConform(applicable, data)
          ? 'CONFORME'
          : 'NON_CONFORME';
  }
}

function isCompletedAudit(audit: Audit): boolean {
  return audit.completedAt !== undefined;
}

function latestApplicableAuditCohort(
  relation: ComponentVersion,
  targetVersion: Version,
  completedAudits: Audit[],
  versionById: Map<string, Version>
): Audit[] {
  const candidates = completedAudits.flatMap((audit) => {
    if (audit.componentId !== relation.componentId || !audit.versionId) return [];
    const auditVersion = versionById.get(audit.versionId);
    if (!auditVersion || auditVersion.libraryId !== targetVersion.libraryId) return [];
    return compareProdVersions(auditVersion.number, targetVersion.number) <= 0
      ? [{ audit, version: auditVersion }]
      : [];
  });
  if (candidates.length === 0) return [];

  const latestNumber = candidates
    .map(({ version }) => version.number)
    .sort(compareProdVersions)
    .at(-1)!;
  return candidates
    .filter(({ version }) => version.number === latestNumber)
    .map(({ audit }) => audit)
    .sort((left, right) => left.auditId.localeCompare(right.auditId));
}

function auditCohortIsConform(audits: Audit[], data: NormalizedData): boolean {
  const auditIds = new Set(audits.map((audit) => audit.auditId));
  const hasAuditAnomaly = data.anomalies.some(
    (anomaly) => anomaly.origin === 'AUDIT' && anomaly.auditId !== undefined && auditIds.has(anomaly.auditId)
  );
  if (hasAuditAnomaly) return false;
  return audits.every((audit) => audit.objectiveAuditResult === 'conform');
}

function compareProdVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index]! - rightParts[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
}
