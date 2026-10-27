import { expect, it } from 'vitest';
import { processingDuration } from '../src/analytics/processing-duration.js';
import { consolidationSnapshot } from './support/consolidation.js';
import { applyIssueReviews } from '../src/domain/issue-review.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { rules } from './support/consolidation.js';

it('#126 : mesure le premier In progress jusqu’au dernier Done sans utiliser la fusion', () => {
  const issue = consolidationSnapshot().normalizedData.issues![0]!;
  issue.createdAt = '2026-03-18T00:00:00Z';
  issue.closedAt = '2026-09-16T00:00:00Z';
  issue.projectContexts[0]!.statusHistory = [
    { status: 'IN_PROGRESS', rawStatus: 'In progress', transitionedAt: '2026-08-13T00:00:00Z' },
    { status: 'DONE', rawStatus: 'Done', transitionedAt: '2026-08-14T00:00:00Z' },
    { status: 'IN_PROGRESS', rawStatus: 'In progress', transitionedAt: '2026-08-15T00:00:00Z' },
    { status: 'DONE', rawStatus: 'Done', transitionedAt: '2026-08-16T00:00:00Z' }
  ];
  expect(processingDuration(issue)).toMatchObject({ value: 3, source: 'project' });
  issue.projectContexts[0]!.statusHistory = [
    { status: 'DONE', rawStatus: 'Done', transitionedAt: '2026-08-14T00:00:00Z' }
  ];
  expect(processingDuration(issue)).toMatchObject({ value: 182, source: 'github' });
  issue.projectContexts[0]!.statusHistory.push({
    status: 'IN_PROGRESS',
    rawStatus: 'In progress',
    transitionedAt: '2026-08-15T00:00:00Z'
  });
  expect(processingDuration(issue)).toMatchObject({ value: null, source: 'project' });
  issue.projectContexts[0]!.statusHistory = [];
  expect(processingDuration(issue)).toMatchObject({ value: 182, source: 'github' });
  delete issue.closedAt;
  expect(processingDuration(issue).value).toBeNull();
});

it('#126 : reproduit le cas anonymisé à 154 jours sans inclure la fusion tardive dans la nouvelle durée', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const issue = data.issues!.find((item) => item.issueId === 'anomaly-a')!;
  issue.createdAt = '2025-03-18T10:25:38Z';
  issue.closedAt = '2025-08-13T13:00:32Z';
  issue.projectContexts[0]!.statusHistory = [
    { status: 'IN_PROGRESS', rawStatus: 'In progress', transitionedAt: '2025-08-13T07:19:38Z' },
    { status: 'DONE', rawStatus: 'Done', transitionedAt: '2025-08-14T07:37:03Z' }
  ];
  data.pullRequests[0]!.mergedAt = '2025-08-19T09:29:52Z';
  applyIssueReviews(data, snapshot.rawData, rules);
  const cohort = simplifiedModel(snapshot)
    .tables.find((table) => table.id === 'delays')!
    .rows.find((row) => row.reviewKey.endsWith(':confirmed-correction'))!;
  expect(cohort.cells[2]!.value).toBeCloseTo(1.0120949074);
  expect(cohort.cells[2]!.refs).toEqual(['anomaly-a']);
  const old = (Date.parse(data.pullRequests[0]!.mergedAt!) - Date.parse(issue.createdAt)) / 86400000;
  expect(old).toBeCloseTo(153.9612731481);
});
