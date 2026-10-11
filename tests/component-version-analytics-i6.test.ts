import { describe, expect, it } from 'vitest';
import { applyComponentVersionVerdicts } from '../src/analytics/component-versions.js';
import type { Anomaly, Audit, ComponentVersion, NormalizedData, Version } from '../src/domain/types.js';

const provenance = { source: 'github' as const, sourceId: 'test', collectedAt: '2026-10-07T20:00:00Z' };

function version(number: string): Version {
  return { versionId: `v-${number}`, libraryId: 'lib-1', number, provenance, dataQualityStatus: 'reliable' };
}
function relation(number: string): ComponentVersion {
  return {
    componentVersionId: `cv-${number}`,
    componentId: 'component-1',
    versionId: `v-${number}`,
    provenance,
    dataQualityStatus: 'reliable'
  };
}
function audit(
  id: string,
  number: string,
  result: Audit['objectiveAuditResult'] = 'conform',
  completed = true
): Audit {
  return {
    auditId: id,
    issueId: `issue-${id}`,
    libraryId: 'lib-1',
    componentId: 'component-1',
    versionId: `v-${number}`,
    version: number,
    status: result,
    sourceIssueId: `issue-${id}`,
    objectiveAuditResult: result,
    ...(completed ? { completedAt: '2026-10-01T10:00:00Z' } : {}),
    provenance,
    dataQualityStatus: 'reliable'
  };
}
function anomaly(id: string, auditId: string, status: Anomaly['status'] = 'open'): Anomaly {
  return {
    anomalyId: id,
    issueId: `issue-${id}`,
    origin: 'AUDIT',
    auditId,
    componentId: 'component-1',
    criticality: 'major',
    categories: [],
    status,
    detectedAt: '2026-09-01T10:00:00Z',
    createdAt: '2026-09-01T10:00:00Z',
    firstDoneAt: status === 'done' ? '2026-09-10T10:00:00Z' : undefined,
    everCorrected: status === 'done',
    pullRequestRefs: [],
    parentRefs: [],
    provenance,
    dataQualityStatus: 'reliable',
    cancelled: false,
    cancelledProjectStatuses: []
  };
}
function data(audits: Audit[], anomalies: Anomaly[] = []): NormalizedData {
  const versions = ['1.0.0', '1.1.0', '1.2.0'].map(version);
  return {
    libraries: [],
    components: [],
    versions,
    componentVersions: versions.map((v) => relation(v.number)),
    issues: [],
    audits,
    anomalies,
    auditImprovements: [],
    pullRequests: []
  };
}

describe('I6 ComponentVersion applicable audit analytics', () => {
  it('marks a component version NON_COUVERT without a completed applicable audit', () => {
    const normalized = data([audit('a-incomplete', '1.0.0', 'conform', false)]);
    applyComponentVersionVerdicts(normalized);
    expect(normalized.componentVersions?.[2]).toMatchObject({
      verdict: 'NON_COUVERT',
      applicableAuditIds: []
    });
  });

  it('inherits a completed conform verdict transitively', () => {
    const normalized = data([audit('a1', '1.0.0')]);
    applyComponentVersionVerdicts(normalized);
    expect(normalized.componentVersions?.map((cv) => cv.verdict)).toEqual([
      'CONFORME',
      'CONFORME',
      'CONFORME'
    ]);
    expect(normalized.componentVersions?.[2]?.applicableAuditIds).toEqual(['a1']);
  });

  it('aggregates every completed audit in the latest applicable audited version', () => {
    const normalized = data([
      audit('a1', '1.0.0'),
      audit('a2', '1.1.0'),
      audit('a3', '1.1.0', 'non_conform')
    ]);
    applyComponentVersionVerdicts(normalized);
    expect(normalized.componentVersions?.[2]).toMatchObject({
      verdict: 'NON_CONFORME',
      applicableAuditIds: ['a2', 'a3']
    });
  });

  it('ignores a newer incomplete audit and keeps the acquired completed verdict', () => {
    const normalized = data([audit('a1', '1.0.0'), audit('a2', '1.1.0', 'non_conform', false)]);
    applyComponentVersionVerdicts(normalized);
    expect(normalized.componentVersions?.[2]).toMatchObject({
      verdict: 'CONFORME',
      applicableAuditIds: ['a1']
    });
  });

  it('does not restore conformity merely because an audit anomaly was corrected', () => {
    const normalized = data([audit('a1', '1.0.0')], [anomaly('bug-1', 'a1', 'done')]);
    applyComponentVersionVerdicts(normalized);
    expect(normalized.componentVersions?.[2]?.verdict).toBe('NON_CONFORME');
  });

  it('lets a newer completed conform audit establish a new conform verdict', () => {
    const normalized = data([audit('a1', '1.0.0'), audit('a2', '1.1.0')], [anomaly('bug-1', 'a1', 'done')]);
    applyComponentVersionVerdicts(normalized);
    expect(normalized.componentVersions?.[2]).toMatchObject({
      verdict: 'CONFORME',
      applicableAuditIds: ['a2']
    });
  });

  it('ignores HORS_AUDIT anomalies and AuditImprovement for conformity', () => {
    const normalized = data([audit('a1', '1.0.0')]);
    const outsideAudit = anomaly('bug-1', 'a1');
    outsideAudit.origin = 'HORS_AUDIT';
    delete outsideAudit.auditId;
    normalized.anomalies.push(outsideAudit);
    normalized.auditImprovements = [
      {
        auditImprovementId: 'improvement-1',
        issueId: 'feature-1',
        auditId: 'a1',
        provenance,
        dataQualityStatus: 'reliable'
      }
    ];
    applyComponentVersionVerdicts(normalized);
    expect(normalized.componentVersions?.[2]?.verdict).toBe('CONFORME');
  });
});
