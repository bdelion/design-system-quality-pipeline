import { describe, expect, it } from 'vitest';
import {
  buildVersionHistoricalStates,
  latestComparableSnapshot,
  metricHistory
} from '../src/snapshots/history.js';
import type { NormalizedData, Snapshot } from '../src/domain/types.js';

const provenance = { source: 'github' as const, sourceId: 'test', collectedAt: '2026-10-07T20:00:00Z' };

function data(): NormalizedData {
  return {
    libraries: [
      {
        libraryId: 'lib',
        name: 'lib',
        repository: 'lib',
        status: 'active',
        provenance,
        dataQualityStatus: 'reliable'
      }
    ],
    components: [
      {
        componentId: 'component',
        name: 'Button',
        libraryId: 'lib',
        status: 'active',
        aliases: [],
        discoverySource: 'github',
        tags: [],
        provenance,
        dataQualityStatus: 'reliable'
      }
    ],
    issues: [],
    versions: [
      {
        versionId: 'v1',
        libraryId: 'lib',
        number: '1.0.0',
        releasedAt: '2026-09-10T10:00:00Z',
        provenance,
        dataQualityStatus: 'reliable'
      }
    ],
    componentVersions: [
      {
        componentVersionId: 'cv1',
        componentId: 'component',
        versionId: 'v1',
        provenance,
        dataQualityStatus: 'reliable'
      }
    ],
    audits: [
      {
        auditId: 'before',
        issueId: 'i1',
        libraryId: 'lib',
        componentId: 'component',
        versionId: 'v1',
        version: '1.0.0',
        status: 'conform',
        sourceIssueId: 'i1',
        objectiveAuditResult: 'conform',
        completedAt: '2026-09-09T10:00:00Z',
        provenance,
        dataQualityStatus: 'reliable'
      },
      {
        auditId: 'catchup',
        issueId: 'i2',
        libraryId: 'lib',
        componentId: 'component',
        versionId: 'v1',
        version: '1.0.0',
        status: 'conform',
        sourceIssueId: 'i2',
        objectiveAuditResult: 'conform',
        completedAt: '2026-09-12T10:00:00Z',
        provenance,
        dataQualityStatus: 'reliable'
      }
    ],
    anomalies: [
      {
        anomalyId: 'late',
        issueId: 'i3',
        origin: 'AUDIT',
        auditId: 'catchup',
        componentId: 'component',
        criticality: 'major',
        categories: [],
        status: 'open',
        detectedAt: '2026-09-11T10:00:00Z',
        createdAt: '2026-09-11T10:00:00Z',
        firstDoneAt: undefined,
        everCorrected: false,
        pullRequestRefs: [],
        parentRefs: [],
        provenance,
        dataQualityStatus: 'reliable',
        cancelled: false,
        cancelledProjectStatuses: []
      }
    ],
    auditImprovements: [],
    pullRequests: []
  };
}

describe('I7 historical release state', () => {
  it('keeps catch-up knowledge current without projecting it back to release', () => {
    const [state] = buildVersionHistoricalStates(data());
    expect(state?.atRelease.audits.map((audit) => audit.auditId)).toEqual(['before']);
    expect(state?.atRelease.anomalies).toEqual([]);
    expect(state?.currentKnowledge.audits.map((audit) => audit.auditId)).toEqual(['before', 'catchup']);
    expect(state?.currentKnowledge.anomalies.map((anomaly) => anomaly.anomalyId)).toEqual(['late']);
    expect(state?.atRelease.componentVersions[0]?.verdict).toBe('CONFORME');
    expect(state?.currentKnowledge.componentVersions[0]?.verdict).toBe('NON_CONFORME');
  });

  it('selects the latest comparable snapshot by capturedAt, not filename order', () => {
    const base = { scope: 's', modelVersion: 'm', ruleVersion: 'r' };
    const snapshots = [
      { ...base, snapshotId: 'z-old', capturedAt: '2026-09-01T00:00:00Z' },
      { ...base, snapshotId: 'a-new', capturedAt: '2026-10-01T00:00:00Z' },
      { ...base, snapshotId: 'other-rules', capturedAt: '2026-10-02T00:00:00Z', ruleVersion: 'r2' }
    ] as unknown as Snapshot[];
    expect(latestComparableSnapshot(snapshots, base)?.snapshotId).toBe('a-new');
  });
});

describe('I7 metric history', () => {
  it('uses values stored in comparable snapshots without recalculation', () => {
    const base = { scope: 's', modelVersion: 'm', ruleVersion: 'r' };
    const make = (snapshotId: string, capturedAt: string, value: number, ruleVersion = 'r') =>
      ({
        ...base,
        snapshotId,
        capturedAt,
        ruleVersion,
        analytics: {
          metrics: {
            'componentVersion.auditCoverage': {
              id: 'componentVersion.auditCoverage',
              value,
              unit: 'percentage',
              scope: 'component',
              definition: 'stored',
              sourceEntityIds: [],
              reliability: { status: 'reliable', issueIds: [] },
              exclusions: []
            }
          }
        }
      }) as unknown as Snapshot;
    const points = metricHistory(
      [
        make('s2', '2026-10-02T00:00:00Z', 80),
        make('s1', '2026-10-01T00:00:00Z', 70),
        make('ignored', '2026-10-03T00:00:00Z', 99, 'r2')
      ],
      'componentVersion.auditCoverage',
      base
    );
    expect(points.map((point) => point.value)).toEqual([70, 80]);
  });
});
