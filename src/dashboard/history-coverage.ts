import type { Anomaly, Issue } from '../domain/types.js';

/** Classification explicite de la disponibilité de la date métier de correction (contrat I3). */
export type CorrectionDateReason =
  | 'available'
  | 'multiple_done'
  | 'no_project_history'
  | 'no_done_transition';

/** Synthèse descriptive, distincte des KPI métier et de leurs dénominateurs. */
export interface HistoryCoverage {
  issuesTotal: number;
  issuesWithHistory: number;
  issuesWithoutHistory: number;
  anomaliesTotal: number;
  correctionDatesAvailable: number;
  reasons: Record<CorrectionDateReason, number>;
}

/** Détermine pourquoi une anomalie dispose ou non d'une date de correction métier fiable. */
export function correctionDateReason(anomaly: Anomaly, issue?: Issue): CorrectionDateReason {
  if (anomaly.correctedAt) return 'available';
  const doneTransitions = issue?.projectContexts.flatMap((context) => context.statusHistory)
    .filter((transition) => transition.status === 'DONE').length ?? 0;
  if (doneTransitions > 1) return 'multiple_done';
  if (!issue || !issue.projectContexts.some((context) => context.statusHistory.length > 0)) {
    return 'no_project_history';
  }
  return 'no_done_transition';
}

/** Mesure la couverture observable sans inférer une correction depuis une PR ou une fermeture. */
export function calculateHistoryCoverage(issues: Issue[], anomalies: Anomaly[]): HistoryCoverage {
  const issueById = new Map(issues.map((issue) => [issue.issueId, issue]));
  const reasons: HistoryCoverage['reasons'] = {
    available: 0,
    multiple_done: 0,
    no_project_history: 0,
    no_done_transition: 0,
  };
  for (const anomaly of anomalies) reasons[correctionDateReason(anomaly, issueById.get(anomaly.issueId))] += 1;
  const issuesWithHistory = issues.filter((issue) =>
    issue.projectContexts.some((context) => context.statusHistory.length > 0),
  ).length;
  return {
    issuesTotal: issues.length,
    issuesWithHistory,
    issuesWithoutHistory: issues.length - issuesWithHistory,
    anomaliesTotal: anomalies.length,
    correctionDatesAvailable: reasons.available,
    reasons,
  };
}
