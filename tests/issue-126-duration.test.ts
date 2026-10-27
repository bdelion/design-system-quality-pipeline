import { expect, it } from 'vitest';
import { processingDuration } from '../src/analytics/processing-duration.js';
import { consolidationSnapshot } from './support/consolidation.js';

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
