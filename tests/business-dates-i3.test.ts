import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import type { GithubProcessingConfig } from '../src/config.js';
import type { RawDataset, RawIssue, RawProjectStatusTransition } from '../src/domain/types.js';

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
      BACKLOG: ['Backlog'], READY: ['Ready'], IN_PROGRESS: ['In progress'], IN_REVIEW: ['In review'],
      DONE: ['Done', '✅ Done'], BLOCKED: ['Blocked'], CANCELLED: ['Cancelled']
    }
  },
  closingKeywords: ['fixes'],
  cancelledProjectStatuses: ['Cancelled']
};

function project(status: string, statusHistory: RawProjectStatusTransition[]) {
  return [{ projectId: 'project-1', projectName: 'Quality', status, statusHistory }];
}

function issue(
  id: string,
  number: number,
  rawIssueType: 'audit' | 'bug',
  state: 'OPEN' | 'CLOSED',
  transitions: RawProjectStatusTransition[],
  parents: string[] = []
): RawIssue {
  return {
    id, number, title: id, state, issueType: rawIssueType.toUpperCase() as RawIssue['issueType'], rawIssueType,
    labels: ['Component:Button'], criticities: [], parents, createdAt: '2026-09-01T08:00:00Z',
    ...(state === 'CLOSED' ? { closedAt: '2026-10-02T09:00:00Z' } : {}),
    linkedPullRequestIds: [], projectStatuses: project(state === 'CLOSED' ? 'Done' : 'In progress', transitions),
    ...(rawIssueType === 'audit' ? { milestone: { id: 421, number: 421, title: '4.2.1', state: 'closed' as const } } : {})
  };
}

function dataset(auditTransitions: RawProjectStatusTransition[], bugTransitions: RawProjectStatusTransition[]): RawDataset {
  return {
    collectedAt: '2026-10-07T20:00:00Z', catalogueComponents: [], nexusAvailable: false,
    repositories: [{
      id: 'repo-1', name: 'ds-react', owner: 'acme', defaultBranch: 'main', pullRequests: [],
      issues: [
        issue('audit-1', 1, 'audit', 'CLOSED', auditTransitions),
        issue('bug-1', 2, 'bug', 'CLOSED', bugTransitions, ['audit-1'])
      ]
    }]
  };
}

const doneOnce = [{ previousStatus: 'In review', status: 'Done', transitionedAt: '2026-10-01T10:00:00Z' }];

describe('I3 business dates', () => {
  it('derives anomaly detectedAt from Issue.createdAt and correctedAt from one canonical DONE transition', () => {
    const normalized = normalizeGithub(dataset(doneOnce, doneOnce), rules, undefined, '4.2.1');
    expect(normalized.anomalies[0]).toMatchObject({
      detectedAt: '2026-09-01T08:00:00Z',
      correctedAt: '2026-10-01T10:00:00Z',
      everCorrected: true
    });
  });

  it('derives Audit.completedAt only when the closed Audit is currently DONE and has one DONE transition', () => {
    const normalized = normalizeGithub(dataset(doneOnce, doneOnce), rules, undefined, '4.2.1');
    expect(normalized.audits[0]?.completedAt).toBe('2026-10-01T10:00:00Z');
  });

  it('does not invent a business date when DONE history is missing', () => {
    const normalized = normalizeGithub(dataset([], []), rules, undefined, '4.2.1');
    expect(normalized.audits[0]?.completedAt).toBeUndefined();
    expect(normalized.anomalies[0]?.correctedAt).toBeUndefined();
    expect(normalized.anomalies[0]?.everCorrected).toBe(false);
  });

  it('keeps the date indeterminate when several DONE transitions exist', () => {
    const repeatedDone = [
      { previousStatus: 'In progress', status: 'Done', transitionedAt: '2026-09-20T10:00:00Z' },
      { previousStatus: 'In review', status: 'Done', transitionedAt: '2026-10-01T10:00:00Z' }
    ];
    const normalized = normalizeGithub(dataset(repeatedDone, repeatedDone), rules, undefined, '4.2.1');
    expect(normalized.audits[0]?.completedAt).toBeUndefined();
    expect(normalized.anomalies[0]?.correctedAt).toBeUndefined();
  });

  it('reports DQ-011 when Done + Closed requires a business date but history is insufficient', () => {
    const raw = dataset([], []);
    const normalized = normalizeGithub(raw, rules, undefined, '4.2.1');
    const quality = evaluateDataQuality(raw, normalized, rules);

    expect(quality.some((item) => item.ruleId === 'DQ-012' && item.entityType === 'audit')).toBe(true);
    expect(quality.some((item) => item.ruleId === 'DQ-011' && item.entityType === 'anomaly')).toBe(true);
  });

  it('reports DQ-014 when an Audit Project is Done while the GitHub Issue remains open', () => {
    const raw = dataset(doneOnce, doneOnce);
    const audit = raw.repositories[0]!.issues[0]!;
    audit.state = 'OPEN';
    delete audit.closedAt;
    audit.projectStatuses[0]!.status = 'Done';

    const normalized = normalizeGithub(raw, rules, undefined, '4.2.1');
    const quality = evaluateDataQuality(raw, normalized, rules);

    expect(normalized.audits[0]?.completedAt).toBeUndefined();
    expect(quality.some((item) => item.ruleId === 'DQ-014' && item.entityType === 'audit')).toBe(true);
  });

  it('does not complete an Audit that is not currently DONE', () => {
    const raw = dataset(doneOnce, doneOnce);
    raw.repositories[0]!.issues[0]!.projectStatuses[0]!.status = 'In progress';
    const normalized = normalizeGithub(raw, rules, undefined, '4.2.1');
    expect(normalized.audits[0]?.completedAt).toBeUndefined();
  });
});
