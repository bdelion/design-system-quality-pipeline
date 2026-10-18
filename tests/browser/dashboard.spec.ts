import { workspaceAnalytics } from '../../src/analytics/workspaces.js';
import { consolidationSnapshot } from '../support/consolidation.js';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import type { Server } from 'node:http';
import { startDashboardTestServer } from '../../scripts/serve-dashboard-tests.js';
import { test, expect, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

let server: Server | undefined;

test('issue #79 : unités, populations et réserves des KPI après filtrage', async ({ page }) => {
  await page.route('**/accessibility.html*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script type="application\/json" id="workspace-data">)([\s\S]*?)(<\/script>)/,
      (_, start, json, end) => {
        const model = JSON.parse(json);
        const summary = {
          ...model.scopes[0].summary,
          coverage: (16 * 100) / 76,
          covered: 16,
          components: 76,
          conform: 8,
          conformity: 50,
          unknown: 0,
          declared: 20,
          treated: 0,
          treatmentRate: 0,
          average: 5.2,
          measured: 12,
          actual: 10,
          estimated: 2,
          qualityIssues: 1
        };
        model.scopes = [
          { repository: '', component: '', version: '', summary },
          {
            repository: 'acme/ds-react',
            component: 'Button',
            version: '1.0.0',
            summary: {
              ...summary,
              coverage: 0,
              covered: 0,
              components: 4,
              conformity: null,
              conform: 0,
              average: 0,
              measured: 1,
              actual: 1,
              estimated: 0,
              qualityIssues: 0
            }
          }
        ];
        return start + JSON.stringify(model) + end;
      }
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/accessibility.html');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('21,1 %');
  await expect(page.locator('[data-workspace-ratio="coverage"]')).toHaveText('16 sur 76 composants présents');
  await expect(page.locator('[data-workspace-kpi="conformity"]')).toHaveText('50 %');
  await expect(page.locator('[data-workspace-kpi="treatmentRate"]')).toHaveText('0 %');
  await expect(page.locator('[data-workspace-kpi="average"]')).toHaveText('5,2 j');
  await expect(page.locator('[data-workspace-ratio="average"]')).toContainText('12 issues mesurables');
  await expect(page.locator('[data-workspace-reserve="coverage"]')).toContainText(
    '1 réserve de données liée au périmètre'
  );
  await page.locator('[data-context-filter="repository"]').selectOption('acme/ds-react');
  await page.locator('[data-context-filter="component"]').selectOption('Button');
  await page.locator('[data-context-filter="version"]').selectOption('1.0.0');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('0 %');
  await expect(page.locator('[data-workspace-ratio="coverage"]')).toHaveText('0 sur 4 composants présents');
  await expect(page.locator('[data-workspace-kpi="conformity"]')).toHaveText('Indisponible');
  await expect(page.locator('[data-workspace-ratio="conformity"]')).toHaveText('Ratio indisponible');
  await expect(page.locator('[data-workspace-kpi="average"]')).toHaveText('0 j');
  await expect(page.locator('[data-workspace-ratio="average"]')).toContainText('1 issues mesurables');
  await expect(page.locator('[data-workspace-reserve="coverage"]')).toHaveText('');
  await page.goto('/accessibility.html?version=inconnue');
  await expect(page.locator('[data-workspace-kpi="declared"]')).toHaveText('Indisponible');
  await expect(page.locator('[data-workspace-ratio="declared"]')).toHaveText('Population indisponible');
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('21,1 %');
});

/** Prépare trois composants et cinq issues, dont une partagée, sans dépendance à une collecte privée. */
function componentCounterRows() {
  const facts = Array.from({ length: 5 }, (_, index) => ({
    id: `counter-issue-${index + 1}`,
    repo: 'acme/ds-react',
    components: index === 1 ? ['Button', 'Tag'] : [index === 0 ? 'Button' : index === 2 ? 'Tag' : 'Modal'],
    versions: [index < 3 ? '1.0.0' : '2.0.0'],
    versionIds: [index < 3 ? 'counter-v1' : 'counter-v2'],
    prs: [],
    open: false,
    treated: false,
    cancelled: false,
    delay: null,
    source: 'unknown'
  }));
  return ['Button', 'Tag', 'Modal'].map((name) => ({
    id: `counter-${name}`,
    name,
    repository: 'acme/ds-react',
    componentId: `counter-${name}`,
    items: facts.filter((fact) => fact.components.includes(name)),
    audits: 0,
    auditSources: [],
    versionSummaries: [
      {
        version: name === 'Modal' ? '2.0.0' : '1.0.0',
        versionId: name === 'Modal' ? 'counter-v2' : 'counter-v1',
        channel: 'development',
        auditSources: [],
        provenance: 'Scénario synthétique #78'
      }
    ]
  }));
}

/** Remplace uniquement le modèle de l'explorateur dans la page servie pour tester les compteurs. */
async function mockComponentCounters(page: Page, payload: unknown): Promise<void> {
  await page.route('**/components.html*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script type="application\/json" id="component-analysis-data">)[\s\S]*?(<\/script>)/,
      (_, start, end) => start + JSON.stringify(payload) + end
    );
    await route.fulfill({ response, body });
  });
}

