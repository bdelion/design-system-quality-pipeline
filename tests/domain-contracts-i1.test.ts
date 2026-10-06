import { describe, expect, expectTypeOf, it } from 'vitest';
import type {
  Anomaly,
  AnomalyOrigin,
  Audit,
  AuditImprovement,
  ComponentVersion,
  Issue,
  IssueProjectContext,
  NormalizedData,
  Version
} from '../src/domain/types.js';

describe('I1 normalized domain contracts', () => {
  it('keeps raw and canonical Issue Type separate', () => {
    const issue: Issue = {
      issueId: 'issue-1', repositoryId: 'repo-1', libraryId: 'lib-1', number: 42,
      title: 'Keyboard navigation', url: 'https://example.invalid/issues/42', state: 'OPEN',
      createdAt: '2026-10-01T10:00:00Z', labels: ['Component:Button'], rawIssueType: '  Bug  ',
      issueType: 'BUG', componentIds: ['component-button'], criticalities: ['major'],
      accessibilityCategories: ['keyboard'], subIssueIds: [], linkedPullRequestIds: [], projectContexts: [],
      provenance: { source: 'github', sourceId: 'issue-1', collectedAt: '2026-10-06T10:00:00Z' },
      dataQualityStatus: 'reliable'
    };
    expect(issue.rawIssueType).toBe('  Bug  ');
    expect(issue.issueType).toBe('BUG');
  });

  it('supports unrecognized and ambiguous Issue Types without UNKNOWN fallback', () => {
    const base: Issue = {
      issueId: 'issue-2', repositoryId: 'repo-1', libraryId: 'lib-1', number: 43,
      title: 'Unknown type', url: 'https://example.invalid/issues/43', state: 'OPEN',
      createdAt: '2026-10-01T10:00:00Z', labels: [], componentIds: [], criticalities: [],
      accessibilityCategories: [], subIssueIds: [], linkedPullRequestIds: [], projectContexts: [],
      provenance: { source: 'github', sourceId: 'issue-2', collectedAt: '2026-10-06T10:00:00Z' },
      dataQualityStatus: 'partial'
    };
    const unrecognized: Issue = { ...base, rawIssueType: 'Accessibility bug' };
    const ambiguous: Issue = { ...base, issueId: 'issue-3', rawIssueType: 'Bug', candidateIssueTypes: ['BUG', 'FEATURE'] };
    expect(unrecognized.issueType).toBeUndefined();
    expect(ambiguous.issueType).toBeUndefined();
    expect(ambiguous.candidateIssueTypes).toEqual(['BUG', 'FEATURE']);
  });

  it('keeps Project values contextualized and preserves transition history', () => {
    const context: IssueProjectContext = {
      projectId: 'project-1', projectName: 'Design System', rawStatus: '🏗 In progress', status: 'IN_PROGRESS',
      iteration: { iterationId: 'iteration-1', title: 'Sprint 42', startDate: '2026-10-01', durationDays: 14 },
      rawVelocity: '3', velocity: 3, rawScheduling: '2',
      statusHistory: [
        { rawStatus: 'Backlog', status: 'BACKLOG', transitionedAt: '2026-09-01T08:00:00Z' },
        { previousRawStatus: 'Backlog', rawStatus: 'Done', status: 'DONE', transitionedAt: '2026-10-05T12:00:00Z' }
      ]
    };
    expect(context.statusHistory).toHaveLength(2);
    expect(context.statusHistory[1]?.previousRawStatus).toBe('Backlog');
  });

  it('models PROD Version separately from the audited release candidate', () => {
    const version: Version = {
      versionId: 'version-4.2.1', libraryId: 'lib-1', number: '4.2.1', releasedAt: '2026-10-06T09:00:00Z',
      milestoneId: 'milestone-42', prodTag: { name: '4.2.1', createdAt: '2026-10-06T09:00:00Z' },
      provenance: { source: 'github', sourceId: '4.2.1', collectedAt: '2026-10-06T10:00:00Z' }, dataQualityStatus: 'reliable'
    };
    const audit = {
      auditId: 'audit-1', issueId: 'issue-audit-1', libraryId: 'lib-1', componentId: 'component-button',
      versionId: version.versionId, auditedReleaseCandidate: '4.2.1-rc.3',
      auditedReleaseCandidateTag: { name: '4.2.1-rc.3', createdAt: '2026-10-05T09:00:00Z' }
    } satisfies Partial<Audit>;
    expect(version.number).toBe('4.2.1');
    expect(audit.auditedReleaseCandidate).toBe('4.2.1-rc.3');
  });

  it('represents Component × Version explicitly and distinguishes NON_COUVERT', () => {
    const relation: ComponentVersion = {
      componentVersionId: 'cv-1', componentId: 'component-button', versionId: 'version-4.2.1',
      verdict: 'NON_COUVERT', applicableAuditIds: [],
      provenance: { source: 'catalogue', sourceId: '4.2.1:Button', collectedAt: '2026-10-06T10:00:00Z' },
      dataQualityStatus: 'reliable'
    };
    expect(relation.verdict).toBe('NON_COUVERT');
    expect(relation.applicableAuditIds).toEqual([]);
  });

  it('supports AUDIT, HORS_AUDIT and UNDETERMINED anomaly origins', () => {
    const origins: AnomalyOrigin[] = ['AUDIT', 'HORS_AUDIT', 'UNDETERMINED'];
    expect(origins).toEqual(['AUDIT', 'HORS_AUDIT', 'UNDETERMINED']);
    expectTypeOf<Anomaly['origin']>().toEqualTypeOf<AnomalyOrigin | undefined>();
  });

  it('requires a valid Audit relation for AuditImprovement', () => {
    const improvement: AuditImprovement = {
      auditImprovementId: 'improvement-1', issueId: 'issue-feature-1', auditId: 'audit-1',
      provenance: { source: 'github', sourceId: 'issue-feature-1', collectedAt: '2026-10-06T10:00:00Z' },
      dataQualityStatus: 'reliable'
    };
    expect(improvement.auditId).toBe('audit-1');
  });

  it('exposes I1 collections on NormalizedData during staged migration', () => {
    expectTypeOf<NormalizedData['issues']>().toEqualTypeOf<Issue[] | undefined>();
    expectTypeOf<NormalizedData['versions']>().toEqualTypeOf<Version[] | undefined>();
    expectTypeOf<NormalizedData['componentVersions']>().toEqualTypeOf<ComponentVersion[] | undefined>();
    expectTypeOf<NormalizedData['auditImprovements']>().toEqualTypeOf<AuditImprovement[] | undefined>();
  });
});
