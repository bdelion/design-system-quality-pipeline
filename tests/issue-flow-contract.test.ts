import { describe, expect, it } from 'vitest';
import { calculateFlowMetrics } from '../src/analytics/flows.js';
import { diffSnapshots } from '../src/snapshots/diff.js';
import type { Issue, Snapshot } from '../src/domain/types.js';

/** Fabrique une issue minimale pour vérifier les transitions métier, tous types confondus. */
function issue(id: string, state: Issue['state']): Issue {
  return {
    issueId: id,
    repositoryId: 'repo',
    libraryId: 'lib',
    number: 1,
    title: id,
    url: `https://example.test/${id}`,
    state,
    createdAt: '2026-01-01T00:00:00Z',
    labels: [],
    componentIds: [],
    criticalities: [],
    accessibilityCategories: [],
    subIssueIds: [],
    linkedPullRequestIds: [],
    projectContexts: [],
    provenance: { source: 'github', collectedAt: '2026-01-01T00:00:00Z' },
    dataQualityStatus: 'reliable'
  };
}

/** Fabrique deux états comparables sans dépendance au réseau. */
function snapshot(id: string, date: string, issues: Issue[]): Snapshot {
  return {
    snapshotId: id,
    capturedAt: date,
    normalizedData: {
      issues,
      libraries: [],
      components: [],
      audits: [],
      anomalies: [],
      pullRequests: []
    }
  } as unknown as Snapshot;
}

describe('flux temporels de toutes les issues', () => {
  it('compte créations, traitements et réouvertures sans confondre les anomalies', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', [issue('task', 'OPEN'), issue('doc', 'CLOSED')]);
    const after = snapshot('s2', '2026-09-11T00:00:00Z', [
      issue('task', 'CLOSED'),
      issue('doc', 'OPEN'),
      issue('new', 'OPEN')
    ]);
    const flows = calculateFlowMetrics(diffSnapshots(before, after));
    expect(flows['issue.flow.created']?.value).toBe(1);
    expect(flows['issue.flow.treated']?.value).toBe(1);
    expect(flows['issue.flow.reopened']?.value).toBe(1);
    expect(flows['issue.flow.cancelled']?.value).toBe(0);
    expect(flows['issue.flow.treated']?.period).toEqual({ from: before.capturedAt, to: after.capturedAt });
    expect(flows['anomaly.flow.created']?.value).toBe(0);
  });
});