test('issue #78 : compteurs distincts après filtres, sélection, reset et lien ciblé', async ({ page }) => {
  await mockComponentCounters(page, componentCounterRows());
  await page.goto('/components.html');
  const feedback = page.locator('[data-filter-feedback]');
  const summary = page.locator('[data-component-summary]');
  const rows = page.locator('[data-component-rows] tr');
  await expect(rows).toHaveCount(3);
  await expect(feedback).toContainText('3 composants visibles · 5 issues distinctes');
  await expect(feedback).toHaveAttribute('role', 'status');
  await expect(feedback).toHaveAttribute('aria-live', 'polite');
  await page.locator('[data-component-search]').fill('Tag');
  await expect(rows).toHaveCount(1);
  await expect(feedback).toContainText('1 composant visible · 2 issues distinctes');
  await page.locator('[data-component-search]').fill('introuvable');
  await expect(rows).toHaveCount(0);
  await expect(feedback).toContainText('0 composants visibles · 0 issues distinctes');
  await page.locator('[data-component-reset]').click();
  await page.getByRole('checkbox', { name: 'Sélectionner Button', exact: true }).check();
  await expect(feedback).toContainText(
    '3 composants visibles · 1 composant sélectionné · 2 issues distinctes dans la sélection'
  );
  await page.getByRole('checkbox', { name: 'Sélectionner Tag', exact: true }).check();
  await expect(feedback).toContainText('2 composants sélectionnés · 3 issues distinctes dans la sélection');
  await page.locator('[data-component-clear]').click();
  await expect(feedback).toContainText('3 composants visibles · 5 issues distinctes');
  await page.locator('[data-context-filter="repository"]').selectOption('acme/ds-react');
  await page.locator('[data-component-filter="name"]').selectOption('Tag');
  await page.locator('[data-context-filter="version"]').selectOption('1.0.0');
  await expect(rows).toHaveCount(1);
  const manual = await feedback.textContent();
  await expect(summary).toHaveText('1 composant visible · 2 issues distinctes');
  await page.goto('/components.html?repository=acme%2Fds-react&component=Tag&version=1.0.0');
  await expect(rows).toHaveCount(1);
  await expect(feedback).toHaveText(manual!);
  await page.locator('[data-clear-context]').click();
  await expect(rows).toHaveCount(3);
  await expect(feedback).toContainText('3 composants visibles · 5 issues distinctes');
  await page.locator('[data-component-filter="version"]').selectOption('2.0.0');
  await expect(rows).toHaveCount(1);
  await expect(feedback).toContainText('1 composant visible · 2 issues distinctes');
  await page.locator('[data-component-reset]').click();
  await expect(feedback).toContainText('3 composants visibles · 5 issues distinctes');
  await page.locator('[data-component-column="1"]').fill('Modal');
  await expect(rows).toHaveCount(1);
  await expect(feedback).toContainText('1 composant visible · 2 issues distinctes');
  await page.locator('[data-component-reset]').click();
  await expect(feedback).toContainText('3 composants visibles · 5 issues distinctes');
});

test('issue #78 : modèle indisponible distinct des résultats vides', async ({ page }) => {
  await mockComponentCounters(page, null);
  await page.goto('/components.html');
  await expect(page.locator('[data-filter-feedback]')).toContainText(
    'Données de l’explorateur indisponibles'
  );
  await expect(page.locator('[data-component-summary]')).toContainText(
    'Données de l’explorateur indisponibles'
  );
  await expect(page.locator('[data-component-search]')).toBeDisabled();
  await expect(page.locator('[data-component-count="global"]')).toHaveText('Indisponible');
});

test('issue #78 : un modèle vide reste un résultat nul disponible', async ({ page }) => {
  await mockComponentCounters(page, []);
  await page.goto('/components.html');
  await expect(page.locator('[data-filter-feedback]')).toContainText(
    '0 composants visibles · 0 issues distinctes'
  );
  await expect(page.locator('[data-component-search]')).toBeEnabled();
});

