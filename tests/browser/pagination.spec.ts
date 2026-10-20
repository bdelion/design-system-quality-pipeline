import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { paginationSnapshot } from '../support/pagination-snapshot.js';

let output: string;
let server: Server;
let root: string;
test.beforeAll(async () => {
  output = await mkdtemp(join(tmpdir(), 'dsq-browser-pagination-'));
  await generateDashboard(paginationSnapshot(), output, 'https://github.enterprise.test');
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

test('issue #88 : les 3 000 causes sont paginées séparément des occurrences', async ({ page }) => {
  await page.goto(`${root}/quality.html`);
  const groups = page.locator('[data-quality-cause-row]');
  const nav = page.locator('[data-pagination="quality-causes"]');
  await expect(groups).toHaveCount(50);
  await expect(nav).toContainText('1–50 sur 3000');
  await nav.getByRole('button', { name: 'Suivant' }).focus();
  await page.keyboard.press('Enter');
  await expect(nav).toContainText('51–100 sur 3000');
  await expect(nav.getByRole('button', { name: 'Suivant' })).toBeFocused();
  await expect(groups.first()).toContainText('Diagnostic synthétique 51');
  await groups.first().locator('[data-quality-cause]').click();
  await expect(page.locator('[data-quality-count]')).toHaveText('1');
  await expect(page.locator('[data-quality-row]')).toHaveCount(1);
  await expect(nav).toContainText('51–100 sur 3000');
  await page.locator('[data-quality-filter="dqRule"]').selectOption('CIBLE');
  await expect(nav).toContainText('1–50 sur 120');
});

test('issue #87 : Activité, sélection inter-pages, tri global, liens ciblés et CSV intégral', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${root}/issues.html`);
  const nav = page.locator('[data-pagination="issues"]');
  const rows = page.locator('[data-issue-rows] tr');
  await expect(rows).toHaveCount(50);
  await expect(nav).toContainText('1–50 sur 120');
  await rows.first().locator('input').check();
  await expect(rows.first().locator('input')).toBeFocused();
  await nav.getByRole('button', { name: 'Suivant' }).focus();
  await page.keyboard.press('Enter');
  await expect(nav).toContainText('51–100 sur 120');
  await expect(nav.getByRole('button', { name: 'Suivant' })).toBeFocused();
  await rows.first().locator('input').check();
  await expect(page.locator('[data-issue-summary]')).toContainText('2 issues sélectionnées');
  await page.locator('[data-issue-select-all]').check();
  await expect(page.locator('[data-issue-summary]')).toContainText('120 issues sélectionnées');
  await nav.getByRole('button', { name: 'Suivant' }).click();
  await expect(rows).toHaveCount(20);
  await expect(nav).toContainText('101–120 sur 120');
  await expect(nav.getByRole('button', { name: 'Précédent' })).toBeFocused();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-issue-export]').click();
  const download = await downloadEvent;
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv.trim().split('\r\n')).toHaveLength(121);
  expect(csv).toContain('"120"');
  await page.locator('[data-issue-column-sort="1"]').click();
  await page.locator('[data-issue-column-sort="1"]').click();
  await expect(nav).toContainText('1–50 sur 120');
  await expect(rows.first().locator('td').nth(2)).toContainText('#120');
  await page.locator('[data-issue-search]').fill('Issue synthétique 119');
  await expect(rows).toHaveCount(1);
  await expect(nav).toContainText('1–1 sur 1');
  await page.goto(`${root}/issues.html?issue=pagination-issue-119`);
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('a')).toHaveAttribute(
    'href',
    'https://github.enterprise.test/acme/ds-react/issues/119'
  );
});

test('issue #87 : DQ, 3 000 diagnostics, 120 filtrés, tri global et export des 120 sur la dernière page', async ({
  page
}) => {
  await page.goto(`${root}/quality.html`);
  const nav = page.locator('[data-pagination="quality"]');
  const rows = page.locator('[data-quality-row]');
  await expect(rows).toHaveCount(50);
  await expect(page.locator('[data-quality-count]')).toHaveText('3000');
  await expect(nav).toContainText('1–50 sur 3000');
  await page.locator('[data-quality-sort="5"]').click();
  await page.locator('[data-quality-sort="5"]').click();
  await expect(rows.first()).toContainText('Diagnostic synthétique 3000');
  await page.locator('[data-quality-filter="dqRule"]').selectOption('CIBLE');
  await expect(page.locator('[data-quality-count]')).toHaveText('120');
  await expect(rows.first()).toContainText('Diagnostic synthétique 120');
  await nav.getByRole('button', { name: 'Suivant' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  await expect(rows).toHaveCount(20);
  await expect(nav).toContainText('101–120 sur 120');
  await expect(nav.getByRole('button', { name: 'Précédent' })).toBeFocused();
  const downloadEvent = page.waitForEvent('download');
  await page.locator('[data-quality-export]').click();
  const csv = await readFile((await (await downloadEvent).path())!, 'utf8');
  expect(csv.trim().split('\r\n')).toHaveLength(121);
  expect(csv).toContain('Diagnostic synthétique 120');
  expect(csv).toContain('Preuve synthétique intégrale');
  expect(csv).toContain('https://github.enterprise.test/acme/ds-react/issues/120');
  await page.locator('[data-quality-filter="dqSearch"]').fill('aucun résultat possible');
  await expect(rows).toHaveCount(0);
  await expect(nav).toContainText('0–0 sur 0');
  await page.locator('[data-quality-reset]').click();
  await expect(nav).toContainText('1–50 sur 3000');
  await page.goto(`${root}/quality.html?dqSearch=Diagnostic+synthétique+3000`);
  await expect(rows).toHaveCount(1);
  await expect(rows.first().locator('a[target="_blank"]')).toHaveAttribute(
    'href',
    'https://github.enterprise.test/acme/ds-react/issues/120'
  );
  await expect(rows.first().locator('a').last()).toHaveAttribute(
    'href',
    /graph.html\?issue=pagination-issue-120#traceability/
  );
});

test('issue #87 : un contrat DQ absent désactive pagination et export sans faux zéro', async ({ page }) => {
  await page.route('**/quality.html', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /<script type="application\/json" id="dashboard-page-data">([\s\S]*?)<\/script>/,
      (tag, json: string) => {
        const model = JSON.parse(json);
        delete model.data.quality;
        return tag.replace(json, JSON.stringify(model));
      }
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto(`${root}/quality.html`);
  await expect(page.locator('[data-page-data-error]')).toBeVisible();
  await expect(page.locator('[data-quality-count]')).toHaveText('Indisponible');
  await expect(page.locator('[data-quality-export]')).toBeDisabled();
  await expect(page.locator('[data-pagination="quality"] [data-page-next]')).toBeDisabled();
});

test('issue #87 : le focus reste sur la même occurrence d’une issue multi-labels', async ({ page }) => {
  await page.route('**/issues.html', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /<script type="application\/json" id="dashboard-page-data">([\s\S]*?)<\/script>/,
      (tag, json: string) => {
        const model = JSON.parse(json);
        model.data.issues.items[0].labels = ['Lot A', 'Lot B'];
        return tag.replace(json, JSON.stringify(model));
      }
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto(`${root}/issues.html`);
  const checks = page.locator('[data-issue-check]');
  const key = await checks.first().getAttribute('data-issue-check');
  await expect(checks.nth(1)).toHaveAttribute('data-issue-check', key!);
  await checks.nth(1).focus();
  await page.keyboard.press('Space');
  await expect(checks.nth(1)).toBeFocused();
  await expect(checks.first()).toBeChecked();
  await expect(checks.nth(1)).toBeChecked();
  await expect(page.locator('[data-issue-summary]')).toContainText('1 issues sélectionnées');
});
