import { test, expect } from '@playwright/test';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';
import { rules } from '../support/consolidation.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('issue #121 : filtres des quatre références et liste exacte des délais mesurables', async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-121-'));
  const snapshot = benchmarkSnapshot('control', 81);
  const component = snapshot.normalizedData.components[0]!;
  const prefix = '🧩 Composant: ';
  for (const issue of snapshot.normalizedData.issues!) {
    issue.url = issue.url!.replace('example.invalid', 'git.acme.internal');
    issue.labels = issue.componentIds.map(
      (id) => prefix + snapshot.normalizedData.components.find((item) => item.componentId === id)!.name
    );
  }
  const selected = snapshot.normalizedData.issues!.filter((issue) =>
    issue.componentIds.includes(component.componentId)
  );
  expect(selected.length).toBeGreaterThanOrEqual(4);
  for (const [index, issue] of selected.entries()) {
    const status = index === 0 ? 'IN_PROGRESS' : index < 3 ? 'DONE' : 'CANCELLED';
    issue.state = index === 0 ? 'OPEN' : 'CLOSED';
    issue.projectContexts[0]!.status = status;
    issue.projectContexts[0]!.statusHistory = [
      { status, rawStatus: status, transitionedAt: '2026-09-05T00:00:00Z' }
    ];
  }
  snapshot.normalizedData.issues!.push({
    ...structuredClone(selected[0]!),
    issueId: 'active-but-closed',
    number: 9001,
    state: 'CLOSED',
    url: 'https://git.acme.internal/benchmark/repo-0/issues/9001'
  });
  const variables = {
    GITHUB_URL: 'https://git.acme.internal',
    GITHUB_PROJECT_OWNER_TYPE: 'orgs',
    GITHUB_PROJECT_OWNER: 'acme',
    GITHUB_PROJECT_NUMBER: '12',
    GITHUB_PROJECT_VIEW_NUMBER: '3',
    GITHUB_PROJECT_REPOSITORY_OWNER: '',
    GITHUB_PROJECT_REPOSITORIES: ''
  };
  const saved = Object.fromEntries(Object.keys(variables).map((name) => [name, process.env[name]]));
  Object.assign(process.env, variables);
  const profile = structuredClone(rules);
  profile.labels.componentPrefix = prefix;
  profile.projectStatuses.keywords.DONE = ['✅ Fait'];
  profile.projectStatuses.keywords.CANCELLED = ['Abandonné'];
  let server: Awaited<ReturnType<typeof startDashboardServer>> | undefined;
  try {
    await generateDashboard(snapshot, directory, undefined, prefix, profile);
    server = await startDashboardServer(join(directory, 'dashboard'), 0);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Port indisponible');
    const url = `http://127.0.0.1:${address.port}/simplified/index.html#components`;
    await page.goto(url);
    const row = page.locator(
      '[data-table-id="component-activity"] tbody tr[data-review-key="' + component.componentId + '"]'
    );
    const dialog = page.getByRole('dialog');
    for (const index of [3, 4, 5]) {
      await row.locator('td').nth(index).getByRole('button').click();
      const link = dialog.locator('#detail-actions a');
      await expect(link).toHaveCount(1);
      const target = new URL((await link.getAttribute('href'))!);
      if (index === 3) {
        expect(target.pathname).toMatch(/\/issues$/);
        expect(target.searchParams.get('q')).toContain('state:open');
        await expect(dialog.locator('#detail-note')).toContainText('limitée aux issues ouvertes');
        await expect(dialog.locator('tbody tr')).toHaveCount(2);
      } else {
        const query = target.searchParams.get('filterQuery')!;
        expect(query).toContain('label:' + JSON.stringify(prefix + component.name));
        expect(query).toContain('status:' + JSON.stringify(index === 4 ? '✅ Fait' : 'Abandonné'));
        expect(query).not.toContain('state:closed');
      }
      await expect(link).toHaveAttribute('target', '_blank');
      await page.keyboard.press('Escape');
    }
    await expect(row.locator('td').nth(11)).toHaveText('2');
    for (const index of [6, 7, 8, 11]) {
      await row.locator('td').nth(index).getByRole('button').click();
      await expect(dialog.locator('#detail-actions a')).toHaveCount(0);
      await expect(dialog.locator('#detail-note')).toContainText('exactement les issues mesurables');
      await expect(dialog.locator('tbody tr')).toHaveCount(2);
      await expect(dialog.locator('tbody')).toContainText('#' + selected[1]!.number);
      await expect(dialog.locator('tbody')).toContainText('#' + selected[2]!.number);
      await expect(dialog.locator('tbody')).not.toContainText('#9001');
      if (index === 11) {
        const download = page.waitForEvent('download');
        await dialog.getByRole('button', { name: 'Exporter les issues en CSV' }).click();
        const csv = await readFile((await (await download).path())!, 'utf8');
        expect(csv).toContain(selected[1]!.url);
        expect(csv).toContain(selected[2]!.url);
        expect(csv).not.toContain('9001');
      }
      await page.keyboard.press('Escape');
    }
    selected[1]!.labels.push('Lot mesurable');
    selected[2]!.labels.push('Lot mesurable');
    await generateDashboard(snapshot, directory, undefined, prefix, profile);
    await page.reload();
    await row.locator('td').nth(11).getByRole('button').click();
    const exact = dialog.locator('#detail-actions a');
    await expect(exact).toHaveCount(1);
    expect(new URL((await exact.getAttribute('href'))!).searchParams.get('q')).toContain(
      'label:"Lot mesurable"'
    );
    await expect(dialog.locator('#detail-note')).not.toContainText('élargie au composant');
  } finally {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    await page.goto('about:blank');
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((done, reject) => server!.close((error) => (error ? reject(error) : done())));
    }
    await rm(directory, { recursive: true, force: true });
  }
});
