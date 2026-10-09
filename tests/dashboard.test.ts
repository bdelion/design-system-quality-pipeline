import { expect, it } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collectFixture } from '../src/collectors/fixture.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { buildSnapshot } from '../src/snapshots/snapshot.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { loadConfig } from '../src/config.js';

// Vérifie le contrat HTML public du dashboard sans dépendre d'un navigateur.
it('generates static dashboard pages from the snapshot contract', async () => {
  const raw = await collectFixture();
  const config = await loadConfig();
  const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
  const issues = evaluateDataQuality(raw, normalized, config.github);
  const snapshot = buildSnapshot(
    raw,
    normalized,
    issues,
    calculateKpis(normalized, issues),
    '2.1',
    'dq-test',
    'test'
  );
  const output = resolve(process.cwd(), 'data/test-dashboard');
  await generateDashboard(snapshot, output, 'https://github.test');
  const html = await readFile(resolve(output, 'dashboard/index.html'), 'utf8');
  expect(html).toContain('Vue d’ensemble');
  expect(html).toContain('design-system-react');
  expect(html).toContain('design-system-docs');
  expect(html).toContain('Délai moyen');
  expect(html).toContain('Temps de correction par repository');
  expect(html).toContain('Critères d’accessibilité');
  expect(html).toContain('focus');
  expect(html).toContain(
    'Les indicateurs sont calculés dans le pipeline puis expliqués ici avec leur périmètre, leur ratio et leur fiabilité.'
  );
  expect(html).toContain('Couverture Component × Version');
  expect(html).toContain('Fiabilité par métrique');
  expect(html).toContain('Pourquoi certains chiffres sont partiels');
  expect(html).not.toContain('Count of anomalies retained after DQ exclusions.');
  expect(html).toContain('window.__SNAPSHOT__');
  expect(html).toContain('class="sidebar"');
  expect(html).toContain('ArchInsight');
  expect(html).toContain('assets/logo.svg');
  const auditsHtml = await readFile(resolve(output, 'dashboard/audits.html'), 'utf8');
  expect(auditsHtml).toContain('Périmètre auditable');
  expect(auditsHtml).toContain('Composant → audit → anomalies');
  expect(auditsHtml).toContain('Composants actifs');
  expect(auditsHtml).toContain('Couverture');
  expect(auditsHtml).toContain('Traçabilité de chaque audit');
  expect(auditsHtml).toContain('data-component-table');
  expect(auditsHtml).toContain('data-component-result');
  expect(auditsHtml).toContain('Verdict par Component × Version');
  expect(auditsHtml).toContain('data-component-version-table');
  expect(auditsHtml).toContain('data-component-version-verdict');
  expect(auditsHtml).toContain('NON_COUVERT reste distinct de NON_CONFORME');
  expect(auditsHtml).toContain('design-system-react');
  const anomaliesHtml = await readFile(resolve(output, 'dashboard/anomalies.html'), 'utf8');
  expect(anomaliesHtml).toContain('Anomalies suivies');
  expect(anomaliesHtml).toContain('href="https://github.test/example/design-system-core/issues/101"');
  expect(anomaliesHtml).toContain('href="https://github.test/example/design-system-core/pull/201"');
  expect(anomaliesHtml).toContain('<th>PR</th>');
  expect(anomaliesHtml).toContain('<th>Catégorie</th>');
  expect(anomaliesHtml).toContain('data-criticality="major"');
  expect(anomaliesHtml).toContain('data-categories="focus"');
  expect(html).toContain('href="anomalies.html?criticality=major"');
  expect(html).toContain('href="anomalies.html?category=focus"');
  expect(anomaliesHtml).toContain('Cible : anomalie');
  expect(anomaliesHtml).toContain('Ouvrir la source');
  expect(anomaliesHtml).toContain('Aucune source GitHub disponible (nexus)');
  expect(anomaliesHtml).toContain('L’anomalie n’a pas de criticité.');
  expect(anomaliesHtml).not.toContain('<p>Anomaly has no criticality.</p>');
  expect(anomaliesHtml).toContain('Copier le YAML');
  expect(anomaliesHtml).toContain('data-copy-yaml=');
  expect(anomaliesHtml).toContain('data-filter-repository');
  expect(anomaliesHtml).toContain('data-filter-criticality');
  expect(anomaliesHtml).toContain('data-reset-filters');
  const graphHtml = await readFile(resolve(output, 'dashboard/graph.html'), 'utf8');
  expect(graphHtml).toContain('Repository → composant → audit → anomalie → PR');
  expect(graphHtml).toContain('assets/graph.js');
  expect(graphHtml).toContain('Patrimoine et chaîne de preuve');
  expect(graphHtml).toContain('data-map-filter');
  expect(graphHtml).toContain('data-map-kind-filter');
  expect(graphHtml).toContain('map-repository');
  expect(graphHtml).toContain('map-component');
  expect(graphHtml).toContain('map-node');
  expect(graphHtml).toContain('<option value="pr">Pull requests</option>');
  const graphScript = await readFile(resolve(output, 'dashboard/assets/graph.js'), 'utf8');
  expect(graphScript).toContain('data-map-node');
  expect(graphScript).toContain('data-map-kind-filter');
  const logo = await readFile(resolve(output, 'dashboard/assets/logo.svg'), 'utf8');
  expect(logo).toContain('<svg');
  await rm(output, { recursive: true, force: true });
});