/** Vérifie sélection d'Epic, inconnues, zéro, liens externes et export CSV du modèle calculé. */
test('issue #69 : suivi des Epics et export CSV accessibles', async ({ page }) => {
  await page.route('**/epics.html', async (route) => {
    const response = await route.fetch();
    const model = {
      version: 1,
      epics: [
        {
          id: 'epic-test',
          number: 69,
          repository: 'acme/ui',
          title: 'Migration',
          referencesCaptured: true,
          rows: [
            {
              issueId: 'i1',
              number: 12,
              url: 'https://github.test/acme/ui/issues/12',
              component: 'Tag',
              velocity: 0,
              velocityReason: '',
              startedAt: '2026-01-01T00:00:00Z',
              finishedAt: '2026-01-04T00:00:00Z',
              elapsedHours: 72,
              reason: ''
            },
            {
              issueId: 'i2',
              number: 13,
              url: '',
              component: '=FORMULA()',
              velocity: null,
              velocityReason: 'Vélocité absente',
              startedAt: null,
              finishedAt: null,
              elapsedHours: null,
              reason: 'Historique Project absent'
            }
          ]
        }
      ]
    };
    const html = (await response.text()).replace(
      /(<script type="application\/json" id="epic-activity-data">)[\s\S]*?(<\/script>)/,
      (_, start, end) => start + JSON.stringify(model) + end
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('/epics.html');
  await page.getByLabel('Epic', { exact: true }).selectOption('epic-test');
  await expect(page.locator('[data-epic-summary]')).toContainText('2 issue(s) distincte(s)');
  const first = page.locator('[data-epic-rows] tr').first();
  await expect(first.locator('td').nth(2)).toHaveText('0');
  await expect(first.locator('td').last()).toHaveText('72');
  await expect(first.locator('a')).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-epic-rows]')).toContainText('Historique Project absent');
  await expect(page.locator('[data-epic-rows]')).toContainText('Vélocité absente');
  const waiting = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter CSV', exact: true }).click();
  const download = await waiting;
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('"Temps passé (h)"');
  expect(csv).toContain('"72"');
  expect(csv).toContain('"\'=FORMULA()"');
  expect(csv).toContain('Historique Project absent');
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze())
      .violations
  ).toEqual([]);
});
/** Vérifie les stocks et les trois cohortes des tableaux globaux, avec leurs destinations GitHub. */
test('vue d’ensemble : stocks cliquables et délais Ensemble, Done et closedAt', async ({ page }) => {
  await page.goto('/index.html');
  const inventory = page.getByRole('region', { name: 'Patrimoine et activité par repository' });
  await expect(inventory.locator('thead')).not.toContainText('Fiabilité');
  const row = inventory.locator('tbody tr').first();
  await expect(row.locator('td').nth(4)).toHaveText('8 ↗');
  await expect(row.locator('td').nth(5)).toHaveText('2 ↗');
  await expect(row.locator('td').nth(6)).toHaveText('1 ↗');
  for (const link of await row.locator('td:not(:first-child) a').all()) {
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  expect(
    new URL((await row.locator('td').nth(5).locator('a').getAttribute('href'))!).searchParams.get('q')
  ).toBe('is:issue is:open');
  expect(
    new URL((await row.locator('td').nth(6).locator('a').getAttribute('href'))!).searchParams.get('q')
  ).toBe('is:pr');
  const delays = page.getByRole('region', { name: 'Temps de traitement par repository' });
  await expect(delays.locator('thead tr').first().locator('th')).toHaveText([
    'Repository',
    'Ensemble (Done + closedAt)',
    'Sans estimation (Done)',
    'Avec estimation (closedAt)'
  ]);
  await expect(delays.locator('thead tr').nth(1).locator('th')).toHaveText(
    Array.from({ length: 3 }, () => ['Issues mesurables', 'Moyenne', 'Médiane', 'P90']).flat()
  );
  await expect(delays.locator('tbody tr').first().locator('td')).toHaveCount(13);
  await expect(delays).not.toContainText('Plus long délai');
});
test.beforeAll(async () => {
  server = await startDashboardTestServer();
});
test.afterAll(async () => {
  if (!server) return;
  server.closeAllConnections();
  await new Promise<void>((resolve) => server!.close(() => resolve()));
});

for (const pageName of [
  'index',
  'accessibility',
  'quality',
  'issues',
  'components',
  'audits',
  'anomalies',
  'graph',
  'history'
]) {
  test(`${pageName} : scripts sans erreur et accessibilité WCAG A/AA`, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`/${pageName}.html`);
    await expect(page.locator('h1')).toBeVisible();
    if (pageName === 'issues') await expect(page.locator('[data-issue-rows] tr').first()).toBeVisible();
    if (pageName === 'components')
      await expect(page.locator('[data-component-rows] tr').first()).toBeVisible();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(
      accessibility.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.map((node) => ({ target: node.target, summary: node.failureSummary }))
      }))
    ).toEqual([]);
    expect(errors).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('desktop.png'), fullPage: false });
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });
}

test('contexte multi-composants, références inconnues, effacement et liens ciblés', async ({ page }) => {
  await page.goto('/issues.html?repository=acme%2Fds-react&component=Modal');
  await expect(page.locator('[data-issue-summary]')).toContainText('1 issues distinctes');
  await expect(page.locator('[data-issue-rows]')).toContainText('5');
  await page.locator('[data-context-filter="component"]').selectOption('Button');
  await expect(page.locator('[data-issue-summary]')).toContainText('8 issues distinctes');
  await page.goto('/audits.html?repository=acme%2Fds-react&version=2.0.0');
  await expect(page.locator('[data-component-version-row]:visible')).toHaveCount(2);
  const inherited = page.locator('[data-component-version-row]:visible').filter({ hasText: 'Button' });
  await expect(inherited).toContainText('hérité');
  const auditLink = inherited.locator('a[href*="audit="]').first();
  await expect(auditLink).toHaveAttribute('href', /audit=/);
  await auditLink.click();
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await expect(page.locator('[data-audit-row]:visible')).toContainText('1.0.0');
  await page.goto('/components.html?component=Unknown');
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(0);
  await expect(page.locator('[data-context-filter="component"]')).toHaveValue('Unknown');
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-component-rows] tr')).toHaveCount(2);
});

