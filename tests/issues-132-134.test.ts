import { expect, it } from 'vitest';
import {
  compareAuditVersions,
  validateAuditTracking,
  auditTrackingData
} from '../src/domain/audit-tracking.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { consolidationSnapshot } from './support/consolidation.js';
import { applyIssueReviews } from '../src/domain/issue-review.js';
import { rules } from './support/consolidation.js';
import { auditScopeSnapshot } from '../src/analytics/audit-scope.js';
import { latestAuditVersions } from '../src/domain/audit-tracking.js';

it('#132 : compare SemVer et refuse une configuration ambiguë', () => {
  expect(compareAuditVersions('1.10.0', '1.9.0')).toBe(1);
  expect(compareAuditVersions('1.8.0-rc.10', '1.8.0-rc.2')).toBe(1);
  expect(compareAuditVersions('1.8.0-rc.1', '1.8.0')).toBe(-1);
  expect(compareAuditVersions('1.8.0+build', '1.8.0')).toBe(0);
  for (const value of [
    null,
    [],
    { 'acme/ds-react': '1.8' },
    { 'acme/ds-react': '1.8.0-01' },
    { repo: '1.0.0' }
  ])
    expect(() => validateAuditTracking(value)).toThrow();
});

it('#132 : borne inclusive, dépôts absents exclus et activité conservée', () => {
  const snapshot = consolidationSnapshot();
  snapshot.normalizedData.auditTracking = { 'acme/ds-react': '2.0.0' };
  const before = structuredClone(snapshot);
  const model = simplifiedModel(snapshot);
  expect(model.campaigns.map((row) => row.version)).toEqual(['2.0.0']);
  expect(model.campaigns[0]!.cells[14]!.value).toBe(2);
  expect(model.tables.find((table) => table.id === 'audit-criticality')!.rows).toHaveLength(0);
  expect(model.tables.find((table) => table.id === 'activity')!.rows.length).toBeGreaterThan(0);
  expect(snapshot).toEqual(before);
  const detailed = auditScopeSnapshot(snapshot);
  expect(detailed.normalizedData.versions!.map((v) => v.number)).toEqual(['2.0.0']);
  expect(detailed.normalizedData.audits.some((audit) => audit.version === '1.0.0')).toBe(false);
  expect(detailed.analytics.auditCampaigns!.every((row) => row.version === '2.0.0')).toBe(true);
  expect(snapshot).toEqual(before);
  snapshot.normalizedData.auditTracking = {};
  expect(auditTrackingData(snapshot.normalizedData).audits).toHaveLength(0);
  expect(simplifiedModel(snapshot).campaigns).toHaveLength(0);
  delete snapshot.normalizedData.issues;
  delete snapshot.normalizedData.auditImprovements;
  expect(auditScopeSnapshot(snapshot).normalizedData.issues).toBeUndefined();
  expect(auditScopeSnapshot(snapshot).normalizedData.auditImprovements).toBeUndefined();
});

it('#133 : agrège les audits sans multiplier le catalogue latest et conserve les preuves', () => {
  const snapshot = consolidationSnapshot();
  snapshot.normalizedData.auditTracking = { 'acme/ds-react': '1.0.0' };
  const table = simplifiedModel(snapshot).tables.find((item) => item.id === 'campaigns')!;
  expect(table.latestRows).toHaveLength(1);
  const row = table.latestRows![0]!;
  expect(row.version).toBe('2.0.0');
  expect(row.cells[2]!.value).toBe(2);
  expect(row.cells[3]!.value).toBe(3);
  expect(new Set(row.cells[3]!.refs)).toEqual(new Set(['audit-a', 'audit-cancelled', 'audit-ongoing']));
  const distribution = simplifiedModel(snapshot).tables.find((item) => item.id === 'audit-criticality')!;
  expect(distribution.latestRows![0]!.version).toBe('2.0.0');
  expect(distribution.latestRows![0]!.cells[3]!.refs).toEqual(['anomaly-a']);
});

it('#133 : latest retient une publication prouvée ou le développement explicite et exclut les audits futurs du cumul', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  data.auditTracking = { 'acme/ds-react': '1.0.0' };
  const development = data.versions!.find((version) => version.number === '2.0.0')!;
  delete development.prodTag;
  development.channel = 'development';
  const future = { ...development, versionId: 'future', number: '3.0.0' };
  delete future.channel;
  data.versions!.push(future);
  const audit = data.audits[0]!;
  data.audits.push({
    ...audit,
    auditId: 'future-audit',
    issueId: 'future-audit',
    version: future.number,
    versionId: future.versionId
  });
  const latest = latestAuditVersions(data);
  expect(latest.get(development.libraryId)).toBe('2.0.0');
  const table = simplifiedModel(snapshot).tables.find((item) => item.id === 'campaigns')!;
  expect(table.rows.some((row) => row.version === '3.0.0')).toBe(true);
  expect(table.latestRows).toHaveLength(1);
  expect(table.latestRows![0]!.version).toBe('2.0.0');
  expect(table.latestRows![0]!.cells[3]!.value).toBe(3);
  expect(table.latestRows![0]!.cells[3]!.refs).not.toContain('future-audit');
  development.channel = 'release';
  expect(latestAuditVersions(data).get(development.libraryId)).toBe('1.0.0');
  for (const version of data.versions!) delete version.prodTag;
  expect(latestAuditVersions(data).size).toBe(0);
  expect(simplifiedModel(snapshot).tables.find((item) => item.id === 'campaigns')!.latestRows).toEqual([]);
});

