import { describe, expect, it } from 'vitest';
import { calculateMetrics } from '../src/analytics/metrics.js';
import type { NormalizedData } from '../src/domain/types.js';

const collectedAt = '2026-09-10T00:00:00Z';

function dataset(): NormalizedData {
  return {
    libraries: [{
      libraryId: 'library-ui',
      name: 'ui',
      repository: 'ui',
      status: 'active',
      provenance: { source: 'github', collectedAt },
      dataQualityStatus: 'reliable'
    }],
    components: [
      { componentId: 'component-one', name: 'One', libraryId: 'library-ui', status: 'active', aliases: [], discoverySource: 'catalogue', tags: [], provenance: { source: 'catalogue', collectedAt }, dataQualityStatus: 'reliable' },
      { componentId: 'component-two', name: 'Two', libraryId: 'library-ui', status: 'active', aliases: [], discoverySource: 'catalogue', tags: [], provenance: { source: 'catalogue', collectedAt }, dataQualityStatus: 'reliable' }
    ],
    issues: [
      {
        issueId: 'issue-anomaly-1', number: 1, title: 'Fixed', rawIssueType: 'Bug', issueType: 'BUG', state: 'CLOSED',
        createdAt: '2026-09-01T00:00:00Z', closedAt: '2026-09-03T00:00:00Z', labels: [], repositoryId: 'repo', libraryId: 'library-ui',
        projectStatuses: [{ projectId: 'project', projectName: 'Board', status: { rawValue: 'Done' }, fields: [], transitions: [] }],
        subIssueIds: [], linkedPullRequestIds: [], componentIds: ['component-one'], criticities: ['major'], accessibilityCategories: ['focus'],
        provenance: { source: 'github', sourceId: 'raw-issue-1', collectedAt }, dataQualityStatus: 'reliable'
      },
      {
        issueId: 'issue-anomaly-2', number: 2, title: 'Open', rawIssueType: 'Bug', issueType: 'BUG', state: 'OPEN',
        createdAt: '2026-09-02T00:00:00Z', labels: [], repositoryId: 'repo', libraryId: 'library-ui',
        projectStatuses: [{ projectId: 'project', projectName: 'Board', status: { rawValue: 'Open' }, fields: [], transitions: [] }],
        subIssueIds: [], linkedPullRequestIds: [], componentIds: ['component-two'], criticities: [], accessibilityCategories: [],
        provenance: { source: 'github', sourceId: 'raw-issue-2', collectedAt }, dataQualityStatus: 'reliable'
      }
    ],
    milestones: [],
    versions: [{
      versionId: 'version-ui-1',
      libraryId: 'library-ui',
      number: '1.0.0',
      tag: '1.0.0',
      releasedAt: '2026-09-05T00:00:00Z',
      published: true,
      catalogueStatus: 'known',
      catalogueComponents: ['One', 'Two']
    }],
    componentVersions: [
      { componentId: 'component-one', versionId: 'version-ui-1' },
      { componentId: 'component-two', versionId: 'version-ui-1' }
    ],
    audits: [{
      auditId: 'audit-one', issueId: 'issue-audit-one', componentId: 'component-one', versionId: 'version-ui-1',
      completedAt: '2026-09-04T00:00:00Z', realized: true, verdict: 'NON_CONFORM', timing: 'PRE_PROD'
    }],
    anomalies: [
      {
        anomalyId: 'anomaly-one', issueId: 'issue-anomaly-1', componentIds: ['component-one'], origin: 'AUDIT',
        auditId: 'audit-one', componentId: 'component-one', criticality: 'major', categories: ['focus'],
        detectedAt: '2026-09-01T00:00:00Z', correctedAt: '2026-09-03T00:00:00Z'
      },
      {
        anomalyId: 'anomaly-two', issueId: 'issue-anomaly-2', componentIds: ['component-two'], origin: 'HORS_AUDIT',
        categories: ['name'], detectedAt: '2026-09-02T00:00:00Z'
      }
    ],
    auditImprovements: [],
    legacyAudits: [],
    legacyAnomalies: [],
    pullRequests: []
  };
}

describe('V1 analytics', () => {
  it('uses historical Component x Version coverage and V1 event dates', () => {
    const metrics = calculateMetrics(dataset(), [], collectedAt);

    expect(metrics['portfolio.auditCoverage']).toMatchObject({ value: 50, numerator: 1, denominator: 2 });
    expect(metrics['version.auditCoverage.version-ui-1']).toMatchObject({ value: 50, numerator: 1, denominator: 2 });
    expect(metrics['version.conformityRate.version-ui-1']).toMatchObject({ value: 0, numerator: 0, denominator: 1 });
    expect(metrics['audit.completed']?.value).toBe(1);
    expect(metrics['audit.nonConform']?.value).toBe(1);
    expect(metrics['anomaly.total']?.value).toBe(2);
    expect(metrics['anomaly.open']?.value).toBe(1);
    expect(metrics['anomaly.done']?.value).toBe(1);
    expect(metrics['anomaly.correctedEver']?.value).toBe(1);
    expect(metrics['anomaly.correctionDelay.average']?.value).toBe(2);
    expect(metrics['anomaly.byOrigin.AUDIT']?.value).toBe(1);
    expect(metrics['anomaly.byOrigin.HORS_AUDIT']?.value).toBe(1);
    expect(metrics['anomaly.audit.total']).toMatchObject({ value: 1, numerator: 1, denominator: 1 });
    expect(metrics['anomaly.audit.open']?.value).toBe(0);
    expect(metrics['anomaly.audit.done']?.value).toBe(1);
    expect(metrics['anomaly.audit.byCriticality.major']?.value).toBe(1);
    expect(metrics['anomaly.audit.byCategory.focus']?.value).toBe(1);
    expect(metrics['anomaly.audit.criticalityCoverage']?.value).toBe(100);
    expect(metrics['anomaly.audit.correctionDelay.average']?.value).toBe(2);
  });

  it('applies audit-specific data-quality exclusions without changing global anomaly counts', () => {
    const qualityIssue = {
      id: 'DQ-003:raw-issue-1',
      ruleId: 'DQ-003',
      severity: 'ERROR' as const,
      action: 'exclude' as const,
      entityType: 'issue',
      entityId: 'raw-issue-1',
      message: 'Anomaly has incompatible multiple parents.',
      detectedAt: collectedAt,
      impacts: []
    };
    const metrics = calculateMetrics(dataset(), [qualityIssue], collectedAt);

    expect(metrics['anomaly.total']?.value).toBe(2);
    expect(metrics['anomaly.audit.total']).toMatchObject({
      value: 0,
      exclusions: [{ entityId: 'raw-issue-1', ruleId: 'DQ-003' }]
    });
  });

  it('returns unknown, not zero, when historical catalogue evidence is unavailable', () => {
    const data = dataset();
    data.versions[0]!.catalogueStatus = 'unknown';

    const metrics = calculateMetrics(data, [], collectedAt);

    expect(metrics['portfolio.auditCoverage']?.value).toBe('unknown');
    expect(metrics['version.auditCoverage.version-ui-1']?.value).toBe('unknown');
  });

  it('does not impose business semantics on Cancelled before Q-022 is decided', () => {
    const data = dataset();
    data.issues[1]!.projectStatuses[0]!.status.rawValue = 'Cancelled';

    const metrics = calculateMetrics(data, [], collectedAt);

    expect(metrics['anomaly.open']?.value).toBe('unknown');
    expect(metrics['anomaly.cancelled']?.value).toBe('unknown');
  });
});
