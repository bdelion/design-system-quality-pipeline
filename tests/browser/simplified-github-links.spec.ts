import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('accès GitHub distincts des dialogues, filtres complets et sources absentes', async ({
  page,
  context
}) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-github-links-'));
  const snapshot = benchmarkSnapshot('control', 81);
  for (const issue of snapshot.normalizedData.issues || [])
    issue.url = issue.url?.replace('example.invalid', 'github.com');
  await generateDashboard(snapshot, directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  await context.route('https://github.com/**', (route) => route.fulfill({ body: 'GitHub simulé' }));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto(`http://127.0.0.1:${address.port}/simplified/index.html`);
    await expect(page.locator('.summary-cards .github-shortcut').first()).toBeVisible();
    await page.getByRole('link', { name: 'Activité', exact: true }).click();
    const panel = page.locator('[data-table-id="activity"]');
    await panel.getByLabel('Lignes par page').selectOption('10');
    const selection = panel.locator('.github-selection .github-shortcut');
    await expect(selection).toHaveCount(4);
    await expect(selection.first()).toContainText('Ouvrir la recherche dans GitHub');
    const urls = await selection.evaluateAll((links) => links.map((link) => link.getAttribute('href')));
    expect(urls.some((url) => decodeURIComponent(url!).includes('24'))).toBe(true);
    const cell = panel.locator('tbody tr').first().locator('td').first();
    const arrow = cell.locator('.github-shortcut');
    await expect(arrow).toHaveText('Ouvrir la recherche dans GitHub ↗');
    await expect(arrow).toHaveAttribute('target', '_blank');
    await expect(arrow).toHaveAttribute('rel', 'noopener noreferrer');
    const href = await arrow.getAttribute('href');
    const popupPromise = page.waitForEvent('popup');
    await arrow.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(href!);
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await popup.close();
    await cell.getByRole('button').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.github-shortcut')).toHaveAttribute('href', href!);
    await page.keyboard.press('Escape');
    await panel.getByLabel('Filtrer ce tableau').fill(snapshot.normalizedData.issues![0]!.title);
    await expect(selection).toHaveCount(1);
    expect(new URL((await selection.getAttribute('href'))!).searchParams.get('q')).toMatch(/is:issue \(1\)$/);
    await panel.getByLabel('Filtrer ce tableau').fill('aucun-resultat');
    await expect(selection).toHaveCount(0);
    await panel.getByLabel('Filtrer ce tableau').fill('');
    await expect(selection).toHaveCount(4);
    await page.getByRole('link', { name: 'Repositories et équipe', exact: true }).click();
    const repository = page.locator('[data-table-id="repositories"] tbody tr').first();
    for (const [index, query] of [
      [2, 'is:issue'],
      [3, 'is:issue is:open'],
      [4, 'is:pr'],
      [5, 'is:pr is:merged']
    ] as const) {
      await repository.locator('td').nth(index).getByRole('button').click();
      const search = page
        .locator('#detail-note')
        .getByRole('link', { name: /Ouvrir la recherche dans GitHub/ });
      await expect(search).toHaveCount(1);
      await expect(search).toHaveText('Ouvrir la recherche dans GitHub ↗');
      expect(new URL((await search.getAttribute('href'))!).searchParams.get('q')).toBe(query);
      await expect(search).toHaveAttribute('target', '_blank');
      await page.keyboard.press('Escape');
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    for (const name of [
      'Synthèse',
      'Composants',
      'Activité',
      'Repositories et équipe',
      'Audits par version'
    ]) {
      await page.getByRole('link', { name, exact: true }).click();
      const missing = await page.evaluate(() => {
        const failures: string[] = [];
        for (const button of document.querySelectorAll<HTMLButtonElement>('tbody button, .card-metric')) {
          button.click();
          const dialog = document.querySelector<HTMLDialogElement>('#detail')!;
          if (!dialog.open) continue;
          if (dialog.querySelector('#detail-content tbody tr')) {
            const search = dialog.querySelector<HTMLAnchorElement>('#detail-note .github-shortcut');
            if (
              !search ||
              !search.textContent?.includes('Ouvrir la recherche dans GitHub') ||
              !new URL(search.href).searchParams.has('q')
            )
              failures.push(document.getElementById('detail-title')!.textContent || 'Titre absent');
          }
          dialog.close();
        }
        return failures;
      });
      expect(missing, 'Chaque fenêtre contenant des issues doit proposer une recherche').toEqual([]);
      const links = page.locator('#content .github-shortcut');
      expect(await links.count()).toBeGreaterThan(0);
      for (const link of await links.all()) {
        await expect(link).toContainText(/Ouvrir (la recherche|l’issue) dans GitHub/);
        const text = await link.textContent();
        expect(await link.getAttribute('aria-label')).toContain(text);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    await rm(directory, { recursive: true, force: true });
  }
});
