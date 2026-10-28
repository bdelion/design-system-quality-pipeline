import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { consolidationSnapshot, rules } from '../support/consolidation.js';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('#132–#134 : bornes, latest indépendant, preuves, CSV et besoins d’audit accessibles', async ({
  page
}) => {
  const snapshot = consolidationSnapshot();
  snapshot.normalizedData.auditTracking = { 'acme/ds-react': '1.0.0' };
  const future = { ...snapshot.normalizedData.versions![0]!, number: '3.0.0', versionId: 'future' };
  delete future.prodTag;
  delete future.channel;
  snapshot.normalizedData.versions!.push(future);
  const directory = await mkdtemp(join(tmpdir(), 'dsq-132-134-'));
  await generateDashboard(snapshot, directory, undefined, rules.labels.componentPrefix, rules);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`http://127.0.0.1:${address.port}/simplified/index.html#versions`);
    const campaigns = page.locator('[data-table-id="campaigns"]');
    await expect(campaigns.locator('tbody tr')).toHaveCount(3);
    await expect(page.getByRole('checkbox', { name: 'Latest version', exact: true })).toHaveCount(4);
    await campaigns.getByRole('checkbox', { name: 'Latest version', exact: true }).check();
    await expect(campaigns.locator('tbody tr')).toHaveCount(1);
    expect(JSON.parse((await campaigns.getAttribute('data-review-state'))!).latest).toBe(true);
    await expect(campaigns).toContainText('acme/ds-react : 2.0.0');
    await expect(campaigns.locator('tbody tr td').nth(3)).toHaveText('3');
    const criticality = page.locator('[data-table-id="audit-criticality"]');
    await expect(criticality.getByRole('checkbox')).not.toBeChecked();
    await criticality.getByRole('checkbox').check();
    await expect(criticality.locator('tbody tr td').nth(1)).toHaveText('2.0.0');
    await criticality.locator('tbody tr td').nth(3).getByRole('button').click();
    await expect(page.getByRole('dialog').locator('tbody tr')).toHaveCount(1);
    await page.keyboard.press('Escape');
    const download = page.waitForEvent('download');
    await criticality.getByRole('button', { name: 'Exporter en CSV', exact: true }).click();
    const csv = await readFile((await (await download).path())!, 'utf8');
    expect(csv).toContain('2.0.0');
    expect(csv).not.toContain('1.0.0');
    await expect(page.locator('[data-table-id="audit-plan"]')).toContainText('Aucun audit terminé');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    await rm(directory, { recursive: true, force: true });
  }
});
