import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import type { GithubProcessingConfig } from '../src/config.js';
import type { NormalizedData, RawDataset, RawIssue } from '../src/domain/types.js';

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

function issue(
  id: string,
  number: number,
  rawIssueType: string | undefined,
  labels: string[] = [],
  parents: string[] = []
): RawIssue {
  return {
    id,
    number,
    title: id,
    state: 'OPEN',
    issueType: 'UNKNOWN',
    ...(rawIssueType !== undefined ? { rawIssueType } : {}),
    labels,
    criticities: [],
    parents,
    createdAt: '2026-09-01T08:00:00Z',
    linkedPullRequestIds: [],
    projectStatuses: []
  };
}

function dataset(issues: RawIssue[]): RawDataset {
  return {
    collectedAt: '2026-10-07T20:00:00Z',
    catalogueComponents: ['Button', 'Modal'],
    nexusAvailable: true,
    repositories: [
      {
        id: 'repo-1',
        name: 'ds-react',
        owner: 'acme',
        defaultBranch: 'main',
        pullRequests: [],
        issues,
        gitTags: [{ name: '1.0.0', createdAt: '2026-10-01T00:00:00Z' }],
        historicalCatalogues: [{ tagName: '1.0.0', status: 'available', componentNames: ['Button', 'Modal'] }]
      }
    ]
  };
}

function quality(raw: RawDataset, customRules = rules) {
  const normalized = normalizeGithub(raw, customRules);
  return { normalized, quality: evaluateDataQuality(raw, normalized, customRules) };
}

describe('I5 Data Quality V2', () => {
  it('reports missing, unknown and ambiguous native Issue Types without inventing a canonical type', () => {
    const ambiguousRules: GithubProcessingConfig = {
      ...rules,
      issueTypes: {
        ...rules.issueTypes,
        keywords: { ...rules.issueTypes.keywords, BUG: ['bug', 'shared'], FEATURE: ['feature', 'shared'] }
      }
    };
    const raw = dataset([
      issue('known', 1, 'bug'),
      issue('missing', 2, undefined),
      issue('unknown', 3, 'custom type'),
      issue('ambiguous', 4, 'shared')
    ]);
    const result = quality(raw, ambiguousRules);

    expect(result.quality.some((item) => item.ruleId === 'DQ-017' && item.entityId === 'missing')).toBe(true);
    expect(result.quality.some((item) => item.ruleId === 'DQ-018' && item.entityId === 'unknown')).toBe(true);
    expect(result.quality.some((item) => item.ruleId === 'DQ-019' && item.entityId === 'ambiguous')).toBe(
      true
    );
    expect(result.normalized.issues?.find((item) => item.issueId === 'ambiguous')?.issueType).toBeUndefined();
  });

  it('reports unknown/ambiguous Project statuses and non numeric Velocity once per Issue', () => {
    const ambiguousRules: GithubProcessingConfig = {
      ...rules,
      projectStatuses: {
        keywords: { ...rules.projectStatuses.keywords, READY: ['Ready', 'shared'], DONE: ['Done', 'shared'] }
      }
    };
    const rawIssue = issue('project-data', 1, 'bug');
    rawIssue.projectStatuses = [
      { projectId: 'p1', projectName: 'P1', status: 'Unexpected', rawVelocity: 'large', statusHistory: [] },
      { projectId: 'p2', projectName: 'P2', status: 'shared', rawVelocity: 'large', statusHistory: [] }
    ];
    const result = quality(dataset([rawIssue]), ambiguousRules);

    expect(
      result.quality.filter((item) => item.ruleId === 'DQ-020' && item.entityId === 'project-data')
    ).toHaveLength(1);
    expect(
      result.quality.filter((item) => item.ruleId === 'DQ-021' && item.entityId === 'project-data')
    ).toHaveLength(1);
    expect(
      result.quality.filter((item) => item.ruleId === 'DQ-022' && item.entityId === 'project-data')
    ).toHaveLength(1);
  });

  it('reports invalid Audit specialization facts without materializing an invalid Audit', () => {
    const noComponent = issue('audit-no-component', 1, 'audit');
    noComponent.milestone = { id: 1, number: 1, title: '1.0.0', state: 'open' };
    const severalComponents = issue('audit-many-components', 2, 'audit', [
      'Component:Button',
      'Component:Modal'
    ]);
    severalComponents.milestone = { id: 2, number: 2, title: '1.0.0', state: 'open' };
    const noVersion = issue('audit-no-version', 3, 'audit', ['Component:Button']);
    const result = quality(dataset([noComponent, severalComponents, noVersion]));

    expect(
      result.quality.some((item) => item.ruleId === 'DQ-023' && item.entityId === 'audit-no-component')
    ).toBe(true);
    expect(
      result.quality.some((item) => item.ruleId === 'DQ-024' && item.entityId === 'audit-many-components')
    ).toBe(true);
    expect(
      result.quality.some((item) => item.ruleId === 'DQ-025' && item.entityId === 'audit-no-version')
    ).toBe(true);
    expect(
      result.normalized.audits.some((audit) =>
        ['audit-no-component', 'audit-many-components', 'audit-no-version'].includes(audit.issueId)
      )
    ).toBe(false);
  });

  it('reports undetermined Bug relation, Component mismatch and invalid Feature parent', () => {
    const audit = issue('audit-1', 1, 'audit', ['Component:Button']);
    audit.milestone = { id: 1, number: 1, title: '1.0.0', state: 'open' };
    const mismatch = issue('bug-mismatch', 2, 'bug', ['Component:Modal'], ['audit-1']);
    const undetermined = issue('bug-undetermined', 3, 'bug', ['Component:Button'], ['missing-audit']);
    const feature = issue('feature-invalid', 4, 'feature', ['Component:Button'], ['missing-audit']);
    const result = quality(dataset([audit, mismatch, undetermined, feature]));

    expect(result.quality.some((item) => item.ruleId === 'DQ-026' && item.entityType === 'anomaly')).toBe(
      true
    );
    expect(
      result.quality.some(
        (item) =>
          item.ruleId === 'DQ-027' &&
          item.entityId === result.normalized.anomalies.find((a) => a.issueId === 'bug-mismatch')?.anomalyId
      )
    ).toBe(true);
    expect(
      result.quality.some((item) => item.ruleId === 'DQ-028' && item.entityId === 'feature-invalid')
    ).toBe(true);
    expect(result.normalized.auditImprovements?.some((item) => item.issueId === 'feature-invalid')).toBe(
      false
    );
  });

  it('defensively reports a dangling normalized relation as DQ-029', () => {
    const raw = dataset([issue('bug-1', 1, 'bug')]);
    const normalized = normalizeGithub(raw, rules);
    const broken: NormalizedData = {
      ...normalized,
      anomalies: normalized.anomalies.map((anomaly) => ({ ...anomaly, auditId: 'missing-audit' }))
    };
    const result = evaluateDataQuality(raw, broken, rules);
    expect(result.some((item) => item.ruleId === 'DQ-029' && item.entityType === 'anomaly')).toBe(true);
  });
});
