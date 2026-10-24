import { test, expect } from '@playwright/test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import type { DashboardPageModel } from '../../src/dashboard/page-read-model.js';
import { dashboardPageModel } from '../../src/dashboard/page-read-model.js';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { consolidationSnapshot } from '../support/consolidation.js';

test('issue #82 : parité PC des cartes, réserves, filtres, liens et CSV avec une ancienne capture', async ({
  page
}) => {
  const reference = consolidationSnapshot();
  reference.analytics.workspaces!.rows[0]!.qualification.reasons.push('Qualification historique conservée');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const results: { cards: string[]; links: (string | null)[]; csv: string }[] = [];
  for (const legacy of [false, true]) {
    const snapshot = structuredClone(reference);
    if (legacy) {
      delete snapshot.analytics.workspaces!.versionSelectionAlgorithm;
      snapshot.analytics.workspaces!.scopes[0]!.summary.coverage = -1;
    }
    const expected = dashboardPageModel(snapshot, 'accessibility').data.workspaces;
    const source = JSON.stringify(snapshot);
    const directory = await mkdtemp(join(tmpdir(), 'dsq-browser-payload-'));
    let server: Server | undefined;
    try {
      await generateDashboard(snapshot, directory);
      server = await startDashboardServer(join(directory, 'dashboard'), 0);
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Port local indisponible');
      await page.goto(`http://127.0.0.1:${address.port}/accessibility.html`);
      await expect(page.locator('#workspace-data')).toHaveCount(0);
      const actual = await page.evaluate(
        () =>
          (JSON.parse(document.getElementById('dashboard-page-data')!.textContent!) as DashboardPageModel)
            .data.workspaces
      );
      expect(actual).toEqual(expected);
      await page.locator('[data-context-filter="repository"]').selectOption('acme/ds-react');
      await page.locator('[data-context-filter="version"]').selectOption('1.0.0');
      await expect(page).toHaveURL(/version=1\.0\.0/);
      const cards = await page.locator('[data-workspace-kpi], [data-workspace-reserve]').allTextContents();
      const links = await page
        .locator('#population a')
        .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
      expect(links.length).toBeGreaterThan(0);
      const download = page.waitForEvent('download');
      await page.locator('[data-accessibility-export="population"]').click();
      const csv = await readFile((await (await download).path())!, 'utf8');
      expect(csv).toContain('Qualification historique conservée');
      results.push({ cards, links, csv });
      expect(JSON.stringify(snapshot)).toBe(source);
    } finally {
      await page.goto('about:blank');
      if (server) {
        server.closeAllConnections();
        await new Promise<void>((done, reject) => server!.close((error) => (error ? reject(error) : done())));
      }
      await rm(directory, { recursive: true, force: true });
    }
  }
  expect(results[1]).toEqual(results[0]);
  expect(errors).toEqual([]);
});
