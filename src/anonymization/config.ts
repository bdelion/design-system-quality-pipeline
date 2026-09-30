import type { RawDataset } from '../domain/types.js';
import type { AnonymizationOptions } from './types.js';
import type { PipelineConfig } from '../config.js';
import type { Catalogue } from '../catalogue.js';

type StableMapper = (namespace: string, source: string, prefix: string) => string;

/**
 * Creates the fixture pipeline configuration from the source RAW dataset.
 *
 * Repository scope is deliberately derived from the RAW dataset, not from
 * system.yaml: the generated configuration must describe exactly the fixture
 * that was just produced.
 */
export function anonymizePipelineConfig(config: PipelineConfig, source: RawDataset, map: StableMapper): PipelineConfig {
  const owners = [...new Set(source.repositories.map((repository) => repository.owner))];
  if (owners.length === 0) throw new Error('Cannot create fixture configuration: RAW dataset contains no repositories.');
  if (owners.length > 1) {
    throw new Error(`Cannot create fixture configuration: RAW dataset contains multiple GitHub owners (${owners.join(', ')}), but PipelineConfig supports a single githubOwner.`);
  }

  return {
    ...config,
    githubOwner: map('owner', owners[0]!, 'owner'),
    repositories: source.repositories.map((repository) => map('repository', repository.name, 'repo')),
    githubApiUrl: undefined,
    githubGraphqlUrl: undefined,
    githubUrl: undefined
  };
}

/**
 * Creates the catalogue configuration for exactly the components declared by
 * the source RAW dataset. Metadata comes from the reference catalogue, while
 * repository/component identities use the same mapping as the anonymized RAW.
 */
export function anonymizeCatalogue(config: Catalogue, source: RawDataset, options: AnonymizationOptions, map: StableMapper): Catalogue {
  const sourceComponents = new Set(source.catalogueComponents);
  const catalogueByName = new Map(config.components.map((component) => [component.name, component]));
  const missing = source.catalogueComponents.filter((name) => !catalogueByName.has(name));
  if (missing.length > 0) {
    throw new Error(`Cannot create fixture catalogue: components declared by RAW are missing from catalogue.yaml: ${missing.join(', ')}`);
  }

  return {
    ...config,
    components: config.components
      .filter((component) => sourceComponents.has(component.name))
      .map((component) => ({
        ...component,
        ...(component.repository ? { repository: map('repository', component.repository, 'repo') } : {}),
        ...(options.preserveComponentNames ? {} : { name: map('component', component.name, 'component') })
      }))
  };
}
