import { describe, expect, it } from 'vitest';
import type { Audit, Issue, Snapshot } from '../src/domain/types.js';
import {
  auditLifecycle,
  classifyIssue,
  latestAuditForComponentVersion
} from '../src/dashboard/audit-read-model.js';

const provenance = { source: 'github' as const, sourceId: 'source', collectedAt: '2026-10-01T00:00:00Z' };
const audit = (auditId: string, versionId: string, status: Audit['status'], completedAt?: string): Audit => ({
  auditId,
  issueId: auditId,
  libraryId: 'lib',
  componentId: 'button',
  versionId,
  version: versionId,
  status,
  objectiveAuditResult: status,
  sourceIssueId: auditId,
  provenance,
  dataQualityStatus: 'reliable',
  ...(completedAt ? { completedAt } : {})
});

describe('contrat métier transversal', () => {
  it('ne confond pas BUG et anomalie RGAA sans anomalie normalisée', () => {
    const issue = { issueId: 'bug', issueType: 'BUG' } as Issue;
    const snapshot = { normalizedData: { audits: [], anomalies: [] } } as unknown as Snapshot;
    expect(classifyIssue(issue, snapshot)).toBe('other');
    expect(
      classifyIssue(issue, {
        normalizedData: { audits: [], anomalies: [{ issueId: 'bug' }] }
      } as unknown as Snapshot)
    ).toBe('anomaly');
  });

  it('sépare progression et verdict définitif', () => {
    expect(auditLifecycle(audit('a', 'v1', 'in_progress'))).toEqual({ progress: 'ongoing', verdict: null });
    expect(auditLifecycle(audit('a', 'v1', 'not_evaluated'))).toEqual({ progress: 'pending', verdict: null });
    expect(auditLifecycle(audit('a', 'v1', 'non_conform'))).toEqual({
      progress: 'completed',
      verdict: 'non_conform'
    });
  });

  it('ne réutilise pas le verdict de v1 sur v2 et ignore une campagne v2 en cours', () => {
    const audits = [audit('old', 'v1', 'conform', '2026-09-01T00:00:00Z'), audit('new', 'v2', 'in_progress')];
    expect(latestAuditForComponentVersion(audits, { componentId: 'button', versionId: 'v1' })?.auditId).toBe(
      'old'
    );
    expect(
      latestAuditForComponentVersion(audits, { componentId: 'button', versionId: 'v2' })
    ).toBeUndefined();
  });
});

describe('couverture d’audit par version', () => {
  it('restitue explicitement le verdict Analytics hérité de v1 sur v2, même avec une campagne en cours', async () => {
    const { componentVersionAuditSummaries } = await import('../src/dashboard/audit-read-model.js');
    const snapshot = {
      normalizedData: {
        componentVersions: [
          { componentId: 'button', versionId: 'v1', verdict: 'CONFORME', applicableAuditIds: ['a1'] },
          { componentId: 'button', versionId: 'v2', verdict: 'CONFORME', applicableAuditIds: ['a1'] },
          { componentId: 'modal', versionId: 'v2', verdict: 'NON_COUVERT', applicableAuditIds: [] }
        ],
        audits: [audit('a1', 'v1', 'conform', '2026-09-01T00:00:00Z'), audit('a2', 'v2', 'in_progress')]
      }
    } as unknown as Snapshot;
    const result = componentVersionAuditSummaries(snapshot);
    expect(result[0]).toMatchObject({
      coverage: 'completed',
      verdict: 'conform',
      completedAuditId: 'a1',
      inherited: false
    });
    expect(result[1]).toMatchObject({
      coverage: 'completed',
      verdict: 'conform',
      ongoingAuditIds: ['a2'],
      inherited: true,
      applicableAuditIds: ['a1']
    });
    expect(result[2]).toMatchObject({ coverage: 'not_audited', verdict: null, inherited: false });
  });
});
