import { expect, it } from 'vitest';
import { applyReviewLinks } from '../src/dashboard/review-links.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { consolidationRaw, consolidationSnapshot, rules, rawIssue } from './support/consolidation.js';

it('#126/#127 : liens de périmètre avec préfixe, Closed, Project Done et milestones sources', () => {
  const snapshot = consolidationSnapshot();
  const model = simplifiedModel(snapshot);
  applyReviewLinks(snapshot, model.tables, rules, {
    url: 'https://github.com/orgs/acme/projects/1/views/1',
    keywords: { DONE: ['✅ Done', 'Done'] }
  });
  const components = model.tables.find((table) => table.id === 'repositories')!.rows[0]!.cells[1]!;
  expect(new URL(components.url!).pathname).toBe('/acme/ds-react/labels');
  expect(new URL(components.url!).searchParams.get('q')).toBe('Component:');
  const delays = model.tables.find((table) => table.id === 'delays')!.rows;
  expect(
    new URL(delays.find((row) => row.reviewKey.endsWith(':github-closure'))!.cells[1]!.url!).searchParams.get(
      'q'
    )
  ).toBe('is:issue state:closed');
  expect(
    new URL(
      delays.find((row) => row.reviewKey.endsWith(':business-treatment'))!.cells[1]!.url!
    ).searchParams.get('filterQuery')
  ).toContain('status:"✅ Done","Done"');
  const campaign = model.campaigns.find((row) => row.version === '1.0.0')!;
  const total = new URL(campaign.cells[3]!.url!).searchParams.get('q')!;
  expect(total).toContain('milestone:"1.0.0"');
  expect(total).toContain('-type:"epic"');
  expect(new URL(campaign.cells[6]!.url!).searchParams.get('filterQuery')).toContain('milestone:"1.0.0"');
  expect(campaign.cells[8]!.note ?? '').not.toContain('has:sub-issue');
});

it('#127 : ne spécialise pas une EPIC en audit, même si une stratégie la reconnaît', () => {
  const raw = consolidationRaw();
  const epic = rawIssue('epic-audit', 90, 'audit');
  epic.rawIssueType = 'epic';
  raw.repositories[0]!.issues.push(epic);
  const configured = structuredClone(rules);
  configured.auditDetection = { strategies: [{ issueTypes: ['epic'], requireComponent: true }] };
  expect(normalizeGithub(raw, configured).audits.some((audit) => audit.issueId === 'epic-audit')).toBe(false);
  epic.rawIssueType = 'Task';
  epic.labels.push('epic');
  configured.auditDetection.strategies = [{ issueTypes: ['Task'], requireComponent: true }];
  expect(normalizeGithub(raw, configured).audits.some((audit) => audit.issueId === 'epic-audit')).toBe(false);
});

it('#126 : ne reconstruit pas de lien depuis des URL anonymisées', () => {
  const snapshot = consolidationSnapshot();
  for (const issue of snapshot.normalizedData.issues!)
    issue.url = issue.url.replace('github.com', 'example.invalid');
  const model = simplifiedModel(snapshot);
  applyReviewLinks(snapshot, model.tables, rules);
  expect(model.tables.find((table) => table.id === 'repositories')!.rows[0]!.cells[1]!.url).toBeUndefined();
});
