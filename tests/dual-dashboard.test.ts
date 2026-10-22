import { applyIssueReviews } from '../src/domain/issue-review.js';
import { consolidationRaw, rules } from './support/consolidation.js';
import { benchmarkSnapshot } from './support/dashboard-load.js';
import { digest, measureHtml } from '../scripts/benchmark-metrics.js';
import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { consolidationSnapshot } from './support/consolidation.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { simplifiedModel, safeSourceUrl } from '../src/analytics/simplified-dashboard.js';

describe('deux présentations du même snapshot', () => {
  it('génère le choix, les deux vues et leurs ressources sans modifier le snapshot', async () => {
    const snapshot = consolidationSnapshot();
    const before = JSON.stringify(snapshot);
    const output = await mkdtemp(join(tmpdir(), 'dsq-dual-'));
    try {
      await generateDashboard(snapshot, output);
      const home = await readFile(join(output, 'dashboard/index.html'), 'utf8');
      expect(home).toContain('classic/index.html');
      expect(home).toContain('simplified/index.html');
      expect(await readFile(join(output, 'dashboard/classic/index.html'), 'utf8')).toContain('../index.html');
      const simple = await readFile(join(output, 'dashboard/simplified/index.html'), 'utf8');
      expect(simple).toContain('Repositories et équipe');
      expect(simple).toContain('Audits par version');
      expect(simple).not.toContain('rawData');
      expect(await readFile(join(output, 'dashboard/simplified/app.js'), 'utf8')).toContain('aria-sort');
      expect(JSON.stringify(snapshot)).toBe(before);
    } finally {
      await rm(output, { recursive: true, force: true });
    }
  });

  it('conserve les URL sources et les inconnues sans transformer un audit en composant conforme', () => {
    const snapshot = consolidationSnapshot();
    const model = simplifiedModel(snapshot);
    expect(model.issues.some((issue) => issue.url.includes('/issues/'))).toBe(true);
    expect(model.campaigns.length).toBeGreaterThan(0);
    expect(model.repositories[0]?.issues).toBe(snapshot.normalizedData.issues?.length);
    delete snapshot.normalizedData.issues;
    delete snapshot.analytics.repositoryActivity;
    const missing = simplifiedModel(snapshot);
    expect(missing.repositories[0]?.issues).toBe('unknown');
  });
});

it('sépare les audits des composants et conserve les versions sans catalogue', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const first = data.audits[0]!;
  data.audits.push({ ...first, auditId: 'second-audit-same-component' });
  delete data.componentVersions;
  const model = simplifiedModel(snapshot);
  const campaign = model.campaigns.find((row) => row.version === first.version)!;
  expect(campaign.cells[8]?.value).toBeNull();
  expect(campaign.cells[6]?.value).toBeGreaterThanOrEqual(2);
});

it('exclut les dates inversées et les URL exécutables sans remplacer leur absence par zéro', () => {
  const snapshot = consolidationSnapshot();
  const issue = snapshot.normalizedData.issues!.find((row) => row.state === 'CLOSED')!;
  issue.closedAt = '1900-01-01T00:00:00Z';
  issue.url = 'javascript:alert(1)';
  const model = simplifiedModel(snapshot);
  expect(model.issues.find((row) => row.id === issue.issueId)?.url).toBe('');
  const closure = model.tables
    .find((table) => table.id === 'delays')!
    .rows.find((row) => row.cells[1]?.value === 'Fermeture des issues')!;
  expect(Number(closure.cells[5]?.value)).toBeGreaterThan(0);
  expect(safeSourceUrl('data:text/html,hello')).toBe('');
});

it('surveille séparément les nouvelles pages sans augmenter les références classiques', async () => {
  const baseline = JSON.parse(await readFile('config/benchmark-simplified-baseline.json', 'utf8')) as {
    fixtureHash: string;
    pages: { page: string; htmlBytes: number; jsonBytes: number; initialTableRows: number }[];
  };
  const snapshot = benchmarkSnapshot('control', 81);
  expect(digest(JSON.stringify(snapshot))).toBe(baseline.fixtureHash);
  const output = await mkdtemp(join(tmpdir(), 'dsq-simple-budget-'));
  try {
    await generateDashboard(snapshot, output);
    for (const reference of baseline.pages) {
      const actual = measureHtml(await readFile(join(output, 'dashboard', reference.page), 'utf8'));
      for (const key of ['htmlBytes', 'jsonBytes', 'initialTableRows'] as const)
        expect(actual[key], reference.page + ' ' + key).toBeLessThanOrEqual(reference[key]);
    }
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

it('signale une qualification métier absente des anciens snapshots au lieu d’afficher zéro', () => {
  const model = simplifiedModel(consolidationSnapshot());
  const rows = model.tables.find((table) => table.id === 'components')!.rows;
  expect(rows.some((row) => row.cells[2]?.value === null)).toBe(true);
});

it('compare les corrections et bugs de même nature sans y ajouter les corrections fonctionnelles', () => {
  const snapshot = consolidationSnapshot();
  const functional = snapshot.normalizedData.issues!.find((issue) => issue.issueId === 'bug-generic')!;
  functional.labels.push('bug:functional');
  functional.linkedPullRequestIds.push('pr-a');
  applyIssueReviews(snapshot.normalizedData, consolidationRaw(), rules);
  delete snapshot.analytics.businessReview;
  const model = simplifiedModel(snapshot);
  const row = model.tables
    .find((table) => table.id === 'components')!
    .rows.find((item) => item.cells[0]?.value === 'Button')!;
  expect(functional.review?.correctionConfirmed).toBe(true);
  expect(row.cells[3]?.value).toBe(1);
  expect(row.cells[3]?.refs).toEqual(['anomaly-a']);
});
