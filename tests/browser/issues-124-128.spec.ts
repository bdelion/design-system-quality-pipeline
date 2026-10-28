import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { consolidationSnapshot, rules } from '../support/consolidation.js';
import { applyIssueReviews } from '../../src/domain/issue-review.js';
import { applyAuditDeclarations } from '../../src/domain/audit-declarations.js';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('#124–#128 : ancienneté civile, traitement, liens de cohortes et répartitions accessibles', async ({
  page
}) => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const opened = data.issues!.find((issue) => issue.issueId === 'audit-ongoing')!;
  for (const issue of data.issues!) if (issue !== opened) issue.state = 'CLOSED';
  opened.createdAt = '2026-10-26T22:55:00Z';
  snapshot.capturedAt = '2026-10-27T00:05:00Z';
  data.issues!.find((issue) => issue.issueId === 'feature-multi')!.labels.push('📌 Grooming');
  applyIssueReviews(data, snapshot.rawData, rules);
  applyAuditDeclarations(data, snapshot.rawData, rules);
  const directory = await mkdtemp(join(tmpdir(), 'dsq-124-128-'));
  await generateDashboard(snapshot, directory, undefined, rules.labels.componentPrefix, rules);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`http://127.0.0.1:${address.port}/simplified/index.html`);
    await page.getByRole('link', { name: 'Composants', exact: true }).click();
    await expect(page.locator('[data-table-id="component-activity"]')).toContainText('#4 · 1 j');
    await page.getByRole('link', { name: 'Activité', exact: true }).click();
    await expect(page.getByRole('columnheader', { name: 'Traitement', exact: false })).toBeVisible();
    await expect(page.locator('[data-table-id="activity"]')).toContainText('À groomer');
    await expect(page.locator('[data-table-id="activity"]')).toContainText('Restant à faire');
    await page.getByRole('link', { name: 'Repositories et équipe', exact: true }).click();
    await page
      .locator('[data-table-id="repositories"] tbody tr')
      .first()
      .locator('td')
      .nth(1)
      .getByRole('button')
      .click();
    await expect(page.locator('#detail-actions a')).toHaveAttribute('href', /\/labels\?q=Component/);
    await page.keyboard.press('Escape');
    const closure = page
      .locator('[data-table-id="delays"] tbody tr')
      .filter({ hasText: 'Fermeture des issues' });
    await closure.locator('td').nth(1).getByRole('button').click();
    expect(
      new URL((await page.locator('#detail-actions a').getAttribute('href'))!).searchParams.get('q')
    ).toBe('is:issue state:closed');
    await page.keyboard.press('Escape');
    await page.getByRole('link', { name: 'Audits par version', exact: true }).click();
    const campaign = page
      .locator('[data-table-id="campaigns"] tbody tr')
      .filter({ has: page.getByText('1.0.0', { exact: true }) });
    await expect(campaign.locator('td').nth(12).getByRole('button')).toHaveText('1');
    await expect(campaign.locator('td').nth(17).getByRole('button')).toHaveText('0');
    const criticality = page.locator('[data-table-id="audit-criticality"]');
    for (const id of ['audit-criticality', 'audit-category', 'audit-component']) {
      const distribution = page.locator(`[data-table-id="${id}"]`);
      await expect(distribution.getByLabel('Trier par', { exact: true })).toHaveValue('3');
      await expect(distribution.getByLabel('Ordre', { exact: true })).toHaveValue('-1');
      await expect(distribution.getByRole('columnheader', { name: /Reste à faire/ })).toBeVisible();
      await expect(distribution.getByRole('columnheader', { name: /Traités/ })).toBeVisible();
      await expect(distribution.locator('td').filter({ has: page.locator('progress') })).toHaveCount(1);
      await expect(
        distribution.locator('tbody tr').first().locator('td').nth(3).locator('progress, meter')
      ).toHaveCount(0);
      await expect(distribution.getByRole('columnheader', { name: /^Total/ })).toHaveAttribute(
        'aria-sort',
        'descending'
      );
    }
    await expect(criticality.locator('tbody tr')).toHaveCount(1);
    await criticality.getByLabel('Population représentée').selectOption('5');
    await expect(criticality.locator('progress')).toHaveAttribute('value', '100');
    await expect(criticality.locator('progress')).toHaveAttribute('max', '100');
    await expect(criticality.locator('tbody tr').first().locator('td').nth(8)).toContainText('1/1 — 100 %');
    const download = page.waitForEvent('download');
    await criticality.getByRole('button', { name: 'Exporter en CSV', exact: true }).click();
    const csv = await readFile((await (await download).path())!, 'utf8');
    expect(csv).toContain('Majeure');
    expect(csv).toContain('Traités');
    expect(csv).toContain('1/1 — 100 %');
    await criticality.locator('tbody tr').first().locator('td').nth(8).getByRole('button').click();
    await expect(page.getByRole('dialog')).toContainText('Traités');
    await expect(page.getByRole('dialog').locator('tbody tr')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await criticality.locator('tbody tr').first().locator('td').nth(5).getByRole('button').click();
    await expect(page.getByRole('dialog')).toContainText('Repli GitHub');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await criticality.getByLabel('Population représentée').selectOption('4');
    await expect(criticality.locator('tbody')).toHaveText('Aucun résultat pour ces filtres.');
    await criticality.getByLabel('Population représentée').selectOption('3');
    await page.getByRole('searchbox', { name: 'Version', exact: true }).fill('2.0.0');
    await expect(criticality.locator('tbody')).toHaveText('Aucun résultat pour ces filtres.');
    await page.getByRole('button', { name: 'Effacer les filtres', exact: true }).click();
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
