import { expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generateDashboard } from '../src/dashboard/generate.js';
import { pageContract } from './support/page-contract.js';
import { paginationSnapshot } from './support/pagination-snapshot.js';
import { decodePageModel } from '../src/dashboard/assets/page-model.js';
import { qualityReadModel } from '../src/dashboard/quality-read-model.js';

it('borne le HTML initial DQ à 50 lignes en conservant 3 000 diagnostics dans le seul contrat de cette page', async () => {
  const snapshot = paginationSnapshot();
  const before = JSON.stringify(snapshot);
  const output = await mkdtemp(join(tmpdir(), 'dsq-pagination-87-'));
  try {
    await generateDashboard(snapshot, output, 'https://github.enterprise.test');
    const html = await readFile(join(output, 'dashboard/quality.html'), 'utf8');
    expect([...html.matchAll(/<tr data-quality-row/g)]).toHaveLength(50);
    const model = pageContract(html);
    expect(model.data.quality).toHaveLength(3000);
    expect(model.data.quality!.at(-1)!.id).toBe('pagination-diagnostic-3000');
    expect(decodePageModel(JSON.stringify(model), 'quality')).toEqual(model);
    Reflect.deleteProperty(model.data, 'quality');
    expect(() => decodePageModel(JSON.stringify(model), 'quality')).toThrow(/absents/);
    expect(JSON.stringify(snapshot)).toBe(before);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

it('conserve les preuves Enterprise et les sources inconnues sans inventer de repository', () => {
  const snapshot = paginationSnapshot();
  snapshot.dataQuality.issues[1]!.entityId = 'orphelin';
  const rows = qualityReadModel(snapshot, 'https://github.enterprise.test');
  expect(rows[0]).toMatchObject({
    repositories: ['acme/ds-react'],
    sourceUrl: 'https://github.enterprise.test/acme/ds-react/issues/1',
    issueId: 'pagination-issue-1'
  });
  expect(rows[1]).toMatchObject({ repositories: [], sourceUrl: '', issueId: '' });
});
