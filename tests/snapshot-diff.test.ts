import { describe, expect, it } from 'vitest';
import { calculateFlowMetrics } from '../src/analytics/flows.js';
import type { Anomaly, Issue, Snapshot } from '../src/domain/types.js';
import { diffSnapshots } from '../src/snapshots/diff.js';

function issue(issueId: string, status: string, sourceId: string): Issue {
  return {
    issueId,
    number: 1,
    title: issueId,
    state: 'OPEN',
    createdAt: '2026-09-01T00:00:00Z',
    labels: [],
    repositoryId: 'repo',
    libraryId: 'library',
    projectStatuses: [{
      projectId: 'project',
      projectName: 'Board',
      status: { rawValue: status },
      fields: [],
      transitions: []
    }],
    subIssueIds: [],
    linkedPullRequestIds: [],
    componentIds: ['component'],
    criticities: [],
    accessibilityCategories: [],
    provenance: { source: 'github', sourceId, collectedAt: '2026-09-01T00:00:00Z' },
    dataQualityStatus: 'reliable'
  };
}

function anomaly(anomalyId: string, issueId: string, correctedAt?: string): Anomaly {
  return {
    anomalyId,
    issueId,
    componentIds: ['component'],
    origin: 'HORS_AUDIT',
    categories: ['focus'],
    detectedAt: '2026-09-01T00:00:00Z',
    ...(correctedAt ? { correctedAt } : {})
  };
}

function snapshot(id: string, capturedAt: string, anomalies: Anomaly[], statuses: Record<string, string>): Snapshot {
  return {
    snapshotId: id,
    capturedAt,
    scope: 'fixture',
    rawData: { collectedAt: capturedAt, repositories: [], catalogueComponents: [], nexusAvailable: true },
    normalizedData: {
      libraries: [], components: [], issues: anomalies.map((item) => issue(item.issueId, statuses[item.issueId] ?? 'Open', item.issueId)),
      milestones: [], versions: [], componentVersions: [], audits: [], anomalies, auditImprovements: [],
      legacyAudits: [], legacyAnomalies: [], pullRequests: []
    },
    dataQuality: { issues: [], summary: { INFO: 0, WARNING: 0, ERROR: 0 } },
    analytics: { metrics: {} } as Snapshot['analytics'],
    ruleVersion: 'test',
    modelVersion: 'test',
    reliability: 'reliable'
  };
}

const beforeAnomaly = anomaly('a1', 'i1');
const afterAnomaly = anomaly('a1', 'i1', '2026-09-10T12:00:00Z');

describe('snapshot diff', () => {
  it('detects V1 anomaly creation, correction and state transitions between observations', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', [beforeAnomaly], { i1: 'Open' });
    const after = snapshot('s2', '2026-09-11T00:00:00Z', [
      { ...afterAnomaly },
      anomaly('a2', 'i2')
    ], { i1: 'Reopened', i2: 'Open' });
    const diff = diffSnapshots(before, after);
    expect(diff.anomaliesCreated).toEqual(['a2']);
    expect(diff.anomaliesCorrected).toEqual(['a1']);
    expect(diff.anomaliesReopened).toEqual(['a1']);
    expect(diff.anomalyTransitions).toEqual([{ anomalyId: 'a1', from: 'open', to: 'reopened' }]);
    expect(diff.period).toEqual({ from: before.capturedAt, to: after.capturedAt });
  });
});

describe('snapshot flow metrics', () => {
  it('exposes period-bound flow metrics without replacing business event dates', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', [beforeAnomaly], { i1: 'Open' });
    const after = snapshot('s2', '2026-09-11T00:00:00Z', [
      afterAnomaly,
      anomaly('a2', 'i2')
    ], { i1: 'Reopened', i2: 'Open' });
    const flows = calculateFlowMetrics(diffSnapshots(before, after));
    expect(flows['anomaly.flow.created']?.value).toBe(1);
    expect(flows['anomaly.flow.corrected']?.value).toBe(1);
    expect(flows['anomaly.flow.reopened']?.value).toBe(1);
    expect(flows['anomaly.flow.created']?.period).toEqual({ from: before.capturedAt, to: after.capturedAt });
  });
});
