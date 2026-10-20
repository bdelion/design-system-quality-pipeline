import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';

test('choix des vues, contexte, tri et pagination des preuves sans réseau externe', async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-dual-browser-'));
  await generateDashboard(benchmarkSnapshot('control', 81), directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const base = `http://127.0.0.1:${address.port}`;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(base);
    await page.getByRole('link', { name: 'Ouvrir la vue synthétique' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Que faut-il faire maintenant ?');
    const reference = JSON.parse(
      await readFile('config/benchmark-simplified-baseline.json', 'utf8')
    ).pages.find((item: { page: string }) => item.page === 'simplified/index.html');
    for (const name of ['Composants', 'Activité', 'Repositories et équipe', 'Audits par version']) {
      await page.getByRole('link', { name, exact: true }).click();
      const counts = await page.evaluate(() => {
        const walker = document.createTreeWalker(document, NodeFilter.SHOW_ALL);
        let nodes = 1;
        while (walker.nextNode()) nodes++;
        return { nodes, rows: document.querySelectorAll('tbody tr').length };
      });
      expect(counts.nodes).toBeLessThanOrEqual(reference.domNodes);
      expect(counts.rows).toBeLessThanOrEqual(reference.renderedTableRows);
    }
    await page.getByRole('link', { name: 'Activité', exact: true }).click();
    const panel = page.locator('#content section');
    await panel.getByLabel('Lignes par page').selectOption('10');
    await expect(panel.locator('tbody tr')).toHaveCount(10);
    await panel.getByRole('button', { name: 'Dernière', exact: true }).click();
    await expect(panel.locator('.pager')).toContainText('Page 3 / 3');
    await panel.getByLabel('Filtrer ce tableau').fill('aucun-cas');
    await expect(panel.locator('tbody')).toContainText('Aucun résultat');
    await panel.getByLabel('Filtrer ce tableau').fill('');
    await panel.getByLabel('Trier par', { exact: true }).selectOption('0');
    await panel.getByLabel('Ordre', { exact: true }).selectOption('-1');
    await expect(panel.locator('th').first()).toHaveAttribute('aria-sort', 'descending');
    await panel.locator('tbody button').first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByRole('link').first()).toHaveAttribute(
      'href',
      /^https:\/\/example\.invalid\//
    );
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: 'Repositories et équipe', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Délais de traitement', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Audits par version', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'Composants conformes' })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'Vue détaillée', exact: true }).click();
    await expect(page).toHaveURL(/classic\/index.html$/);
    await page.getByRole('link', { name: 'Changer de vue', exact: true }).click();
    await expect(page).toHaveURL(new RegExp('/index.html$'));
    await page.goto(base + '/issues.html?repository=benchmark%2Frepo-0#proof');
    await expect(page).toHaveURL(/classic\/issues.html\?repository=benchmark%2Frepo-0#proof$/);
    expect(errors).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    await rm(directory, { recursive: true, force: true });
  }
});
