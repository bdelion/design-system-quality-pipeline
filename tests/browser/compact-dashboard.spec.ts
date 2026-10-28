import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('vue compacte : bandeau fixe, exports complets et preuves GitHub', async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-compact-'));
  await generateDashboard(benchmarkSnapshot('control', 81), directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`http://127.0.0.1:${address.port}/simplified/index.html`);
    expect(
      await page.locator('main').evaluate((element) => element.getBoundingClientRect().width)
    ).toBeGreaterThanOrEqual(1900);
    expect(
      await page.locator('.summary-cards').evaluate((element) => element.getBoundingClientRect().height)
    ).toBeLessThanOrEqual(64);
    await page.setViewportSize({ width: 1440, height: 720 });
    await page.goto(`http://127.0.0.1:${address.port}/simplified/index.html#activity`);
    const panel = page.locator('#content section');
    await expect(panel.locator('.github-shortcut')).toHaveCount(0);
    await panel.getByLabel('Lignes par page').selectOption('10');
    await expect(panel.locator('tbody tr')).toHaveCount(10);
    const allDownload = page.waitForEvent('download');
    await panel.getByRole('button', { name: 'Exporter en CSV', exact: true }).click();
    const download = await allDownload;
    const path = await download.path();
    const csv = await readFile(path!, 'utf8');
    expect(csv.trim().split('\r\n')).toHaveLength(25);
    expect(csv).toContain('URL GitHub');
    await panel.getByLabel('Filtrer ce tableau').fill('aucun-resultat');
    const emptyDownload = page.waitForEvent('download');
    await panel.getByRole('button', { name: 'Exporter en CSV', exact: true }).click();
    expect((await readFile((await (await emptyDownload).path())!, 'utf8')).trim().split('\r\n')).toHaveLength(
      1
    );
    await panel.getByLabel('Filtrer ce tableau').fill('');
    expect(
      await panel
        .locator('tbody tr')
        .first()
        .evaluate((row) => row.getBoundingClientRect().height)
    ).toBeLessThanOrEqual(42);
    await page.evaluate(() => window.scrollTo(0, 500));
    expect(
      await page.locator('.sticky-shell').evaluate((element) => element.getBoundingClientRect().top)
    ).toBe(0);
    await expect(page.getByRole('navigation', { name: 'Espaces' })).toBeInViewport();
    await page.getByRole('link', { name: 'Repositories et équipe', exact: true }).click();
    const repository = page.locator('#content section').filter({
      has: page.getByRole('heading', { name: 'Patrimoine et activité par repository', exact: true })
    });
    await repository.locator('tbody tr').first().locator('td').nth(2).getByRole('button').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('link').first()).toHaveAttribute('href', /^https:\/\/example\.invalid\//);
    const proofDownload = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Exporter les issues en CSV', exact: true }).click();
    expect((await readFile((await (await proofDownload).path())!, 'utf8')).trim().split('\r\n')).toHaveLength(
      25
    );
    await page.keyboard.press('Escape');
    for (const name of [
      'Synthèse',
      'Composants',
      'Activité',
      'Repositories et équipe',
      'Audits par version'
    ]) {
      await page.getByRole('link', { name, exact: true }).click();
      const tables = page.locator('#content section');
      for (const section of await tables.all())
        if (await section.locator('table').count())
          await expect(section.getByRole('button', { name: 'Exporter en CSV', exact: true })).toBeVisible();
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    await rm(directory, { recursive: true, force: true });
  }
});
