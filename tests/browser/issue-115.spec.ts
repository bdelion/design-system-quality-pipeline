import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { simplifiedModel } from '../../src/analytics/simplified-dashboard.js';
import { applyIssueReviews } from '../../src/domain/issue-review.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';
import { rules } from '../support/consolidation.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('issue #115 : en-têtes des actions et listes par composant, filtres et source unique', async ({
  page,
  context
}) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-115-'));
  const snapshot = benchmarkSnapshot('control', 81);
  const issues = snapshot.normalizedData.issues!;
  for (const issue of issues) issue.url = issue.url.replace('example.invalid', 'github.com');
  for (const index of [0, 4, 8]) {
    const issue = issues[index]!;
    const status = index === 8 ? 'IN_PROGRESS' : 'CANCELLED';
    issue.state = index === 8 ? 'OPEN' : 'CLOSED';
    issue.projectContexts[0]!.status = status;
    issue.projectContexts[0]!.statusHistory = [
      { status, rawStatus: status, transitionedAt: '2026-09-05T00:00:00Z' }
    ];
  }
  applyIssueReviews(snapshot.normalizedData, snapshot.rawData, rules);
  delete snapshot.analytics.businessReview;
  const component = snapshot.normalizedData.components[0]!;
  const solo = { ...snapshot.normalizedData.components[1]!, componentId: 'solo', name: 'Solo' };
  snapshot.normalizedData.components.push(solo);
  const unique = {
    ...structuredClone(issues[12]!),
    issueId: 'solo-issue',
    number: 99,
    title: 'Ticket unique Solo',
    componentIds: ['solo'],
    labels: ['Component:Solo'],
    url: 'https://github.com/benchmark/repo-0/issues/99'
  };
  issues.push(unique);
  const model = simplifiedModel(snapshot);
  const priority = model.tables
    .find((table) => table.id === 'priorities')!
    .rows.find((row) => row.cells[0]!.value === component.name)!;
  expect(priority, 'Le scénario doit contenir les trois actions demandées').toBeDefined();
  expect(priority.cells[1]!.refs!.length).toBeGreaterThan(1);
  await generateDashboard(snapshot, directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'Source GitHub simulée' }));
  try {
    await page.goto(`http://127.0.0.1:${address.port}/simplified/index.html#summary`);
    const dialog = page.getByRole('dialog');
    const actions = dialog.getByRole('group', { name: 'Actions de la fenêtre' });
    const row = page
      .locator('[data-table-id="priorities"] tbody tr')
      .filter({ has: page.getByRole('button', { name: component.name, exact: true }) });
    for (const [index, title] of ['Composant', 'Situation', 'Prochaine action'].entries()) {
      await row.locator('td').nth(index).getByRole('button').click();
      await expect(dialog.getByRole('heading')).toHaveText(title);
      const links = actions.getByRole('link', { name: /Ouvrir dans GitHub/ });
      await expect(links.first()).toBeVisible();
      const expected = priority.cells[index]!.refs!.map(
        (id) => model.issues.find((issue) => issue.id === id)!.url
      ).sort();
      expect(
        await dialog
          .locator('tbody a')
          .evaluateAll((items) => items.map((item) => (item as HTMLAnchorElement).href).sort())
      ).toEqual(expected);
      const queries = (
        await links.evaluateAll((items) => items.map((item) => (item as HTMLAnchorElement).href))
      ).map((url) => new URL(url).searchParams.get('q')!);
      expect(
        queries.every(
          (query) =>
            query.includes('repo:benchmark/repo-0') &&
            query.includes('label:"Component:' + component.name + '"')
        )
      ).toBe(true);
      expect(await actions.evaluate((element) => element.getBoundingClientRect().bottom)).toBeLessThanOrEqual(
        await dialog.locator('#detail-note').evaluate((element) => element.getBoundingClientRect().top)
      );
      await page.keyboard.press('Escape');
    }
    await page.getByRole('link', { name: 'Composants', exact: true }).click();
    const activity = page
      .locator('[data-table-id="component-activity"] tbody tr')
      .filter({ has: page.getByRole('button', { name: component.name, exact: true }) });
    const activityModel = model.tables
      .find((table) => table.id === 'component-activity')!
      .rows.find((item) => item.cells[1]!.value === component.name)!;
    for (const [index, state] of [
      [1, null],
      [2, null],
      [3, 'open'],
      [4, 'closed'],
      [5, 'closed']
    ] as const) {
      await activity.locator('td').nth(index).getByRole('button').click();
      const queries = (
        await actions
          .getByRole('link', { name: /Ouvrir dans GitHub/ })
          .evaluateAll((items) => items.map((item) => (item as HTMLAnchorElement).href))
      ).map((url) => new URL(url).searchParams.get('q')!);
      expect(queries.length).toBeGreaterThan(0);
      for (const query of queries) {
        if (state) expect(query).toContain('is:' + state);
        else expect(query).not.toMatch(/is:(open|closed)/);
        expect(query).toContain('label:"Component:' + component.name + '"');
      }
      const expected = activityModel.cells[index]!.refs!.map(
        (id) => model.issues.find((issue) => issue.id === id)!.url
      ).sort();
      expect(
        await dialog
          .locator('tbody a')
          .evaluateAll((items) => items.map((item) => (item as HTMLAnchorElement).href).sort())
      ).toEqual(expected);
      await page.keyboard.press('Escape');
    }
    const soloRow = page
      .locator('[data-table-id="component-activity"] tbody tr')
      .filter({ has: page.getByRole('button', { name: 'Solo', exact: true }) });
    await soloRow.locator('td').nth(1).getByRole('button').click();
    const single = actions.getByRole('link', { name: /Ouvrir dans GitHub/ });
    await expect(single).toHaveCount(1);
    await expect(single).toHaveAttribute('href', unique.url);
    const popupEvent = page.waitForEvent('popup');
    await single.click();
    const popup = await popupEvent;
    await expect(popup).toHaveURL(unique.url);
    await popup.close();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    await rm(directory, { recursive: true, force: true });
  }
});
