import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { consolidationSnapshot } from '../support/consolidation.js';

test('explique un contrat absent, illisible, inconnu ou incomplet sans faux zéro', async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-contract-errors-'));
  await generateDashboard(consolidationSnapshot(), directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    for (const variant of ['absent', 'json', 'version', 'page', 'details']) {
      await page.route('**/issues.html', async (route) => {
        const response = await route.fetch();
        const html = (await response.text()).replace(
          /<script[^>]* type="application\/json" id="dashboard-page-data">([\s\S]*?)<\/script>/,
          (tag, text: string) => {
            if (variant === 'absent') return '';
            if (variant === 'json') return tag.replace(text, '{');
            const model = JSON.parse(text);
            if (variant === 'version') model.version = 999;
            if (variant === 'page') model.page = 'index';
            if (variant === 'details') delete model.data.issues;
            return tag.replace(text, JSON.stringify(model));
          }
        );
        await route.fulfill({ response, body: html });
      });
      await page.goto(`http://127.0.0.1:${address.port}/issues.html`);
      await expect(page.locator('[data-page-data-error]')).toContainText(
        'Données interactives indisponibles'
      );
      await expect(page.locator('main select').first()).toBeDisabled();
      await expect(page.locator('[data-issue-kpi]').first()).toHaveText('Indisponible');
      await page.unroute('**/issues.html');
    }
    expect(errors).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    await rm(directory, { recursive: true, force: true });
  }
});
