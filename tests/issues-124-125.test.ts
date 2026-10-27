import { expect, it } from 'vitest';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { applyIssueReviews } from '../src/domain/issue-review.js';
import { consolidationRaw, consolidationSnapshot, rules } from './support/consolidation.js';

it('#124 : compte les changements de jour à Paris, même avant 24 heures et au changement d’heure', () => {
  const snapshot = consolidationSnapshot();
  const issue = snapshot.normalizedData.issues!.find((item) => item.issueId === 'audit-ongoing')!;
  for (const other of snapshot.normalizedData.issues!) if (other !== issue) other.state = 'CLOSED';
  for (const [created, capture] of [
    ['2026-10-26T22:55:00Z', '2026-10-27T00:05:00Z'],
    ['2026-03-28T22:55:00Z', '2026-03-29T21:05:00Z']
  ]) {
    issue.createdAt = created!;
    snapshot.capturedAt = capture!;
    const row = simplifiedModel(snapshot)
      .tables.find((table) => table.id === 'component-activity')!
      .rows.find((item) => item.reviewKey === issue.componentIds[0])!;
    expect(row.cells[9]!.value).toBe(`#${issue.number} · 1 j`);
    expect(row.cells[9]!.sortValue).toBe(1);
  }
});

it('#125 : distingue tâche, grooming, amélioration indépendante et bug', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const audit = data.issues!.find((issue) => issue.issueId === 'audit-ongoing')!;
  const feature = data.issues!.find((issue) => issue.issueId === 'feature-multi')!;
  feature.labels.push('Grooming');
  applyIssueReviews(data, consolidationRaw(), rules);
  const table = simplifiedModel(snapshot).tables.find((item) => item.id === 'activity')!;
  expect(table.headers[5]).toBe('Traitement');
  expect(table.rows.find((row) => row.reviewKey === audit.issueId)!.cells[5]!.value).toBe('Restant à faire');
  expect(table.rows.find((row) => row.reviewKey === feature.issueId)!.cells[5]!.value).toBe('À groomer');
  expect(table.rows.find((row) => row.reviewKey === feature.issueId)!.cells[1]!.value).toBe('Improvement');
  expect(table.rows.find((row) => row.reviewKey === 'improvement-a')!.cells[1]!.value).toBe(
    'Improvement d’audit'
  );
  feature.labels = feature.labels.filter((label) => label !== 'Grooming');
  feature.projectContexts = [];
  applyIssueReviews(data, consolidationRaw(), rules);
  expect(feature.review!.correctionLabel).toBe('Traitement indéterminé');
});
