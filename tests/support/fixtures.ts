import { readFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { parse } from 'yaml';
import { rootPath } from '../../src/lib/paths.js';
import type { RawDataset } from '../../src/domain/types.js';
import type { PipelineConfig } from '../../src/config.js';
import { validateCatalogue } from '../../src/catalogue.js';
export { validateCatalogue } from '../../src/catalogue.js';

const directory = join(rootPath, 'tests/fixtures');
interface TestSelection {
  systemConfig?: string;
  catalogueConfig?: string;
}
/** Charge uniquement le scénario versionné de tests, sans utiliser le dataset de démonstration. */
export async function collectFixture(path = join(directory, 'github.json')): Promise<RawDataset> {
  return JSON.parse(await readFile(path, 'utf8')) as RawDataset;
}
/** Choisit la configuration interne d’un scénario de tests ; aucune donnée locale n’est consultée. */
export async function loadConfig(
  _source = 'fixture',
  fixture?: string,
  selection: TestSelection = {}
): Promise<PipelineConfig> {
  if (_source !== 'fixture')
    throw new Error('Les helpers de tests chargent uniquement les scénarios fixture.');
  const stem = !fixture || basename(fixture) === 'github.json' ? 'fixture' : basename(fixture, '.json');
  return parse(
    await readFile(selection.systemConfig ?? join(directory, `system.${stem}.yaml`), 'utf8')
  ) as PipelineConfig;
}
/** Charge les enrichissements versionnés du scénario de tests explicitement choisi. */
export async function loadCatalogue(_source = 'fixture', fixture?: string, selection: TestSelection = {}) {
  if (_source !== 'fixture')
    throw new Error('Les helpers de tests chargent uniquement les scénarios fixture.');
  const stem = !fixture || basename(fixture) === 'github.json' ? 'fixture' : basename(fixture, '.json');
  return validateCatalogue(
    parse(await readFile(selection.catalogueConfig ?? join(directory, `catalogue.${stem}.yaml`), 'utf8'))
  );
}
