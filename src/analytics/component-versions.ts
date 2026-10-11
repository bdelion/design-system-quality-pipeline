/**
 * @module analytics.component-versions
 * Attribue les verdicts métier aux couples composant–version à partir des audits.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { isCompletedAudit } from '../domain/business.js';
import type { Audit, ComponentVersion, NormalizedData, Version } from '../domain/types.js';

/**
 * Matérialise D-220 à D-228 : héritage pour une identité stable sur les versions PROD suivantes.
 * La cohorte de la version auditée la plus récente applicable remplace les cohortes antérieures ;
 * chaque audit terminé et daté de cette cohorte contribue au verdict.
 */
export function applyComponentVersionVerdicts(data: NormalizedData): void {
  const versions = data.versions ?? [];
  const versionById = new Map(versions.map((version) => [version.versionId, version]));
  const completedAudits = data.audits.filter(
    (audit) =>
      isCompletedAudit(audit, data.issues ?? []) &&
      audit.completedAt !== undefined &&
      Number.isFinite(Date.parse(audit.completedAt))
  );

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

/**
 * Sélectionne la cohorte d’audits terminés applicable à une version de composant dans le pipeline de qualité.
 *
 * @param relation - Valeur de « relation » utilisée par ce traitement.
 * @param targetVersion - Valeur de « targetVersion » utilisée par ce traitement.
 * @param completedAudits - Valeur de « completedAudits » utilisée par ce traitement.
 * @param versionById - Valeur de « versionById » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
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

/**
 * Vérifie que tous les audits de la cohorte satisfont les critères de conformité dans le pipeline de qualité.
 *
 * @param audits - Valeur de « audits » utilisée par ce traitement.
 * @param data - Valeur de « data » utilisée par ce traitement.
 * @returns Indique si la condition est satisfaite.
 */
function auditCohortIsConform(audits: Audit[], data: NormalizedData): boolean {
  const auditIds = new Set(audits.map((audit) => audit.auditId));
  const hasAuditAnomaly = data.anomalies.some(
    (anomaly) => anomaly.origin === 'AUDIT' && anomaly.auditId !== undefined && auditIds.has(anomaly.auditId)
  );
  if (hasAuditAnomaly) return false;
  return audits.every((audit) => audit.objectiveAuditResult === 'conform');
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

/** Recherche la relation de la dernière version PROD du composant ; restitue le verdict déjà calculé. */
export function latestComponentVersion(
  data: NormalizedData,
  componentId: string
): ComponentVersion | undefined {
  const versions = new Map((data.versions ?? []).map((version) => [version.versionId, version]));
  return (data.componentVersions ?? [])
    .filter((relation) => relation.componentId === componentId && versions.has(relation.versionId))
    .sort((a, b) => compareProdVersions(versions.get(a.versionId)!.number, versions.get(b.versionId)!.number))
    .at(-1);
}
