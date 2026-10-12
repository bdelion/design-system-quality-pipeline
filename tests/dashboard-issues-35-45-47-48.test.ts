import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import { generateDashboard } from '../src/dashboard/generate.js';
import { componentGithubLinks } from '../src/dashboard/component-links.js';
import { dataQualityContent, accessibilityContent } from '../src/dashboard/workspaces.js';
import { consolidationSnapshot } from './support/consolidation.js';

/** Vérifie les recherches encodées et les états GitHub approchés sans modifier les faits métier. */
it('construit les recherches des composants avec les labels source et une base Enterprise', () => {
  const snapshot = consolidationSnapshot();
  const issues = snapshot.normalizedData.issues!;
  for (const issue of issues) issue.labels = ['Component: Button'];
  const links = componentGithubLinks(
    snapshot,
    issues[0]!.libraryId,
    'Button',
    'Component:',
    issues,
    'https://github.test/'
  );
  expect(new URL(links.issues).pathname).toBe('/acme/ds-react/issues');
  expect(new URL(links.issues).searchParams.get('q')).toContain('label:"Component: Button"');
  expect(new URL(links.open).searchParams.get('q')).toContain('is:open');
  expect(new URL(links.treated).searchParams.get('q')).toContain('is:closed reason:completed');
  expect(new URL(links.cancelled).searchParams.get('q')).toContain('reason:"not planned"');
  expect(new URL(links.audits).searchParams.get('q')).toContain('type:"audit"');
  expect(new URL(links.prs).searchParams.get('q')).toContain('is:pr in:body');
  expect(componentGithubLinks(snapshot, 'missing', 'Button', 'Component:', []).issues).toBe('');
});

/** Vérifie que les grandes populations n'engendrent ni URL excessive ni troncature silencieuse. */
it('répartit les références PR en recherches courtes sans perdre des issues', () => {
  const snapshot = consolidationSnapshot();
  const issue = snapshot.normalizedData.issues![0]!;
  const issues = Array.from({ length: 100 }, (_, i) => ({
    ...issue,
    issueId: `issue-${i}`,
    number: i + 100,
    linkedPullRequestIds: ['pr-a']
  }));
  const links = componentGithubLinks(snapshot, issue.libraryId, 'Button', 'Component:', issues);
  expect(links.prSearches.length).toBeGreaterThan(1);
  const queries = links.prSearches.map((url) => new URL(url).searchParams.get('q')!);
  for (const query of queries) expect(query.length).toBeLessThanOrEqual(240);
  for (const item of issues) expect(queries.join(' ')).toContain(`"#${item.number}"`);
});

/** Vérifie les destinations externes DQ et accessibilité, sans lier une entité inconnue. */
it('ouvre les sources GitHub explicites et conserve les diagnostics sans source', () => {
  const snapshot = consolidationSnapshot();
  const issue = snapshot.dataQuality.issues[0]!;
  snapshot.dataQuality.issues = [
    { ...issue, entityId: 'anomaly-a', entityType: 'issue' },
    { ...issue, id: 'orphan-diagnostic', entityId: 'source-unknown', entityType: 'unknown' }
  ];
  const quality = dataQualityContent(snapshot, 'https://github.test');
  expect(quality).toContain('href="https://github.test/acme/ds-react/issues/2" target="_blank"');
  expect(quality).not.toContain('>source-unknown ↗</a>');
  expect(accessibilityContent(snapshot)).toMatch(/target="_blank" rel="noopener noreferrer">#2 ↗<\/a>/);
});

/** Vérifie l'ordre global de l'accueil, les colonnes et la compatibilité des anciens snapshots. */
it('génère deux tableaux puis huit cartes et restitue les nouvelles informations d’activité', async () => {
  const snapshot = consolidationSnapshot();
  delete snapshot.analytics.teamActivity;
  const output = await mkdtemp(join(tmpdir(), 'dsq-dashboard-issues-'));
  try {
    await generateDashboard(snapshot, output);
    const overview = await readFile(join(output, 'dashboard/index.html'), 'utf8');
    expect(overview).not.toContain('data-context-filter');
    expect(overview).not.toContain('data-workspace-cards');
    expect(overview).not.toContain('data-global-only');
    expect(overview.indexOf('<h2>Qualité par repository')).toBeLessThan(
      overview.indexOf('<h2>Temps de traitement')
    );
    expect(overview.indexOf('<h2>Temps de traitement')).toBeLessThan(
      overview.indexOf('<h2>Patrimoine et activité globale')
    );
    expect(overview.match(/class="kpi-card metric-card"/g)).toHaveLength(8);
    const activity = await readFile(join(output, 'dashboard/issues.html'), 'utf8');
    expect(activity).toContain('data-team-count="issues">8');
    expect(activity).toContain('data-team-count="merged-prs">1');
    for (const label of ['Composants', 'Statut Project', 'Itération', 'Velocity source'])
      expect(activity).toContain(`Trier par ${label}`);
    const payload = JSON.parse(activity.match(/id="issue-explorer-data">([^<]+)<\/script>/)![1]!);
    expect(payload.items[0].projectContexts[0].projectName).toBe('Qualité');
    const components = await readFile(join(output, 'dashboard/components.html'), 'utf8');
    const rows = JSON.parse(components.match(/id="component-analysis-data">([^<]+)<\/script>/)![1]!);
    expect(rows[0].latestAuditUrl).toContain('/issues/1');
    expect(
      rows[0].auditSources.find((audit: { id: string }) =>
        rows[0].versionSummaries[0].auditIds.includes(audit.id)
      )
    ).toBeDefined();
  } finally {
    await rm(output, { recursive: true, force: true });
  }
});