it('#134 : distingue absence d’audit terminé et évolution explicite, sans inventer une évolution', () => {
  const snapshot = consolidationSnapshot();
  snapshot.normalizedData.auditTracking = { 'acme/ds-react': '1.0.0' };
  const version = snapshot.normalizedData.versions!.find((v) => v.number === '2.0.0')!;
  version.channel = 'development';
  const relations = snapshot.normalizedData.componentVersions!.filter(
    (r) => r.versionId === version.versionId
  );
  relations[0]!.change = 'modified';
  const table = simplifiedModel(snapshot).tables.find((item) => item.id === 'audit-plan')!;
  expect(
    table.rows.some(
      (row) => row.cells[2]!.value === 'Modal' && String(row.cells[3]!.value).includes('Aucun audit terminé')
    )
  ).toBe(true);
  expect(
    table.rows.some((row) =>
      String(row.cells[3]!.value).includes('Évolution dans la version en développement')
    )
  ).toBe(true);
});

it('#133 : cumule les anomalies de deux versions et conserve une partition exacte des statuts', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  data.auditTracking = { 'acme/ds-react': '1.0.0' };
  applyIssueReviews(data, snapshot.rawData, rules);
  const audit = data.audits.find((item) => item.issueId === 'audit-a')!;
  const version = data.versions!.find((item) => item.number === '2.0.0')!;
  const sourceAudit = data.issues!.find((item) => item.issueId === audit.issueId)!;
  data.issues!.push({ ...structuredClone(sourceAudit), issueId: 'audit-next' });
  data.audits.push({
    ...audit,
    auditId: 'audit-next',
    issueId: 'audit-next',
    version: version.number,
    versionId: version.versionId
  });
  const source = data.issues!.find((item) => item.issueId === 'anomaly-a')!;
  const next = { ...structuredClone(source), issueId: 'anomaly-next', parentIssueId: 'audit-next' };
  next.review!.correctionConfirmed = false;
  next.projectContexts[0]!.status = 'IN_PROGRESS';
  next.projectContexts[0]!.statusHistory = [];
  data.issues!.push(next);
  const anomaly = data.anomalies.find((item) => item.issueId === source.issueId)!;
  data.anomalies.push({
    ...anomaly,
    anomalyId: 'anomaly-next',
    issueId: next.issueId,
    auditId: 'audit-next'
  });
  for (const id of ['audit-criticality', 'audit-category', 'audit-component']) {
    const table = simplifiedModel(snapshot).tables.find((item) => item.id === id)!;
    expect(table.rows).toHaveLength(2);
    expect(table.latestRows).toHaveLength(1);
    expect(table.latestRows![0]!.cells.slice(3, 8).map((cell) => cell.value)).toEqual([2, 1, 1, 0, 0]);
    expect(table.latestRows![0]!.cells[8]!.value).toBe('1/2 — 50 %');
    expect(table.latestRows![0]!.cells[3]!.refs).toEqual(['anomaly-a', 'anomaly-next']);
  }
});

it('#134 : demande un réaudit après correction ou annulation, mais sépare inconnues et audit ultérieur', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  data.auditTracking = { 'acme/ds-react': '1.0.0' };
  applyIssueReviews(data, snapshot.rawData, rules);
  const audit = data.audits.find((a) => a.issueId === 'audit-a')!;
  const issue = data.issues!.find((i) => i.issueId === 'anomaly-a')!;
  audit.completedAt = '2026-09-01T00:00:00Z';
  /** Recherche le motif métier dans la liste calculée. */
  const reasons = () =>
    simplifiedModel(snapshot)
      .tables.find((t) => t.id === 'audit-plan')!
      .rows.map((r) => String(r.cells[3]!.value))
      .join(' ');
  expect(reasons()).toContain('réaudit requis');
  audit.completedAt = '2026-09-20T00:00:00Z';
  expect(reasons()).not.toContain('réaudit requis');
  audit.completedAt = '2026-09-01T00:00:00Z';
  issue.review!.correctionConfirmed = false;
  issue.projectContexts[0]!.status = 'CANCELLED';
  issue.projectContexts[0]!.statusHistory = [
    { status: 'CANCELLED', rawStatus: 'Cancelled', transitionedAt: '2026-09-10T00:00:00Z' }
  ];
  expect(reasons()).toContain('réaudit requis');
  issue.projectContexts = [];
  expect(reasons()).not.toContain('réaudit requis');
});
