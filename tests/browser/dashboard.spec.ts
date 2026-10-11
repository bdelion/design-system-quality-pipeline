import { workspaceAnalytics } from '../../src/analytics/workspaces.js';
import { consolidationSnapshot } from '../support/consolidation.js';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Server } from 'node:http';
import { startDashboardTestServer } from '../../scripts/serve-dashboard-tests.js';
import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

let server: Server | undefined;
test.beforeAll(async () => {
  server = await startDashboardTestServer();
});
test.afterAll(async () => {
  if (!server) return;
  server.closeAllConnections();
  await new Promise<void>((resolve) => server!.close(() => resolve()));
});

for (const pageName of [
  'index',
  'accessibility',
  'quality',
  'issues',
  'components',
  'audits',
  'anomalies',
  'graph',
  'history'
]) {
  test(`${pageName} : scripts sans erreur et accessibilité WCAG A/AA`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${pageName}.html`);
    await expect(page.locator('h1')).toBeVisible();
    if (pageName === 'issues') await expect(page.locator('[data-issue-rows] tr').first()).toBeVisible();
    if (pageName === 'components')
      await expect(page.locator('[data-component-rows] tr').first()).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      accessibility.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary }))
      }))
    ).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: false });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    for (const link of await page.locator('[data-workspace-nav]').all()) {
      const bounds = await link.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    }
    await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: false });
    const mobileAccessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(mobileAccessibility.violations.map((violation) => violation.id)).toEqual([]);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
}

test('contexte multi-composants, références inconnues, effacement et liens ciblés', async ({ page }) => {
  await page.goto('/issues.html?repository=acme%2Fds-react&component=Modal');
  await expect(page.locator('[data-issue-summary]')).toContainText('1 issues distinctes');
  await expect(page.locator('[data-issue-rows]')).toContainText('5');
  await page.locator('[data-context-filter="component"]').selectOption('Button');
  await expect(page.locator('[data-issue-summary]')).toContainText('8 issues distinctes');
  await page.goto('/audits.html?repository=acme%2Fds-react&version=2.0.0');
  await expect(page.locator('[data-component-version-row]:visible')).toHaveCount(2);
  const inherited = page.locator('[data-component-version-row]:visible').filter({ hasText: 'Button' });
  await expect(inherited).toContainText('hérité');
  const auditLink = inherited.locator('a[href*="audit="]').first();
  await expect(auditLink).toHaveAttribute('href', /audit=/);
  await auditLink.click();
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await expect(page.locator('[data-audit-row]:visible')).toContainText('1.0.0');
  await page.goto('/components.html?component=Unknown');
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(0);
  await expect(page.locator('[data-context-filter="component"]')).toHaveValue('Unknown');
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(2);
});

test('KPI distincts cohérents entre explorateurs, sélection et CSV', async ({ page }) => {
  await page.goto('/issues.html?repository=acme%2Fds-react');
  const average = await page.locator('[data-issue-kpi="global-average"]').textContent();
  const median = await page.locator('[data-issue-kpi="global-median"]').textContent();
  await page.locator('[data-issue-dedupe]').click();
  await expect(page.locator('[data-issue-kpi="global-average"]')).toHaveText(average!);
  await page.locator('[data-issue-search]').fill('feature-multi');
  await expect(page.locator('[data-issue-kpi="global-average"]')).toHaveText('—');
  await page.locator('[data-issue-reset]').click();
  await page.locator('[data-issue-select-all]').check();
  await expect(page.locator('[data-issue-kpi="global-average"]')).toHaveText(average!);
  const download = page.waitForEvent('download');
  await page.locator('[data-issue-export]').click();
  expect((await download).suggestedFilename()).toContain('.csv');
  await page.goto('/components.html?repository=acme%2Fds-react');
  await expect(page.locator('[data-component-kpi="global-average"]')).toHaveText(average!);
  await expect(page.locator('[data-component-kpi="global-median"]')).toHaveText(median!);
  await page.locator('[data-component-filter="version"]').selectOption('2.0.0');
  await expect(page.locator('[data-component-rows]')).toContainText('NON_CONFORME');
  await expect(page.locator('[data-component-summary]')).toContainText('2 issues distinctes');
});

test('anomalie exacte, annulations, traçabilité et journal observé', async ({ page }) => {
  await page.goto('/graph.html?issue=anomaly-a');
  await expect(page.locator('[data-trace-row]:visible')).toHaveCount(1);
  await expect(page.locator('[data-trace-row]:visible')).toContainText('pr-a');
  await expect(page.locator('[data-trace-row]:visible')).toContainText('1.0.0');
  await page.locator('[data-trace-row]:visible a[href*="anomaly="]').click();
  await expect(page.locator('[data-table-row]:visible')).toHaveCount(1);
  await page.goto('/audits.html?progress=cancelled');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await expect(page.locator('[data-audit-row]:visible')).toContainText('annulé');
  await expect(page.locator('[data-audit-progress-filter]')).toHaveValue('cancelled');
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(3);
  await page.locator('[data-audit-progress-filter]').selectOption('completed');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await page.locator('[data-audit-result-filter]').selectOption('conform');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(0);
  await page.locator('[data-audit-result-filter]').selectOption('non_conform');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await page.locator('[data-reset-audit-filters]').click();
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(3);
  await page.goto('/history.html');
  await expect(page.locator('[data-transition-row]')).not.toHaveCount(0);
  await expect(
    page.getByText('Date métier = événement Project prouvé dans la période.', { exact: false })
  ).toBeVisible();
});

test('six espaces, explication proche du chiffre et absence des anciens cartouches globaux', async ({
  page
}) => {
  await page.goto('/index.html');
  await expect(page.locator('nav[aria-label="Navigation principale"] a')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Périmètre de navigation' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Preuves des métriques Analytics' })).toHaveCount(0);
  await page.locator('.metric-info summary').first().click();
  await expect(page.getByText('Composants couverts / composants présents', { exact: false })).toBeVisible();
  await page.goto('/quality.html');
  await expect(page.locator('[data-context-filter]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Alertes de qualité des données' })).toBeVisible();
});

test('les indicateurs accessibilité et la liste suivent le même périmètre et les versions héritées', async ({
  page
}) => {
  await page.goto('/accessibility.html?repository=acme%2Fds-react&component=Button&version=2.0.0');
  await expect(page.locator('[data-workspace-kpi="declared"]')).toHaveText('1');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('100');
  await expect(page.locator('#population [data-workspace-row]:visible')).toHaveCount(1);
  await expect(page.locator('#population [data-workspace-row]:visible')).toContainText('anomaly-a');
  await page.locator('[data-context-filter="component"]').selectOption('Modal');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('0');
  await expect(page.locator('[data-workspace-kpi="conformity"]')).toHaveText('Indisponible');
  await expect(page.locator('#population [data-workspace-row]:visible')).toHaveCount(0);
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('50');
});

test('liste de revue exportable et navigation depuis un ancien lien ciblé', async ({ page }) => {
  await page.goto('/accessibility.html#review');
  await expect(page.locator('#review')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.locator('[data-accessibility-export="review"]').click();
  expect((await download).suggestedFilename()).toBe('accessibilite-review.csv');
  await page.goto('/graph.html?issue=anomaly-a');
  await page.locator('[data-workspace-nav][href^="accessibility.html"]').click();
  await expect(page.locator('[data-workspace-kpi="declared"]')).toBeVisible();
  expect(new URL(page.url()).searchParams.has('issue')).toBe(false);
});

/** Vérifie qu’un filtre métier ancien ne laisse pas afficher des agrégats hors périmètre. */
test('un ancien filtre de catégorie masque les agrégats non calculés pour ce filtre', async ({ page }) => {
  await page.goto('/accessibility.html?category=non-existent');
  await expect(page.locator('[data-workspace-cards]')).toBeHidden();
  await expect(page.locator('[data-workspace-summary]')).toContainText('liste de preuves');
  await expect(page.locator('#population [data-workspace-row]:visible')).toHaveCount(0);
});

/** Vérifie la visibilité des métriques globales et leur séparation du contexte filtré. */
test('la synthèse globale reste visible à l’accueil et disparaît en périmètre filtré', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.getByRole('heading', { name: 'Patrimoine et activité globale' })).toBeVisible();
  await expect(page.getByText('Défauts normalisés déclarés', { exact: true })).toBeVisible();
  await page.goto('/index.html?component=Modal');
  await expect(page.locator('[data-global-only]')).toBeHidden();
  await expect(page.locator('[data-workspace-unavailable="conformity"]')).toContainText('dénominateur');
});

/** Vérifie les filtres repository et de diagnostic, les compteurs et leur réinitialisation. */
test('repository et tableau de qualité répondent aux changements de filtres', async ({ page }) => {
  await page.goto('/index.html');
  const repo = page.locator('[data-context-filter="repository"]');
  await repo.selectOption('acme/ds-react');
  await repo.dispatchEvent('change');
  expect(new URL(page.url()).searchParams.get('repository')).toBe('acme/ds-react');
  await expect(page.locator('[data-filter-feedback]')).toContainText('acme/ds-react');
  await expect(page.locator('[data-global-only]')).toBeHidden();
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-global-only]')).toBeVisible();
  await page.goto('/quality.html');
  const total = await page.locator('[data-quality-row]').count();
  expect(total).toBeGreaterThan(0);
  await page.locator('[data-quality-filter="repository"]').selectOption('__unknown__');
  await expect(page.locator('[data-quality-row]:visible')).not.toHaveCount(total);
  await page.locator('[data-quality-reset]').click();
  await page.locator('[data-quality-filter="dqSearch"]').fill('aucun-diagnostic-possible');
  await expect(page.locator('[data-quality-count]')).toHaveText('0');
  await expect(page.locator('[data-quality-row]:visible')).toHaveCount(0);
  await page.locator('[data-quality-reset]').click();
  await expect(page.locator('[data-quality-count]')).toHaveText(String(total));
  const value = await page.locator('[data-quality-filter="dqRule"] option').nth(1).getAttribute('value');
  await page.locator('[data-quality-filter="dqRule"]').selectOption(value!);
  const rows = page.locator('[data-quality-row]:visible');
  expect(await rows.count()).toBeGreaterThan(0);
  for (const cell of await rows.locator('td:first-child').allTextContents()) expect(cell).toBe(value);
});

/** Signale le mode fichier avant tout chargement des modules JavaScript. */
test('le mode fichier explique les filtres désactivés', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('data/browser-consolidation/dashboard/index.html')).href);
  await expect(page.locator('[data-file-warning]')).toBeVisible();
  await expect(page.locator('[data-context-filter="repository"]')).toBeDisabled();
});

/** Vérifie les cartes et ratios en présence de composants connus sans preuves de présence versionnée. */
test('la présence inconnue rend les ratios et le stock non couvert indisponibles', async ({ page }) => {
  const snapshot = consolidationSnapshot();
  snapshot.normalizedData.componentVersions = [];
  const model = workspaceAnalytics(snapshot.normalizedData, snapshot.dataQuality.issues);
  await page.route('**/accessibility.html', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script type="application\/json" id="workspace-data">)[\s\S]*?(<\/script>)/,
      (_match, start, end) => start + JSON.stringify(model).replace(/</g, '\\u003c') + end
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/accessibility.html');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('Indisponible');
  await expect(page.locator('[data-workspace-ratio="coverage"]')).toHaveText('Ratio indisponible');
  await expect(page.locator('[data-workspace-ratio="conformity"]')).toHaveText('Ratio indisponible');
  await expect(page.locator('[data-workspace-kpi="nonCovered"]')).toHaveText('Indisponible');
  await expect(page.locator('[data-workspace-kpi="unknown"]')).toHaveText('2');
});