it('shows source repository and first correction even when anomaly has no component', async () => {
  const raw = await collectFixture();
  const config = await loadConfig();
  const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
  const anomaly = normalized.anomalies[0]!;
  const issue = (normalized.issues ?? []).find((entry) => entry.issueId === anomaly.issueId)!;
  const library = normalized.libraries.find((entry) => entry.libraryId === issue.libraryId)!;
  anomaly.componentId = ' ';
  anomaly.correctedAt = '2026-10-01T16:09:00Z';
  anomaly.firstDoneAt = undefined;
  anomaly.createdAt = '2026-10-01T10:00:00Z';
  const issues = evaluateDataQuality(raw, normalized, config.github);
  const snapshot = buildSnapshot(
    raw,
    normalized,
    issues,
    calculateKpis(normalized, issues),
    '2.1',
    'dq-test',
    'test'
  );
  const output = resolve(process.cwd(), 'data/test-dashboard-regression');
  try {
    await generateDashboard(snapshot, output);
    const html = await readFile(resolve(output, 'dashboard/anomalies.html'), 'utf8');
    const row = html.match(new RegExp(`<tr[^>]*>[\\s\\S]*?${anomaly.anomalyId}[\\s\\S]*?<\\/tr>`))?.[0];
    expect(row).toBeDefined();
    expect(row).toContain(library.name);
    expect(row).not.toContain('repository inconnu');
    expect(row).toContain('composant non déterminé');
    expect(row).toContain('01/10/2026');
    expect(row).toContain('0.3 j');
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

it('renders cancelled status as a separate filter value and excludes it from done', async () => {
  const raw = await collectFixture();
  const config = await loadConfig();
  const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
  const anomaly = normalized.anomalies[0]!;
  anomaly.status = 'cancelled';
  anomaly.cancelled = true;
  delete anomaly.correctedAt;
  anomaly.firstDoneAt = undefined;
  const issues = evaluateDataQuality(raw, normalized, config.github);
  const snapshot = buildSnapshot(
    raw,
    normalized,
    issues,
    calculateKpis(normalized, issues),
    '2.1',
    'dq-test',
    'test'
  );
  const output = resolve(process.cwd(), 'data/test-dashboard-cancelled');
  try {
    await generateDashboard(snapshot, output);
    const html = await readFile(resolve(output, 'dashboard/anomalies.html'), 'utf8');
    const row = html
      .match(/<tr[^>]*>[\s\S]*?<\/tr>/g)
      ?.find((candidate) => candidate.includes(anomaly.anomalyId));
    expect(row).toContain('data-status="cancelled"');
    expect(row).toContain('Annulée');
    expect(row).not.toContain('data-status="done"');
    expect(html).toContain('<option value="cancelled">Annulée</option>');
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
