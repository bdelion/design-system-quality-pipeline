import { expect, it } from 'vitest';
import { collectFixture } from './support/fixtures.js';
import { loadConfig } from './support/fixtures.js';
import { loadCatalogue } from './support/fixtures.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { applyComponentVersionVerdicts } from '../src/analytics/component-versions.js';

/** Vérifie la preuve historique fournie sans l’étendre aux versions dont le catalogue demeure inconnu. */
it('matérialise les 71 composants demo-react en 1.7.1 et le verdict conforme de LinkButton', async () => {
  const path = 'tests/fixtures/full-dataset-anonymized.json';
  const raw = await collectFixture(path);
  const config = await loadConfig('fixture', path);
  const catalogue = await loadCatalogue('fixture', path);
  const historical = raw.repositories.find((repo) => repo.name === 'demo-react')!.historicalCatalogues!;
  const evidence = historical.find((entry) => entry.tagName === '1.7.1')!;
  expect(evidence.status).toBe('available');
  expect(evidence.componentNames).toHaveLength(71);
  expect(new Set(evidence.componentNames).size).toBe(71);
  expect(evidence.componentNames).toContain('LinkButton');
  expect(
    historical.filter((entry) => entry.tagName !== '1.7.1').every((entry) => entry.status === 'missing')
  ).toBe(true);
  const data = normalizeGithub(raw, config.github, catalogue, config.auditVersion);
  applyComponentVersionVerdicts(data);
  const library = data.libraries.find((item) => item.name === 'demo-react')!;
  const version = data.versions!.find(
    (item) => item.libraryId === library.libraryId && item.number === '1.7.1'
  )!;
  const relations = data.componentVersions!.filter((item) => item.versionId === version.versionId);
  expect(relations).toHaveLength(71);
  const component = data.components.find(
    (item) => item.libraryId === library.libraryId && item.name === 'LinkButton'
  )!;
  expect(relations.find((item) => item.componentId === component.componentId)?.verdict).toBe('CONFORME');
});
