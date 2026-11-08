import type { ComponentVersion, NormalizedData } from '../domain/types.js';

/** Population de versions de composants séparée selon la preuve de `kind`. */
export interface AuditComponentPopulation {
  ui: ComponentVersion[];
  nonUi: ComponentVersion[];
  unclassified: ComponentVersion[];
}

/** Sélectionne les composants `ui` sans convertir les classifications inconnues en non-UI. */
export function auditComponentPopulation(
  data: NormalizedData,
  relations: readonly ComponentVersion[]
): AuditComponentPopulation {
  const components = new Map(data.components.map((component) => [component.componentId, component]));
  const population: AuditComponentPopulation = { ui: [], nonUi: [], unclassified: [] };
  for (const relation of relations) {
    const kind = components.get(relation.componentId)?.kind;
    if (kind === 'ui') population.ui.push(relation);
    else if (kind === undefined) population.unclassified.push(relation);
    else population.nonUi.push(relation);
  }
  return population;
}
