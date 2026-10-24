import type { DataQualityIssue, NormalizedData } from '../domain/types.js';
import { projectIssueFacts } from './issues.js';
import { durationStatistics } from './statistics.js';

/** Stocks observés et délais par provenance, calculés pour un repository. */
export interface RepositoryActivity {
  libraryId: string;
  repository: string;
  name: string;
  components: number;
  anomalies: number;
  openAnomalies: number;
  issues: number | 'unknown';
  openIssues: number | 'unknown';
  pullRequests: number;
  mergedPullRequests: number;
  delays: ReturnType<typeof durationStatistics>;
}

/**
 * Calcule les stocks et les trois cohortes de délais par repository, avec les exclusions DQ existantes.
 * @param data - Données normalisées ; l'absence d'issues reste une inconnue.
 * @param quality - Réserves de qualité applicables aux délais.
 * @returns Synthèses par librairie, sans confondre état GitHub et statut métier.
 */
export function repositoryActivity(
  data: NormalizedData,
  quality: readonly DataQualityIssue[] = []
): RepositoryActivity[] {
  const facts = projectIssueFacts(data, quality);
  return data.libraries.map((library) => {
    const components = data.components.filter((item) => item.libraryId === library.libraryId);
    const ids = new Set(components.map((item) => item.componentId));
    const anomalies = data.anomalies.flatMap((item) => {
      const issue = data.issues?.find((candidate) => candidate.issueId === item.issueId);
      const componentIds = issue?.review
        ? [...new Set(issue.componentIds)]
        : item.componentId
          ? [item.componentId]
          : [];
      return componentIds.filter((id) => ids.has(id)).map(() => item);
    });
    const issues = data.issues
      ? [
          ...new Map(
            data.issues
              .filter((item) => item.libraryId === library.libraryId)
              .map((item) => [item.issueId, item])
          ).values()
        ]
      : undefined;
    const prs = [
      ...new Map(
        data.pullRequests
          .filter((item) => item.repository === library.name || item.repository === library.repository)
          .map((item) => [item.pullRequestId, item])
      ).values()
    ];
    return {
      libraryId: library.libraryId,
      repository: library.repository,
      name: library.name,
      components: components.length,
      anomalies: anomalies.length,
      openAnomalies: anomalies.filter((item) => item.status === 'open' || item.status === 'reopened').length,
      issues: issues?.length ?? 'unknown',
      openIssues: issues?.filter((item) => item.state === 'OPEN').length ?? 'unknown',
      pullRequests: prs.length,
      mergedPullRequests: prs.filter((item) => item.state === 'merged').length,
      delays: durationStatistics(facts.filter((fact) => fact.repo === library.repository))
    };
  });
}
