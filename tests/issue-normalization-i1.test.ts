import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import type { GithubProcessingConfig } from '../src/config.js';
import type { RawDataset } from '../src/domain/types.js';

const rules: GithubProcessingConfig = {
  labels: {
    componentPrefix: 'Component:', accessibilityCriticalityPrefix: 'rgaa:', accessibilityCategoryPrefix: 'a11y:',
    unknown: 'label:unknown', criticalityValues: { majeure: 'major' }
  },
  issueTypes: {
    anomaly: 'BUG',
    keywords: { AUDIT: ['audit'], BUG: ['bug'], FEATURE: ['feature'], EPIC: ['epic'], NEW_COMPONENT: ['new component'] }
  },
  closingKeywords: ['fixes'],
  cancelledProjectStatuses: ['Cancelled']
};

function dataset(): RawDataset {
  return {
    collectedAt: '2026-10-06T20:00:00Z', catalogueComponents: [], nexusAvailable: false,
    repositories: [{
      id: 'repo-1', name: 'ds-react', owner: 'acme', defaultBranch: 'main', pullRequests: [],
      issues: [{
        id: 'acme/ds-react:issue:42', number: 42, title: 'Keyboard navigation',
        url: 'https://github.example/acme/ds-react/issues/42', state: 'OPEN', issueType: 'BUG', rawIssueType: '  Bug  ',
        labels: ['Component:Button', 'Component:Input', 'rgaa:Majeure', 'a11y:Keyboard'], criticities: ['majeure'],
        parents: ['audit-1'], createdAt: '2026-10-01T10:00:00Z', linkedPullRequestIds: ['pr-1'],
        projectStatuses: [{ projectId: 'project-1', projectName: 'Quality', status: 'In progress' }],
        milestone: { id: 12, number: 12, title: '4.2.1' }
      }]
    }]
  };
}

describe('I1 Issue normalization', () => {
  it('preserves every raw Issue as one normalized Issue with raw and canonical facts separated', () => {
    const normalized = normalizeGithub(dataset(), rules, undefined, '4.2.1');
    expect(normalized.issues).toHaveLength(1);
    expect(normalized.issues?.[0]).toMatchObject({
      issueId: 'acme/ds-react:issue:42', repositoryId: 'repo-1', number: 42,
      title: 'Keyboard navigation', url: 'https://github.example/acme/ds-react/issues/42',
      rawIssueType: '  Bug  ', issueType: 'BUG', state: 'OPEN', milestoneId: '12',
      parentIssueId: 'audit-1', linkedPullRequestIds: ['pr-1'], criticalities: ['Majeure'],
      accessibilityCategories: ['Keyboard']
    });
    expect(normalized.issues?.[0]?.componentIds).toHaveLength(2);
    expect(normalized.issues?.[0]?.projectContexts).toEqual([{
      projectId: 'project-1', projectName: 'Quality', rawStatus: 'In progress', statusHistory: []
    }]);
  });

  it('uses strict whole-value matching after trim and case normalization', () => {
    const raw = dataset();
    raw.repositories[0]!.issues[0]!.rawIssueType = 'Bug report';
    const issue = normalizeGithub(raw, rules).issues?.[0];
    expect(issue?.rawIssueType).toBe('Bug report');
    expect(issue?.issueType).toBeUndefined();
  });

  it('does not choose a canonical type when configured variants are ambiguous', () => {
    const raw = dataset();
    const ambiguousRules = structuredClone(rules);
    ambiguousRules.issueTypes.keywords.FEATURE = ['bug'];
    const issue = normalizeGithub(raw, ambiguousRules).issues?.[0];
    expect(issue?.issueType).toBeUndefined();
    expect(issue?.candidateIssueTypes).toEqual(['BUG', 'FEATURE']);
  });

  it('keeps normalized Issue output deterministic when source Issue order changes', () => {
    const raw = dataset();
    const second = structuredClone(raw.repositories[0]!.issues[0]!);
    second.id = 'acme/ds-react:issue:43'; second.number = 43; second.title = 'Second'; second.parents = [];
    raw.repositories[0]!.issues.push(second);
    const reversed = structuredClone(raw);
    reversed.repositories[0]!.issues.reverse();
    const ids = normalizeGithub(raw, rules).issues?.map((issue) => issue.issueId).sort();
    const reversedIds = normalizeGithub(reversed, rules).issues?.map((issue) => issue.issueId).sort();
    expect(reversedIds).toEqual(ids);
  });
});
