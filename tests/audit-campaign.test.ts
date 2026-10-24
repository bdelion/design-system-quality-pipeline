import { expect, it } from 'vitest';
import { dsqConfig } from '../src/datasets.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { workspaceAnalytics } from '../src/analytics/workspaces.js';
import { auditCampaigns } from '../src/analytics/audit-campaigns.js';
import { anonymizeDataset } from '../src/anonymization/anonymizer.js';
import type { RawDataset, RawIssue } from '../src/domain/types.js';

it('issue #49 : stratégies explicites, bugs parentés et améliorations restent distincts', async () => {
  const config = await dsqConfig(['example/react']);
  /** Produit une preuve d’issue synthétique, sans données personnelles de la collecte. */
  function issue(number: number, rawIssueType: string, component: string): RawIssue {
    return {
      id: `example/react:issue:${number}`,
      number,
      title: 'Scénario synthétique',
      state: 'CLOSED',
      issueType: 'UNKNOWN',
      rawIssueType,
      labels: [config.github.labels.componentPrefix + ' ' + component],
      component,
      criticities: [],
      parents: [],
      createdAt: '2026-01-01T00:00:00Z',
      closedAt: '2026-01-03T00:00:00Z',
      linkedPullRequestIds: [],
      projectStatuses: [
        {
          projectId: 'project',
          projectName: 'Projet',
          status: 'Done',
          statusHistory: [{ status: 'Done', transitionedAt: '2026-01-02T00:00:00Z' }]
        }
      ],
      milestone: { id: 1, number: 1, title: '1.7.1-Audit' }
    };
  }
  const audit = issue(1, 'Task', 'Button');
  audit.labels.push('Audit RGAA');
  const clean = issue(2, 'Task', 'Input');
  clean.labels.push('Audit RGAA');
  const bug = issue(3, 'Bug', 'Button');
  bug.linkedPullRequestIds = ['correction-pr'];
  bug.parents = [audit.id];
  const improvement = issue(4, 'Enhancement', 'Input');
  improvement.parents = [clean.id];
  const historical = issue(5, 'Task', 'Old');
  delete historical.rawIssueType;
  historical.issueType = 'AUDIT';
  const raw: RawDataset = {
    collectedAt: '2026-01-04T00:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: [
      {
        id: 'repo',
        owner: 'example',
        name: 'react',
        defaultBranch: 'main',
        packageManifest: { status: 'available', version: '1.8.0' },
        gitTags: [{ name: '1.7.1' }, { name: '1.8.0' }],
        issues: [audit, clean, bug, improvement, historical],
        pullRequests: [
          {
            id: 'correction-pr',
            number: 1,
            state: 'MERGED',
            mergedAt: '2026-01-02T00:00:00Z',
            relatedIssueIds: []
          }
        ]
      }
    ]
  };
  const data = normalizeGithub(raw, config.github, undefined, '1.7.1');
  expect(data.audits).toHaveLength(2);
  expect(data.audits.find((item) => item.issueId === audit.id)?.status).toBe('non_conform');
  expect(data.audits.find((item) => item.issueId === clean.id)?.status).toBe('conform');
  expect(data.anomalies).toHaveLength(1);
  expect(data.anomalies[0]?.origin).toBe('AUDIT');
  expect(data.auditImprovements).toHaveLength(1);
  const summary = workspaceAnalytics(data).scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )!.summary;
  expect(summary.declared).toBe(1);
  expect(summary.treated).toBe(1);
  expect(summary.qualified).toBe(1);
  expect(summary.criticalities.unknown?.declared).toBe(1);
  expect(summary.byComponent.Button).toBe(1);
  const outside = issue(6, 'Bug', 'Button');
  const withOutside = normalizeGithub(
    {
      ...raw,
      repositories: [{ ...raw.repositories[0]!, issues: [...raw.repositories[0]!.issues, outside] }]
    },
    config.github,
    undefined,
    '1.7.1'
  );
  const campaign = auditCampaigns(withOutside)[0]!;
  expect(campaign).toMatchObject({
    components: 2,
    audits: 2,
    progress: { completed: 2, ongoing: 0, pending: 0, cancelled: 0 },
    results: { conform: 1, non_conform: 1 },
    anomalies: 1,
    openAnomalies: 0,
    improvements: 1
  });
  expect(campaign.publication).toBe('prod');
  withOutside.audits[0]!.dataQualityStatus = 'partial';
  expect(auditCampaigns(withOutside)[0]!.quality).toBe('partial');
  withOutside.audits[0]!.lifecycle = 'ongoing';
  const sourceAudit = withOutside.issues!.find((item) => item.issueId === withOutside.audits[0]!.issueId)!;
  sourceAudit.state = 'OPEN';
  // Done suffit à terminer l’audit, même lorsque l’issue GitHub reste ouverte (D-244).
  expect(auditCampaigns(withOutside)[0]!.results.non_conform).toBe(1);
  const legacyRules = structuredClone(config.github);
  delete legacyRules.issuePolicy;
  delete legacyRules.auditDetection!.allowLegacyIssueTypes;
  expect(normalizeGithub(raw, legacyRules, undefined, '1.7.1').audits).toHaveLength(3);
  // Un bug corrigé ne rétablit pas seul la conformité ; l’amélioration n’affecte pas le verdict.
});

it('conserve un parent situé dans un autre repository après anonymisation', () => {
  const raw: RawDataset = {
    collectedAt: '2026-01-01T00:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: ['first', 'second'].map((name, index) => ({
      id: name,
      owner: 'example',
      name,
      defaultBranch: 'main',
      issues: [
        {
          id: `example/${name}:issue:1`,
          number: 1,
          title: 'Scénario',
          state: 'OPEN',
          issueType: 'UNKNOWN',
          labels: [],
          criticities: [],
          parents: index === 0 ? ['example/second:issue:1'] : [],
          createdAt: '2026-01-01T00:00:00Z',
          linkedPullRequestIds: [],
          projectStatuses: []
        }
      ],
      pullRequests: []
    }))
  };
  const result = anonymizeDataset(raw, {
    seed: 'test',
    dateOffsetDays: 0,
    strictText: true,
    preserveComponentNames: true
  }).dataset;
  expect(result.repositories[0]!.issues[0]!.parents).toEqual([result.repositories[1]!.issues[0]!.id]);
  expect(raw.repositories[0]!.issues[0]!.parents).toEqual(['example/second:issue:1']);
});
