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
  closingKeywords: ['fixes'],
  cancelledProjectStatuses: ['Cancelled']
};

function rawIssue(id: string, number: number, rawIssueType: string, labels: string[], parents: string[] = []): RawIssue {
  return {
    id, number, title: id, state: 'OPEN', issueType: rawIssueType.toUpperCase() as RawIssue['issueType'], rawIssueType,
    labels, criticities: [], parents, createdAt: '2026-10-01T10:00:00Z', linkedPullRequestIds: [], projectStatuses: []
  };
}

function dataset(): RawDataset {
  return {
    collectedAt: '2026-10-06T20:00:00Z', catalogueComponents: [], nexusAvailable: false,
    repositories: [{
      id: 'repo-1', name: 'ds-react', owner: 'acme', defaultBranch: 'main', pullRequests: [],
      issues: [
        Object.assign(
          rawIssue('audit-1', 1, 'audit', ['Component:Button']),
            {
              milestone: {
                id: 421,
                number: 421,
                title: '4.2.1',
                state: 'open' as const,
              },
            },
        ),
        rawIssue('bug-audit', 2, 'bug', ['Component:Button'], ['audit-1']),
        rawIssue('bug-free', 3, 'bug', ['Component:Button', 'Component:Input']),
        rawIssue('bug-invalid-parent', 4, 'bug', ['Component:Button'], ['missing-audit']),
        rawIssue('feature-valid', 5, 'feature', ['Component:Button'], ['audit-1']),
        rawIssue('feature-invalid', 6, 'feature', ['Component:Button'], ['missing-audit']),
        rawIssue('audit-invalid-components', 7, 'audit', ['Component:Button', 'Component:Input'])
      ]
    }]
  };
}

describe('I1 specialization normalization', () => {
  it('materializes only valid Audits and never duplicates an invalid Audit', () => {
    const normalized = normalizeGithub(dataset(), rules, undefined, '4.2.1');
    expect(normalized.audits).toHaveLength(1);
    expect(normalized.audits[0]).toMatchObject({ issueId: 'audit-1', sourceIssueId: 'audit-1', version: '4.2.1' });
    expect(normalized.audits[0]?.componentId).toBe(normalized.issues?.find((issue) => issue.issueId === 'audit-1')?.componentIds[0]);
  });

  it('classifies anomaly origin without inventing an Audit relation', () => {
    const normalized = normalizeGithub(dataset(), rules, undefined, '4.2.1');
    const byIssue = new Map(normalized.anomalies.map((anomaly) => [anomaly.issueId, anomaly]));

    expect(byIssue.get('bug-audit')).toMatchObject({ origin: 'AUDIT', auditId: normalized.audits[0]?.auditId });
    expect(byIssue.get('bug-free')?.origin).toBe('HORS_AUDIT');
    expect(byIssue.get('bug-free')?.auditId).toBeUndefined();
    expect(byIssue.get('bug-free')?.componentId).toBeUndefined();
    expect(byIssue.get('bug-invalid-parent')?.origin).toBe('UNDETERMINED');
    expect(byIssue.get('bug-invalid-parent')?.auditId).toBeUndefined();
  });

  it('creates AuditImprovement only for one unambiguous valid Audit parent', () => {
    const normalized = normalizeGithub(dataset(), rules, undefined, '4.2.1');
    expect(normalized.auditImprovements).toHaveLength(1);
    expect(normalized.auditImprovements?.[0]).toMatchObject({
      issueId: 'feature-valid', auditId: normalized.audits[0]?.auditId
    });
  });

  it('does not materialize an Audit when the target version is indeterminable', () => {
    const raw = dataset();
    const auditIssue = raw.repositories[0]?.issues.find((issue) => issue.id === 'audit-1');
    if (auditIssue) {
      delete auditIssue.milestone;
    }
    const normalized = normalizeGithub(raw, rules);
    expect(normalized.audits).toHaveLength(0);
    expect(
      normalized.anomalies.find((anomaly) => anomaly.issueId === 'bug-audit')?.origin,
    ).toBe('UNDETERMINED');
  });

  it('keeps business specialization identifiers deterministic when source order changes', () => {
    const raw = dataset();
    const reversed = structuredClone(raw);
    reversed.repositories[0]!.issues.reverse();
    const first = normalizeGithub(raw, rules, undefined, '4.2.1');
    const second = normalizeGithub(reversed, rules, undefined, '4.2.1');

    expect(second.audits.map((item) => item.auditId).sort()).toEqual(first.audits.map((item) => item.auditId).sort());
    expect(second.anomalies.map((item) => item.anomalyId).sort()).toEqual(first.anomalies.map((item) => item.anomalyId).sort());
    expect(second.auditImprovements?.map((item) => item.auditImprovementId).sort())
      .toEqual(first.auditImprovements?.map((item) => item.auditImprovementId).sort());
  });
  it('keeps ambiguous Audit relations unresolved without duplicating specializations', () => {
    const raw = dataset();
    raw.repositories[0]!.issues.push(
      Object.assign(rawIssue('audit-2', 8, 'audit', ['Component:Button']), {
        milestone: { id: 421, number: 421, title: '4.2.1', state: 'open' as const }
      }),
      rawIssue('bug-ambiguous', 9, 'bug', ['Component:Button'], ['audit-1', 'audit-2']),
      rawIssue('feature-ambiguous', 10, 'feature', ['Component:Button'], ['audit-1', 'audit-2'])
    );

    const normalized = normalizeGithub(raw, rules, undefined, '4.2.1');
    const anomaly = normalized.anomalies.find((item) => item.issueId === 'bug-ambiguous');

    expect(anomaly).toMatchObject({ origin: 'UNDETERMINED' });
    expect(anomaly?.auditId).toBeUndefined();
    expect(normalized.anomalies.filter((item) => item.issueId === 'bug-ambiguous')).toHaveLength(1);
    expect(normalized.auditImprovements?.some((item) => item.issueId === 'feature-ambiguous')).toBe(false);
  });

  it('only materializes references to existing normalized entities', () => {
    const normalized = normalizeGithub(dataset(), rules, undefined, '4.2.1');
    const issueIds = new Set(normalized.issues?.map((issue) => issue.issueId));
    const auditIds = new Set(normalized.audits.map((audit) => audit.auditId));
    const versionIds = new Set(normalized.versions?.map((version) => version.versionId));

    expect(normalized.audits.every((audit) => issueIds.has(audit.issueId))).toBe(true);
    expect(normalized.audits.every((audit) => !audit.versionId || versionIds.has(audit.versionId))).toBe(true);
    expect(normalized.anomalies.every((anomaly) => issueIds.has(anomaly.issueId))).toBe(true);
    expect(normalized.anomalies.every((anomaly) => !anomaly.auditId || auditIds.has(anomaly.auditId))).toBe(true);
    expect(normalized.auditImprovements?.every((item) => issueIds.has(item.issueId) && auditIds.has(item.auditId))).toBe(true);
  });

});
