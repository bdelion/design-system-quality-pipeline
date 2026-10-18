import { pageContract } from './support/page-contract.js';
import { expect, it } from 'vitest';
import { readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collectFixture } from './support/fixtures.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { evaluateDataQuality } from '../src/quality/rules.js';
import { buildSnapshot } from '../src/snapshots/snapshot.js';
import { generateDashboard } from '../src/dashboard/generate.js';
import { loadConfig } from './support/fixtures.js';

// Vérifie le contrat HTML public du dashboard sans dépendre d'un navigateur.
it('generates static dashboard pages from the snapshot contract', async () => {
  const raw = await collectFixture();
  const config = await loadConfig('fixture');
  const normalized = normalizeGithub(
    raw,
    config.github,
    undefined,
    config.auditVersion,
    'https://github.test/'
  );
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
  expect(html).toContain('Moyenne');
  const diagnostics = await readFile(resolve(output, 'dashboard/quality.html'), 'utf8');
  expect(diagnostics).toContain('Temps de traitement des issues par repository');
  expect(diagnostics).toContain('Critères d’accessibilité');
  expect(html).toContain('focus');
  expect(diagnostics).toContain(
    'Les indicateurs sont calculés dans le pipeline puis expliqués ici avec leur périmètre, leur ratio et leur fiabilité.'
  );
  expect(diagnostics).toContain('Couverture Component × Version');
  expect(diagnostics).toContain('Fiabilité par métrique');
  expect(diagnostics).toContain('Pourquoi certains chiffres sont partiels');
  expect(html).not.toContain('Count of anomalies retained after DQ exclusions.');
  expect(html).toContain('dashboard-page-data');
  expect(html).toContain('class="sidebar"');
  expect(html).toContain('<span>Design System Quality</span>');
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
  const issuesHtml = await readFile(resolve(output, 'dashboard/issues.html'), 'utf8');
  expect(issuesHtml).toContain('Analyse des issues');
  for (const source of ['global', 'done', 'estimated']) {
    for (const statistic of ['average', 'median', 'p90']) {
      expect(issuesHtml).toContain(`data-issue-kpi="${source}-${statistic}"`);
    }
  }
  expect(issuesHtml).toContain('data-issue-components');
  expect(issuesHtml).toContain('data-issue-dedupe');
  expect(issuesHtml).toContain('data-issue-column-sort');
  expect(issuesHtml).toContain('assets/issues.js');
  expect(issuesHtml).toContain('dashboard-page-data');
  expect(html).toContain('href="issues.html"');
  const graphHtml = await readFile(resolve(output, 'dashboard/graph.html'), 'utf8');
  expect(graphHtml).toContain('Issues (tous types)');
  expect(graphHtml.includes('npm run dashboard:serve -- chemin/du/dashboard')).toBe(true);
  expect(graphHtml).toContain('data-map-kind="issue"');
  expect(graphHtml).toContain('href="https://github.test/example/design-system-react/issues/204"');
  expect(/href="https:\/\/github\.test\/[^" ]+\/pull\/\d+"/.test(graphHtml)).toBe(true);
  expect(graphHtml.includes('href="https://github.com/')).toBe(false);
  const historyHtml = await readFile(resolve(output, 'dashboard/history.html'), 'utf8');
  expect(auditsHtml).toContain('Audits en cours');
  expect(auditsHtml).toContain('Audits non évalués');
  expect(auditsHtml).toContain('Traçabilité de chaque audit, par version');
  expect(auditsHtml).toContain('data-audit-version=');
  expect(auditsHtml).toContain('État de l’audit');
  expect(historyHtml).toContain('data-history-issue-flows');
  expect(historyHtml).toContain('Flux des anomalies');
  expect(historyHtml).toContain('issues distinctes, tous types confondus');
  expect(historyHtml).toContain('Les flux des issues et des anomalies sont observés entre deux snapshots');
  expect(historyHtml).toContain('ne doivent pas être additionnés');
  expect(historyHtml).toContain('data-history-issue-stock');
  expect(historyHtml).toContain('Issues (tous types) : <strong>8</strong> distinctes');
  expect(historyHtml).toContain('<strong>3</strong> ouvertes');
  expect(historyHtml).toContain('<strong>5</strong> traitées');
  expect(historyHtml).toContain('<strong>0</strong> annulées');
  const anomaliesHtml = await readFile(resolve(output, 'dashboard/anomalies.html'), 'utf8');
  expect(anomaliesHtml).toContain('Anomalies suivies');
  expect(anomaliesHtml).toContain('href="https://github.test/example/design-system-core/issues/101"');
  expect(anomaliesHtml).toContain('href="https://github.test/example/design-system-core/pull/201"');
  expect(anomaliesHtml).toContain('<th scope="col">PR</th>');
  expect(anomaliesHtml).toContain('<th scope="col">Catégorie</th>');
  expect(anomaliesHtml).toContain('data-criticality="major"');
  expect(anomaliesHtml).toContain('data-categories="focus"');
  expect(diagnostics).toContain('href="anomalies.html?criticality=major"');
  expect(diagnostics).toContain('href="anomalies.html?category=focus"');
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
  expect(graphHtml).toContain('Repository → composant → issues / audit → anomalie → PR');
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
  const config = await loadConfig('fixture');
  const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
  const anomaly = normalized.anomalies[0]!;
  const issue = (normalized.issues ?? []).find((entry) => entry.issueId === anomaly.issueId)!;
  const library = normalized.libraries.find((entry) => entry.libraryId === issue.libraryId)!;
  anomaly.componentId = ' ';
  anomaly.correctedAt = '2026-10-01T16:09:00Z';
  anomaly.firstDoneAt = undefined;
  anomaly.effectiveCorrectedAt = '2026-10-01T16:09:00Z';
  anomaly.correctionDateSource = 'done';
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
  const config = await loadConfig('fixture');
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

it('does not display a negative correction delay for an inconsistent estimated closure', async () => {
  const raw = await collectFixture();
  const config = await loadConfig('fixture');
  const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
  const anomaly = normalized.anomalies[0]!;
  anomaly.createdAt = '2026-10-01T10:00:00Z';
  delete anomaly.correctedAt;
  anomaly.effectiveCorrectedAt = '2026-08-06T10:00:00Z';
  anomaly.correctionDateSource = 'issue_closed';
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
  const output = resolve(process.cwd(), 'data/test-dashboard-negative-date');
  try {
    await generateDashboard(snapshot, output);
    const html = await readFile(resolve(output, 'dashboard/anomalies.html'), 'utf8');
    const row = html.match(new RegExp(`<tr[^>]*>[\\s\\S]*?${anomaly.anomalyId}[\\s\\S]*?<\\/tr>`))?.[0];
    expect(row).toContain('Date incohérente');
    expect(row).not.toContain('-56.0 j');
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

it('uses the same treatment dates for Task issues across issues, components and overview', async () => {
  const raw = await collectFixture();
  const config = await loadConfig('fixture');
  const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
  const issue = normalized.issues!.find((item) => item.componentIds.length > 0)!;
  issue.rawIssueType = 'Task';
  issue.state = 'CLOSED';
  issue.createdAt = '2026-09-01T00:00:00.000Z';
  issue.closedAt = '2026-09-09T00:00:00.000Z';
  issue.projectContexts = [
    {
      projectId: 'project-test',
      projectName: 'Tests',
      status: 'DONE',
      statusHistory: [
        { rawStatus: 'Done', status: 'DONE', transitionedAt: '2026-09-03T00:00:00.000Z' },
        { rawStatus: 'Backlog', status: 'BACKLOG', transitionedAt: '2026-09-04T00:00:00.000Z' },
        { rawStatus: 'Done', status: 'DONE', transitionedAt: '2026-09-06T00:00:00.000Z' }
      ]
    }
  ];
  normalized.anomalies = normalized.anomalies.filter((item) => item.issueId !== issue.issueId);
  const quality = evaluateDataQuality(raw, normalized, config.github);
  const snapshot = buildSnapshot(
    raw,
    normalized,
    quality,
    calculateKpis(normalized, quality),
    '2.1',
    'dq-test',
    'test'
  );
  const output = resolve(process.cwd(), 'data/test-dashboard-consistency');
  try {
    await generateDashboard(snapshot, output, 'https://github.test');
    const issuesHtml = await readFile(resolve(output, 'dashboard/issues.html'), 'utf8');
    const componentsHtml = await readFile(resolve(output, 'dashboard/components.html'), 'utf8');
    const overviewHtml = await readFile(resolve(output, 'dashboard/quality.html'), 'utf8');
    const issuePayload = pageContract(issuesHtml).data.issues!;
    const componentRows = pageContract(componentsHtml).data.components!;
    const projectedIssue = issuePayload.items.find(
      (item: { number: number }) => item.number === issue.number
    );
    const componentItem = componentRows
      .flatMap((row: { items: { number: number }[] }) => row.items)
      .find((item: { number: number }) => item.number === issue.number);
    expect(projectedIssue).toMatchObject({ type: 'Task', status: 'closed', source: 'done', delay: 5 });
    expect(componentItem).toMatchObject({ treated: true, source: 'done', delay: 5 });
    expect(overviewHtml).toContain('Temps de traitement des issues par repository');
    expect(issuesHtml).toContain('Délai de traitement');
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});

// Contrat inter-pages : l'historique Project prime sur le statut déclaré et sur GitHub.
it('uses the last dated Project transition for reopened issues in both explorers', async () => {
  const raw = await collectFixture();
  const config = await loadConfig('fixture');
  const normalized = normalizeGithub(raw, config.github, undefined, config.auditVersion);
  const issue = normalized.issues!.find((item) => item.componentIds.length > 0)!;
  issue.rawIssueType = 'Documentation';
  issue.state = 'CLOSED';
  issue.createdAt = '2026-09-01T00:00:00.000Z';
  issue.closedAt = '2026-09-08T00:00:00.000Z';
  issue.projectContexts = [
    {
      projectId: 'project-test',
      projectName: 'Tests',
      status: 'DONE',
      statusHistory: [
        { rawStatus: 'Done', status: 'DONE', transitionedAt: '2026-09-03T00:00:00.000Z' },
        { rawStatus: 'Backlog', status: 'BACKLOG', transitionedAt: '2026-09-05T00:00:00.000Z' }
      ]
    }
  ];
  normalized.anomalies = normalized.anomalies.filter((item) => item.issueId !== issue.issueId);
  const quality = evaluateDataQuality(raw, normalized, config.github);
  const snapshot = buildSnapshot(
    raw,
    normalized,
    quality,
    calculateKpis(normalized, quality),
    '2.1',
    'dq-test',
    'test'
  );
  const output = resolve(process.cwd(), 'data/test-dashboard-last-transition');
  try {
    await generateDashboard(snapshot, output, 'https://github.test');
    const issuesHtml = await readFile(resolve(output, 'dashboard/issues.html'), 'utf8');
    const componentsHtml = await readFile(resolve(output, 'dashboard/components.html'), 'utf8');
    const issuePayload = pageContract(issuesHtml).data.issues!;
    const componentRows = pageContract(componentsHtml).data.components!;
    const projected = issuePayload.items.find((item: { number: number }) => item.number === issue.number);
    const component = componentRows
      .flatMap((row: { items: { number: number }[] }) => row.items)
      .find((item: { number: number }) => item.number === issue.number);
    expect(projected).toMatchObject({
      type: 'Documentation',
      status: 'open',
      delay: null,
      source: 'unavailable'
    });
    expect(component).toMatchObject({ open: true, treated: false, delay: null, source: 'unavailable' });
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
