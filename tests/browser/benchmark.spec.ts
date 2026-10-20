import { test, expect, chromium } from '@playwright/test';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { measureBrowserPage } from '../../scripts/dashboard-benchmark.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';
import { measureHtml } from '../../scripts/benchmark-metrics.js';

test('issue #81 : protocole PC reproductible, capture isolée et erreurs détectées', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-browser-benchmark-'));
  const browser = await chromium.launch({ ...(process.platform === 'win32' ? { channel: 'msedge' } : {}) });
  let server: Awaited<ReturnType<typeof startDashboardServer>> | undefined;
  try {
    await generateDashboard(benchmarkSnapshot('control', 81), directory);
    server = await startDashboardServer(join(directory, 'dashboard'), 0);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Port local indisponible');
    const url = `http://127.0.0.1:${address.port}/issues.html`;
    const first = await measureBrowserPage(browser, url);
    const second = await measureBrowserPage(browser, url, join(directory, 'capture.png'));
    expect(first.domNodes).toBe(second.domNodes);
    expect(first.renderedTableRows).toBe(second.renderedTableRows);
    expect(first.renderedTableRows).toBeGreaterThan(0);
    expect(first.domElements).toBeLessThan(first.domNodes);
    expect(first.captureMs).toBeNull();
    expect(second.captureMs).not.toBeNull();
    expect(first.resultReadyMs).toBeGreaterThanOrEqual(first.navigationMs);
    const baseline = JSON.parse(await readFile('config/benchmark-control-baseline.json', 'utf8')) as {
      pages: { page: string; domNodes: number; renderedTableRows: number }[];
    };
    const budget = JSON.parse(await readFile('config/benchmark-budgets.json', 'utf8')) as {
      status: string;
      maxGrowthPercent: number;
    };
    expect(budget.status).toBe('validated');
    const reference = baseline.pages.find((item) => item.page === 'issues.html')!;
    expect(first.domNodes).toBeLessThanOrEqual(
      Math.ceil(reference.domNodes * (1 + budget.maxGrowthPercent / 100))
    );
    expect(first.renderedTableRows).toBeLessThanOrEqual(
      Math.ceil(reference.renderedTableRows * (1 + budget.maxGrowthPercent / 100))
    );
    for (const reference of baseline.pages.filter((item) => item.page !== 'issues.html')) {
      const measured = await measureBrowserPage(
        browser,
        `http://127.0.0.1:${address.port}/${reference.page}`
      );
      expect(measured.domNodes, reference.page).toBeLessThanOrEqual(
        Math.ceil(reference.domNodes * (1 + budget.maxGrowthPercent / 100))
      );
      expect(measured.renderedTableRows, reference.page).toBeLessThanOrEqual(
        Math.ceil(reference.renderedTableRows * (1 + budget.maxGrowthPercent / 100))
      );
    }
    const staticMetrics = measureHtml(await readFile(join(directory, 'dashboard/issues.html'), 'utf8'));
    expect(staticMetrics.initialTableRows).toBeLessThan(first.renderedTableRows);
    await expect(
      measureBrowserPage(browser, `http://127.0.0.1:${address.port}/missing.html`)
    ).rejects.toThrow(/Navigation/);
    await writeFile(
      join(directory, 'dashboard/external.html'),
      '<main><h1>Test synthétique</h1></main><script>fetch("https://example.invalid/blocked").catch(() => {});</script>'
    );
    await expect(
      measureBrowserPage(browser, `http://127.0.0.1:${address.port}/external.html`)
    ).rejects.toThrow(/non locale/);
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise<void>((done, reject) => server!.close((error) => (error ? reject(error) : done())));
    }
    await browser.close();
    await rm(directory, { recursive: true, force: true });
  }
});
