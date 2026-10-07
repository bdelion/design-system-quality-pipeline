import { describe, expect, it } from 'vitest';
import type {
  Anomaly,
  AuditImprovement,
  Audit,
  Issue,
  NormalizedDataV1,
  Version
} from '../src/domain/types.js';
import { collectFixture } from '../src/collectors/fixture.js';
import { loadConfig } from '../src/config.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { stableId } from '../src/lib/ids.js';

const [rawFixture, fixtureConfig] = await Promise.all([
  collectFixture(),
  loadConfig()
]);

describe('V1 domain contracts', () => {
  it('preserves the generic Issue independently from its specializations', () => {
    const issue: Issue = {
      issueId: 'issue-1',
      number: 1,
      title: 'Fix accessible name',
      rawIssueType: 'Bug',
      issueType: 'BUG',
      state: 'OPEN',
      createdAt: '2026-09-01T00:00:00.000Z',
      labels: ['Component:Button', 'a11y:name'],
      repositoryId: 'repository-1',
      libraryId: 'library-1',
      projectStatuses: [],
      subIssueIds: [],
      linkedPullRequestIds: [],
      componentIds: ['component-1'],
      criticities: [],
      accessibilityCategories: ['name'],
      provenance: { source: 'github', collectedAt: '2026-09-02T00:00:00.000Z' },
      dataQualityStatus: 'reliable'
    };
    const anomaly: Anomaly = {
      anomalyId: 'anomaly-1',
      issueId: issue.issueId,
      componentIds: issue.componentIds,
      origin: 'HORS_AUDIT',
      categories: ['name'],
      detectedAt: issue.createdAt
    };

    expect(anomaly.issueId).toBe(issue.issueId);
    expect(anomaly.origin).toBe('HORS_AUDIT');
  });

  it('requires a valid Audit reference for Audit Improvements', () => {
    const improvement: AuditImprovement = {
      auditImprovementId: 'improvement-1',
      issueId: 'issue-2',
      auditId: 'audit-1'
    };

    expect(improvement.auditId).toBe('audit-1');
  });

  it('represents unknown release and catalogue facts without fabricating values', () => {
    const version: Version = {
      versionId: 'version-1',
      libraryId: 'library-1',
      number: '1.2.3',
      published: false,
      catalogueStatus: 'unknown'
    };
    const audit: Audit = {
      auditId: 'audit-1',
      issueId: 'issue-3',
      componentId: 'component-1',
      versionId: version.versionId,
      realized: false,
      verdict: 'UNKNOWN',
      timing: 'UNKNOWN'
    };
    const data: NormalizedDataV1 = {
      libraries: [],
      components: [],
      issues: [],
      milestones: [],
      versions: [version],
      componentVersions: [],
      audits: [audit],
      anomalies: [],
      auditImprovements: [],
      legacyAudits: [],
      legacyAnomalies: [],
      pullRequests: []
    };

    expect(data.versions[0]?.releasedAt).toBeUndefined();
    expect(data.versions[0]?.tag).toBeUndefined();
    expect(data.audits[0]?.completedAt).toBeUndefined();
  });

  it('preserves every source Issue and normalizes deterministically across input order', () => {
    const normalized = normalizeGithub(rawFixture, fixtureConfig.github);
    const reordered = structuredClone(rawFixture);
    reordered.repositories.reverse();
    for (const repository of reordered.repositories) repository.issues.reverse();
    const reorderedNormalized = normalizeGithub(reordered, fixtureConfig.github);
    const sourceIssueCount = rawFixture.repositories.reduce(
      (count, repository) => count + repository.issues.length,
      0
    );

    expect(normalized.issues).toHaveLength(sourceIssueCount);
    expect(reorderedNormalized).toEqual(normalized);
  });

  it('uses strict configured Issue Type matching and keeps the raw value', () => {
    const raw = structuredClone(rawFixture);
    const issue = raw.repositories[0]?.issues[0];
    if (!issue) throw new Error('Fixture must contain at least one Issue.');
    issue.issueType = 'unconfigured BUG suffix';

    const normalized = normalizeGithub(raw, fixtureConfig.github);
    const result = normalized.issues.find((candidate) => candidate.issueId === stableId('issue', issue.id));

    expect(result?.rawIssueType).toBe('unconfigured BUG suffix');
    expect(result?.issueType).toBeUndefined();
  });

  it('preserves multiple Components and keeps a Bug with an unresolved parent undetermined', () => {
    const raw = structuredClone(rawFixture);
    const source = raw.repositories[0]?.issues.find((issue) => issue.id === 'issue-101');
    if (!source) throw new Error('Fixture issue-101 is required for this test.');
    source.components = ['Button', 'Modal'];
    delete source.component;

    const normalized = normalizeGithub(raw, fixtureConfig.github);
    const issue = normalized.issues.find((candidate) => candidate.issueId === stableId('issue', source.id));

    expect(issue?.componentIds).toHaveLength(2);
    expect(issue?.componentIds.every((componentId) =>
      normalized.components.some((component) => component.componentId === componentId)
    )).toBe(true);
    expect(normalized.anomalies).toHaveLength(
      raw.repositories.flatMap((repository) => repository.issues)
        .filter((candidate) => candidate.issueType === fixtureConfig.github.issueTypes.anomaly).length
    );
    const anomaly = normalized.anomalies.find((candidate) => candidate.issueId === issue?.issueId);
    expect(anomaly).toMatchObject({
      issueId: issue?.issueId,
      componentIds: issue?.componentIds,
      origin: 'UNDETERMINED'
    });
    expect(anomaly).not.toHaveProperty('auditId');
    expect(normalized.legacyAnomalies.some((anomaly) => anomaly.provenance.sourceId === source.id)).toBe(false);
  });

  it('does not materialize orphaned Issue references', () => {
    const normalized = normalizeGithub(rawFixture, fixtureConfig.github);
    const issueIds = new Set(normalized.issues.map((issue) => issue.issueId));
    const componentIds = new Set(normalized.components.map((component) => component.componentId));
    const milestoneIds = new Set(normalized.milestones.map((milestone) => milestone.milestoneId));
    const pullRequestIds = new Set(normalized.pullRequests.map((pullRequest) => pullRequest.pullRequestId));

    for (const issue of normalized.issues) {
      expect(issue.componentIds.every((id) => componentIds.has(id))).toBe(true);
      expect(issue.subIssueIds.every((id) => issueIds.has(id))).toBe(true);
      expect(issue.linkedPullRequestIds.every((id) => pullRequestIds.has(id))).toBe(true);
      if (issue.parentIssueId) expect(issueIds.has(issue.parentIssueId)).toBe(true);
      if (issue.milestoneId) expect(milestoneIds.has(issue.milestoneId)).toBe(true);
    }
  });
});
