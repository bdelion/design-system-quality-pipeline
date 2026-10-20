import { it, expect } from 'vitest';
import { componentPopulationRows } from '../src/dashboard/component-populations.js';
import { componentPopulationsSnapshot } from './support/component-populations.js';
import { generateClassicDashboard as generateDashboard } from '../src/dashboard/generate.js';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

it('rend un verdict manquant comme indéterminé dans la table historique sans modifier les agrégats', async () => {
  const snapshot = componentPopulationsSnapshot();
  delete snapshot.normalizedData.componentVersions![0]!.verdict;
  const before = JSON.stringify(snapshot);
  const directory = await mkdtemp(join(tmpdir(), 'dsq-verdict-unknown-'));
  try {
    await generateDashboard(snapshot, directory);
    const html = await readFile(join(directory, 'dashboard/audits.html'), 'utf8');
    const unknown = html.match(
      /<tr[^>]*data-component-version-row[^>]*data-verdict="unknown"[^>]*>[\s\S]*?<\/tr>/
    )?.[0];
    expect(unknown).toBeDefined();
    expect(unknown).toContain('indéterminé');
    expect(unknown).not.toContain('non couvert');
    expect(JSON.stringify(snapshot)).toBe(before);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

it('préserve cinq identités, quatre actifs et les preuves de deux versions sans fusionner les incarnations', () => {
  const snapshot = componentPopulationsSnapshot();
  const before = JSON.stringify(snapshot);
  const rows = componentPopulationRows(snapshot);
  expect(new Set(rows.map((row) => row.componentId)).size).toBe(5);
  expect(new Set(rows.filter((row) => row.active).map((row) => row.componentId)).size).toBe(4);
  expect(rows.filter((row) => row.version === '2.0.0' && row.presence === 'present')).toHaveLength(3);
  expect(rows.find((row) => row.componentId === 'mystery' && row.version === '2.0.0')!.presence).toBe(
    'unknown'
  );
  expect(rows.find((row) => row.componentId === 'modal' && row.version === '1.0.0')!.presence).toBe('absent');
  expect(rows.filter((row) => row.componentId === 'renamed' && row.presence === 'present')).toHaveLength(2);
  expect(rows.find((row) => row.componentId === 'renamed')!.aliases).toEqual(['OldName']);
  expect(rows.find((row) => row.componentId === 'tag-new' && row.version === '2.0.0')!.proof).toContain(
    'catalogue-proof-2'
  );
  expect(
    rows.find((row) => row.componentId === 'mystery' && row.version === '2.0.0')!.verdict
  ).toBeUndefined();
  expect(JSON.stringify(snapshot)).toBe(before);
});

it('conserve les identités sans PROD et expose les exclusions DQ sans toucher aux métriques', () => {
  const snapshot = componentPopulationsSnapshot();
  snapshot.normalizedData.versions!.forEach((version) => {
    delete version.prodTag;
  });
  delete snapshot.analytics.workspaces;
  snapshot.analytics.metrics['portfolio.components']!.exclusions.push({
    entityId: 'mystery',
    ruleId: 'DQ-SYNTHETIC'
  });
  const metrics = JSON.stringify(snapshot.analytics.metrics);
  const rows = componentPopulationRows(snapshot).filter((row) => row.current);
  expect(rows).toHaveLength(5);
  expect(rows.every((row) => row.presence === 'unknown' && row.versionId === '')).toBe(true);
  expect(rows.find((row) => row.componentId === 'mystery')!.exclusions).toContain(
    'portfolio.components : mystery (DQ-SYNTHETIC)'
  );
  expect(JSON.stringify(snapshot.analytics.metrics)).toBe(metrics);
});

it('ne transforme ni catalogue manquant, ni tag non prouvé, ni ambiguïté d’identité en absence', () => {
  const snapshot = componentPopulationsSnapshot();
  expect(
    componentPopulationRows(snapshot).find((row) => row.componentId === 'tag-old' && row.version === '2.0.0')!
      .presence
  ).toBe('unknown');
  delete snapshot.normalizedData.versions![0]!.prodTag;
  expect(
    componentPopulationRows(snapshot).find((row) => row.componentId === 'modal' && row.version === '1.0.0')!
      .presence
  ).toBe('unknown');
  snapshot.rawData.repositories.forEach((repository) => {
    delete repository.historicalCatalogues;
  });
  expect(
    componentPopulationRows(snapshot).find((row) => row.componentId === 'modal' && row.version === '1.0.0')!
      .presence
  ).toBe('unknown');
});
