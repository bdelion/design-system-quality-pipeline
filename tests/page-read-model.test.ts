import { expect, it } from 'vitest';
import { dashboardPageModel } from '../src/dashboard/page-read-model.js';
import { consolidationSnapshot } from './support/consolidation.js';
import { decodePageModel } from '../src/dashboard/assets/page-model.js';

it('projette une enveloppe versionnée propre à chaque usage sans modifier la capture', () => {
  const snapshot = consolidationSnapshot();
  const before = JSON.stringify(snapshot);
  for (const page of ['index', 'anomalies', 'graph', 'history'] as const) {
    const model = dashboardPageModel(snapshot, page);
    expect(model.schema).toBe('dsq-dashboard-page');
    expect(model.version).toBe(1);
    expect(model.page).toBe(page);
    expect(model.data).toEqual({});
    expect(JSON.stringify(model)).not.toMatch(/rawData|normalizedData|componentVersions|analytics/);
  }
  const audits = dashboardPageModel(snapshot, 'audits');
  expect(dashboardPageModel(snapshot, 'quality').data.quality).toHaveLength(
    snapshot.dataQuality.issues.length
  );
  expect(audits.data.workspaces!.scopes.length).toBeGreaterThan(0);
  expect(audits.data.workspaces).not.toHaveProperty('rows');
  expect(audits.data.workspaces!.scopes[0]!.summary).not.toHaveProperty('sourceIds');
  expect(dashboardPageModel(snapshot, 'accessibility').data.workspaces).toHaveProperty('rows');
  expect(dashboardPageModel(snapshot, 'issues').data.issues!.items.length).toBeGreaterThan(0);
  expect(dashboardPageModel(snapshot, 'components').data.components!.length).toBeGreaterThan(0);
  expect(dashboardPageModel(snapshot, 'epics').data.epics!.version).toBe(1);
  expect(JSON.stringify(snapshot)).toBe(before);
});

it('valide les dix contrats et explique les absences sans inventer de données', () => {
  const snapshot = consolidationSnapshot();
  for (const page of [
    'index',
    'issues',
    'components',
    'accessibility',
    'audits',
    'anomalies',
    'graph',
    'history',
    'quality',
    'epics'
  ] as const) {
    const model = dashboardPageModel(snapshot, page);
    expect(decodePageModel(JSON.stringify(model), page)).toEqual(model);
    expect(() => decodePageModel(JSON.stringify({ ...model, version: 99 }), page)).toThrow(/Version/);
  }
  expect(() => decodePageModel('{', 'index')).toThrow(/illisibles/);
  expect(() => decodePageModel(JSON.stringify(dashboardPageModel(snapshot, 'index')), 'issues')).toThrow(
    /autre page/
  );
  for (const data of [{}, { issues: null }, { issues: { items: [], componentPrefix: 'x' }, rawData: {} }])
    expect(() =>
      decodePageModel(JSON.stringify({ ...dashboardPageModel(snapshot, 'issues'), data }), 'issues')
    ).toThrow(/absents|indisponibles/);
  const model = dashboardPageModel(snapshot, 'accessibility');
  delete model.data.workspaces!.rows;
  expect(() => decodePageModel(JSON.stringify(model), 'accessibility')).toThrow(/accessibilité/);
  const incomplete = dashboardPageModel(snapshot, 'audits');
  const summary = incomplete.data.workspaces!.scopes[0]!.summary;
  Reflect.deleteProperty(summary, 'declared');
  expect(() => decodePageModel(JSON.stringify(incomplete), 'audits')).toThrow(/Synthèses/);
  const issues = dashboardPageModel(snapshot, 'issues');
  Reflect.deleteProperty(issues.data.issues!.items[0]!, 'versionIds');
  expect(() => decodePageModel(JSON.stringify(issues), 'issues')).toThrow(/issues indisponibles/);
});
