/**
 * @module anonymization.config
 * Produit les configurations anonymisées associées aux fixtures.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type { AnonymizationOptions } from './types.js';
import type { PipelineConfig } from '../config.js';
import type { Catalogue } from '../catalogue.js';
import type { RawDataset } from '../domain/types.js';

/**
 * Fonction de correspondance stable entre une valeur source et son identifiant pseudonymisé.
 *
 * @inline
 */
export type StableMapper = (namespace: string, source: string, prefix: string) => string;

/**
 * Creates the fixture pipeline configuration from the source RAW dataset.
 *
 * Repository scope is deliberately derived from the RAW dataset, not from
 * system.yaml: the generated configuration must describe exactly the fixture
 * that was just produced.
 */
export function anonymizePipelineConfig(
  config: PipelineConfig,
  source: RawDataset,
  map: StableMapper
): PipelineConfig {
  const owners = [...new Set(source.repositories.map((repository) => repository.owner))];
  if (owners.length === 0)
    throw new Error('Cannot create fixture configuration: RAW dataset contains no repositories.');
  if (owners.length > 1) {
    throw new Error(
      `Cannot create fixture configuration: RAW dataset contains multiple GitHub owners (${owners.join(', ')}), but PipelineConfig supports a single githubOwner.`
    );
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
 * Creates the anonymized catalogue configuration from the reference catalogue.
 * The reference catalogue is the source of truth for the fixture catalogue.
 * Repository/component identities use the same mapping as the anonymized RAW.
 */
export function anonymizeCatalogue(
  config: Catalogue,
  source: RawDataset,
  options: AnonymizationOptions,
  map: StableMapper
): Catalogue {
  const sourceComponents = new Set(source.catalogueComponents);
  const missingComponents = [...sourceComponents].filter(
    (name) => !config.components.some((component) => component.name === name)
  );
  if (missingComponents.length > 0) {
    throw new Error(
      `Cannot create fixture catalogue: RAW component(s) ${missingComponents.join(', ')} are missing from catalogue.yaml.`
    );
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
