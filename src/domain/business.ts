import type { Audit, CanonicalProjectStatus, Issue, IssueProjectContext, NormalizedData } from './types.js';

/** État métier observable, indépendant de la fermeture technique GitHub. */
export type BusinessState = 'open' | 'treated' | 'cancelled';
/** Famille exclusive ; RGAA reste une qualification de l'anomalie d'audit. */
export type IssueClassification = 'audit' | 'audit_anomaly' | 'anomaly' | 'improvement' | 'other';

/** Retourne le dernier statut daté, même non reconnu, sans masquer une réouverture. */
export function currentProjectStatus(context: IssueProjectContext): CanonicalProjectStatus | undefined {
  const latest = [...context.statusHistory]
    .filter((entry) => Number.isFinite(Date.parse(entry.transitionedAt)))
    .sort((a, b) => Date.parse(a.transitionedAt) - Date.parse(b.transitionedAt))
    .at(-1);
  return latest ? latest.status : context.status;
}

/** Exige Done et Closed ; une annulation prime et un contexte inconnu reste non terminé. */
export function issueBusinessState(issue: Issue): BusinessState {
  const statuses = issue.projectContexts.map(currentProjectStatus);
  if (statuses.includes('CANCELLED')) return 'cancelled';
  return issue.state === 'CLOSED' && statuses.length > 0 && statuses.every((status) => status === 'DONE')
    ? 'treated'
    : 'open';
}

/** Sélectionne la dernière date Done prouvée, sans transformer Closed en transition Project. */
export function lastDoneAt(issue: Issue): string | undefined {
  return issue.projectContexts
    .flatMap((context) => context.statusHistory)
    .filter((entry) => entry.status === 'DONE' && Number.isFinite(Date.parse(entry.transitionedAt)))
    .map((entry) => entry.transitionedAt)
    .sort((a, b) => Date.parse(a) - Date.parse(b))
    .at(-1);
}

/** Classe les identités normalisées, sans inférer une anomalie RGAA à partir d'un type BUG ou d'un label. */
export function issueClassification(
  issue: Issue,
  data: Pick<NormalizedData, 'audits' | 'anomalies' | 'auditImprovements'>
): IssueClassification {
  if (data.audits.some((audit) => audit.issueId === issue.issueId)) return 'audit';
  const anomaly = data.anomalies.find((item) => item.issueId === issue.issueId);
  if (anomaly) return anomaly.origin === 'AUDIT' ? 'audit_anomaly' : 'anomaly';
  if (data.auditImprovements?.some((item) => item.issueId === issue.issueId)) return 'improvement';
  return 'other';
}

/** Restitue le cycle de vie sans prendre un résultat déclaré pour une preuve de terminaison. */
export function auditProgress(
  audit: Audit,
  issues: readonly Issue[] = []
): 'pending' | 'ongoing' | 'completed' | 'cancelled' {
  const issue = issues.find((item) => item.issueId === audit.issueId);
  if (issue) {
    const state = issueBusinessState(issue);
    if (state === 'cancelled') return 'cancelled';
    if (state === 'treated') return 'completed';
    const statuses = issue.projectContexts.map(currentProjectStatus);
    return statuses.some((status) => ['IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'].includes(status ?? ''))
      ? 'ongoing'
      : 'pending';
  }
  // Compatibilité des anciens snapshots sans Issue source ; aucune date n'est inventée.
  if (audit.lifecycle) return audit.lifecycle;
  if (audit.status === 'cancelled') return 'cancelled';
  if (audit.status === 'not_evaluated') return 'pending';
  if (audit.status === 'in_progress') return 'ongoing';
  return 'completed';
}

/** Vérifie la terminaison métier ; une date exploitable constitue une dimension distincte. */
export function isCompletedAudit(audit: Audit, issues: readonly Issue[] = []): boolean {
  return auditProgress(audit, issues) === 'completed';
}
