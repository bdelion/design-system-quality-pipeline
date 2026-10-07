import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import type { GithubProcessingConfig } from '../src/config.js';
import type { RawDataset, RawIssue } from '../src/domain/types.js';

const rules: GithubProcessingConfig = {
  labels: {
    componentPrefix: 'Component:', accessibilityCriticalityPrefix: 'rgaa:', accessibilityCategoryPrefix: 'a11y:',
    unknown: 'label:unknown', criticalityValues: { majeure: 'major' }
  },
  issueTypes: {
    anomaly: 'BUG',
    keywords: { AUDIT: ['audit'], BUG: ['bug'], FEATURE: ['feature'], EPIC: ['epic'], NEW_COMPONENT: ['new component'] }
  },
  projectStatuses: {
    keywords: {
      BACKLOG: ['Backlog', '📋 Backlog'], READY: ['Ready', '🔖 Ready'],
      IN_PROGRESS: ['In progress', '🏗 In progress'], IN_REVIEW: ['In review', '👀 In review'],
      DONE: ['Done', '✅ Done'], BLOCKED: ['Blocked', '✋ Blocked'], CANCELLED: ['Cancelled', '🛑 Cancelled']
    }
  },
  closingKeywords: ['fixes'], cancelledProjectStatuses: ['Cancelled']
};

function auditIssue(id: string, milestoneTitle?: string): RawIssue {
  return {
    id, number: 1, title: id, state: 'CLOSED', issueType: 'AUDIT', rawIssueType: 'Audit',
    labels: ['Component:Button'], criticities: [], parents: [], createdAt: '2026-09-01T00:00:00Z',
    linkedPullRequestIds: [], projectStatuses: [],
    ...(milestoneTitle ? { milestone: { id: 42, number: 42, title: milestoneTitle, state: 'closed' } } : {})
  };
}

function dataset(issue: RawIssue, gitTags: NonNullable<RawDataset['repositories'][number]['gitTags']>): RawDataset {
  return {
    collectedAt: '2026-10-06T20:00:00Z', catalogueComponents: [], nexusAvailable: false,
    repositories: [{ id: 'repo-1', name: 'ds-react', owner: 'acme', defaultBranch: 'main', issues: [issue], pullRequests: [], gitTags }]
  };
}

describe('I1 Version normalization', () => {
  it('materializes a published PROD Version from exact milestone and annotated Git tag evidence', () => {
    const normalized = normalizeGithub(dataset(auditIssue('audit-1', '4.2.1'), [{ name: '4.2.1', createdAt: '2026-09-30T12:00:00Z' }]), rules);
    expect(normalized.versions).toHaveLength(1);
    expect(normalized.versions?.[0]).toMatchObject({ number: '4.2.1', milestoneId: '42', releasedAt: '2026-09-30T12:00:00Z', prodTag: { name: '4.2.1' } });
    expect(normalized.audits).toHaveLength(1);
    expect(normalized.audits[0]?.versionId).toBe(normalized.versions?.[0]?.versionId);
  });

  it('keeps an identifiable Version unpublished when the PROD tag is missing', () => {
    const normalized = normalizeGithub(dataset(auditIssue('audit-1', '4.2.1'), []), rules);
    expect(normalized.versions?.[0]).toMatchObject({ number: '4.2.1', milestoneId: '42', dataQualityStatus: 'partial' });
    expect(normalized.versions?.[0]?.releasedAt).toBeUndefined();
    expect(normalized.audits).toHaveLength(1);
  });

  it('does not infer PROD from an RC milestone or from an arbitrary version string', () => {
    const normalized = normalizeGithub(dataset(auditIssue('audit-1', '4.2.1-rc.2'), [{ name: '4.2.1-rc.2', createdAt: '2026-09-20T12:00:00Z' }]), rules);
    expect(normalized.versions).toEqual([]);
    expect(normalized.audits).toEqual([]);
  });

  it('never substitutes a commit date for a lightweight PROD tag date', () => {
    const normalized = normalizeGithub(dataset(auditIssue('audit-1', '4.2.1'), [{ name: '4.2.1' }]), rules);
    expect(normalized.versions?.[0]?.prodTag).toEqual({ name: '4.2.1' });
    expect(normalized.versions?.[0]?.releasedAt).toBeUndefined();
  });
});
