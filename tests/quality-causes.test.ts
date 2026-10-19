import { expect, it } from 'vitest';
import {
  groupQualityRows,
  presentQualityCause,
  qualityCauseKey
} from '../src/dashboard/assets/quality-causes.js';
import type { QualityRow } from '../src/dashboard/quality-read-model.js';
import { dataQualityContent } from '../src/dashboard/workspaces.js';
import { paginationSnapshot } from './support/pagination-snapshot.js';

const row: QualityRow = {
  id: 'dq-1',
  ruleId: 'DQ-001',
  severity: 'ERROR',
  action: 'exclude',
  entityType: 'anomaly',
  entityId: 'a1',
  message: 'Anomaly has no criticality.',
  impacts: [{ metricId: 'anomaly.byCriticality', action: 'exclude', reason: 'Criticité absente' }],
  repositories: ['example/ui'],
  sourceUrl: 'https://github.enterprise.test/example/ui/issues/1',
  issueId: 'issue-1'
};

it('borne séparément le HTML initial à 50 causes et 50 occurrences sans modifier la capture', () => {
  const snapshot = paginationSnapshot();
  const before = JSON.stringify(snapshot);
  const html = dataQualityContent(snapshot, 'https://github.enterprise.test');
  expect(html.match(/data-quality-cause-row/g)).toHaveLength(50);
  expect(html.match(/data-quality-row[ >]/g)).toHaveLength(50);
  expect(html).toContain('3000 groupes · 3000 occurrences filtrées');
  expect(JSON.stringify(snapshot)).toBe(before);
});

it('réconcilie 120 occurrences d’une cause sans compter des défauts produit ni modifier les faits', () => {
  const rows = Array.from({ length: 120 }, (_, index) => ({
    ...structuredClone(row),
    id: `dq-${index}`,
    entityId: `a-${index}`
  }));
  const before = JSON.stringify(rows);
  const groups = groupQualityRows(rows);
  expect(groups).toHaveLength(1);
  expect(groups[0]!.rows).toHaveLength(120);
  expect(presentQualityCause(row)).toMatchObject({
    title: 'Criticité absente',
    action: 'Exclusion sur les indicateurs concernés'
  });
  expect(JSON.stringify(rows)).toBe(before);
});

it('sépare les messages, sévérités, actions, types, impacts et sources non résolues', () => {
  const variants = [
    row,
    { ...row, message: 'Autre cause' },
    { ...row, severity: 'WARNING' },
    { ...row, action: 'include' },
    { ...row, entityType: 'audit' },
    { ...row, impacts: [] },
    { ...row, sourceUrl: '' }
  ];
  expect(groupQualityRows(variants)).toHaveLength(variants.length);
  const effects = [...row.impacts, { metricId: 'other', action: 'unknown', reason: 'Autre effet' }];
  expect(qualityCauseKey({ ...row, impacts: effects })).toBe(
    qualityCauseKey({ ...row, impacts: [...effects].reverse() })
  );
});

it('n’invente aucune instruction pour une règle, source ou action inconnue', () => {
  expect(presentQualityCause({ ...row, ruleId: 'PERSONNALISEE' })).toMatchObject({
    title: 'Cause non documentée',
    next: 'Vérification non documentée pour cette règle.'
  });
  expect(presentQualityCause({ ...row, sourceUrl: '' }).next).toBe(
    'Source non résolue ; vérification indisponible.'
  );
  expect(presentQualityCause({ ...row, action: 'unknown' }).next).toBe(
    'Action inconnue ; vérification indisponible.'
  );
  expect(presentQualityCause({ ...row, action: 'block' })).toMatchObject({
    action: 'Action déclarée : blocage du traitement',
    next: 'Vérifier le label ou la donnée de criticité dans la source.'
  });
});
