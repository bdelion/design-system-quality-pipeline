import type { GithubProcessingConfig } from '../../src/config.js';
import type { RawDataset, RawIssue, Snapshot } from '../../src/domain/types.js';
import { normalizeGithub } from '../../src/normalizers/github.js';
import { applyComponentVersionVerdicts } from '../../src/analytics/component-versions.js';
import { calculateKpis } from '../../src/analytics/kpis.js';
import { evaluateDataQuality } from '../../src/quality/rules.js';
import { buildSnapshot } from '../../src/snapshots/snapshot.js';

/** Configuration déterministe du scénario de consolidation, sans réseau. */
export const rules: GithubProcessingConfig = {
  labels: {
    componentPrefix: 'Component:',
    accessibilityCriticalityPrefix: 'rgaa:',
    accessibilityCategoryPrefix: 'a11y:',
    unknown: 'label:unknown',
    criticalityValues: { major: 'major' }
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
      BACKLOG: ['Backlog'],
      READY: ['Ready'],
      IN_PROGRESS: ['In progress'],
      IN_REVIEW: ['In review'],
      DONE: ['Done'],
      BLOCKED: ['Blocked'],
      CANCELLED: ['Cancelled']
    }
  },
  closingKeywords: ['fixes'],
  cancelledProjectStatuses: ['Cancelled']
};

/** Crée une issue avec preuves Project et GitHub distinctes et configurables. */
export function rawIssue(
  id: string,
  number: number,
  type: 'audit' | 'bug' | 'feature',
  status = 'Done',
  state: 'OPEN' | 'CLOSED' = 'CLOSED',
  parents: string[] = []
): RawIssue {
  return {
    id,
    number,
    title: id,
    state,
    rawIssueType: type,
    issueType: type.toUpperCase() as RawIssue['issueType'],
    url: `https://github.com/acme/ds-react/issues/${number}`,
    labels: ['Component:Button'],
    criticities: [],
    parents,
    createdAt: '2026-09-01T00:00:00Z',
    ...(state === 'CLOSED' ? { closedAt: '2026-09-06T00:00:00Z' } : {}),
    linkedPullRequestIds: [],
    projectStatuses: [
      {
        projectId: 'quality',
        projectName: 'Qualité',
        status,
        statusHistory: [{ status, transitionedAt: '2026-09-05T00:00:00Z' }]
      }
    ],
    ...(type === 'audit'
      ? { milestone: { id: 10, number: 10, title: '1.0.0' }, auditedReleaseCandidate: '1.0.0-rc.1' }
      : {})
  };
}

/** Produit les cas direct, hérité, annulé, en cours, multi-composants et parent orphelin. */
export function consolidationRaw(): RawDataset {
  const issues = [
    rawIssue('audit-a', 1, 'audit'),
    rawIssue('anomaly-a', 2, 'bug', 'Done', 'CLOSED', ['audit-a']),
    rawIssue('audit-cancelled', 3, 'audit', 'Cancelled'),
    rawIssue('audit-ongoing', 4, 'audit', 'In progress', 'OPEN'),
    rawIssue('feature-multi', 5, 'feature', 'Ready'),
    rawIssue('improvement-a', 6, 'feature', 'Done', 'CLOSED', ['audit-a']),
    rawIssue('bug-generic', 7, 'bug'),
    rawIssue('orphan', 8, 'bug', 'Backlog', 'OPEN', ['missing-parent'])
  ];
  issues[1]!.labels.push('rgaa:major', 'a11y:focus');
  issues[1]!.criticities = ['major'];
  issues[1]!.linkedPullRequestIds = ['pr-a'];
  issues[2]!.milestone = { id: 20, number: 20, title: '2.0.0' };
  issues[3]!.milestone = { id: 20, number: 20, title: '2.0.0' };
  issues[4]!.labels.push('Component:Modal');
  issues[6]!.projectStatuses[0]!.statusHistory = [];
  return {
    collectedAt: '2026-10-11T10:00:00Z',
    nexusAvailable: false,
    catalogueComponents: ['Button', 'Modal'],
    repositories: [
      {
        id: 'repo',
        owner: 'acme',
        name: 'ds-react',
        defaultBranch: 'main',
        issues,
        pullRequests: [
          {
            id: 'pr-a',
            number: 9,
            state: 'MERGED',
            mergedAt: '2026-09-04T00:00:00Z',
            relatedIssueIds: ['anomaly-a']
          }
        ],
        gitTags: [
          { name: '1.0.0', createdAt: '2026-09-03T00:00:00Z' },
          { name: '2.0.0', createdAt: '2026-09-10T00:00:00Z' },
          { name: '1.0.0-rc.1' }
        ],
        historicalCatalogues: [
          { tagName: '1.0.0', status: 'available', componentNames: ['Button', 'Modal'] },
          { tagName: '2.0.0', status: 'available', componentNames: ['Button', 'Modal'] }
        ]
      }
    ]
  };
}

/** Assemble un snapshot complet du scénario et ses diagnostics réels. */
export function consolidationSnapshot(): Snapshot {
  const raw = consolidationRaw(),
    data = normalizeGithub(raw, rules);
  applyComponentVersionVerdicts(data);
  const quality = evaluateDataQuality(raw, data, rules);
  return buildSnapshot(
    raw,
    data,
    quality,
    calculateKpis(data, quality),
    '2.2',
    'consolidation-2026.10',
    'consolidation',
    raw.collectedAt
  );
}
