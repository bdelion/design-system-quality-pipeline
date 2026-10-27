import { expect, it } from 'vitest';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { consolidationSnapshot } from './support/consolidation.js';
import { applyIssueReviews } from '../src/domain/issue-review.js';
import { rules } from './support/consolidation.js';
import { applyAuditDeclarations } from '../src/domain/audit-declarations.js';

it('#127 : le ratio utilise les audits terminés et distingue résultats directs et hérités', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const inherited = data.componentVersions!.find(
    (relation) =>
      data.versions!.some(
        (version) => version.versionId === relation.versionId && version.number === '2.0.0'
      ) && relation.applicableAuditIds?.length
  )!;
  inherited.verdict = 'CONFORME';
  const table = simplifiedModel(snapshot).tables.find((item) => item.id === 'campaigns')!;
  const row = table.rows.find((item) => item.version === '2.0.0')!;
  expect(row.cells[7]!.value).toBe(0);
  expect(table.headers[7]).toBe('Audits terminés / composants (%)');
  expect(row.cells[8]!.value).toBe(1);
  expect(row.cells[17]!.value).toBe(0);
});

it('#128 : réconcilie restant, réalisé, annulé et inconnu sans transformer les inconnus en zéro conforme', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  applyIssueReviews(data, snapshot.rawData, rules);
  const original = data.issues!.find((issue) => issue.issueId === 'anomaly-a')!;
  const anomaly = data.anomalies.find((item) => item.issueId === original.issueId)!;
  for (const [index, status] of ['IN_PROGRESS', 'CANCELLED', undefined].entries()) {
    const issue = structuredClone(original);
    issue.issueId = 'population-' + index;
    issue.review!.correctionConfirmed = false;
    if (!status) issue.projectContexts = [];
    else {
      issue.projectContexts[0]!.status = status as 'IN_PROGRESS' | 'CANCELLED';
      issue.projectContexts[0]!.statusHistory = [];
    }
    data.issues!.push(issue);
    data.anomalies.push({ ...anomaly, anomalyId: issue.issueId, issueId: issue.issueId });
  }
  const table = simplifiedModel(snapshot).tables.find((item) => item.id === 'audit-criticality')!;
  expect(table.rows[0]!.cells.slice(3).map((cell) => cell.value)).toEqual([4, 1, 1, 1, 1]);
});

it('#127/#128 : exclut une anomalie non enfant de l’audit et répartit uniquement les enfants explicites', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const source = data.anomalies.find((anomaly) => anomaly.issueId === 'anomaly-a')!;
  const unrelated = data.issues!.find((issue) => issue.issueId === 'bug-generic')!;
  data.anomalies.push({ ...source, anomalyId: 'wrong-link', issueId: unrelated.issueId });
  applyAuditDeclarations(data, snapshot.rawData, rules);
  const model = simplifiedModel(snapshot);
  const campaign = model.campaigns.find((row) => row.version === '1.0.0')!;
  expect(campaign.cells[12]!.refs).toEqual(['anomaly-a']);
  for (const id of ['audit-criticality', 'audit-category', 'audit-component']) {
    const table = model.tables.find((item) => item.id === id)!;
    expect(table.rows.length).toBeGreaterThan(0);
    expect(
      table.rows.every((row) => !row.cells.flatMap((cell) => cell.refs ?? []).includes('bug-generic'))
    ).toBe(true);
    expect(table.rows[0]!.cells[3]!.value).toBe(1);
  }
});
