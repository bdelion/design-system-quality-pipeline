import type { NormalizedData } from '../domain/types.js';

/** Synthèse du snapshot courant, tous repositories et toutes versions confondus. */
export interface TeamActivitySummary {
  issues: number | 'unknown';
  withProject: number | 'unknown';
  withIteration: number | 'unknown';
  datedTransitions: number | 'unknown';
  pullRequests: number;
  openPullRequests: number;
  closedPullRequests: number;
  mergedPullRequests: number;
  linkedPullRequests: number;
  quality: 'reliable' | 'partial';
}

/**
 * Compte les faits observés distincts sans interpréter la Velocity ni une performance de sprint.
 * @param data - Données normalisées du snapshot.
 * @returns Effectifs des issues, contextes Project et états exclusifs des PR ; absence d'issues conservée.
 */
export function teamActivitySummary(data: NormalizedData): TeamActivitySummary {
  const issues = data.issues
    ? [...new Map(data.issues.map((item) => [item.issueId, item])).values()]
    : undefined;
  const prs = [...new Map(data.pullRequests.map((item) => [item.pullRequestId, item])).values()];
  return {
    issues: issues?.length ?? 'unknown',
    withProject: issues?.filter((item) => item.projectContexts.length > 0).length ?? 'unknown',
    withIteration:
      issues?.filter((item) => item.projectContexts.some((context) => context.iteration)).length ?? 'unknown',
    datedTransitions:
      issues?.filter((item) =>
        item.projectContexts.some((context) =>
          context.statusHistory.some((transition) => Number.isFinite(Date.parse(transition.transitionedAt)))
        )
      ).length ?? 'unknown',
    pullRequests: prs.length,
    openPullRequests: prs.filter((item) => item.state === 'open').length,
    closedPullRequests: prs.filter((item) => item.state === 'closed').length,
    mergedPullRequests: prs.filter((item) => item.state === 'merged').length,
    linkedPullRequests: prs.filter(
      (item) =>
        item.relatedIssueIds.length > 0 ||
        issues?.some((issue) => issue.linkedPullRequestIds.includes(item.pullRequestId))
    ).length,
    quality:
      !issues || [...issues, ...prs].some((item) => item.dataQualityStatus !== 'reliable')
        ? 'partial'
        : 'reliable'
  };
}
