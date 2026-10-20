import { test, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateClassicDashboard as generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';
import { prodAndDevelopmentSnapshot } from '../support/workspace-version-snapshot.js';

for (const scenario of ['partial', 'reliable-nonconform', 'invalid-date', 'missing-metadata']) {
  test(`issue #89 : contexte PC ${scenario}`, async ({ page }, info) => {
    const snapshot = prodAndDevelopmentSnapshot();
    snapshot.capturedAt = '2026-10-19T12:00:00+02:00';
    snapshot.scope = 'demo-ui';
    if (scenario === 'reliable-nonconform') {
      snapshot.dataQuality.issues = [];
      snapshot.dataQuality.summary = { INFO: 0, WARNING: 0, ERROR: 0 };
      snapshot.reliability = 'reliable';
      for (const relation of snapshot.normalizedData.componentVersions!) relation.verdict = 'NON_CONFORME';
    }
    if (scenario === 'invalid-date') snapshot.capturedAt = 'invalide';
    if (scenario === 'missing-metadata') {
      // Une capture ancienne peut être dépourvue de ces champs ; ne pas inventer de substitution.
      Reflect.deleteProperty(snapshot, 'capturedAt');
      Reflect.deleteProperty(snapshot, 'scope');
      Reflect.deleteProperty(snapshot, 'reliability');
    }
    const output = await mkdtemp(join(tmpdir(), 'dsq-browser-header-89-'));
    await generateDashboard(snapshot, output);
    const server = await startDashboardServer(join(output, 'dashboard'), 0);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Port indisponible');
    const root = `http://127.0.0.1:${address.port}`;
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    try {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`${root}/accessibility.html`);
      const header = page.locator('.page-heading');
      const scope = header.locator('[data-snapshot-scope]');
      const reliability = header.locator('[data-snapshot-reliability]');
      if (scenario === 'invalid-date' || scenario === 'missing-metadata') {
        await expect(header.locator('[data-snapshot-date]')).toHaveText('Date de capture indisponible');
        await expect(scope).toHaveText('Périmètre interactif indisponible');
        await expect(page.locator('[data-page-data-error]')).toBeVisible();
        if (scenario === 'missing-metadata') await expect(reliability).toContainText('indisponible');
      } else {
        await expect(header.locator('[data-snapshot-date]')).toHaveText(
          'Snapshot du 19/10/2026 10:00:00 UTC'
        );
        await expect(scope).toContainText('Capture : demo-ui');
        await expect(scope).toContainText('1.7.1 (PROD)');
        if (scenario === 'partial') {
          await expect(reliability).toContainText('partielle');
          await page.screenshot({ path: info.outputPath('capture-recente-partielle.png') });
          await page.locator('[data-context-filter="repository"]').selectOption('acme/ds-react');
          await page.locator('[data-context-filter="component"]').selectOption('Button');
          await page.locator('[data-context-filter="version"]').selectOption('1.8.0');
          await expect(scope).toContainText('Composant : Button');
          await expect(scope).toContainText('1.8.0 (développement)');
          await expect(scope).not.toContainText('1.7.1 (PROD)');
          await page.reload();
          await expect(scope).toContainText('1.8.0 (développement)');
          await page.locator('[data-clear-context]').click();
          await expect(scope).toContainText('1.7.1 (PROD)');
          await page.locator('[data-context-filter="component"]').selectOption('Button');
          await expect(reliability).toHaveAttribute('href', 'quality.html#quality');
          await reliability.focus();
          await page.keyboard.press('Enter');
          await expect(page).toHaveURL(`${root}/quality.html#quality`);
          await expect(page.locator('[data-quality-row]:visible')).toHaveCount(
            snapshot.dataQuality.issues.length
          );
          await expect(
            page.getByRole('region', { name: 'Diagnostics de qualité des données' })
          ).toBeVisible();
          await expect(page.locator('[data-quality-row]').first()).toContainText(
            snapshot.dataQuality.issues[0]!.ruleId
          );
          await expect(page.locator('[data-quality-row]').first()).toContainText(
            snapshot.dataQuality.issues[0]!.entityId
          );
        } else {
          await expect(reliability).toContainText('Fiabilité globale : fiable');
          await expect(reliability).toContainText('aucun diagnostic');
          await expect(page.locator('[data-workspace-kpi="conformity"]')).toHaveText('0 %');
        }
      }
      expect(errors).toEqual([]);
    } finally {
      await page.goto('about:blank');
      server.closeAllConnections();
      await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
      await rm(output, { recursive: true, force: true });
    }
  });
}
