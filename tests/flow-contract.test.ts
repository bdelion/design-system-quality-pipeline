import { describe, expect, it } from 'vitest';
import { calculateFlowMetrics } from '../src/analytics/flows.js';
import { diffSnapshots } from '../src/snapshots/diff.js';
import type { DataQualityIssue, Snapshot } from '../src/domain/types.js';

function snapshot(id: string, capturedAt: string, status: 'open' | 'done', firstDoneAt?: string): Snapshot {
  const anomaly = {
    anomalyId: 'a1', auditId: 'au1', componentId: 'c1', criticality: 'major' as const,
    categories: ['focus'], status, createdAt: '2026-09-01T00:00:00Z', firstDoneAt,
    everCorrected: Boolean(firstDoneAt), pullRequestRefs: [], parentRefs: [],
    provenance: { source: 'github' as const, collectedAt: capturedAt },
    dataQualityStatus: 'reliable' as const, cancelled: false, cancelledProjectStatuses: []
  };
  return {
    snapshotId: id, capturedAt, scope: 'fixture',
    rawData: { collectedAt: capturedAt, repositories: [], catalogueComponents: [], nexusAvailable: true },
    normalizedData: {
      libraries: [], components: [], issues: [], milestones: [], versions: [], componentVersions: [],
      audits: [], anomalies: [], auditImprovements: [],
      legacyAudits: [], legacyAnomalies: [anomaly], pullRequests: []
    },
    dataQuality: { issues: [], summary: { INFO: 0, WARNING: 0, ERROR: 0 } },
    analytics: { metrics: {} } as Snapshot['analytics'], ruleVersion: 'test', modelVersion: 'test', reliability: 'reliable'
  } as Snapshot;
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
  it('applies metric-scoped DQ impacts to flow metrics', () => {
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

});