test('KPI distincts cohérents entre explorateurs, sélection et CSV', async ({ page }) => {
  await page.goto('/issues.html?repository=acme%2Fds-react');
  const average = await page.locator('[data-issue-kpi="global-average"]').textContent();
  const median = await page.locator('[data-issue-kpi="global-median"]').textContent();
  await page.locator('[data-issue-dedupe]').click();
  await expect(page.locator('[data-issue-kpi="global-average"]')).toHaveText(average!);
  await page.locator('[data-issue-search]').fill('feature-multi');
  await expect(page.locator('[data-issue-kpi="global-average"]')).toHaveText('—');
  await page.locator('[data-issue-reset]').click();
  await page.locator('[data-issue-select-all]').check();
  await expect(page.locator('[data-issue-kpi="global-average"]')).toHaveText(average!);
  const download = page.waitForEvent('download');
  await page.locator('[data-issue-export]').click();
  expect((await download).suggestedFilename()).toContain('.csv');
  await page.goto('/components.html?repository=acme%2Fds-react');
  await expect(page.locator('[data-component-kpi="global-average"]')).toHaveText(average!);
  await expect(page.locator('[data-component-kpi="global-median"]')).toHaveText(median!);
  await page.locator('[data-component-filter="version"]').selectOption('2.0.0');
  await expect(page.locator('[data-component-rows]')).toContainText('Aucun résultat définitif');
  await expect(page.locator('[data-component-summary]')).toContainText('2 issues distinctes');
  await page.locator('[data-component-filter="version"]').selectOption('1.0.0');
  await expect(page.locator('[data-component-rows]')).toContainText('non conforme');
});

/** Vérifie les colonnes source, leurs filtres et leur export sans fusion de plusieurs Projects. */
test('activité : contextes Project multiples, Velocity source et CSV', async ({ page }) => {
  await page.route('**/issues.html', async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    const match = original.match(/id="issue-explorer-data">([^<]+)<\/script>/)!;
    const data = JSON.parse(match[1]!);
    data.items[0].projectContexts = [
      {
        projectId: 'a',
        projectName: 'Squad A',
        rawStatus: 'Done',
        iteration: { title: 'Sprint 23' },
        rawVelocity: 0
      },
      { projectId: 'b', projectName: 'Squad B', rawStatus: 'À qualifier', rawVelocity: 'à estimer' }
    ];
    await route.fulfill({
      response,
      body: original.replace(match[1]!, JSON.stringify(data).replace(/</g, '\\u003c'))
    });
  });
  await page.goto('/issues.html');
  await expect(page.locator('[data-team-count="issues"]')).toHaveText('8');
  await expect(page.locator('[data-team-count="merged-prs"]')).toHaveText('1');
  await page.locator('[data-issue-column="10"]').fill('Squad B : À qualifier');
  const row = page.locator('[data-issue-rows] tr').first();
  await expect(row).toContainText('Squad A : Sprint 23 ; Squad B : Non renseigné');
  await expect(row).toContainText('Squad A : 0 ; Squad B : à estimer');
  await expect(row.locator('td').nth(10)).toContainText('Button');
  await page.locator('[data-issue-column-sort="12"]').click();
  await expect(page.locator('[data-issue-column-sort="12"]').locator('..')).toHaveAttribute(
    'aria-sort',
    'ascending'
  );
  const downloadPromise = page.waitForEvent('download');
  await page.locator('[data-issue-export]').click();
  const download = await downloadPromise;
  const csv = await readFile((await download.path())!, 'utf8');
  expect(csv).toContain('"Statut Project";"Itération";"Velocity source"');
  expect(csv).toContain('Squad A : 0 ; Squad B : à estimer');
});

