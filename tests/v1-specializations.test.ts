import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import type { RawDataset, RawIssue } from '../src/domain/types.js';

const config = await loadConfig();

describe('V1 Issue specializations', () => {
  it('normalizes Audit, Anomaly, Improvement, release candidate and timing from source facts', () => {
    const raw = dataset();
    const repo = raw.repositories[0]!;
    const audit = issue('audit-1', 1, 'Audit', ['Button'], {
      state: 'CLOSED',
      milestone: { id: 1, number: 1, title: '1.8.0-Audit' },
      projectStatuses: [{
        projectId: 'project-1',
        projectName: 'Audit board',
        status: 'Done',
        transitions: [{ previousStatus: 'In progress', newStatus: 'Done', changedAt: '2026-08-04T10:00:00Z' }]
      }],
      projectFields: [{
        projectId: 'project-1',
        projectName: 'Audit board',
        fieldName: 'RC audited',
        value: '1.8.0-rc.3'
      }]
    });
    const catchUpAudit = issue('audit-2', 2, 'Audit', ['Modal'], {
      state: 'CLOSED',
      milestone: { id: 2, number: 2, title: '1.8.0' },
      projectStatuses: [{
        projectId: 'project-1',
        projectName: 'Audit board',
        status: 'Done',
        transitions: [{ previousStatus: 'In progress', newStatus: 'Done', changedAt: '2026-08-06T10:00:00Z' }]
      }]
    });
    const incompleteAudit = issue('audit-open', 3, 'Audit', ['Card'], {
      state: 'OPEN',
      milestone: { id: 3, number: 3, title: '2.0.0' },
      projectStatuses: [{
        projectId: 'project-1',
        projectName: 'Audit board',
        status: 'Done',
        transitions: [{ previousStatus: 'In progress', newStatus: 'Done', changedAt: '2026-08-07T10:00:00Z' }]
      }]
    });
    const closedButNotDoneAudit = issue('audit-not-done', 10, 'Audit', ['Alert'], {
      state: 'CLOSED',
      milestone: { id: 10, number: 10, title: '2.1.0' },
      projectStatuses: [{
        projectId: 'project-1',
        projectName: 'Audit board',
        status: 'In progress'
      }]
    });
    const auditAnomaly = issue('bug-audit', 4, 'Bug', ['Modal'], {
      parents: [audit.id],
      criticities: ['majeure'],
      labels: [`${config.github.labels.accessibilityCategoryPrefix}focus`],
      createdAt: '2026-08-01T09:00:00Z',
      projectStatuses: [{
        projectId: 'project-1',
        projectName: 'Audit board',
        status: 'Done',
        transitions: [{ previousStatus: 'In progress', newStatus: 'Done', changedAt: '2026-08-05T09:00:00Z' }]
      }]
    });
    const improvement = issue('feature-1', 5, 'Feature', ['Button'], { parents: [audit.id] });
    const improvementOnly = issue('feature-only', 12, 'Feature', ['Modal'], {
      parents: [catchUpAudit.id]
    });
    const ambiguousImprovement = issue('feature-multiple-audits', 11, 'Feature', ['Button'], {
      parents: [audit.id, catchUpAudit.id]
    });
    const outsideAnomaly = issue('bug-outside', 6, 'Bug', []);
    const unresolvedAnomaly = issue('bug-unresolved', 7, 'Bug', ['Button'], { parents: ['missing-audit'] });
    const multiAuditAnomaly = issue('bug-multiple-audits', 8, 'Bug', ['Button'], {
      parents: [audit.id, catchUpAudit.id]
    });
    const bugWithNonAuditParent = issue('bug-feature-parent', 9, 'Bug', ['Button'], {
      parents: [improvement.id]
    });

    repo.issues.push(
      audit,
      catchUpAudit,
      incompleteAudit,
      closedButNotDoneAudit,
      auditAnomaly,
      improvement,
      improvementOnly,
      ambiguousImprovement,
      outsideAnomaly,
      unresolvedAnomaly,
      multiAuditAnomaly,
      bugWithNonAuditParent
    );
    repo.tags = [
      tag('1.8.0', '2026-08-05T12:00:00Z'),
      tag('1.8.0-rc.3', '2026-08-03T12:00:00Z'),
      tag('2.0.0', '2026-08-10T12:00:00Z')
    ];

    const normalized = normalizeGithub(raw, {
      ...config.github,
      projects: { ...config.github.projects, auditedReleaseCandidateField: 'RC audited' }
    });
    const auditBySource = new Map(normalized.audits.map((item) => [
      normalized.issues.find((candidate) => candidate.issueId === item.issueId)?.provenance.sourceId,
      item
    ]));
    const anomalyBySource = new Map(normalized.anomalies.map((item) => [
      normalized.issues.find((candidate) => candidate.issueId === item.issueId)?.provenance.sourceId,
      item
    ]));

    expect(normalized.issues).toHaveLength(repo.issues.length);
    expect(normalized.audits).toHaveLength(4);
    expect(auditBySource.get(audit.id)).toMatchObject({
      auditedReleaseCandidate: '1.8.0-rc.3',
      auditedReleaseCandidateTag: { name: '1.8.0-rc.3', taggedAt: '2026-08-03T12:00:00Z' },
      completedAt: '2026-08-04T10:00:00Z',
      realized: true,
      verdict: 'UNKNOWN',
      timing: 'PRE_PROD'
    });
    expect(auditBySource.get(catchUpAudit.id)).toMatchObject({
      realized: true,
      verdict: 'UNKNOWN',
      timing: 'CATCH_UP'
    });
    expect(auditBySource.get(incompleteAudit.id)).toMatchObject({
      realized: false,
      verdict: 'UNKNOWN'
    });
    expect(auditBySource.get(closedButNotDoneAudit.id)).toMatchObject({
      realized: false,
      verdict: 'UNKNOWN',
      timing: 'UNKNOWN'
    });
    expect(anomalyBySource.get(auditAnomaly.id)).toMatchObject({
      origin: 'AUDIT',
      auditId: auditBySource.get(audit.id)?.auditId,
      componentIds: normalized.issues.find((candidate) => candidate.provenance.sourceId === auditAnomaly.id)?.componentIds,
      componentId: normalized.issues.find((candidate) => candidate.provenance.sourceId === audit.id)?.componentIds[0],
      criticality: 'major',
      categories: ['focus'],
      detectedAt: auditAnomaly.createdAt,
      correctedAt: '2026-08-05T09:00:00Z'
    });
    expect(anomalyBySource.get(outsideAnomaly.id)?.origin).toBe('HORS_AUDIT');
    expect(anomalyBySource.get(unresolvedAnomaly.id)?.origin).toBe('UNDETERMINED');
    expect(anomalyBySource.get(multiAuditAnomaly.id)?.origin).toBe('UNDETERMINED');
    expect(anomalyBySource.get(bugWithNonAuditParent.id)?.origin).toBe('HORS_AUDIT');
    expect(normalized.auditImprovements).toHaveLength(2);
    expect(normalized.auditImprovements).toEqual(expect.arrayContaining([
      {
        auditImprovementId: expect.any(String),
        issueId: normalized.issues.find((candidate) => candidate.provenance.sourceId === improvement.id)?.issueId,
        auditId: auditBySource.get(audit.id)?.auditId
      },
      {
        auditImprovementId: expect.any(String),
        issueId: normalized.issues.find((candidate) => candidate.provenance.sourceId === improvementOnly.id)?.issueId,
        auditId: auditBySource.get(catchUpAudit.id)?.auditId
      }
    ]));
    const qualityIssues = evaluateDataQuality(raw, normalized, config.github);
    expect(qualityIssues.some((item) => item.ruleId === 'DQ-019' && item.entityId === unresolvedAnomaly.id)).toBe(true);
    expect(qualityIssues.some((item) => item.ruleId === 'DQ-020' && item.entityId === auditAnomaly.id)).toBe(true);
    expect(qualityIssues.some((item) => item.ruleId === 'DQ-001' && item.entityId === outsideAnomaly.id)).toBe(false);

    const issueIds = new Set(normalized.issues.map((candidate) => candidate.issueId));
    const componentIds = new Set(normalized.components.map((candidate) => candidate.componentId));
    const versionIds = new Set(normalized.versions.map((candidate) => candidate.versionId));
    const auditIds = new Set(normalized.audits.map((candidate) => candidate.auditId));
    expect(normalized.audits.every((candidate) =>
      issueIds.has(candidate.issueId) && componentIds.has(candidate.componentId) && versionIds.has(candidate.versionId)
    )).toBe(true);
    expect(normalized.anomalies.every((candidate) =>
      issueIds.has(candidate.issueId)
      && candidate.componentIds.every((componentId) => componentIds.has(componentId))
      && (candidate.origin !== 'AUDIT' || auditIds.has(candidate.auditId))
    )).toBe(true);
    expect(normalized.auditImprovements.every((candidate) =>
      issueIds.has(candidate.issueId) && auditIds.has(candidate.auditId)
    )).toBe(true);
  });

  it('keeps a generic Issue but does not specialize an Audit without one Component and a target Version', () => {
    const raw = dataset();
    const invalidAuditNoComponent = issue('audit-no-component', 10, 'Audit', [], {
      milestone: { id: 10, number: 10, title: '1.8.0' }
    });
    const invalidAuditManyComponents = issue('audit-many-components', 11, 'Audit', ['Button', 'Modal'], {
      milestone: { id: 11, number: 11, title: '1.8.0' }
    });
    const invalidAuditNoVersion = issue('audit-no-version', 12, 'Audit', ['Button']);
    const childOfInvalidAudit = issue('bug-under-invalid-audit', 13, 'Bug', ['Button'], {
      parents: [invalidAuditNoComponent.id]
    });
    const repo = raw.repositories[0]!;
    repo.issues.push(invalidAuditNoComponent, invalidAuditManyComponents, invalidAuditNoVersion, childOfInvalidAudit);

    const normalized = normalizeGithub(raw, config.github);
    expect(normalized.audits).toEqual([]);
    expect(normalized.issues.map((candidate) => candidate.provenance.sourceId)).toEqual(
      expect.arrayContaining([
        invalidAuditNoComponent.id,
        invalidAuditManyComponents.id,
        invalidAuditNoVersion.id,
        childOfInvalidAudit.id
      ])
    );
    expect(normalized.anomalies.find((candidate) => candidate.issueId ===
      normalized.issues.find((issue) => issue.provenance.sourceId === childOfInvalidAudit.id)?.issueId
    )?.origin).toBe('UNDETERMINED');
    expect(normalized.anomalies.find((candidate) => candidate.issueId ===
      normalized.issues.find((issue) => issue.provenance.sourceId === childOfInvalidAudit.id)?.issueId
    )).not.toHaveProperty('auditId');
  });
});

function dataset(): RawDataset {
  return {
    collectedAt: '2026-09-01T00:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: [{
      id: 'repo-1',
      name: 'design-system',
      owner: 'example',
      defaultBranch: 'main',
      issues: [],
      pullRequests: []
    }]
  };
}

function issue(
  id: string,
  number: number,
  issueType: string,
  components: string[],
  overrides: Partial<RawIssue> = {}
): RawIssue {
  return {
    id,
    number,
    title: `${issueType} ${number}`,
    state: 'OPEN',
    issueType,
    labels: [],
    components,
    criticities: [],
    parents: [],
    createdAt: '2026-08-01T00:00:00Z',
    linkedPullRequestIds: [],
    projectStatuses: [],
    ...overrides
  };
}

function tag(name: string, createdAt: string) {
  return {
    name,
    ref: `refs/tags/${name}`,
    referenceSha: `tag-${name}`,
    referenceObjectType: 'tag' as const,
    targetSha: `commit-${name}`,
    targetType: 'commit' as const,
    createdAt
  };
}
