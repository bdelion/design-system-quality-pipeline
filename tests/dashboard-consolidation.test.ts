import { completeSnapshotComparison } from '../src/pipeline.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { buildSnapshot } from '../src/snapshots/snapshot.js';
import { describe, expect, it } from 'vitest';
import { issueBusinessState, issueClassification, isCompletedAudit } from '../src/domain/business.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import {
  latestComponentVersion,
  applyComponentVersionVerdicts
} from '../src/analytics/component-versions.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { issueTreatment, projectIssueFacts } from '../src/analytics/issues.js';
import { durationStatistics } from '../src/analytics/statistics.js';
import { diffSnapshots } from '../src/snapshots/diff.js';
import { anomaliesForAudit } from '../src/dashboard/audit-relations.js';
import { consolidationRaw, consolidationSnapshot, rules } from './support/consolidation.js';

/** Vérifie les critères métiers des dix chantiers à partir d'un scénario cohérent. */
describe('acceptation de la consolidation du dashboard', () => {
  it('classe exclusivement audits, anomalies, improvements et autres issues', () => {
    const data = consolidationSnapshot().normalizedData;
    const families = Object.fromEntries(
      data.issues!.map((issue) => [issue.issueId, issueClassification(issue, data)])
    );
    expect(families).toMatchObject({
      'audit-a': 'audit',
      'anomaly-a': 'audit_anomaly',
      'bug-generic': 'anomaly',
      'improvement-a': 'improvement',
      'feature-multi': 'other',
      orphan: 'anomaly'
    });
    const issue = data.issues!.find((issue) => issue.issueId === 'bug-generic')!;
    expect(issueClassification(issue, { audits: [], anomalies: [] })).toBe('other');
  });
  it('sépare Closed, Done ouvert, annulation et absence de statut Project', () => {
    const raw = consolidationRaw();
    const audit = raw.repositories[0]!.issues[0]!;
    audit.auditStatus = 'conform';
    audit.auditResult = 'conform';
    audit.projectStatuses[0]!.status = 'Ready';
    audit.projectStatuses[0]!.statusHistory = [];
    let data = normalizeGithub(raw, rules);
    expect(data.audits.find((item) => item.issueId === 'audit-a')).toMatchObject({
      lifecycle: 'pending',
      status: 'not_evaluated'
    });
    audit.projectStatuses[0]!.status = 'Done';
    audit.state = 'OPEN';
    data = normalizeGithub(raw, rules);
    expect(isCompletedAudit(data.audits[0]!, data.issues)).toBe(false);
    audit.state = 'CLOSED';
    audit.projectStatuses = [];
    data = normalizeGithub(raw, rules);
    expect(isCompletedAudit(data.audits[0]!, data.issues)).toBe(false);
    expect(data.audits[0]!.completedAt).toBeUndefined();
    const cancelled = data.audits.find((item) => item.issueId === 'audit-cancelled')!;
    expect(cancelled).toMatchObject({ status: 'cancelled', lifecycle: 'cancelled' });
    expect(cancelled.completedAt).toBeUndefined();
  });
  it('compte un audit Done et Closed sans inventer sa date ni sa couverture historique', () => {
    const raw = consolidationRaw();
    raw.repositories[0]!.issues[0]!.projectStatuses[0]!.statusHistory = [];
    const data = normalizeGithub(raw, rules);
    applyComponentVersionVerdicts(data);
    expect(data.audits[0]!.lifecycle).toBe('completed');
    expect(data.audits[0]!.completedAt).toBeUndefined();
    expect(calculateKpis(data, []).metrics['audit.completed']?.value).toBe(1);
    expect(data.componentVersions?.every((relation) => relation.verdict === 'NON_COUVERT')).toBe(true);
  });
  it('restitue la cohorte non conforme héritée sans qu’une correction ou annulation la revalide', () => {
    const snapshot = consolidationSnapshot(),
      data = snapshot.normalizedData;
    const audit = data.audits.find((audit) => audit.issueId === 'audit-a')!;
    expect(audit.objectiveAuditResult).toBe('non_conform');
    const component = data.components.find((component) => component.name === 'Button')!;
    const relations = data.componentVersions!.filter(
      (relation) => relation.componentId === component.componentId
    );
    expect(relations.map((relation) => relation.verdict)).toEqual(['NON_CONFORME', 'NON_CONFORME']);
    expect(relations[1]!.applicableAuditIds).toEqual([audit.auditId]);
    expect(
      snapshot.historicalStates?.find((state) => state.versionId === relations[0]!.versionId)?.atRelease
        .componentVersions[0]?.verdict
    ).toBe('NON_COUVERT');
    expect(snapshot.analytics.metrics['audit.cancelled']?.value).toBe(1);
    expect(snapshot.analytics.metrics['audit.completed']?.value).toBe(1);
  });
  it('utilise des faits Analytics identiques et des populations distinctes, réelles ou estimées', () => {
    const snapshot = consolidationSnapshot(),
      facts = projectIssueFacts(snapshot.normalizedData);
    const stats = durationStatistics([...facts, ...facts]);
    expect(
      latestComponentVersion(snapshot.normalizedData, snapshot.normalizedData.audits[0]!.componentId)?.verdict
    ).toBe('NON_CONFORME');
    expect(stats.global.count).toBe(stats.done.count + stats.estimated.count);
    expect(snapshot.analytics.metrics['issue.treatmentDelay.global.average']?.value).toBe(
      Number(stats.global.average!.toFixed(1))
    );
    const closedReady = facts.find((fact) => fact.id === 'feature-multi')!;
    expect(closedReady).toMatchObject({
      status: 'open',
      githubState: 'CLOSED',
      delay: null,
      source: 'unavailable'
    });
    expect(facts.find((fact) => fact.id === 'bug-generic')).toMatchObject({
      status: 'closed',
      source: 'estimated',
      familyLabel: 'Bug hors audit · qualification RGAA non prouvée'
    });
    expect(durationStatistics([]).global.average).toBeNull();
  });
  it('conserve les relations explicites et refuse une attribution ambiguë ou par composant', () => {
    const data = consolidationSnapshot().normalizedData,
      audit = data.audits[0]!;
    const linked = anomaliesForAudit(audit, data.anomalies, data.issues!);
    expect(linked.linked.map((item) => item.issueId)).toEqual(['anomaly-a']);
    const ambiguous = { ...linked.linked[0]!, parentRefs: ['audit-a', 'audit-cancelled'] };
    expect(anomaliesForAudit(audit, [ambiguous], data.issues!).linked).toEqual([]);
    const generic = projectIssueFacts(data).find((fact) => fact.id === 'bug-generic')!;
    expect(generic.auditIds).toEqual([]);
    expect(generic.versions).toEqual([]);
  });
  it('journalise une annulation et une réouverture avec les snapshots de preuve', () => {
    const before = consolidationSnapshot(),
      after = structuredClone(before);
    after.snapshotId = 'after';
    after.capturedAt = '2026-10-12T10:00:00Z';
    const issue = after.normalizedData.issues!.find((item) => item.issueId === 'audit-a')!;
    issue.projectContexts[0]!.statusHistory.push({
      status: 'CANCELLED',
      rawStatus: 'Cancelled',
      transitionedAt: '2026-10-12T09:00:00Z'
    });
    const diff = diffSnapshots(before, after);
    expect(diff.issuesTreated).toEqual([]);
    expect(diff.issuesCancelled).toEqual(['audit-a']);
    expect(diff.businessTransitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          entityType: 'audit',
          from: 'completed:non_conform',
          to: 'cancelled',
          businessAt: '2026-10-12T09:00:00Z',
          observedAt: after.capturedAt,
          fromSnapshotId: before.snapshotId,
          toSnapshotId: 'after'
        })
      ])
    );
    issue.projectContexts[0]!.statusHistory.at(-1)!.status = 'BACKLOG';
    expect(diffSnapshots(before, after).issuesReopened).toContain('audit-a');
    expect(issueBusinessState(issue)).toBe('open');
    expect(issueTreatment(issue).delay).toBeNull();
  });
  it('refuse les comparaisons incompatibles et les dates invalides', () => {
    const before = consolidationSnapshot(),
      after = structuredClone(before);
    after.capturedAt = '2026-10-12T10:00:00Z';
    after.ruleVersion = 'other';
    expect(() => diffSnapshots(before, after)).toThrow('incompatibles');
    after.ruleVersion = before.ruleVersion;
    after.capturedAt = 'invalid';
    expect(() => diffSnapshots(before, after)).toThrow();
  });
});

