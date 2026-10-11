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
 * Produit la configuration fixture à partir du périmètre du RAW source.
 *
 * Le périmètre provient du RAW et non de system.yaml afin de décrire exactement la fixture produite.
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
 * Produit le catalogue anonymisé avec les mêmes correspondances que le RAW.
 * Le catalogue source conserve la responsabilité des métadonnées métier.
 */
export function anonymizeCatalogue(
  config: Catalogue,
  source: RawDataset,
  options: AnonymizationOptions,
  map: StableMapper,
  componentPrefix: string = 'Component:'
): Catalogue {
  // Le RAW peut ne pas fournir catalogueComponents : récupérer les composants
  // observés dans les labels sans fabriquer de métadonnées métier.
  const prefix = componentPrefix;
  const sourceComponents = new Set(source.catalogueComponents);
  for (const repository of source.repositories) {
    for (const issue of repository.issues) {
      if (issue.component) sourceComponents.add(issue.component);
      for (const label of issue.labels) {
        const index = label.toLowerCase().indexOf(prefix.toLowerCase());
        if (index >= 0) {
          const component = label.slice(index + prefix.length).trim();
          if (component) sourceComponents.add(component);
        }
      }
    }
  }
  const missingComponents = [...sourceComponents].filter(
    (name) => !config.components.some((component) => component.name === name)
  );
  if (missingComponents.length > 0) {
    throw new Error(
      `Cannot create fixture catalogue: RAW component(s) ${missingComponents.join(', ')} are missing from catalogue.yaml. Add them to the reference catalogue before preparing the fixture.`
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
