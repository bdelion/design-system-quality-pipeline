import { expect, it } from 'vitest';
import { presentWorkspaceKpi } from '../src/dashboard/assets/kpi-presentation.js';
import { workspaceCards } from '../src/dashboard/workspaces.js';
import { consolidationSnapshot } from './support/consolidation.js';
import { workspaceAnalytics } from '../src/analytics/workspaces.js';

it('présente taux et dénominateurs sans recalculer la formule métier', () => {
  expect(
    presentWorkspaceKpi('coverage', { coverage: (16 * 100) / 76, covered: 16, components: 76, unknown: 0 })
  ).toMatchObject({ value: '21,1 %', population: '16 sur 76 composants présents' });
  expect(presentWorkspaceKpi('conformity', { conformity: 50, conform: 8, covered: 16 })).toMatchObject({
    value: '50 %',
    population: '8 sur 16 composants couverts'
  });
  expect(presentWorkspaceKpi('treatmentRate', { treatmentRate: 0, treated: 0, declared: 20 })).toMatchObject({
    value: '0 %',
    population: '0 sur 20 issues non annulées'
  });
});

it('distingue zéro, dénominateur nul, valeur absente et présence inconnue', () => {
  expect(presentWorkspaceKpi('coverage', { coverage: 0, covered: 0, components: 4, unknown: 0 }).value).toBe(
    '0 %'
  );
  expect(presentWorkspaceKpi('coverage', { coverage: 0, covered: 0, components: 0 }).value).toBe(
    'Indisponible'
  );
  expect(presentWorkspaceKpi('coverage', { covered: 0, components: 4 }).value).toBe('Indisponible');
  expect(presentWorkspaceKpi('coverage', { coverage: 50, covered: 2, components: 4, unknown: 1 }).value).toBe(
    'Indisponible'
  );
  expect(presentWorkspaceKpi('nonCovered', { nonCovered: 0, unknown: 1 }).value).toBe('Indisponible');
  expect(presentWorkspaceKpi('declared', null)).toMatchObject({
    value: 'Indisponible',
    population: 'Population indisponible'
  });
  expect(presentWorkspaceKpi('declared', { declared: 0 })).toMatchObject({
    value: '0',
    population: 'issues d’accessibilité non annulées'
  });
});

it('associe jours, population mesurable, estimations et réserves de périmètre', () => {
  const result = presentWorkspaceKpi('average', {
    average: 5.2,
    measured: 12,
    actual: 10,
    estimated: 2,
    qualityIssues: 1
  });
  expect(result.value).toBe('5,2 j');
  expect(result.population).toContain('12 issues mesurables');
  expect(result.population).toContain('10 dates Done');
  expect(result.population).toContain('2 estimations');
  expect(result.reserve).toContain('1 réserve de données liée au périmètre');
  expect(presentWorkspaceKpi('median', { median: 0, measured: 1, actual: 1, estimated: 0 }).value).toBe(
    '0 j'
  );
  expect(presentWorkspaceKpi('p90', { p90: null, measured: 0 }).value).toBe('Indisponible');
});

it('rend les mêmes unités et populations dès le HTML initial, en mode complet et compact', () => {
  const snapshot = consolidationSnapshot();
  const model = workspaceAnalytics(snapshot.normalizedData);
  const summary = model.scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )!.summary;
  Object.assign(summary, {
    coverage: (16 * 100) / 76,
    covered: 16,
    components: 76,
    conform: 8,
    conformity: 50,
    unknown: 0,
    average: 5.2,
    measured: 12,
    actual: 10,
    estimated: 2,
    qualityIssues: 1
  });
  snapshot.analytics.workspaces = model;
  for (const compact of [false, true]) {
    const html = workspaceCards(snapshot, compact);
    expect(html).toContain('>21,1 %</strong>');
    expect(html).toContain('16 sur 76 composants présents');
    expect(html).toContain('>5,2 j</strong>');
    expect(html).toContain('12 issues mesurables');
    expect(html).toContain('data-workspace-reserve="coverage"');
    expect(html).toContain('1 réserve de données liée au périmètre');
  }
});