it('signale les statuts contradictoires, les estimations et les durées exclues', () => {
  const raw = consolidationRaw();
  const source = raw.repositories[0]!.issues[0]!;
  source.projectStatuses.push({
    projectId: 'other',
    projectName: 'Autre',
    status: 'Ready',
    statusHistory: []
  });
  const data = normalizeGithub(raw, rules);
  expect(isCompletedAudit(data.audits[0]!, data.issues)).toBe(false);
  const unknown = raw.repositories[0]!.issues[4]!;
  unknown.projectStatuses[0]!.status = 'Done';
  unknown.projectStatuses[0]!.statusHistory = [
    { status: 'Unmapped', transitionedAt: '2026-10-10T00:00:00Z' }
  ];
  const invalid = raw.repositories[0]!.issues[6]!;
  invalid.closedAt = '2026-08-01T00:00:00Z';
  const normalized = normalizeGithub(raw, rules);
  expect(
    normalized.issues?.find((issue) => issue.issueId === unknown.id)?.projectContexts[0]?.status
  ).toBeUndefined();
  expect(normalized.components.some((component) => component.name === 'unknown')).toBe(false);
  const quality = evaluateDataQuality(raw, normalized, rules);
  expect(quality).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ ruleId: 'DQ-030', entityId: source.id }),
      expect.objectContaining({ ruleId: 'DQ-031', entityId: invalid.id }),
      expect.objectContaining({ ruleId: 'DQ-032', entityId: invalid.id })
    ])
  );
  const metrics = calculateKpis(normalized, quality).metrics;
  expect(metrics['issue.treatmentDelay.global.average']?.exclusions).toContainEqual({
    entityId: invalid.id,
    ruleId: 'DQ-032'
  });
  expect(metrics['issue.treatmentDelay.global.average']?.sourceEntityIds).not.toContain(invalid.id);
  expect(metrics['issue.treatmentDelay.global.average']?.reliability.status).toBe('partial');
});