/** Vérifie les huit destinations des composants et les sources externes des autres espaces. */
test('composants, accessibilité et DQ : liens GitHub dans un nouvel onglet', async ({ page }) => {
  await page.goto('/components.html');
  const row = page.locator('[data-component-rows] tr').filter({ hasText: 'Button' });
  for (const index of [3, 4, 5, 6, 7, 8, 9, 10]) {
    const link = row.locator('td').nth(index).locator('a').first();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(link).toHaveAttribute('href', /^https:\/\/github.com\/acme\/ds-react\//);
  }
  const treated = new URL((await row.locator('td').nth(5).locator('a').getAttribute('href'))!);
  expect(treated.searchParams.get('q')).toContain('reason:completed');
  await expect(row.locator('td').nth(9).locator('a')).toHaveAttribute('href', /\/issues\/1$/);
  await expect(row.locator('td').nth(10).locator('a')).toHaveAttribute('href', /\/issues\/1$/);
  await page.locator('[data-component-filter="version"]').selectOption('2.0.0');
  await expect(row.locator('td').nth(10).locator('a')).toHaveAttribute('href', /\/issues\/3$/);
  await expect(row).toContainText('Aucun résultat définitif');
  await page.goto('/accessibility.html');
  for (const table of ['population', 'review']) {
    const link = page.locator(`#${table} tbody td:first-child a`).first();
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveText(/#\d+ ↗/);
  }
  await page.goto('/quality.html');
  await expect(page.locator('[data-quality-row] td:nth-child(5) a[target="_blank"]').first()).toHaveAttribute(
    'href',
    /^https:\/\/github.com\//
  );
  await page.goto('/components.html?component=Button');
  await expect(page.locator('[data-workspace-nav][href^="index.html"]')).toHaveAttribute(
    'href',
    'index.html'
  );
});

test('anomalie exacte, annulations, traçabilité et journal observé', async ({ page }) => {
  await page.goto('/graph.html?issue=anomaly-a');
  await expect(page.locator('[data-trace-row]:visible')).toHaveCount(1);
  await expect(page.locator('[data-trace-row]:visible')).toContainText('pr-a');
  await expect(page.locator('[data-trace-row]:visible')).toContainText('1.0.0');
  await page.locator('[data-trace-row]:visible a[href*="anomaly="]').click();
  await expect(page.locator('[data-table-row]:visible')).toHaveCount(1);
  await page.goto('/audits.html?progress=cancelled');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await expect(page.locator('[data-audit-row]:visible')).toContainText('annulé');
  await expect(page.locator('[data-audit-progress-filter]')).toHaveValue('cancelled');
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(3);
  await page.locator('[data-audit-progress-filter]').selectOption('completed');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await page.locator('[data-audit-result-filter]').selectOption('conform');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(0);
  await page.locator('[data-audit-result-filter]').selectOption('non_conform');
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(1);
  await page.locator('[data-reset-audit-filters]').click();
  await expect(page.locator('[data-audit-row]:visible')).toHaveCount(3);
  await page.goto('/history.html');
  await expect(page.locator('[data-transition-row]')).not.toHaveCount(0);
  await expect(
    page.getByText('Date métier = événement Project prouvé dans la période.', { exact: false })
  ).toBeVisible();
});

test('six espaces, explication proche du chiffre et absence des anciens cartouches globaux', async ({
  page
}) => {
  await page.goto('/index.html');
  await expect(page.locator('nav[aria-label="Navigation principale"] a')).toHaveCount(6);
  await expect(page.getByRole('heading', { name: 'Périmètre de navigation' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Preuves des métriques Analytics' })).toHaveCount(0);
  await page.goto('/accessibility.html');
  await page.locator('.metric-info-button').first().click();
  await expect(page.locator('#metric-info-declared')).toBeVisible();
  await page.goto('/quality.html');
  await expect(page.locator('[data-context-filter]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Alertes de qualité des données' })).toBeVisible();
});

test('les indicateurs accessibilité et la liste suivent le même périmètre et les versions héritées', async ({
  page
}) => {
  await page.goto('/accessibility.html?repository=acme%2Fds-react&component=Button&version=2.0.0');
  await expect(page.locator('[data-workspace-kpi="declared"]')).toHaveText('1');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('100 %');
  await expect(page.locator('#population [data-workspace-row]:visible')).toHaveCount(1);
  await expect(page.locator('#population [data-workspace-row]:visible')).toContainText('anomaly-a');
  await page.locator('[data-context-filter="component"]').selectOption('Modal');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('0 %');
  await expect(page.locator('[data-workspace-kpi="conformity"]')).toHaveText('Indisponible');
  await expect(page.locator('#population [data-workspace-row]:visible')).toHaveCount(0);
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('50 %');
});

test('liste de revue exportable et navigation depuis un ancien lien ciblé', async ({ page }) => {
  await page.goto('/accessibility.html#review');
  await expect(page.locator('#review')).toBeVisible();
  const download = page.waitForEvent('download');
  await page.locator('[data-accessibility-export="review"]').click();
  expect((await download).suggestedFilename()).toBe('accessibilite-review.csv');
  await page.goto('/graph.html?issue=anomaly-a');
  await page.locator('[data-workspace-nav][href^="accessibility.html"]').click();
  await expect(page.locator('[data-workspace-kpi="declared"]')).toBeVisible();
  expect(new URL(page.url()).searchParams.has('issue')).toBe(false);
});

/** Vérifie qu’un filtre métier ancien ne laisse pas afficher des agrégats hors périmètre. */
test('un ancien filtre de catégorie masque les agrégats non calculés pour ce filtre', async ({ page }) => {
  await page.goto('/accessibility.html?category=non-existent');
  await expect(page.locator('[data-workspace-cards]')).toBeHidden();
  await expect(page.locator('[data-workspace-summary]')).toContainText('liste de preuves');
  await expect(page.locator('#population [data-workspace-row]:visible')).toHaveCount(0);
});

/** Vérifie que l'accueil global ignore les filtres conservés dans une ancienne URL. */
test('la synthèse globale reste visible à l’accueil même avec un ancien filtre', async ({ page }) => {
  await page.goto('/index.html');
  await expect(page.getByRole('heading', { name: 'Patrimoine et activité globale' })).toBeVisible();
  await expect(page.getByText('Défauts normalisés déclarés', { exact: true })).toBeVisible();
  await page.goto('/index.html?component=Modal');
  await expect(page.getByRole('heading', { name: 'Patrimoine et activité globale' })).toBeVisible();
  await expect(page.locator('[data-context-filter]')).toHaveCount(0);
  await expect(page.locator('.kpi-card')).toHaveCount(8);
  await expect(page.locator('[data-metric-id="portfolio.components"]')).toHaveAttribute(
    'href',
    'components.html'
  );
  await expect(page.getByRole('heading', { name: 'Patrimoine et activité par repository' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Temps de traitement des issues par repository' })
  ).toBeVisible();
});

/** Vérifie les filtres repository et de diagnostic, les compteurs et leur réinitialisation. */
test('repository et tableau de qualité répondent aux changements de filtres', async ({ page }) => {
  await page.goto('/accessibility.html');
  const repo = page.locator('[data-context-filter="repository"]');
  await repo.selectOption('acme/ds-react');
  await repo.dispatchEvent('change');
  expect(new URL(page.url()).searchParams.get('repository')).toBe('acme/ds-react');
  await expect(page.locator('[data-filter-feedback]')).toContainText('acme/ds-react');
  await page.locator('[data-clear-context]').click();
  await expect(page.locator('[data-context-filter="repository"]')).toHaveValue('');
  await page.goto('/quality.html');
  const total = await page.locator('[data-quality-row]').count();
  expect(total).toBeGreaterThan(0);
  await page.locator('[data-quality-filter="repository"]').selectOption('__unknown__');
  await expect(page.locator('[data-quality-row]:visible')).not.toHaveCount(total);
  await page.locator('[data-quality-reset]').click();
  await page.locator('[data-quality-filter="dqSearch"]').fill('aucun-diagnostic-possible');
  await expect(page.locator('[data-quality-count]')).toHaveText('0');
  await expect(page.locator('[data-quality-row]:visible')).toHaveCount(0);
  await page.locator('[data-quality-reset]').click();
  await expect(page.locator('[data-quality-count]')).toHaveText(String(total));
  const value = await page.locator('[data-quality-filter="dqRule"] option').nth(1).getAttribute('value');
  await page.locator('[data-quality-filter="dqRule"]').selectOption(value!);
  const rows = page.locator('[data-quality-row]:visible');
  expect(await rows.count()).toBeGreaterThan(0);
  for (const cell of await rows.locator('td:first-child').allTextContents()) expect(cell).toBe(value);
});

/** Signale le mode fichier avant tout chargement des modules JavaScript. */
test('le mode fichier explique les filtres désactivés', async ({ page }) => {
  await page.goto(pathToFileURL(resolve('data/browser-consolidation/dashboard/index.html')).href);
  await expect(page.locator('[data-file-warning]')).toBeVisible();
  await expect(page.locator('[data-context-filter]')).toHaveCount(0);
  await page.goto(pathToFileURL(resolve('data/browser-consolidation/dashboard/accessibility.html')).href);
  await expect(page.locator('[data-file-warning]')).toBeVisible();
  await expect(page.locator('[data-context-filter="repository"]')).toBeDisabled();
});

/** Vérifie les cartes et ratios en présence de composants connus sans preuves de présence versionnée. */
test('la présence inconnue rend les ratios et le stock non couvert indisponibles', async ({ page }) => {
  const snapshot = consolidationSnapshot();
  snapshot.normalizedData.componentVersions = [];
  const model = workspaceAnalytics(snapshot.normalizedData, snapshot.dataQuality.issues);
  await page.route('**/accessibility.html', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /(<script type="application\/json" id="workspace-data">)[\s\S]*?(<\/script>)/,
      (_match, start, end) => start + JSON.stringify(model).replace(/</g, '\\u003c') + end
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/accessibility.html');
  await expect(page.locator('[data-workspace-kpi="coverage"]')).toHaveText('Indisponible');
  await expect(page.locator('[data-workspace-ratio="coverage"]')).toHaveText('Ratio indisponible');
  await expect(page.locator('[data-workspace-ratio="conformity"]')).toHaveText('Ratio indisponible');
  await expect(page.locator('[data-workspace-kpi="nonCovered"]')).toHaveText('Indisponible');
  await expect(page.locator('[data-workspace-kpi="unknown"]')).toHaveText('2');
});

test('les graphiques accessibilité restituent les agrégats et suivent les filtres', async ({
  page
}, testInfo) => {
  await page.goto('/accessibility.html');
  await expect(page.locator('[data-distribution]')).toHaveCount(3);
  await page.locator('.distribution-grid').screenshot({ path: testInfo.outputPath('distributions.png') });
  for (const repository of ['', 'acme/ds-react']) {
    await page.locator('[data-context-filter="repository"]').selectOption(repository);
    const summary = await page
      .locator('#workspace-data')
      .evaluate(
        (node, repo) =>
          JSON.parse(node.textContent!).scopes.find(
            (scope: { repository: string; component: string; version: string }) =>
              scope.repository === repo && !scope.component && !scope.version
          ).summary,
        repository
      );
    const rows = page.locator('[data-distribution="criticality"] .distribution-row');
    await expect(rows).toHaveCount(Object.keys(summary.criticalities).length);
    let index = 0;
    for (const item of Object.values(summary.criticalities) as { declared: number }[]) {
      await expect(rows.nth(index++).locator('strong')).toHaveText(String(item.declared));
    }
    await expect(page.locator('[data-distribution="category"] .distribution-row')).toHaveCount(
      Object.keys(summary.categories).length
    );
    for (const dimension of ['category', 'component']) {
      const values = await page
        .locator(`[data-distribution="${dimension}"] .distribution-label`)
        .allTextContents();
      expect(values).toEqual([...values].sort((a, b) => a.localeCompare(b, 'fr', { numeric: true })));
    }
  }
  await page.goto('/accessibility.html?category=unknown');
  await expect(page.locator('[data-distribution]')).toHaveCount(0);
  await expect(page.locator('[data-workspace-breakdowns]')).toContainText('indisponibles');
});

test('issue #49 : résultat par version auditée sans catalogue historique ni héritage implicite', async ({
  page
}) => {
  await page.route('**/components.html', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /(<script type="application\/json" id="component-analysis-data">)([\s\S]*?)(<\/script>)/,
      (_, start, content, end) => {
        const row = JSON.parse(content)[0];
        row.name = 'Tag';
        row.versionSummaries = [];
        row.latestAuditId = 'audit-tag';
        row.conformity = 'conforme';
        row.auditSources = [
          {
            id: 'audit-tag',
            version: '1.7.1',
            versionId: 'v171',
            status: 'completed',
            result: 'conforme',
            url: 'https://github.test/audit/1'
          },
          {
            id: 'audit-dev',
            version: '1.8.0',
            versionId: 'v180',
            status: 'ongoing',
            result: '',
            url: 'https://github.test/audit/2'
          }
        ];
        return start + JSON.stringify([row]) + end;
      }
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('/components.html');
  const rows = page.locator('[data-component-rows]');
  await expect(rows).toContainText('conforme · 1.7.1');
  await expect(rows).not.toContainText('NON_COUVERT');
  await page.locator('[data-component-filter="version"]').selectOption('1.8.0');
  await expect(rows).toContainText('Aucun résultat définitif · 1.8.0');
  await expect(rows).not.toContainText('conforme · 1.8.0');
  await page.locator('[data-component-filter="version"]').selectOption('1.7.1');
  await expect(rows).toContainText('conforme · 1.7.1');
});

test('historique : affiche les preuves et la conformité héritée sans inventer un audit de développement', async ({
  page
}) => {
  await page.route('**/components.html', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /(<script type="application\/json" id="component-analysis-data">)([\s\S]*?)(<\/script>)/,
      (_, start, content, end) => {
        const row = JSON.parse(content)[0];
        row.name = 'Tag';
        row.componentIds = [row.componentId];
        row.latestAuditId = 'audit-tag';
        row.auditSources = [
          {
            id: 'audit-tag',
            version: '1.7.1',
            versionId: 'v171',
            status: 'completed',
            result: 'conforme',
            url: 'https://github.test/audit/1'
          }
        ];
        row.versionSummaries = [
          {
            version: '1.7.1',
            versionId: 'v171',
            channel: 'release',
            publication: 'PROD',
            conformity: 'CONFORME',
            provenance: 'local-history:1.7.1:AS484',
            auditSources: [{ id: 'audit-tag', url: 'https://github.test/audit/1' }]
          },
          {
            version: '1.8.0',
            versionId: 'v180',
            channel: 'development',
            conformity: 'CONFORME',
            provenance: 'local-history:1.8.0:AT484',
            auditSources: [{ id: 'audit-tag', url: 'https://github.test/audit/1' }]
          }
        ];
        return start + JSON.stringify([row]) + end;
      }
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('/components.html');
  await page.locator('[data-component-filter="version"]').selectOption('1.8.0');
  const history = page.locator('[data-component-history]');
  await history.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(history).toContainText('Développement');
  await expect(history).toContainText('Conforme');
  await expect(history).toContainText('AT484');
  await expect(history.locator('a')).toHaveAttribute('href', 'https://github.test/audit/1');
  await expect(history.locator('a')).toHaveAttribute('target', '_blank');
  await expect(page.locator('[data-component-rows]')).toContainText('Aucun résultat définitif');
  await expect(page.locator('[data-component-rows]')).not.toContainText('conforme · 1.8.0');
});

test('issue #49 : comparaison des audits par version cible et non couverture héritée', async ({ page }) => {
  await page.goto('/audits.html');
  const summary = page.locator('[data-audit-campaign-summary]');
  await expect(summary).toContainText('Résultats d’audit par repository et version cible');
  await expect(summary).toContainText('Anomalies liées');
  await expect(summary.locator('[data-audit-campaign]')).toHaveCount(2);
  const current = summary.locator('[data-audit-campaign]').filter({ hasText: '2.0.0' });
  await expect(current.locator('td').nth(4)).toHaveText('0');
  await expect(current.locator('td').nth(5)).toHaveText('1');
  await expect(current.locator('td').nth(8)).toHaveText('0');
  await expect(current.locator('td').nth(9)).toHaveText('0');
  await expect(
    page.getByRole('heading', { name: 'Couverture des dernières versions PROD par repository' })
  ).toHaveCount(0);
});

test('tris indépendants des répartitions : intitulés, nombres, égalités et conservation au filtrage', async ({
  page
}) => {
  await page.route('**/accessibility.html', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /(<script type="application\/json" id="workspace-data">)([\s\S]*?)(<\/script>)/,
      (_, start, content, end) => {
        const model = JSON.parse(content);
        for (const scope of model.scopes) {
          scope.summary.categories = { Zebra: 1, Beta: 2, Alpha: 2 };
          scope.summary.byComponent = { Zebra: 1, Beta: 2, Alpha: 2 };
        }
        return start + JSON.stringify(model) + end;
      }
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('/accessibility.html');
  const category = page.locator('[data-distribution-sort="category"]');
  const labels = page.locator('[data-distribution="category"] .distribution-label');
  await expect(labels).toHaveText(['Alpha', 'Beta', 'Zebra']);
  await category.selectOption('label-desc');
  await expect(labels).toHaveText(['Zebra', 'Beta', 'Alpha']);
  await expect(category).toBeFocused();
  await category.selectOption('count-asc');
  await expect(labels).toHaveText(['Zebra', 'Alpha', 'Beta']);
  await category.selectOption('count-desc');
  await expect(labels).toHaveText(['Alpha', 'Beta', 'Zebra']);
  await expect(page.locator('[data-distribution-sort="component"]')).toHaveValue('label-asc');
  await page.locator('[data-distribution-sort="component"]').selectOption('label-desc');
  await page.locator('[data-context-filter="repository"]').selectOption('acme/ds-react');
  await expect(category).toHaveValue('count-desc');
  await expect(labels).toHaveText(['Alpha', 'Beta', 'Zebra']);
  await expect(page.locator('[data-distribution="component"] .distribution-label')).toHaveText([
    'Zebra',
    'Beta',
    'Alpha'
  ]);
  await expect(page.locator('[data-distribution="criticality"] select')).toHaveCount(0);
});

test('issue #65 : ordre initial repository puis composant indépendant de l’ordre du payload', async ({
  page
}) => {
  await page.route('**/components.html', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(
      /(<script type="application\/json" id="component-analysis-data">)([\s\S]*?)(<\/script>)/,
      (_, start, content, end) => start + JSON.stringify(JSON.parse(content).reverse()) + end
    );
    await route.fulfill({ response, body: html });
  });
  await page.goto('/components.html');
  const rows = await page
    .locator('[data-component-rows] tr')
    .evaluateAll((nodes) =>
      nodes.map((node) => [node.children[1]!.textContent!.trim(), node.children[2]!.textContent!.trim()])
    );
  expect(rows.length).toBeGreaterThan(1);
  expect(rows).toEqual(
    [...rows].sort(
      (a, b) =>
        a[0]!.localeCompare(b[0]!, 'fr', { numeric: true }) ||
        a[1]!.localeCompare(b[1]!, 'fr', { numeric: true })
    )
  );
});

test('cartes compactes et infobulles utilisables au clavier et à la souris sur PC', async ({
  page
}, testInfo) => {
  await page.goto('/accessibility.html');
  const button = page.locator('.metric-info-button').first();
  const card = page.locator('.compact-kpi').first();
  const cardBounds = await card.boundingBox();
  const buttonBounds = await button.boundingBox();
  expect(buttonBounds!.width).toBeLessThanOrEqual(24);
  expect(buttonBounds!.y - cardBounds!.y).toBeLessThan(16);
  expect(cardBounds!.height).toBeLessThan(180);
  await card.screenshot({ path: testInfo.outputPath('compact-card.png') });
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.metric-tooltip:popover-open')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await button.click();
  const tooltip = page.locator('.metric-tooltip:popover-open');
  const bounds = await tooltip.boundingBox();
  await tooltip.screenshot({ path: testInfo.outputPath('metric-tooltip.png') });
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze())
      .violations
  ).toEqual([]);
});
