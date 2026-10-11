import { describe, expect, it } from 'vitest';
import type { Audit } from '../src/domain/types.js';
import { isCompletedAudit, latestCompletedAudit } from '../src/dashboard/audit-selection.js';

/** Fabrique un audit minimal pour vérifier les règles de sélection. */
function audit(id: string, status: Audit['status'], completedAt?: string): Audit {
  return {
    auditId: id,
    issueId: `issue-${id}`,
    libraryId: 'library',
    componentId: 'component',
    version: id,
    status,
    sourceIssueId: `issue-${id}`,
    objectiveAuditResult: status,
    provenance: { source: 'github', sourceId: id, collectedAt: '2026-10-01T00:00:00Z' },
    dataQualityStatus: 'reliable',
    ...(completedAt ? { completedAt } : {})
  };
}

describe('Sélection cohérente des audits du dashboard', () => {
  it('retient le dernier audit terminé indépendamment de l’ordre des données', () => {
    const old = audit('1.6.0', 'non_conform', '2026-08-01T00:00:00Z');
    const recent = audit('1.7.1', 'conform', '2026-09-18T07:33:37Z');
    const pending = audit('1.8.0', 'in_progress');
    expect(latestCompletedAudit([recent, pending, old])?.auditId).toBe(recent.auditId);
    expect(latestCompletedAudit([old, recent, pending])?.auditId).toBe(recent.auditId);
    expect(isCompletedAudit(pending)).toBe(false);
  });

  it('préserve le dernier résultat terminé même si une version ultérieure est en cours', () => {
    const finished = audit('1.0', 'conform', '2026-09-01T00:00:00Z');
    const ongoing = audit('2.0', 'in_progress');
    expect(latestCompletedAudit([ongoing, finished])?.auditId).toBe('1.0');
  });

  it('ne transforme pas un audit en cours en audit terminé', () => {
    expect(latestCompletedAudit([audit('1.8.0', 'in_progress')])).toBeUndefined();
  });
});
