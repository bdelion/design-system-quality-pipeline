import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { stringify } from 'yaml';

interface RawCatalogueInput {
  collectedAt: string;
  catalogueComponents: string[];
  repositories: Array<{
    name: string;
    owner: string;
    issues: Array<{ number: number; labels: string[]; component?: string }>;
    historicalCatalogues?: Array<{ tagName: string; status: string; componentNames: string[] }>;
  }>;
}

/** Observation d’un nom dans le RAW, sans reprendre les textes ni inférer de métadonnées métier. */
export interface CatalogueDraftEvidence {
  source: 'catalogueComponents' | 'issue.component' | 'issue.label' | 'historicalCatalogue';
  repository?: string;
  issueNumber?: number;
  tagName?: string;
}

/** Entrée à compléter ; les valeurs nulles interdisent son utilisation comme catalogue validé. */
export interface CatalogueDraftComponent {
  name: string;
  repository: string | null;
  stream: null;
  owner: null;
  squad: null;
  status: null;
  rgaaLevel: null;
  tags: null;
  repositories: string[];
  evidence: CatalogueDraftEvidence[];
}

/** Brouillon local contenant l’union des noms observés, sans garantie d’inventaire courant exhaustif. */
export interface CatalogueDraft {
  version: string;
  draft: true;
  collectedAt: string;
  components: CatalogueDraftComponent[];
}

/** Reconnaît un objet JSON sans tableau ni valeur nulle. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Vérifie un nom non vide sans remplacer une information absente par une valeur métier. */
function name(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Vérifie les seuls champs RAW utilisés ; les autres champs restent sans effet sur le brouillon. */
function validateInput(value: unknown): asserts value is RawCatalogueInput {
  if (
    !record(value) ||
    !name(value.collectedAt) ||
    !Number.isFinite(Date.parse(value.collectedAt)) ||
    !Array.isArray(value.catalogueComponents) ||
    !value.catalogueComponents.every(name) ||
    !Array.isArray(value.repositories)
  )
    throw new Error('RAW invalide : date, catalogueComponents et repositories requis.');
  for (const repository of value.repositories) {
    if (
      !record(repository) ||
      !name(repository.name) ||
      !name(repository.owner) ||
      !Array.isArray(repository.issues)
    )
      throw new Error('RAW invalide : repository sans nom, owner ou liste d’issues.');
    for (const issue of repository.issues) {
      if (
        !record(issue) ||
        !Number.isSafeInteger(issue.number) ||
        Number(issue.number) <= 0 ||
        !Array.isArray(issue.labels) ||
        !issue.labels.every(name) ||
        (issue.component !== undefined && !name(issue.component))
      )
        throw new Error('RAW invalide : numéro, labels ou composant d’une issue.');
    }
    if (repository.historicalCatalogues !== undefined) {
      if (!Array.isArray(repository.historicalCatalogues))
        throw new Error('RAW invalide : liste des catalogues historiques.');
      for (const catalogue of repository.historicalCatalogues) {
        if (
          !record(catalogue) ||
          !name(catalogue.tagName) ||
          !['available', 'missing', 'invalid'].includes(String(catalogue.status)) ||
          !Array.isArray(catalogue.componentNames) ||
          !catalogue.componentNames.every(name)
        )
          throw new Error('RAW invalide : catalogue historique.');
      }
    }
  }
}

/** Extrait les noms déclarés, champs de composant, labels préfixés et catalogues historiques disponibles. */
export function buildCatalogueDraft(input: unknown, componentPrefix = 'Component:'): CatalogueDraft {
  validateInput(input);
  if (!name(componentPrefix)) throw new Error('Le préfixe des labels de composant doit être non vide.');
  const components = new Map<string, CatalogueDraftComponent>();
  /** Ajoute une preuve unique et ne déduit un repository que d’une association réellement observée. */
  function add(rawName: string, evidence: CatalogueDraftEvidence, repository?: string): void {
    const componentName = rawName.trim();
    if (!componentName) return;
    let component = components.get(componentName);
    if (!component) {
      component = {
        name: componentName,
        repository: null,
        stream: null,
        owner: null,
        squad: null,
        status: null,
        rgaaLevel: null,
        tags: null,
        repositories: [],
        evidence: []
      };
      components.set(componentName, component);
    }
    if (repository && !component.repositories.includes(repository)) component.repositories.push(repository);
    if (!component.evidence.some((existing) => JSON.stringify(existing) === JSON.stringify(evidence)))
      component.evidence.push(evidence);
  }
  for (const component of input.catalogueComponents) add(component, { source: 'catalogueComponents' });
  for (const repository of input.repositories) {
    const fullName = `${repository.owner}/${repository.name}`;
    for (const issue of repository.issues) {
      const location = { repository: fullName, issueNumber: issue.number };
      if (issue.component) add(issue.component, { source: 'issue.component', ...location }, fullName);
      for (const label of issue.labels) {
        if (label.toLowerCase().startsWith(componentPrefix.toLowerCase()))
          add(label.slice(componentPrefix.length), { source: 'issue.label', ...location }, fullName);
      }
    }
    for (const catalogue of repository.historicalCatalogues ?? []) {
      if (catalogue.status !== 'available') continue;
      for (const component of catalogue.componentNames)
        add(
          component,
          { source: 'historicalCatalogue', repository: fullName, tagName: catalogue.tagName },
          fullName
        );
    }
  }
  for (const component of components.values()) {
    component.repositories.sort();
    const repository = component.repositories[0];
    component.repository =
      component.repositories.length === 1 && repository
        ? repository.slice(repository.indexOf('/') + 1)
        : null;
  }
  return {
    version: '1.0',
    draft: true,
    collectedAt: input.collectedAt,
    components: [...components.values()].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  };
}

/** Génère un fichier YAML local sans réseau ni écrasement d’un fichier existant, y compris le RAW source. */
export async function generateCatalogueDraft(
  input: string,
  output: string,
  componentPrefix = 'Component:'
): Promise<CatalogueDraft> {
  const text = await readFile(input, 'utf8');
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('Fichier RAW : JSON invalide.');
  }
  const draft = buildCatalogueDraft(raw, componentPrefix);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, stringify(draft), { encoding: 'utf8', flag: 'wx' });
  return draft;
}
