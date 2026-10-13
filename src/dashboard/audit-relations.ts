import type { Anomaly, Audit, Issue, Snapshot } from '../domain/types.js';

/** Résultat traçable d'un rattachement entre anomalies et audit. */
export interface AuditAnomalyRelations {
  linked: Anomaly[];
  unresolved: Anomaly[];
}

/**
 * Rattache uniquement les anomalies disposant d'une preuve explicite.
 * Le partage d'un composant ne suffit pas à démontrer l'appartenance à un audit.
 * Les références de parent peuvent être des identifiants d'issue ou d'audit.
 */
export function anomaliesForAudit(
  audit: Audit,
  anomalies: readonly Anomaly[],
  issues: readonly Issue[]
): AuditAnomalyRelations {
  const issuesById = new Map(issues.map((issue) => [issue.issueId, issue]));
  const linked: Anomaly[] = [];
  const unresolved: Anomaly[] = [];
  for (const anomaly of anomalies) {
    const issue = issuesById.get(anomaly.issueId);
    const parents = new Set([
      ...(anomaly.parentRefs ?? []),
      ...(issue?.parentIssueId ? [issue.parentIssueId] : [])
    ]);
    const ownRefs = new Set([audit.issueId, audit.auditId]);
    const parentMatches = parents.size > 0 && [...parents].every((parent) => ownRefs.has(parent));
    const explicit = anomaly.auditId
      ? anomaly.auditId === audit.auditId && (parents.size === 0 || parentMatches)
      : parentMatches;
    if (explicit) linked.push(anomaly);
    else if (anomaly.componentId === audit.componentId || issue?.componentIds.includes(audit.componentId))
      unresolved.push(anomaly);
  }
  return { linked, unresolved };
}

/** Retourne le libellé de version canonique lorsqu'il est disponible. */
export function auditVersionLabel(audit: Audit, snapshot: Pick<Snapshot, 'normalizedData'>): string {
  const version = snapshot.normalizedData.versions?.find(
    (candidate) => candidate.versionId === audit.versionId
  );
  return version?.number ?? audit.version ?? 'Version indéterminée';
}
