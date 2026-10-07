import { describe, expect, it } from 'vitest';
import { diffSnapshots } from '../src/snapshots/diff.js';
import type { Snapshot } from '../src/domain/types.js';

function snapshot(id: string, capturedAt: string, anomalies: Snapshot['normalizedData']['anomalies']): Snapshot {
  return {
    snapshotId: id,
    capturedAt,
    scope: 'fixture',
    rawData: { collectedAt: capturedAt, repositories: [], catalogueComponents: [], nexusAvailable: true },
    normalizedData: { libraries: [], components: [], audits: [], anomalies, pullRequests: [] },
    dataQuality: { issues: [], summary: { INFO: 0, WARNING: 0, ERROR: 0 } },
    analytics: { metrics: {} } as Snapshot['analytics'],
    ruleVersion: 'test',
    modelVersion: 'test',
    reliability: 'reliable'
  } as Snapshot;
}

const base = {
  anomalyId: 'a1', issueId: 'issue-1', origin: 'AUDIT' as const, auditId: 'au1', componentId: 'c1', criticality: 'major' as const, categories: ['focus'],
  status: 'open' as const, createdAt: '2026-09-01T00:00:00Z', detectedAt: '2026-09-01T00:00:00Z', firstDoneAt: undefined, everCorrected: false,
  pullRequestRefs: [], parentRefs: [], provenance: { source: 'github' as const, collectedAt: '2026-09-01T00:00:00Z' },
  dataQualityStatus: 'reliable' as const, cancelled: false, cancelledProjectStatuses: []
};

describe('snapshot diff', () => {
  it('detects created, corrected and reopened anomalies', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', [base]);
    const after = snapshot('s2', '2026-09-11T00:00:00Z', [
      { ...base, status: 'reopened', firstDoneAt: '2026-09-10T12:00:00Z', everCorrected: true },
      { ...base, anomalyId: 'a2' }
    ]);
    const diff = diffSnapshots(before, after);
    expect(diff.anomaliesCreated).toEqual(['a2']);
    expect(diff.anomaliesCorrected).toEqual(['a1']);
    expect(diff.anomaliesReopened).toEqual(['a1']);
    expect(diff.anomalyTransitions).toEqual([{ anomalyId: 'a1', from: 'open', to: 'reopened' }]);
    expect(diff.period).toEqual({ from: before.capturedAt, to: after.capturedAt });
  });
});

import { calculateFlowMetrics } from '../src/analytics/flows.js';

describe('snapshot flow metrics', () => {
  it('exposes period-bound flow metrics', () => {
    const before = snapshot('s1', '2026-09-10T00:00:00Z', [base]);
    const after = snapshot('s2', '2026-09-11T00:00:00Z', [
      { ...base, status: 'reopened', firstDoneAt: '2026-09-10T12:00:00Z', everCorrected: true },
      { ...base, anomalyId: 'a2' }
    ]);
    const flows = calculateFlowMetrics(diffSnapshots(before, after));
    expect(flows['anomaly.flow.created']?.value).toBe(1);
    expect(flows['anomaly.flow.corrected']?.value).toBe(1);
    expect(flows['anomaly.flow.reopened']?.value).toBe(1);
    expect(flows['anomaly.flow.created']?.period).toEqual({ from: before.capturedAt, to: after.capturedAt });
  });
});