it('conserve la photographie de release après annulation ultérieure d’un audit', () => {
  const previous = consolidationSnapshot(),
    raw = consolidationRaw();
  raw.collectedAt = '2026-10-12T10:00:00Z';
  const issue = raw.repositories[0]!.issues[0]!;
  issue.projectStatuses![0]!.statusHistory!.push({
    status: 'Cancelled',
    transitionedAt: '2026-10-12T09:00:00Z'
  });
  const data = normalizeGithub(raw, rules);
  applyComponentVersionVerdicts(data);
  const quality = evaluateDataQuality(raw, data, rules);
  const current = buildSnapshot(
    raw,
    data,
    quality,
    calculateKpis(data, quality),
    previous.modelVersion,
    previous.ruleVersion,
    previous.scope,
    raw.collectedAt,
    previous
  );
  const before = previous.historicalStates!.find((state) => state.releasedAt === '2026-09-10T00:00:00Z')!;
  const after = current.historicalStates!.find((state) => state.versionId === before.versionId)!;
  expect(before.atRelease.componentVersions.some((relation) => relation.verdict === 'NON_CONFORME')).toBe(
    true
  );
  expect(after.atRelease).toEqual(before.atRelease);
  expect(
    after.currentKnowledge.componentVersions.every((relation) => relation.verdict === 'NON_COUVERT')
  ).toBe(true);
  expect(previous.normalizedData.audits[0]?.lifecycle).toBe('completed');
});

it('référence les véritables captures dans le journal finalisé de la pipeline', () => {
  const previous = consolidationSnapshot(),
    current = structuredClone(previous);
  current.snapshotId = 'capture-current';
  current.capturedAt = '2026-10-12T10:00:00Z';
  const source = current.normalizedData.issues!.find((issue) => issue.issueId === 'audit-a')!;
  source.projectContexts[0]!.statusHistory.push({
    rawStatus: 'Cancelled',
    status: 'CANCELLED',
    transitionedAt: '2026-10-12T09:00:00Z'
  });
  completeSnapshotComparison(previous, current);
  expect(current.analytics.transitions?.length).toBeGreaterThan(0);
  expect(
    current.analytics.transitions?.every(
      (transition) =>
        transition.toSnapshotId === current.snapshotId && transition.fromSnapshotId === previous.snapshotId
    )
  ).toBe(true);
  expect(previous.analytics.transitions).toBeUndefined();
});
