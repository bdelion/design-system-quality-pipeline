import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { normalizeGithub } from '../../src/normalizers/github.js';
import { applyComponentVersionVerdicts } from '../../src/analytics/component-versions.js';
import { calculateKpis } from '../../src/analytics/kpis.js';
import { evaluateDataQuality } from '../../src/quality/rules.js';
import { buildSnapshot } from '../../src/snapshots/snapshot.js';
import { validateHistoricalComponents } from '../../src/historical-components.js';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { dashboardPages, type DashboardPageModel } from '../../src/dashboard/page-read-model.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { consolidationRaw, rawIssue, rules } from '../support/consolidation.js';

test('toutes les pages partagent les verdicts recalculés, DateBox déclaré et Live Zone regroupé', async ({
  page
}) => {
  const raw = consolidationRaw();
  const audit = rawIssue('audit-button', 10, 'audit');
  const outside = rawIssue('outside-button', 11, 'bug', 'Cancelled');
  outside.labels.push('rgaa:major');
  const live = rawIssue('audit-live', 12, 'audit');
  live.labels = ['Component:Live Zone'];
  raw.repositories[0]!.issues = [audit, outside, live];
  const history = validateHistoricalComponents({
    schemaVersion: 1,
    repository: 'ds-react',
    versions: ['1.0.0', '2.0.0'].map((version) => ({ version, channel: 'release', sourceLabel: version })),
    components: [
      {
        name: 'DateBox',
        history: ['1.0.0', '2.0.0'].map((version) => ({
          version,
          channel: 'release',
          present: true,
          change: 'unspecified',
          identity: 'datebox',
          historicalName: 'DateBox',
          evidence: [],
          declaration: { reference: 'presence-confirmed' }
        }))
      },
      {
        name: 'Live Zone',
        history: ['1.0.0', '2.0.0'].map((version, index) => ({
          version,
          channel: 'release',
          present: true,
          change: index ? 'unchanged' : 'added',
          identity: 'live-zone',
          historicalName: 'Live Zone',
          evidence: [
            { cell: index ? 'H3' : 'G3', symbol: 'A11yProvider', value: index ? '=' : '+' },
            { cell: index ? 'H5' : 'G5', symbol: 'A11yRegion', value: index ? '=' : '+' }
          ]
        }))
      }
    ]
  });
  const data = normalizeGithub(raw, { ...rules, issuePolicy: {} }, undefined, undefined, undefined, [
    history
  ]);
  applyComponentVersionVerdicts(data);
  const quality = evaluateDataQuality(raw, data, rules);
  const snapshot = buildSnapshot(
    raw,
    data,
    quality,
    calculateKpis(data, quality),
    '2.5',
    'audit-precedence',
    'test',
    raw.collectedAt
  );
  expect(data.components.filter((component) => component.name === 'Live Zone')).toHaveLength(1);
  expect(data.components.some((component) => ['A11yProvider', 'A11yRegion'].includes(component.name))).toBe(
    false
  );
  const directory = await mkdtemp(join(tmpdir(), 'dsq-audit-consistency-'));
  await generateDashboard(snapshot, directory, undefined, rules.labels.componentPrefix, rules);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    const base = `http://127.0.0.1:${address.port}`;
    for (const id of dashboardPages) {
      await page.goto(`${base}/classic/${id}.html`);
      const model = (await page
        .locator('#dashboard-page-data')
        .evaluate((node) => JSON.parse(node.textContent!))) as DashboardPageModel;
      expect(model.snapshot.id, id).toBe(snapshot.snapshotId);
      for (const scope of model.data.workspaces?.scopes.filter(
        (scope) => !scope.component && scope.version === '1.0.0'
      ) ?? []) {
        expect(scope.summary.conform, id).toBe(2);
        expect(scope.summary.nonCovered, id).toBe(2);
      }
      if (id === 'components') {
        const rows = model.data.components!;
        expect(rows.some((row) => row.name === 'DateBox')).toBe(true);
        expect(rows.filter((row) => row.name === 'Live Zone')).toHaveLength(1);
        expect(
          rows
            .find((row) => row.name === 'Button')!
            .versionSummaries.find((version) => version.version === '1.0.0')!.conformity
        ).toBe('CONFORME');
      }
    }
    await page.goto(`${base}/simplified/index.html`);
    for (const name of [
      'Synthèse',
      'Composants',
      'Activité',
      'Repositories et équipe',
      'Audits par version'
    ]) {
      await page.getByRole('link', { name, exact: true }).click();
      await expect(page.locator('#content')).not.toBeEmpty();
    }
    const row = page
      .locator('[data-table-id="campaigns"] tbody tr')
      .filter({ has: page.getByText('1.0.0', { exact: true }) });
    await expect(row.locator('td').nth(2).getByRole('button')).toHaveText('4');
    await expect(row.locator('td').nth(8).getByRole('button')).toHaveText('2');
    await expect(row.locator('td').nth(14).getByRole('button')).toHaveText('2');
    expect(errors).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(directory, { recursive: true, force: true });
  }
});
