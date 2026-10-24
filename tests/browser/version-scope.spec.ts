import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Server } from 'node:http';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { consolidationRaw, rules } from '../support/consolidation.js';
import { normalizeGithub } from '../../src/normalizers/github.js';
import { applyComponentVersionVerdicts } from '../../src/analytics/component-versions.js';
import { evaluateDataQuality } from '../../src/quality/rules.js';
import { calculateKpis } from '../../src/analytics/kpis.js';
import { buildSnapshot } from '../../src/snapshots/snapshot.js';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';

test('issue #39 : versions bornées, issues futures visibles et filtres repository', async ({ page }) => {
  const raw = consolidationRaw();
  raw.repositories[0]!.packageManifest = { status: 'available', version: '1.0.0' };
  const data = normalizeGithub(raw, rules);
  applyComponentVersionVerdicts(data);
  const quality = evaluateDataQuality(raw, data, rules);
  const snapshot = buildSnapshot(raw, data, quality, calculateKpis(data, quality), 'test', 'test', 'scope');
  const directory = await mkdtemp(join(tmpdir(), 'dsq-browser-version-'));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  let server: Server | undefined;
  try {
    await generateDashboard(snapshot, directory);
    server = await startDashboardServer(join(directory, 'dashboard'), 0);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Port serveur indisponible');
    const base = `http://127.0.0.1:${address.port}`;
    await page.goto(base + '/issues.html');
    await expect(page.locator('[data-issue-rows]')).toContainText('acme/ds-react#4');
    await expect(page.locator('[data-issue-rows]')).toContainText('Version future');
    await expect(page.locator('[data-issue-summary]')).toContainText('8 issues distinctes');
    await page.goto(base + '/accessibility.html');
    await page.locator('[data-context-filter="repository"]').selectOption('acme/ds-react');
    const versions = await page.locator('[data-context-filter="version"] option').allTextContents();
    expect(versions).not.toContain('2.0.0');
    expect(versions).toContain('1.0.0');
    await page.goto(base + '/quality.html');
    await page.locator('[data-quality-filter="repository"]').selectOption('acme/ds-react');
    await expect(page.locator('[data-quality-row]').filter({ hasText: 'DQ-034' })).toBeVisible();
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
