import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { qualityCausesSnapshot } from '../support/quality-causes-snapshot.js';

let output: string;
let server: Server;
let root: string;
test.use({ viewport: { width: 1440, height: 1000 } });
test.beforeAll(async () => {
  output = await mkdtemp(join(tmpdir(), 'dsq-causes-88-'));
  await generateDashboard(qualityCausesSnapshot(), output, 'https://github.enterprise.test');
  server = await startDashboardServer(join(output, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  root = `http://127.0.0.1:${address.port}`;
});
test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
  await rm(output, { recursive: true, force: true });
});

test('issue #88 : six causes réconciliées, 120 occurrences ouvertes au clavier et export complet', async ({
  page
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${root}/quality.html`);
  const summary = page.locator('[data-quality-group-summary]');
  const groups = page.locator('[data-quality-cause-row]');
  await expect(summary).toHaveText('6 groupes · 125 occurrences filtrées');
  expect(
    (await page.locator('[data-cause-count]').allTextContents()).reduce(
      (sum, value) => sum + Number(value),
      0
    )
  ).toBe(125);
  const main = groups.filter({ has: page.locator('[data-cause-count]', { hasText: /^120$/ }) });
  await expect(main).toContainText('Criticité absente');
  await expect(main).toContainText('Vérifier le label ou la donnée de criticité');
  const message = main.locator('summary');
  await message.focus();
  await page.keyboard.press('Enter');
  await expect(main.locator('details p')).toBeVisible();
  await expect(main.locator('details p')).toHaveText('Anomaly has no criticality.');
  await main.locator('[data-quality-cause]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-quality-occurrences-heading]')).toBeFocused();
  await expect(page).toHaveURL(/dqCause=/);
  await expect(page.locator('[data-quality-count]')).toHaveText('120');
  await expect(main.locator('details p')).toBeVisible();
  await expect(page.locator('[data-quality-row]')).toHaveCount(50);
  await expect(page.locator('[data-quality-group-summary]')).toHaveText(
    '6 groupes · 125 occurrences filtrées'
  );
  const nav = page.locator('[data-pagination="quality"]');
  await nav.getByRole('button', { name: 'Suivant' }).click();
  await nav.getByRole('button', { name: 'Suivant' }).click();
  await expect(page.locator('[data-quality-row]')).toHaveCount(20);
  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-quality-export]').click();
  const csv = await readFile((await (await downloadEvent).path())!, 'utf8');
  expect(csv.trim().split('\r\n')).toHaveLength(121);
  expect(csv).toContain('https://github.enterprise.test/acme/ds-react/issues/120');
  expect(csv).toContain('missing-criticality-119');
  await page.reload();
  await expect(page.locator('[data-quality-count]')).toHaveText('120');
  await page.locator('[data-quality-all-causes]').click();
  await expect(summary).toBeFocused();
  await expect(page.locator('[data-quality-count]')).toHaveText('125');
  await page.locator('[data-quality-filter="dqRule"]').selectOption('DQ-029');
  await expect(summary).toHaveText('2 groupes · 2 occurrences filtrées');
  await expect(groups).toHaveCount(2);
  await page.locator('[data-quality-filter="dqSearch"]').fill('Audit contains');
  await expect(summary).toHaveText('1 groupe · 1 occurrence filtrée');
  await page.locator('[data-quality-reset]').click();
  await expect(summary).toHaveText('6 groupes · 125 occurrences filtrées');
  expect(errors).toEqual([]);
});

test('issue #88 : inconnues explicites et cause URL introuvable sans substitution globale', async ({
  page
}) => {
  await page.goto(`${root}/quality.html`);
  const unknown = page.locator('[data-quality-cause-row]').filter({ hasText: 'PERSONNALISEE' });
  await expect(unknown).toContainText('Action inconnue');
  await expect(unknown).toContainText('Source non résolue');
  await expect(unknown).toContainText('vérification indisponible');
  await expect(unknown).not.toContainText('Vérifier le label');
  await unknown.locator('[data-quality-cause]').click();
  await expect(page.locator('[data-quality-row]')).toHaveCount(1);
  await expect(page.locator('[data-quality-row]')).toContainText('sans-source');
  await expect(page.locator('[data-quality-row] a')).toHaveCount(0);
  await page.goto(`${root}/quality.html?dqCause=inconnue`);
  await expect(page.locator('[data-quality-cause-selection]')).toContainText('Cause introuvable');
  await expect(page.locator('[data-quality-count]')).toHaveText('Indisponible');
  await expect(page.locator('[data-quality-export]')).toBeDisabled();
  await expect(page.locator('[data-quality-row]')).toHaveCount(0);
});
