import { expect, it } from 'vitest';
import { anonymizeHistoricalComponents, validateHistoricalComponents } from '../src/historical-components.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { consolidationRaw, rules } from './support/consolidation.js';

/** Produit une présence déclarée tardive, sans inventer une absence sur la version antérieure. */
function declaredHistory() {
  return {
    schemaVersion: 1,
    repository: 'ds-react',
    versions: ['1.0.0', '1.1.0'].map((version) => ({ version, channel: 'release', sourceLabel: version })),
    components: [
      {
        name: 'DateBox',
        history: [
          {
            version: '1.1.0',
            channel: 'release',
            present: true,
            change: 'unspecified',
            identity: 'datebox',
            historicalName: 'DateBox',
            evidence: [],
            declaration: { reference: 'confirmation-20261028' }
          }
        ]
      }
    ]
  };
}

it('préserve la déclaration et ne fabrique ni cellule, ni absence antérieure, ni verdict conforme', () => {
  const history = validateHistoricalComponents(declaredHistory());
  expect(history.components[0]!.history).toHaveLength(1);
  expect(history.components[0]!.history[0]!.evidence).toEqual([]);
  const raw = consolidationRaw();
  const data = normalizeGithub(raw, rules, undefined, undefined, undefined, [history]);
  const component = data.components.find((component) => component.name === 'DateBox')!;
  expect(component).toBeDefined();
  const relations = data.componentVersions!.filter(
    (relation) => relation.componentId === component.componentId
  );
  expect(relations).toHaveLength(1);
  expect(relations[0]!.change).toBe('unspecified');
  expect(relations[0]!.provenance.sourceId).toContain('local-declaration:1.1.0:confirmation-20261028');
  expect(relations[0]!.verdict).not.toBe('CONFORME');
  expect(
    anonymizeHistoricalComponents(
      history,
      'repo',
      () => 'composant',
      () => 'ref'
    ).components[0]!.history[0]!.declaration?.reference
  ).toBe('ref');
});

it('refuse les déclarations incomplètes, les fausses cellules et les changements inventés', () => {
  for (const patch of [{ reference: '' }, null]) {
    const history = declaredHistory();
    Object.assign(history.components[0]!.history[0]!, { declaration: patch });
    expect(() => validateHistoricalComponents(history)).toThrow();
  }
  const history = declaredHistory();
  history.components[0]!.history[0]!.change = 'unchanged';
  expect(() => validateHistoricalComponents(history)).toThrow();
  const fabricated = declaredHistory();
  Object.assign(fabricated.components[0]!.history[0]!, {
    evidence: [{ cell: 'A1', symbol: 'DateBox', value: '=' }]
  });
  expect(() => validateHistoricalComponents(fabricated)).toThrow();
  const mixed = declaredHistory();
  const first = { ...mixed.components[0]!.history[0]!, version: '1.0.0', change: 'added' };
  Object.assign(first, { declaration: undefined, evidence: [{ cell: 'A1', symbol: 'DateBox', value: '+' }] });
  mixed.components[0]!.history.unshift(first);
  expect(() => validateHistoricalComponents(mixed)).toThrow();
});

it('conserve une preuve GitHub sur une version non couverte par la déclaration', () => {
  const raw = consolidationRaw();
  raw.repositories[0]!.historicalCatalogues![0]!.componentNames.push('DateBox');
  const history = validateHistoricalComponents(declaredHistory());
  const data = normalizeGithub(raw, rules, undefined, undefined, undefined, [history]);
  const version = data.versions!.find((version) => version.number === '1.0.0')!;
  expect(
    data.componentVersions!.some(
      (relation) =>
        relation.versionId === version.versionId &&
        data.components.some(
          (component) => component.componentId === relation.componentId && component.name === 'DateBox'
        )
    )
  ).toBe(true);
});
