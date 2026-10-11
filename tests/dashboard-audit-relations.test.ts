import { describe, expect, it } from 'vitest';
import type { Anomaly, Audit, Issue, Snapshot } from '../src/domain/types.js';
import { anomaliesForAudit, auditVersionLabel } from '../src/dashboard/audit-relations.js';

/** Construit les faits minimaux nécessaires au contrat de rattachement. */
function audit(id: string): Audit {
  return {
    auditId: id,
    issueId: `issue-${id}`,
    libraryId: 'lib',
    componentId: 'component',
    versionId: 'version-2',
    version: 'ancienne-version',
    status: 'conform',
    sourceIssueId: `issue-${id}`,
    objectiveAuditResult: 'conform',
    provenance: { source: 'github', sourceId: id, collectedAt: '2026-10-01T00:00:00Z' },
    dataQualityStatus: 'reliable'
  };
}

/** Produit une anomalie minimale sans inférer son audit. */
function anomaly(id: string, parents: string[] = []): Anomaly {
  return {
    anomalyId: id,
    issueId: `anomaly-issue-${id}`,
    origin: 'UNDETERMINED',
    componentId: 'component',
    criticality: 'minor',
    categories: [],
    status: 'open',
    detectedAt: '2026-10-01T00:00:00Z',
    createdAt: '2026-10-01T00:00:00Z',
    firstDoneAt: undefined,
    everCorrected: false,
    pullRequestRefs: [],
    parentRefs: parents,
    provenance: { source: 'github', sourceId: id, collectedAt: '2026-10-01T00:00:00Z' },
    dataQualityStatus: 'reliable',
    cancelled: false,
    cancelledProjectStatuses: []
  };
}

describe('Relations explicites audit / anomalies', () => {
  it('ne rattache pas une anomalie sur la seule base du composant', () => {
    const result = anomaliesForAudit(audit('audit-a'), [anomaly('a')], []);
    expect(result.linked).toHaveLength(0);
    expect(result.unresolved).toHaveLength(1);
  });

  it('rattache par identifiant d’audit ou issue parente et évite le transfert à un autre audit', () => {
    const direct = { ...anomaly('a'), auditId: 'audit-a' };
    const parent = anomaly('b', ['issue-audit-a']);
    const list = [direct, parent];
    expect(anomaliesForAudit(audit('audit-a'), list, []).linked).toHaveLength(2);
    expect(anomaliesForAudit(audit('audit-b'), list, []).linked).toHaveLength(0);
  });

  it('utilise également la relation parent portée par l’issue normalisée', () => {
    const issue = {
      issueId: 'anomaly-issue-a',
      parentIssueId: 'issue-audit-a',
      componentIds: ['component']
    } as Issue;
    expect(anomaliesForAudit(audit('audit-a'), [anomaly('a')], [issue]).linked).toHaveLength(1);
  });

  it('affiche la version canonique plutôt que la valeur historique', () => {
    const snapshot = {
      normalizedData: { versions: [{ versionId: 'version-2', number: '2.4.0' }] }
    } as Snapshot;
    expect(auditVersionLabel(audit('audit-a'), snapshot)).toBe('2.4.0');
  });
});
