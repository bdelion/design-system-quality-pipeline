import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import type { GithubProcessingConfig } from '../src/config.js';
import type { RawDataset } from '../src/domain/types.js';

const rules: GithubProcessingConfig = {
  labels: {
    componentPrefix: 'Component:',
    accessibilityCriticalityPrefix: 'rgaa:',
    accessibilityCategoryPrefix: 'a11y:',
    unknown: 'label:unknown',
    criticalityValues: { majeure: 'major' }
  },
  issueTypes: {
    anomaly: 'BUG',
    keywords: {
      AUDIT: ['audit'],
      BUG: ['bug'],
      FEATURE: ['feature'],
      EPIC: ['epic'],
      NEW_COMPONENT: ['new component']
    }
  },
  projectStatuses: {
    keywords: {
      BACKLOG: ['Backlog', '📋 Backlog'],
      READY: ['Ready', '🔖 Ready'],
      IN_PROGRESS: ['In progress', '🏗 In progress'],
      IN_REVIEW: ['In review', '👀 In review'],
      DONE: ['Done', '✅ Done'],
      BLOCKED: ['Blocked', '✋ Blocked'],
      CANCELLED: ['Cancelled', '🛑 Cancelled']
    }
  },
  closingKeywords: ['fixes'],
  cancelledProjectStatuses: ['Cancelled']
};

function dataset(): RawDataset {
  return {
    collectedAt: '2026-10-06T20:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: [
      {
        id: 'repo-1',
        name: 'ds-react',
        owner: 'acme',
        defaultBranch: 'main',
        pullRequests: [],
        issues: [
          {
            id: 'acme/ds-react:issue:42',
            number: 42,
            title: 'Keyboard navigation',
            url: 'https://github.example/acme/ds-react/issues/42',
            state: 'OPEN',
            issueType: 'BUG',
            rawIssueType: '  Bug  ',
            labels: ['Component:Button', 'Component:Input', 'rgaa:Majeure', 'a11y:Keyboard'],
            criticities: ['majeure'],
            parents: ['audit-1'],
            createdAt: '2026-10-01T10:00:00Z',
            linkedPullRequestIds: ['pr-1'],
            projectStatuses: [
              {
                projectId: 'project-1',
                projectName: 'Quality',
                status: 'In progress',
                iteration: {
                  iterationId: 'it-1',
                  title: 'Sprint 1',
                  startDate: '2026-09-01',
                  durationDays: 14
                },
                rawVelocity: '3',
                rawScheduling: '2',
                statusHistory: [
                  { previousStatus: 'Backlog', status: 'In progress', transitionedAt: '2026-09-29T09:00:00Z' }
                ]
              }
            ],
            milestone: { id: 12, number: 12, title: '4.2.1' }
          }
        ]
      }
    ]
  };
}

describe('I1 Issue normalization', () => {
  it('preserves every raw Issue as one normalized Issue with raw and canonical facts separated', () => {
    const normalized = normalizeGithub(dataset(), rules, undefined, '4.2.1');
    expect(normalized.issues).toHaveLength(1);
    expect(normalized.issues?.[0]).toMatchObject({
      issueId: 'acme/ds-react:issue:42',
      repositoryId: 'repo-1',
      number: 42,
      title: 'Keyboard navigation',
      url: 'https://github.example/acme/ds-react/issues/42',
      rawIssueType: '  Bug  ',
      issueType: 'BUG',
      state: 'OPEN',
      milestoneId: '12',
      parentIssueId: 'audit-1',
      linkedPullRequestIds: ['pr-1'],
      criticalities: ['Majeure'],
      accessibilityCategories: ['Keyboard']
    });
    expect(normalized.issues?.[0]?.componentIds).toHaveLength(2);
    expect(normalized.issues?.[0]?.projectContexts).toEqual([
      {
        projectId: 'project-1',
        projectName: 'Quality',
        rawStatus: 'In progress',
        status: 'IN_PROGRESS',
        iteration: { iterationId: 'it-1', title: 'Sprint 1', startDate: '2026-09-01', durationDays: 14 },
        rawVelocity: '3',
        velocity: 3,
        rawScheduling: '2',
        statusHistory: [
          {
            previousRawStatus: 'Backlog',
            previousStatus: 'BACKLOG',
            rawStatus: 'In progress',
            status: 'IN_PROGRESS',
            transitionedAt: '2026-09-29T09:00:00Z'
          }
        ]
      }
    ]);
  });

  it('canonicalizes configured Project status variants for current state and history', () => {
    const raw = dataset();
    raw.repositories[0]!.issues[0]!.projectStatuses![0]!.status = '  🏗 IN PROGRESS  ';
    raw.repositories[0]!.issues[0]!.projectStatuses![0]!.statusHistory = [
      {
        previousStatus: '📋 Backlog',
        status: '✅ Done',
        transitionedAt: '2026-09-30T09:00:00Z'
      }
    ];
    const context = normalizeGithub(raw, rules).issues?.[0]?.projectContexts[0];
    expect(context?.status).toBe('IN_PROGRESS');
    expect(context?.statusHistory[0]).toMatchObject({ previousStatus: 'BACKLOG', status: 'DONE' });
  });

  it('preserves unknown Project statuses without inventing a canonical value', () => {
    const raw = dataset();
    raw.repositories[0]!.issues[0]!.projectStatuses![0]!.status = 'Todo';
    const context = normalizeGithub(raw, rules).issues?.[0]?.projectContexts[0];
    expect(context?.rawStatus).toBe('Todo');
    expect(context?.status).toBeUndefined();
    expect(context?.candidateStatuses).toBeUndefined();
  });

  it('does not choose a canonical Project status when configured variants are ambiguous', () => {
    const raw = dataset();
    const ambiguousRules = structuredClone(rules);
    ambiguousRules.projectStatuses.keywords.READY = ['In progress'];
    const context = normalizeGithub(raw, ambiguousRules).issues?.[0]?.projectContexts[0];
    expect(context?.status).toBeUndefined();
    expect(context?.candidateStatuses).toEqual(['READY', 'IN_PROGRESS']);
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
    second.id = 'acme/ds-react:issue:43';
    second.number = 43;
    second.title = 'Second';
    second.parents = [];
    raw.repositories[0]!.issues.push(second);
    const reversed = structuredClone(raw);
    reversed.repositories[0]!.issues.reverse();
    const ids = normalizeGithub(raw, rules)
      .issues?.map((issue) => issue.issueId)
      .sort();
    const reversedIds = normalizeGithub(reversed, rules)
      .issues?.map((issue) => issue.issueId)
      .sort();
    expect(reversedIds).toEqual(ids);
  });
});

