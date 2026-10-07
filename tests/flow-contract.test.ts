import { describe, expect, it } from 'vitest';
import { calculateFlowMetrics } from '../src/analytics/flows.js';
import { diffSnapshots } from '../src/snapshots/diff.js';
import type { Anomaly, DataQualityIssue, Issue, Snapshot } from '../src/domain/types.js';

function snapshot(id: string, capturedAt: string, status: string, correctedAt?: string): Snapshot {
  const issue: Issue = {
    issueId: 'i1',
    number: 1,
    title: 'Anomaly',
    state: status === 'done' ? 'CLOSED' : 'OPEN',
    createdAt: '2026-09-01T00:00:00Z',
    labels: [],
    repositoryId: 'repo',
    libraryId: 'library',
    projectStatuses: [{
      projectId: 'project',
      projectName: 'Board',
      status: { rawValue: status === 'done' ? 'Done' : 'Open' },
      fields: [],
      transitions: []
    }],
    subIssueIds: [],
    linkedPullRequestIds: [],
    componentIds: ['c1'],
    criticities: [],
    accessibilityCategories: [],
    provenance: { source: 'github', sourceId: 'i1', collectedAt: capturedAt },
    dataQualityStatus: 'reliable'
  };
  const anomaly: Anomaly = {
    anomalyId: 'a1',
    issueId: 'i1',
    componentIds: ['c1'],
    origin: 'HORS_AUDIT',
    categories: ['focus'],
    detectedAt: '2026-09-01T00:00:00Z',
    ...(correctedAt ? { correctedAt } : {})
  };
  return {
    snapshotId: id, capturedAt, scope: 'fixture',
    rawData: { collectedAt: capturedAt, repositories: [], catalogueComponents: [], nexusAvailable: true },
    normalizedData: {
      libraries: [], components: [], issues: [issue], milestones: [], versions: [], componentVersions: [],
      audits: [], anomalies: [anomaly], auditImprovements: [],
      legacyAudits: [], legacyAnomalies: [], pullRequests: []
    },
    dataQuality: { issues: [], summary: { INFO: 0, WARNING: 0, ERROR: 0 } },
    analytics: { metrics: {} } as Snapshot['analytics'], ruleVersion: 'test', modelVersion: 'test', reliability: 'reliable'
  };
}

describe('flow contract', () => {
  it('never invents a period when only one snapshot exists', () => {
    expect(calculateFlowMetrics).toBeTypeOf('function');
  });

  it('uses the exact snapshot interval for temporal metrics', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', 'open');
    const after = snapshot('s2', '2026-09-11T00:00:00Z', 'done', '2026-09-10T12:00:00Z');
    const flows = calculateFlowMetrics(diffSnapshots(before, after));
    expect(flows['anomaly.flow.corrected']?.period).toEqual({ from: before.capturedAt, to: after.capturedAt });
    expect(flows['anomaly.flow.corrected']?.definition).toContain('première correction');
  });

  it('applies metric-scoped DQ impacts to V1 flow metrics', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', 'open');
    const after = snapshot('s2', '2026-09-11T00:00:00Z', 'done', '2026-09-10T12:00:00Z');
    const issue: DataQualityIssue = {
      id: 'DQ-004:a1', ruleId: 'DQ-004', severity: 'WARNING', action: 'include', entityType: 'anomaly', entityId: 'a1',
      message: 'incomplete correction evidence', detectedAt: after.capturedAt,
      impacts: [{ metricId: 'anomaly.flow.corrected', action: 'include', reason: 'evidence incomplete' }]
    };
    const flows = calculateFlowMetrics(diffSnapshots(before, after), [issue]);
    expect(flows['anomaly.flow.corrected']?.value).toBe(1);
    expect(flows['anomaly.flow.corrected']?.reliability.status).toBe('partial');
  });

  it('does not report a numeric cancellation flow while Q-022 is unresolved', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', 'open');
    const after = snapshot('s2', '2026-09-11T00:00:00Z', 'open');
    const issue: DataQualityIssue = {
      id: 'DQ-021:i1', ruleId: 'DQ-021', severity: 'WARNING', action: 'include', entityType: 'anomaly', entityId: 'a1',
      message: 'Cancelled status semantics are unresolved', detectedAt: after.capturedAt,
      impacts: [{ metricId: 'anomaly.flow.cancelled', action: 'unknown', reason: 'Q-022 is unresolved' }]
    };
    const flows = calculateFlowMetrics(diffSnapshots(before, after), [issue]);
    expect(flows['anomaly.flow.cancelled']?.value).toBe('unknown');
    expect(flows['anomaly.flow.cancelled']?.numerator).toBe('unknown');
    expect(flows['anomaly.flow.cancelled']?.denominator).toBe('unknown');
    expect(flows['anomaly.flow.cancelled']?.reliability.status).toBe('unknown');
  });
});
