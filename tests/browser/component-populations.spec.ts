import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { componentPopulationsSnapshot } from '../support/component-populations.js';

test('issue #85 : patrimoine, actifs, présences et preuves restent distincts au clavier et après filtrage', async ({
  page
}) => {
  const snapshot = componentPopulationsSnapshot();
  const source = JSON.stringify(snapshot);
  const directory = await mkdtemp(join(tmpdir(), 'dsq-populations-'));
  await generateDashboard(snapshot, directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`http://127.0.0.1:${address.port}/audits.html`);
    const detail = page.locator('#component-populations');
    await detail.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(detail).toHaveAttribute('open', '');
    const summary = detail.locator('[data-component-populations-summary]');
    await expect(summary).toContainText('5 identités historiques · 4 actifs · 3 présences matérialisées');
    await expect(summary).toContainText('2 couples couverts · 2 conformes');
    const currentMystery = detail.locator('[data-identity="mystery"]:visible');
    await expect(currentMystery).toContainText('Présence indéterminée');
    await expect(currentMystery).toContainText('Verdict indéterminé');
    await expect(detail.locator('[data-identity="tag-old"]:visible')).toContainText(
      'Exclu du KPI actifs : removed'
    );
    await expect(detail.locator('[data-identity="tag-new"]:visible')).toContainText('catalogue-proof-2');
    await page.locator('[data-context-filter="version"]').selectOption('1.0.0');
    await expect(summary).toContainText(
      '2 présences matérialisées · 2 absences démontrées · 1 présence indéterminée'
    );
    await expect(detail.locator('[data-identity="modal"]:visible')).toContainText(
      'Absent (catalogue complet)'
    );
    await expect(detail.locator('[data-identity="tag-old"]:visible')).toContainText(
      'Présent (relation matérialisée)'
    );
    await page.locator('[data-context-filter="component"]').selectOption('Renamed');
    await expect(summary).toContainText('1 identité historique · 1 actif · 1 présence matérialisée');
    await expect(detail.locator('[data-identity="renamed"]:visible')).toContainText(
      'alias déclarés : OldName'
    );
    await page.locator('[data-context-filter="version"]').selectOption('2.0.0');
    await expect(summary).toContainText('1 identité historique · 1 actif · 1 présence matérialisée');
    await page.reload();
    await detail.locator('summary').click();
    await expect(summary).toContainText('1 identité historique · 1 actif');
    await page.locator('[data-clear-context]').click();
    await expect(summary).toContainText('5 identités historiques · 4 actifs');
    await page.goto(`http://127.0.0.1:${address.port}/index.html`);
    const inventory = page.getByRole('region', { name: 'Patrimoine et activité par repository' });
    await expect(inventory.locator('thead')).toContainText('Identités historiques');
    const identityCount = inventory.locator('tbody tr').first().locator('td').nth(1).locator('a');
    await expect(identityCount).toHaveText('5');
    await expect(identityCount).toHaveAttribute(
      'href',
      /audits\.html\?repository=acme%2Fds-react#component-populations/
    );
    expect(errors).toEqual([]);
    expect(JSON.stringify(snapshot)).toBe(source);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    await rm(directory, { recursive: true, force: true });
  }
});