describe('regression: legacy BUG with canonical DONE history', () => {
  it('derives first correction from DONE even without rawIssueType', () => {
    const raw = dataset();
    const source = raw.repositories[0]!.issues[0]!;
    delete source.rawIssueType;
    source.issueType = 'BUG';
    source.parents = [];
    source.labels = [];
    source.state = 'CLOSED';
    source.projectStatuses![0]!.status = '✅ Done';
    source.projectStatuses![0]!.statusHistory = [
      { previousStatus: 'In review', status: '✅ Done', transitionedAt: '2026-10-01T16:09:00Z' }
    ];
    const normalized = normalizeGithub(raw, rules);
    const anomaly = normalized.anomalies.find((entry) => entry.issueId === source.id);
    expect(anomaly?.componentId).toBeUndefined();
    expect(anomaly?.correctedAt).toBe('2026-10-01T16:09:00Z');
    expect(anomaly?.firstDoneAt).toBe('2026-10-01T16:09:00Z');
    expect(anomaly?.everCorrected).toBe(true);
  });
});

describe('anomaly project status regressions', () => {
  it('classifies a CLOSED issue with Cancelled project status as cancelled, not done', () => {
    const raw = dataset();
    const issue = raw.repositories[0]!.issues[0]!;
    issue.state = 'CLOSED';
    issue.parents = [];
    issue.projectStatuses![0]!.status = '🛑 Cancelled';
    issue.projectStatuses![0]!.statusHistory = [
      { previousStatus: 'Backlog', status: '🛑 Cancelled', transitionedAt: '2026-10-02T10:00:00Z' }
    ];
    const anomaly = normalizeGithub(raw, rules).anomalies[0]!;
    expect(anomaly.status).toBe('cancelled');
    expect(anomaly.cancelled).toBe(true);
    expect(anomaly.correctedAt).toBeUndefined();
    expect(anomaly.firstDoneAt).toBeUndefined();
  });

  it('retains the earliest DONE transition after reopening and correction again', () => {
    const raw = dataset();
    const issue = raw.repositories[0]!.issues[0]!;
    issue.state = 'CLOSED';
    issue.parents = [];
    issue.projectStatuses![0]!.status = '✅ Done';
    issue.projectStatuses![0]!.statusHistory = [
      { previousStatus: 'In progress', status: '✅ Done', transitionedAt: '2026-10-02T09:00:00Z' },
      { previousStatus: 'Done', status: 'Backlog', transitionedAt: '2026-10-03T09:00:00Z' },
      { previousStatus: 'Backlog', status: '✅ Done', transitionedAt: '2026-10-04T09:00:00Z' }
    ];
    const anomaly = normalizeGithub(raw, rules).anomalies[0]!;
    expect(anomaly.status).toBe('done');
    expect(anomaly.correctedAt).toBeUndefined();
    expect(anomaly.firstDoneAt).toBeUndefined();
  });
});
