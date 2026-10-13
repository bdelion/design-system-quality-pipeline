import { expect, it } from 'vitest';
import { projectIssueFacts } from '../src/analytics/issues.js';
import { teamActivitySummary } from '../src/analytics/team-activity.js';
import { consolidationSnapshot } from './support/consolidation.js';

/** Vérifie les contextes multiples, la valeur brute et une Velocity nulle explicite. */
it('conserve les faits Project sans fusionner leurs valeurs ni inventer des défauts', () => {
  const data = consolidationSnapshot().normalizedData;
  const issue = data.issues![0]!;
  issue.projectContexts = [
    {
      projectId: 'a',
      projectName: 'Équipe A',
      rawStatus: 'Done',
      status: 'DONE',
      iteration: { iterationId: 's1', title: 'Sprint 1' },
      rawVelocity: 0,
      velocity: 0,
      statusHistory: []
    },
    {
      projectId: 'b',
      projectName: 'Équipe B',
      rawStatus: 'À examiner',
      rawVelocity: 'inconnue',
      statusHistory: []
    }
  ];
  expect(projectIssueFacts(data)[0]!.projectContexts).toEqual(issue.projectContexts);
  const summary = teamActivitySummary(data);
  expect(summary).toMatchObject({
    issues: 8,
    withProject: 8,
    withIteration: 1,
    pullRequests: 1,
    mergedPullRequests: 1,
    openPullRequests: 0,
    closedPullRequests: 0,
    linkedPullRequests: 1
  });
});

/** Distingue l'absence d'issues d'une population connue vide et déduplique les PR. */
it('préserve les inconnues et sépare PR fermées sans fusion et PR fusionnées', () => {
  const data = consolidationSnapshot().normalizedData;
  delete data.issues;
  const merged = data.pullRequests[0]!;
  data.pullRequests = [
    merged,
    merged,
    { ...merged, pullRequestId: 'open', state: 'open' },
    { ...merged, pullRequestId: 'closed', state: 'closed', relatedIssueIds: [] }
  ];
  expect(teamActivitySummary(data)).toMatchObject({
    issues: 'unknown',
    withProject: 'unknown',
    withIteration: 'unknown',
    datedTransitions: 'unknown',
    pullRequests: 3,
    openPullRequests: 1,
    closedPullRequests: 1,
    mergedPullRequests: 1,
    linkedPullRequests: 2
  });
});
