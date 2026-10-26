import { test, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { consolidationSnapshot } from '../support/consolidation.js';
import { generateDashboard } from '../../src/dashboard/generate.js';
import { startDashboardServer } from '../../scripts/serve-dashboard.js';

test('issue #122 : un composant cumulé expose deux preuves héritées et leur milestone source', async ({
  page
}) => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const proof = data.audits.find((audit) => audit.issueId === 'audit-a')!;
  const issue = data.issues!.find((item) => item.issueId === proof.issueId)!;
  data.issues!.push({
    ...structuredClone(issue),
    issueId: 'second-proof',
    number: 99,
    url: 'https://github.com/acme/ds-react/issues/99'
  });
  data.audits.push({ ...proof, auditId: 'second-audit', issueId: 'second-proof' });
  const raw = snapshot.rawData.repositories[0]!.issues.find((item) => item.id === proof.issueId)!;
  snapshot.rawData.repositories[0]!.issues.push({
    ...structuredClone(raw),
    id: 'second-proof',
    number: 99,
    url: 'https://github.com/acme/ds-react/issues/99'
  });
  const version = data.versions!.find((item) => item.number === '2.0.0')!;
  const relation = data.componentVersions!.find(
    (item) => item.componentId === proof.componentId && item.versionId === version.versionId
  )!;
  relation.verdict = 'CONFORME';
  relation.applicableAuditIds = [proof.auditId, 'second-audit'];
  const directory = await mkdtemp(join(tmpdir(), 'dsq-122-'));
  await generateDashboard(snapshot, directory);
  const server = await startDashboardServer(join(directory, 'dashboard'), 0);
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Port indisponible');
  try {
    await page.goto(`http://127.0.0.1:${address.port}/simplified/index.html`);
    await page.getByRole('link', { name: 'Audits par version', exact: true }).click();
    const row = page
      .locator('[data-table-id="campaigns"] tbody tr')
      .filter({ has: page.getByText('2.0.0', { exact: true }) });
    await expect(row.locator('td').nth(8).getByRole('button')).toHaveText('1');
    await row.locator('td').nth(8).getByRole('button').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('tbody tr')).toHaveCount(2);
    await expect(dialog.locator('tbody')).not.toContainText('audit-ongoing');
    const query = new URL((await dialog.locator('#detail-actions a').getAttribute('href'))!).searchParams.get(
      'q'
    )!;
    expect(query).toContain('milestone:"1.0.0"');
    expect(query).not.toContain('2.0.0');
    expect(query).not.toContain('state:closed');
    expect(query).not.toContain('sub-issue');
    await expect(dialog.locator('#detail-actions a')).toHaveAttribute('target', '_blank');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  } finally {
    await page.goto('about:blank');
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
    await rm(directory, { recursive: true, force: true });
  }
});
