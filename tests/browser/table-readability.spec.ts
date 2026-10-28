import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { consolidationSnapshot } from '../support/consolidation.js';
import { repositoryActivity } from '../../src/analytics/repository-activity.js';

let directory: string;
let server: Server;
let root: string;
test.beforeAll(async () => {
  const snapshot = consolidationSnapshot();
  // Valeurs fictives de présentation : grands nombres, zéro mesuré et donnée indisponible.
  snapshot.analytics.repositoryActivity = repositoryActivity(
    snapshot.normalizedData,
    snapshot.dataQuality.issues
  );
  const activity = snapshot.analytics.repositoryActivity[0]!;
  activity.anomalies = 1234567890123;
  activity.issues = 'unknown';
  activity.openIssues = 0;
  activity.delays.global.average = 1234567.8;
  activity.delays.global.median = 0;
  activity.delays.global.p90 = null;
  const original = JSON.stringify(snapshot);
  directory = await mkdtemp(join(tmpdir(), 'dsq-tables-90-'));
  await generateDashboard(snapshot, directory);
  expect(JSON.stringify(snapshot)).toBe(original);
  server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port local indisponible');
  root = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
  await rm(directory, { recursive: true, force: true });
});

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 1440, height: 1000 }
]) {
  for (const zoom of [1, 2]) {
    test(`issue #90 : tableaux PC ${viewport.width} × ${viewport.height}, agrandissement ${zoom * 100} %`, async ({
      page
    }, info) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.setViewportSize(viewport);
      await page.goto(`${root}/index.html`);
      // Agrandissement du rendu sur écran PC, sans émulation mobile ni interaction tactile.
      await page.evaluate((factor) => {
        document.documentElement.style.zoom = String(factor);
      }, zoom);
      const inventory = page.getByRole('region', {
        name: 'Patrimoine et activité par repository',
        exact: true
      });
      const heading = inventory.locator('th').first();
      const typography = await heading.evaluate((node) => {
        const style = getComputedStyle(node);
        return { size: style.fontSize, family: style.fontFamily, transform: style.textTransform };
      });
      expect(typography.size).toBe('14px');
      expect(typography.family).not.toContain('monospace');
      expect(typography.transform).toBe('none');
      expect(await heading.evaluate((node) => getComputedStyle(node).overflowWrap)).toBe('normal');
      const cells = inventory.locator('tbody tr').first().locator('td');
      await expect(cells.nth(2)).toContainText('1234567890123');
      await expect(cells.nth(4)).toContainText('Indisponible');
      await expect(cells.nth(5)).toContainText('0');
      expect(await cells.nth(2).evaluate((node) => getComputedStyle(node).textAlign)).toBe('right');
      expect(await cells.nth(2).evaluate((node) => getComputedStyle(node).fontVariantNumeric)).toContain(
        'tabular-nums'
      );
      expect(await cells.nth(2).evaluate((node) => getComputedStyle(node).whiteSpace)).toBe('nowrap');
      expect(await cells.nth(2).evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      const delays = page.getByRole('region', { name: 'Temps de traitement par repository', exact: true });
      await expect(delays.locator('tbody tr').first()).toContainText('1234567.8 j');
      await expect(delays.locator('tbody tr').first()).toContainText('0.0 j');
      await expect(delays.locator('tbody tr').first()).toContainText('inconnu');
      await delays.scrollIntoViewIfNeeded();
      await page.screenshot({ path: info.outputPath('overview.png') });

      await page.goto(`${root}/components.html`);
      await page.evaluate((factor) => {
        document.documentElement.style.zoom = String(factor);
      }, zoom);
      const rows = page.locator('[data-component-rows] tr');
      await expect(rows.first()).toBeVisible();
      expect(
        await rows
          .first()
          .locator('td')
          .nth(3)
          .evaluate((node) => getComputedStyle(node).textAlign)
      ).toBe('right');
      const sort = page.getByRole('button', {
        name: 'Trier par Résultat de l’audit · version cible',
        exact: true
      });
      await sort.focus();
      await page.keyboard.press('Enter');
      await expect(sort.locator('..')).toHaveAttribute('aria-sort', 'ascending');
      await expect(sort).toBeFocused();
      expect(await sort.evaluate((node) => getComputedStyle(node).fontSize)).toBe('14px');
      expect(await sort.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
      const region = page.locator('[data-component-analysis] .table-wrap');
      await region.focus();
      await expect(region).toBeFocused();
      expect(await region.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe('solid');
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
      await page.screenshot({ path: info.outputPath('components.png') });
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        accessibility.violations.map((violation) => ({
          id: violation.id,
          targets: violation.nodes.map((node) => node.target)
        }))
      ).toEqual([]);

      await page.goto(`${root}/quality.html`);
      await page.evaluate((factor) => {
        document.documentElement.style.zoom = String(factor);
      }, zoom);
      const technical = page.locator('[data-quality-row] td').first();
      expect(await technical.evaluate((node) => getComputedStyle(node).fontFamily)).toContain('monospace');
      expect(errors).toEqual([]);
    });
  }
}
