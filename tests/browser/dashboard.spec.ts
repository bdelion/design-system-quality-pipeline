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

for (const pageName of ['index', 'issues', 'components', 'audits', 'anomalies', 'graph', 'history']) {
  test(`${pageName} : scripts sans erreur et accessibilité WCAG A/AA`, async ({ page }) => {
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
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator('h1')).toBeVisible();
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
