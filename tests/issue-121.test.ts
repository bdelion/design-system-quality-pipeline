import { expect, it } from 'vitest';
import { githubTargets } from '../src/dashboard/assets/github-links.js';
import { applyProjectLinks, componentProjectLabels } from '../src/dashboard/project-links.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { benchmarkSnapshot } from './support/dashboard-load.js';

it('issue #121 : impose state:open à la recherche En cours, même si un état Project actif est Closed', () => {
  const sources = [
    { url: 'https://git.acme.internal/org/ui/issues/1', state: 'OPEN', labels: ['Component:Table'] },
    { url: 'https://git.acme.internal/org/ui/issues/2', state: 'CLOSED', labels: ['Component:Table'] }
  ];
  const result = githubTargets(sources, {
    state: 'open',
    requireState: true,
    matchLabels: true,
    allowBroader: true
  });
  expect(new URL(result.links[0]!.url).searchParams.get('q')).toContain('state:open');
  expect(result.stateMismatch).toBe(true);
});

it('issue #121 : les vues Done/Cancelled conservent le label source complet du composant', () => {
  const model = simplifiedModel(benchmarkSnapshot('control', 81));
  const table = model.tables.find((item) => item.id === 'component-activity')!;
  const labels = Object.fromEntries(
    table.rows.map((row) => [row.reviewKey, ['🧩 Widget: ' + row.cells[1]!.value]])
  );
  const refs = structuredClone(table.rows[0]!.cells[4]!.refs);
  applyProjectLinks(
    model.tables,
    {
      url: 'https://git.acme.internal/orgs/org/projects/1/views/2',
      keywords: { DONE: ['✅ Fait'], CANCELLED: ['Annulé'] }
    },
    labels
  );
  for (const index of [4, 5]) {
    const query = new URL(table.rows[0]!.cells[index]!.url!).searchParams.get('filterQuery');
    expect(query).toContain('label:' + JSON.stringify(labels[table.rows[0]!.reviewKey]![0]));
    expect(query).not.toContain('state:closed');
  }
  expect(table.rows[0]!.cells[4]!.refs).toEqual(refs);
});

it('issue #121 : résout préfixe et alias explicites sans inventer un label pour une source ancienne', () => {
  const snapshot = benchmarkSnapshot('control', 81);
  const component = snapshot.normalizedData.components[0]!;
  component.aliases.push('Ancien composant');
  const issue = snapshot.normalizedData.issues!.find((item) =>
    item.componentIds.includes(component.componentId)
  )!;
  issue.labels.push(
    '🧩 Widget: ' + component.name,
    '🧩 Widget: Ancien composant',
    '🧩 Widget: Autre composant',
    component.name
  );
  const labels = componentProjectLabels(snapshot, '🧩 Widget: ');
  expect(labels[component.componentId]).toEqual([
    '🧩 Widget: ' + component.name,
    '🧩 Widget: Ancien composant'
  ]);
  const model = simplifiedModel(snapshot);
  applyProjectLinks(
    model.tables,
    {
      url: 'https://git.acme.internal/orgs/org/projects/1/views/2',
      keywords: { DONE: ['Fait'], CANCELLED: ['Annulé'] }
    },
    componentProjectLabels(snapshot, 'Préfixe absent:')
  );
  expect(model.tables[0]!.rows[0]!.cells[4]!.url).toBeUndefined();
});

it('issue #121 : un filtre d’état requis ne devient pas l’URL directe d’un seul ticket', () => {
  const result = githubTargets(
    [{ url: 'https://git.acme.internal/org/ui/issues/1', state: 'OPEN', labels: ['Component:Table'] }],
    { state: 'open', requireState: true, directSingle: true, matchLabels: true }
  );
  expect(new URL(result.links[0]!.url).searchParams.get('q')).toContain('state:open');
  expect(result.links[0]!.search).toBe(true);
});
