import { expect, it } from 'vitest';
import { repositoryActivity } from '../src/analytics/repository-activity.js';
import { consolidationSnapshot } from './support/consolidation.js';

/** Vérifie les stocks GitHub et les trois cohortes sur une population déterministe. */
it('sépare Done et closedAt, déduplique les issues et calcule le P90 interpolé', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const first = data.issues![0]!;
  const actual = {
    ...first,
    issueId: 'actual',
    createdAt: '2026-09-01T00:00:00Z',
    closedAt: '2026-09-06T00:00:00Z',
    state: 'CLOSED' as const,
    projectContexts: [
      {
        projectId: 'p',
        projectName: 'P',
        status: 'DONE' as const,
        statusHistory: [
          { rawStatus: 'Done', status: 'DONE' as const, transitionedAt: '2026-09-04T00:00:00Z' }
        ]
      }
    ]
  };
  const estimated = {
    ...actual,
    issueId: 'estimated',
    projectContexts: [{ projectId: 'p', projectName: 'P', status: 'DONE' as const, statusHistory: [] }]
  };
  data.issues = [actual, actual, estimated, { ...actual, issueId: 'open', state: 'OPEN' }];
  const row = repositoryActivity(data)[0]!;
  expect(row).toMatchObject({ issues: 3, openIssues: 1, pullRequests: 1, mergedPullRequests: 1 });
  expect(row.delays['global']).toMatchObject({ count: 2, average: 4, median: 4, p90: 4.8 });
  expect(row.delays['done']).toMatchObject({ count: 1, average: 3, median: 3, p90: 3 });
  expect(row.delays['estimated']).toMatchObject({ count: 1, average: 5, median: 5, p90: 5 });
  const excluded = repositoryActivity(data, [
    {
      id: 'dq',
      ruleId: 'DQ-test',
      severity: 'WARNING',
      action: 'exclude',
      entityType: 'issue',
      entityId: 'actual',
      message: 'Date exclue',
      detectedAt: snapshot.capturedAt,
      impacts: [{ metricId: 'issue.treatmentDelay.global.average', action: 'exclude', reason: 'Date exclue' }]
    }
  ])[0]!;
  expect(excluded.delays['global']).toMatchObject({ count: 1, average: 5 });
});

/** Vérifie les repositories sans issue et la différence entre vide connu et absent. */
it('conserve les inconnues et ne remplace pas un délai absent par zéro', () => {
  const data = consolidationSnapshot().normalizedData;
  data.issues = [];
  expect(repositoryActivity(data)[0]).toMatchObject({
    issues: 0,
    openIssues: 0,
    delays: { global: { count: 0, average: null, median: null, p90: null } }
  });
  delete data.issues;
  expect(repositoryActivity(data)[0]).toMatchObject({ issues: 'unknown', openIssues: 'unknown' });
});
