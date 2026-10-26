import { test, expect, type Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { benchmarkSnapshot } from '../support/dashboard-load.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

/** Vérifie aussi les collisions entre écrans : aucune référence ne doit être partagée. */
async function references(page: Page) {
  return page.evaluate(() => {
    const review = Reflect.get(window, 'dsqReview');
    const collisions = review.refresh();
    return {
      collisions,
      ids: [...document.querySelectorAll('*')].map((node) => node.getAttribute('data-review-id'))
    };
  });
}

test('identifiants : toutes les pages, tris, fenêtres, copie et recherche', async ({ page, context }) => {
  const directory = await mkdtemp(join(tmpdir(), 'dsq-review-'));
  const snapshot = benchmarkSnapshot('control', 81);
  await generateDashboard(snapshot, directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  const base = `http://127.0.0.1:${address.port}/`;
  const globalIds = new Set();
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    for (const path of [
      'index.html',
      ...[
        'index',
        'issues',
        'components',
        'accessibility',
        'audits',
        'anomalies',
        'history',
        'quality',
        'graph',
        'epics'
      ].map((name) => 'classic/' + name + '.html'),
      ...['summary', 'components', 'activity', 'team', 'versions'].map(
        (name) => 'simplified/index.html#' + name
      )
    ]) {
      await page.goto(base + path);
      await page.waitForFunction(() => Reflect.get(window, 'dsqReview'));
      const result = await references(page);
      expect(result.collisions, path).toEqual([]);
      expect(result.ids.every(Boolean)).toBe(true);
      for (const id of result.ids) {
        expect(globalIds.has(id), String(id)).toBe(false);
        globalIds.add(id);
      }
    }
    await page.goto(base + 'simplified/index.html?review=1#components');
    const inspector = page.getByRole('complementary', { name: 'Revue du dashboard' });
    await expect(inspector).toBeVisible();
    const table = page.locator('[data-table-id="component-activity"]');
    const rowKey = await table.locator('tbody tr').first().getAttribute('data-review-key');
    const row = table
      .locator('tbody tr')
      .filter({ has: page.locator('[data-review-slot="s3e"]') })
      .filter({ visible: true });
    const original = await row.first().getAttribute('data-review-id');
    await table.getByLabel('Ordre', { exact: true }).selectOption('-1');
    const sameRow = table.locator('tbody tr').filter({ has: page.locator('td') });
    const sameId = await sameRow.evaluateAll(
      (rows, key) =>
        rows.find((item) => item.getAttribute('data-review-key') === key)?.getAttribute('data-review-id'),
      rowKey
    );
    expect(sameId).toBe(original);
    expect((await references(page)).collisions).toEqual([]);
    const buttons = table.locator('tbody tr').first().locator('td button');
    const first = buttons.nth(0);
    const value = first.locator('span');
    await first.click({ modifiers: ['Alt'] });
    await expect(page.locator('#detail')).not.toBeVisible();
    const copiedId = await inspector.locator('textarea').inputValue();
    expect(copiedId).toBe(await value.getAttribute('data-review-id'));
    expect(copiedId).not.toBe(await first.getAttribute('data-review-id'));
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await inspector.getByRole('button', { name: 'Copier l’identifiant', exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(copiedId);
    await inspector.getByRole('button', { name: 'Copier le contexte', exact: true }).click();
    const copied = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    expect(copied.element).toBe(copiedId);
    expect(copied).toHaveProperty('generation');
    expect(copied).not.toHaveProperty('valeurVisible');
    expect(copied).not.toHaveProperty('url');
    await page.evaluate(() =>
      Object.defineProperty(navigator.clipboard, 'writeText', {
        configurable: true,
        value: async () => {
          throw new Error('Presse-papiers refusé');
        }
      })
    );
    await inspector.getByRole('button', { name: 'Copier le contexte', exact: true }).click();
    await expect(inspector.getByRole('status')).toContainText('Ctrl+C');
    expect(JSON.parse(await inspector.locator('textarea').inputValue()).element).toBe(copiedId);
    await inspector.locator('textarea').fill(copiedId);
    await inspector.getByRole('button', { name: 'Retrouver', exact: true }).click();
    await expect(value).toHaveAttribute('data-review-selected', 'true');
    await inspector.locator('textarea').fill('DSQ1/absent');
    await inspector.getByRole('button', { name: 'Retrouver', exact: true }).click();
    await expect(inspector.getByRole('status')).toContainText('Référence absente');
    await first.click();
    await expect(page.locator('#detail')).toBeVisible();
    const firstDialog = await page.locator('#detail').getAttribute('data-review-id');
    const github = page.locator('#detail-actions a');
    if (await github.count()) {
      const linkId = await github.getAttribute('data-review-id');
      await github.evaluate((node) => node.setAttribute('href', 'https://github.test/other/repo/issues/999'));
      await references(page);
      await expect(github).toHaveAttribute('data-review-id', linkId!);
    }
    expect(firstDialog).toContain(encodeURIComponent('origin:'));
    expect((await references(page)).collisions).toEqual([]);
    await page.locator('#close-detail').click();
    await expect(inspector).toBeVisible();
    await buttons.nth(1).click();
    await expect(page.locator('#detail')).toBeVisible();
    expect(await page.locator('#detail').getAttribute('data-review-id')).not.toBe(firstDialog);
    expect((await references(page)).collisions).toEqual([]);
    await page.locator('#close-detail').click();
    await first.click();
    await expect(page.locator('#detail')).toHaveAttribute('data-review-id', firstDialog!);
    await page.locator('#close-detail').click();
    await table.getByRole('searchbox').fill('aucun résultat possible');
    expect((await references(page)).collisions).toEqual([]);
    await table.getByRole('searchbox').fill('');
    const after = await table
      .locator('tbody tr')
      .evaluateAll(
        (rows, key) =>
          rows.find((item) => item.getAttribute('data-review-key') === key)?.getAttribute('data-review-id'),
        rowKey
      );
    expect(after).toBe(original);
    // Une valeur, un titre et la destination web peuvent changer sans réassigner le rôle sélectionné.
    await value.evaluate((node) => {
      node.textContent = 'Valeur modifiée';
      node.setAttribute('title', 'Autre libellé');
    });
    await page.evaluate(() => Reflect.get(window, 'dsqReview').refresh());
    expect(await value.getAttribute('data-review-id')).toBe(copiedId);
    // La collision n’est jamais résolue par un numéro de ligne ou un suffixe automatique.
    await value.evaluate((node) => node.parentElement!.append(node.cloneNode(true)));
    expect((await references(page)).collisions.length).toBeGreaterThan(0);
    snapshot.snapshotId += '-generation-suivante';
    snapshot.capturedAt = '2026-10-27T00:00:00Z';
    snapshot.normalizedData.issues![0]!.title = 'Autre titre, même identité';
    const generation = copied.generation;
    await generateDashboard(snapshot, directory);
    await page.reload();
    await page.waitForFunction(() => Reflect.get(window, 'dsqReview'));
    const regenerated = await page
      .locator('[data-table-id="component-activity"] tbody tr')
      .evaluateAll(
        (rows, key) =>
          rows.find((item) => item.getAttribute('data-review-key') === key)?.getAttribute('data-review-id'),
        rowKey
      );
    expect(regenerated).toBe(original);
    await page
      .locator('[data-table-id="component-activity"] tbody tr')
      .first()
      .locator('button')
      .first()
      .click({ modifiers: ['Alt'] });
    const regeneratedContext = await page.evaluate(() => Reflect.get(window, 'dsqReview').reference());
    expect(regeneratedContext.generation).not.toBe(generation);
    const disabled = page.locator('[data-table-id="component-activity"] .pager button').first();
    const box = await disabled.boundingBox();
    expect(box).not.toBeNull();
    await page.keyboard.down('Alt');
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2);
    await page.keyboard.up('Alt');
    await expect(inspector.locator('textarea')).toHaveValue((await disabled.getAttribute('data-review-id'))!);
    await page.goto(base + 'simplified/index.html#summary');
    await page.waitForFunction(() => Reflect.get(window, 'dsqReview'));
    const heading = page.locator('#heading');
    const headingId = await heading.getAttribute('data-review-id');
    await page.locator('a.skip').focus();
    await page.keyboard.press('Enter');
    await expect(heading).toHaveAttribute('data-review-id', headingId!);
    expect((await references(page)).collisions).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
    await rm(directory, { recursive: true, force: true });
  }
});

test('identifiants : données anciennes, plusieurs repositories et grandes listes paginées', async ({
  page
}) => {
  const { consolidationSnapshot } = await import('../support/consolidation.js');
  const { paginationSnapshot } = await import('../support/pagination-snapshot.js');
  for (const snapshot of [consolidationSnapshot(), paginationSnapshot()]) {
    const directory = await mkdtemp(join(tmpdir(), 'dsq-review-variants-'));
    await generateDashboard(snapshot, directory);
    const server = await startDashboardServer(join(directory, 'dashboard'), 0);
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Port indisponible');
    try {
      for (const path of [
        'classic/graph.html',
        'classic/audits.html',
        'classic/components.html',
        'classic/quality.html',
        'classic/issues.html',
        'simplified/index.html#components',
        'simplified/index.html#activity',
        'simplified/index.html#versions'
      ]) {
        await page.goto(`http://127.0.0.1:${address.port}/` + path);
        await page.waitForFunction(() => Reflect.get(window, 'dsqReview'));
        const result = await references(page);
        expect(
          result.collisions.map((item: { slot: string; parent: string }) => item.slot + ':' + item.parent),
          path
        ).toEqual([]);
        const next = page.locator('[data-page-next]').filter({ visible: true }).first();
        if ((await next.count()) && (await next.isEnabled())) {
          const previousIds = result.ids;
          await next.click();
          expect((await references(page)).collisions).toEqual([]);
          await page.locator('[data-page-previous]').filter({ visible: true }).first().click();
          expect((await references(page)).ids).toEqual(previousIds);
        }
      }
    } finally {
      await page.goto('about:blank');
      server.closeAllConnections();
      await new Promise<void>((done, reject) => server.close((error) => (error ? reject(error) : done())));
      await rm(directory, { recursive: true, force: true });
    }
  }
});
