import { test, expect } from '@playwright/test';
import type { Server } from 'node:http';
import { startDashboardTestServer } from '../../scripts/serve-dashboard-tests.js';
import { readFile } from 'node:fs/promises';

let server: Server;
test.beforeAll(async () => {
  server = await startDashboardTestServer();
});
test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((done) => server.close(() => done()));
});

test('issue #84 : un périmètre unique, URL et reset cohérents, aide au clavier', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/components.html');
  const initialTop = await page
    .locator('[data-component-rows]')
    .evaluate((node) => node.closest('table')!.getBoundingClientRect().top + window.scrollY);
  // Cible explicitement validée après présentation du rendu préparé à l’utilisateur.
  expect(initialTop).toBeLessThan(900);
  await page.screenshot({ path: info.outputPath('components-1440.png') });
  for (const dimension of ['repository', 'component', 'version'])
    await expect(page.locator(`[data-context-filter="${dimension}"]`)).toHaveCount(1);
  await expect(
    page.locator(
      '[data-component-filter="repository"], [data-component-filter="name"], [data-component-filter="version"]'
    )
  ).toHaveCount(0);
  await page.locator('[data-context-filter="repository"]').selectOption('acme/ds-react');
  await page.locator('[data-context-filter="component"]').selectOption('Button');
  await page.locator('[data-context-filter="version"]').selectOption('1.0.0');
  await expect(page).toHaveURL(/component=Button/);
  await expect(page.locator('[data-component-summary]')).toContainText('Button');
  await expect(page.locator('[data-component-summary]')).toContainText('1.0.0');
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(1);
  const summary = await page.locator('[data-component-summary]').textContent();
  await page.reload();
  await expect(page.locator('[data-component-summary]')).toHaveText(summary!);
  await page.getByRole('checkbox', { name: 'Sélectionner Button', exact: true }).check();
  await page.locator('[data-component-search]').fill('introuvable');
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(0);
  await page.locator('[data-component-reset]').click();
  await expect(page).toHaveURL(/components\.html$/);
  await expect(page.locator('[data-component-search]')).toHaveValue('');
  for (const dimension of ['repository', 'component', 'version'])
    await expect(page.locator(`[data-context-filter="${dimension}"]`)).toHaveValue('');
  await expect(page.locator('[data-component-rows] tr')).not.toHaveCount(0);
  await expect(page.locator('[data-component-all]')).not.toBeChecked();
  await expect(
    page.getByRole('button', { name: 'Trier par Repository', exact: true }).locator('..')
  ).toHaveAttribute('aria-sort', 'ascending');
  const top = await page
    .locator('[data-component-rows]')
    .evaluate((node) => node.closest('table')!.getBoundingClientRect().top + window.scrollY);
  await info.attach('position-tableau-PC.json', {
    body: JSON.stringify({ viewport: '1440x1000', tableTop: top }),
    contentType: 'application/json'
  });
  expect(top).toBeLessThan(900);
  const help = page.locator('[data-component-help] summary');
  await help.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-component-help]')).toHaveAttribute('open', '');
  await expect(page.locator('[data-component-help]')).toContainText('Recherches approchées');
  expect(errors).toEqual([]);
});

test('issue #84 : filtres, tri, aide et CSV restent utilisables à agrandissement 200 % sur PC', async ({
  page
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/components.html?repository=acme%2Fds-react&component=Button&version=1.0.0');
  // Agrandissement CSS sur le viewport PC : aucune émulation de téléphone ou interaction tactile.
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(1);
  await page.locator('[data-context-filter="component"]').focus();
  await expect(page.locator('[data-context-filter="component"]')).toBeFocused();
  await page.locator('[data-component-search]').fill('Button');
  const sort = page.getByRole('button', { name: 'Trier par Composant', exact: true });
  await sort.focus();
  await page.keyboard.press('Enter');
  await expect(sort.locator('..')).toHaveAttribute('aria-sort', 'ascending');
  await page.locator('[data-component-column="1"]').fill('Button');
  const region = page.locator('[data-component-analysis] .table-wrap');
  await region.focus();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => region.evaluate((node) => node.scrollLeft)).toBeGreaterThan(0);
  for (const selector of [
    '[data-component-search]',
    '[data-component-export]',
    '[data-context-filter="component"]'
  ]) {
    const control = page.locator(selector);
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(1441);
  }
  const download = page.waitForEvent('download');
  await page.locator('[data-component-export]').click();
  const exported = await download;
  expect(exported.suggestedFilename()).toBe('analyse-composants.csv');
  const csv = await readFile((await exported.path())!, 'utf8');
  expect(csv).toContain('"acme/ds-react";"Button"');
  expect(csv).not.toContain(';"Modal"');
  const help = page.locator('[data-component-help] summary');
  await help.focus();
  await page.keyboard.press('Space');
  await expect(page.locator('[data-component-help]')).toHaveAttribute('open', '');
});

test('issue #84 : références inconnues et navigation historique conservent le périmètre explicite', async ({
  page
}) => {
  await page.goto('/components.html?component=Inconnu&version=introuvable');
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(0);
  await expect(page.locator('[data-context-filter="component"]')).toHaveValue('Inconnu');
  await expect(page.locator('[data-component-summary]')).toContainText('introuvable');
  await page.goto('/components.html?component=Button&version=1.0.0');
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(1);
  await page.goBack();
  await expect(page.locator('[data-context-filter="component"]')).toHaveValue('Inconnu');
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(0);
  await page.goForward();
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(1);
  await page.locator('[data-component-search]').fill('introuvable');
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-component-search]')).toHaveValue('introuvable');
  await expect(page.locator('[data-component-summary]')).toContainText('0 composants visibles');
  await page.locator('[data-component-reset]').click();
  await expect(page.locator('[data-component-search]')).toHaveValue('');
  await expect(page.locator('[data-component-rows] tr')).not.toHaveCount(0);
});

test('issue #86 : une recherche actuelle divergente ne modifie pas le stock du snapshot', async ({
  page,
  context
}) => {
  await context.route('https://github.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>3 issues ouvertes actuellement</p>' })
  );
  await page.goto('/index.html');
  const inventory = page.getByRole('region', { name: 'Patrimoine et activité par repository' });
  const count = inventory.locator('tbody tr').first().locator('td').nth(5);
  const frozen = await count.textContent();
  await expect(count).toContainText('GitHub actuel ≈');
  const popupPromise = page.waitForEvent('popup');
  await count.locator('a').click();
  const popup = await popupPromise;
  await expect(popup.locator('body')).toHaveText('3 issues ouvertes actuellement');
  await expect(count).toHaveText(frozen!);
  await popup.close();
  await page.goto('/components.html');
  await expect(page.locator('[data-component-rows] tr').first().locator('td').nth(3)).toContainText(
    'GitHub actuel ≈'
  );
  await expect(page.locator('.table-panel .badge').first()).toContainText('Snapshot du');
});
