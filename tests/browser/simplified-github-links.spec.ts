import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('maquette A : lien unique dans les fenêtres, aucun raccourci dans les pages et tableaux', async ({
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
    await expect(page.locator('#content .github-shortcut')).toHaveCount(0);
    await page.getByRole('link', { name: 'Activité', exact: true }).click();
    const panel = page.locator('[data-table-id="activity"]');
    await panel.getByLabel('Lignes par page').selectOption('10');
    await expect(panel.locator('.github-shortcut, .github-selection')).toHaveCount(0);
    await panel.locator('tbody tr').first().locator('td').first().getByRole('button').click();
    const dialog = page.getByRole('dialog');
    const action = dialog.locator('.detail-header #detail-actions .github-shortcut');
    await expect(action).toHaveCount(1);
    await expect(action).toHaveAttribute('href', snapshot.normalizedData.issues![0]!.url!);
    await expect(action).toHaveAttribute('target', '_blank');
    const titleBox = await dialog.getByRole('heading').boundingBox();
    const actionBox = await action.boundingBox();
    expect(Math.abs(titleBox!.y - actionBox!.y)).toBeLessThan(15);
    const closeBox = await dialog.getByRole('button', { name: 'Fermer', exact: true }).boundingBox();
    expect(closeBox!.x - actionBox!.x - actionBox!.width).toBeLessThanOrEqual(20);
    const popupPromise = page.waitForEvent('popup');
    await action.click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(snapshot.normalizedData.issues![0]!.url!);
    await popup.close();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await panel.getByLabel('Filtrer ce tableau').fill('aucun-resultat');
    await expect(panel.locator('tbody td')).toHaveText('Aucun résultat pour ces filtres.');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByRole('link', { name: 'Repositories et équipe', exact: true }).click();
    const repository = page.locator('[data-table-id="repositories"] tbody tr').first();
    for (const [index, query] of [
      [2, 'is:issue'],
      [3, 'is:issue is:open'],
      [4, 'is:pr'],
      [5, 'is:pr is:merged']
    ] as const) {
      await repository.locator('td').nth(index).getByRole('button').click();
      const search = page.locator('#detail-actions').getByRole('link', { name: /Ouvrir dans GitHub/ });
      await expect(search).toHaveCount(1);
      await expect(search).toHaveText('Ouvrir dans GitHub ↗');
      expect(new URL((await search.getAttribute('href'))!).searchParams.get('q')).toBe(query);
      await expect(search).toHaveAttribute('target', '_blank');
      if (index === 2) {
        const destination = await search.getAttribute('href');
        await dialog.getByLabel('Lignes par page').selectOption('10');
        await dialog.getByRole('button', { name: 'Suivante', exact: true }).click();
        await expect(search).toHaveAttribute('href', destination!);
        await expect(dialog.locator('tbody tr')).toHaveCount(10);
      }
      if (index >= 4) {
        await expect(page.locator('#detail-content table')).toHaveCount(0);
        expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      }
      await page.keyboard.press('Escape');
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    let broadened = 0;
    for (const name of [
      'Synthèse',
      'Composants',
      'Activité',
      'Repositories et équipe',
      'Audits par version'
    ]) {
      await page.getByRole('link', { name, exact: true }).click();
      const feedback = await page.evaluate(() => {
        const failures: string[] = [];
        let broadened = 0;
        for (const button of document.querySelectorAll<HTMLButtonElement>('tbody button, .card-metric')) {
          button.click();
          const dialog = document.querySelector<HTMLDialogElement>('#detail')!;
          if (!dialog.open) continue;
          if (dialog.querySelector('#detail-note')?.textContent?.includes('Recherche GitHub élargie')) {
            broadened++;
            const link = dialog.querySelector('#detail-actions a');
            if (!link?.getAttribute('aria-label')?.includes('recherche élargie'))
              failures.push('Avertissement élargi absent du lien');
          }

          if (dialog.querySelectorAll('#detail-actions a').length > 1)
            failures.push('Plusieurs accès globaux');
          for (const table of dialog.querySelectorAll('table')) {
            if (table.querySelector('th') && !table.querySelector('td'))
              failures.push('Tableau sans données');
          }

          if (dialog.querySelector('#detail-content tbody tr')) {
            const search = dialog.querySelector<HTMLAnchorElement>('#detail-actions .github-shortcut');
            if (
              (!search && !dialog.querySelector('#detail-actions .unavailable')) ||
              (search && !search.textContent?.includes('Ouvrir dans GitHub')) ||
              (search &&
                dialog.querySelectorAll('#detail-content tbody tr').length > 1 &&
                !new URL(search.href).searchParams.has('q'))
            )
              failures.push(document.getElementById('detail-title')!.textContent || 'Titre absent');
          }
          dialog.close();
        }
        return { failures, broadened };
      });
      broadened += feedback.broadened;
      expect(feedback.failures, 'Chaque fenêtre contenant des issues doit proposer une recherche').toEqual(
        []
      );
      await expect(page.locator('#content .github-shortcut, #content .github-selection')).toHaveCount(0);
      expect(await page.locator('#detail-actions a').count()).toBeLessThanOrEqual(1);
      expect(await page.locator('#detail-actions').textContent()).not.toMatch(/lot \d/);
    }
    expect(broadened).toBeGreaterThan(0);
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
