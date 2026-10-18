import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { prodAndDevelopmentSnapshot } from '../support/workspace-version-snapshot.js';

for (const published of [true, false]) {
  test(`issue #80 : périmètre PC avec PROD ${published ? 'démontrée' : 'inconnue'}`, async ({ page }) => {
    const snapshot = prodAndDevelopmentSnapshot();
    if (!published) for (const version of snapshot.normalizedData.versions!) delete version.prodTag;
    const directory = await mkdtemp(join(tmpdir(), 'dsq-browser-prod-'));
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    let server: Server | undefined;
    try {
      await generateDashboard(snapshot, directory);
      server = await startDashboardServer(join(directory, 'dashboard'), 0);
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Port serveur indisponible');
      await page.goto(`http://127.0.0.1:${address.port}/accessibility.html`);
      const context = page.locator('[data-workspace-version-context]');
      const coverage = page.locator('[data-workspace-kpi="coverage"]');
      await expect(context).toContainText('Anomalies, délais et répartitions : toutes versions');
      if (published) {
        await expect(context).toContainText('acme/ds-react : 1.7.1 (PROD, tag 1.7.1)');
        await expect(coverage).toHaveText('100 %');
      } else {
        await expect(context).toContainText('PROD non démontrée pour : acme/ds-react');
        await expect(coverage).toHaveText('Indisponible');
        await expect(page.locator('[data-workspace-ratio="coverage"]')).toHaveText('Ratio indisponible');
      }
      await page.locator('[data-context-filter="version"]').selectOption('1.8.0');
      await expect(context).toContainText('1.8.0 (développement, publication PROD non démontrée)');
      await expect(context).toContainText('selon les relations explicites');
      await expect(coverage).toHaveText('0 %');
      await page.locator('[data-context-filter="version"]').selectOption('');
      await expect(coverage).toHaveText(published ? '100 %' : 'Indisponible');
      if (!published) {
        await page.locator('[data-context-filter="version"]').selectOption('1.7.1');
        await expect(context).toContainText('1.7.1 (publication PROD non démontrée)');
      }
      expect(errors).toEqual([]);
    } finally {
      await page.goto('about:blank');
      if (server) {
        server.closeAllConnections();
        await new Promise<void>((done, reject) => server!.close((error) => (error ? reject(error) : done())));
      }
      await rm(directory, { recursive: true, force: true });
    }
  });
}
