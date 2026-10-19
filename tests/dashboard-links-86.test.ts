import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { generateDashboard } from '../src/dashboard/generate.js';
import { componentGithubLinks } from '../src/dashboard/component-links.js';
import { consolidationSnapshot } from './support/consolidation.js';

it('date les compteurs figés et distingue les recherches Enterprise sans changer leurs requêtes', async () => {
  const snapshot = consolidationSnapshot();
  snapshot.capturedAt = '2026-10-01T12:00:00.000Z';
  snapshot.normalizedData.anomalies[0]!.pullRequestRefs.push('pr-sans-source');
  snapshot.normalizedData.issues![0]!.url = '';
  const before = JSON.stringify(snapshot);
  const output = await mkdtemp(join(tmpdir(), 'dsq-links-86-'));
  try {
    await generateDashboard(snapshot, output, 'https://github.enterprise.test');
    const home = await readFile(join(output, 'dashboard/index.html'), 'utf8');
    expect(home).toContain('Snapshot du 2026-10-01. Compteurs figés');
    expect(home).toContain('GitHub actuel ≈ : recherche approchée, sans preuve du compte');
    expect(home).toContain('· GitHub actuel ≈ ↗</a>');
    expect(home).toContain('https://github.enterprise.test/acme/ds-react/issues?q=is%3Aissue');
    const components = await readFile(join(output, 'dashboard/components.html'), 'utf8');
    expect(components).toContain('Snapshot du 2026-10-01');
    const graph = await readFile(join(output, 'dashboard/graph.html'), 'utf8');
    expect(graph).not.toMatch(/class="map-node pr-node"[^>]*href="#"/);
    expect(graph).not.toContain('href="#traceability" target="_blank"');
    expect(graph).toContain(
      '<div class="map-node pr-node" data-map-node data-map-kind="pr"><span class="node-dot"></span><div><strong>pr-sans-source</strong>'
    );
    expect(JSON.stringify(snapshot)).toBe(before);
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

it('ne fabrique pas de recherche pour un repository absent et préserve les données partielles', () => {
  const snapshot = consolidationSnapshot();
  const issues = snapshot.normalizedData.issues!;
  const issue = issues[0]!;
  const links = componentGithubLinks(snapshot, issue.libraryId, 'Button', 'Component:', issues);
  expect(new URL(links.open).searchParams.get('q')).toContain('is:open');
  snapshot.rawData.repositories = [];
  expect(componentGithubLinks(snapshot, issue.libraryId, 'Button', 'Component:', issues).open).toBe('');
  expect(issues[0]).toBe(issue);
});
