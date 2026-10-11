/** Prépare des références cohérentes, validées avant publication, à partir d'un RAW local. */
import { readFile, writeFile, mkdir, mkdtemp, rename, link, rm, lstat } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { stringify } from 'yaml';
import { loadConfig, type ConfigSelection, type PipelineConfig } from '../config.js';
import { loadCatalogue, validateCatalogue, type Catalogue } from '../catalogue.js';
import { rootPath } from '../lib/paths.js';
import { normalizeGithub } from '../normalizers/github.js';
import type { RawDataset } from '../domain/types.js';
import { anonymizeDataset, createAnonymizationMapper } from './anonymizer.js';
import { anonymizePipelineConfig, anonymizeCatalogue } from './config.js';
import { anonymizationAliases, withAliases } from './aliases.js';
import { validateAnonymizedDataset, inspectRelationalIntegrity } from './validator.js';
import { buildTraceManifest } from './trace.js';
import type { AnonymizationOptions } from './types.js';

/** Paramètres de génération ; la racine alternative sert aux tests isolés. */
export interface PrepareReferencesOptions {
  input: string;
  name: string;
  seed: string;
  dateOffsetDays?: number;
  anonymizeComponents?: boolean;
  force?: boolean;
  selection?: ConfigSelection;
  outputRoot?: string;
}

/** Vérifie les références et l'unicité du périmètre sans inventer de données métier. */
function assertCoherence(raw: RawDataset, system: PipelineConfig, catalogue: Catalogue): void {
  const repositories = new Set(raw.repositories.map((repo) => repo.name));
  if (
    repositories.size !== raw.repositories.length ||
    repositories.size !== system.repositories.length ||
    system.repositories.some((name) => !repositories.has(name))
  )
    throw new Error('Périmètre repositories incohérent.');
  if (raw.repositories.some((repo) => repo.owner !== system.githubOwner))
    throw new Error('Owner incohérent.');
  if (
    catalogue.components.some((component) => component.repository && !repositories.has(component.repository))
  )
    throw new Error('Repository du catalogue absent du RAW.');
  normalizeGithub(raw, system.github, catalogue, system.auditVersion);
}

/** Vérifie la référence synthétique V1 existante sans la modifier ou produire de snapshot. */
export async function validateV1Reference(): Promise<void> {
  const path = join(rootPath, 'fixtures/v1-reference.json');
  const raw = JSON.parse(await readFile(path, 'utf8')) as RawDataset;
  assertCoherence(raw, await loadConfig('fixture', path), await loadCatalogue('fixture', path));
}

/** Prépare les profils, contrôle les artefacts puis publie uniquement l'ensemble valide. */
export async function prepareReferences(options: PrepareReferencesOptions): Promise<string[]> {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(options.name) || options.name === 'v1')
    throw new Error('Nom invalide ou réservé : utiliser un nom autre que v1, en minuscules et tirets.');
  if (!options.seed?.trim()) throw new Error('Une graine privée --seed ou ANONYMIZATION_SEED est requise.');
  const offset = options.dateOffsetDays ?? -365;
  if (!Number.isSafeInteger(offset)) throw new Error('Le décalage des dates doit être un entier.');
  const rawContent = await readFile(options.input, 'utf8');
  const raw = JSON.parse(rawContent) as RawDataset;
  if (
    !Array.isArray(raw.repositories) ||
    !raw.repositories.length ||
    !Array.isArray(raw.catalogueComponents) ||
    !Number.isFinite(Date.parse(raw.collectedAt))
  )
    throw new Error('RAW invalide : repositories, catalogueComponents et collectedAt requis.');
  const sourceSystem = await loadConfig('github', undefined, options.selection);
  const sourceCatalogue = await loadCatalogue('github', undefined, options.selection);
  const owners = new Set(raw.repositories.map((repo) => repo.owner));
  if (owners.size !== 1) throw new Error('La configuration exige un unique owner GitHub.');
  const githubSystem: PipelineConfig = {
    ...sourceSystem,
    githubOwner: raw.repositories[0]!.owner,
    repositories: raw.repositories.map((repo) => repo.name),
    scope: `github-reference-${options.name}`
  };
  // Ne pas recopier des composants appartenant à des repositories hors collecte.
  const githubCatalogue: Catalogue = {
    ...sourceCatalogue,
    components: sourceCatalogue.components.filter(
      (component) => !component.repository || githubSystem.repositories.includes(component.repository)
    )
  };
  raw.catalogueComponents = [
    ...new Set([...raw.catalogueComponents, ...githubCatalogue.components.map((component) => component.name)])
  ];
  assertCoherence(raw, githubSystem, githubCatalogue);
  const anon: AnonymizationOptions = {
    seed: options.seed,
    dateOffsetDays: offset,
    strictText: true,
    preserveComponentNames: !options.anonymizeComponents,
    aliases: anonymizationAliases(raw)
  };
  const mapper = withAliases(createAnonymizationMapper(anon.seed), anon.aliases ?? {});
  const result = anonymizeDataset(raw, anon);
  const fixtureSystem = {
    ...anonymizePipelineConfig(githubSystem, raw, mapper),
    scope: `fixture-reference-${options.name}`
  };
  const mappedCatalogue = anonymizeCatalogue(
    githubCatalogue,
    raw,
    anon,
    mapper,
    sourceSystem.github.labels.componentPrefix
  );
  // Les labels de composant doivent suivre leur identité quand l'option explicite est activée.
  if (options.anonymizeComponents) {
    const prefix = sourceSystem.github.labels.componentPrefix;
    for (const repo of result.dataset.repositories)
      for (const issue of repo.issues) {
        issue.labels = issue.labels.map((label) =>
          label.toLowerCase().startsWith(prefix.toLowerCase())
            ? prefix + ' ' + mapper('component', label.slice(prefix.length).trim(), 'component')
            : label
        );
      }
  }
  const fixtureCatalogue = validateCatalogue({
    ...mappedCatalogue,
    components: mappedCatalogue.components.map((component) => {
      const next = {
        ...component,
        owner: mapper('catalogue-owner', component.owner, 'owner'),
        squad: mapper('squad', component.squad, 'squad'),
        stream: mapper('stream', component.stream, 'stream'),
        tags: component.tags.map((tag) => mapper('catalogue-tag', tag, 'tag'))
      };
      delete next.figmaUrl;
      delete next.documentationUrl;
      if (next.audit?.lastAuditDate) {
        const date = new Date(next.audit.lastAuditDate);
        if (!Number.isFinite(date.getTime())) throw new Error('Date du catalogue invalide.');
        next.audit = {
          ...next.audit,
          lastAuditDate: new Date(date.getTime() + offset * 86400000).toISOString().slice(0, 10)
        };
      }
      return next;
    })
  });
  const validation = validateAnonymizedDataset(result.dataset);
  const integrity = inspectRelationalIntegrity(result.dataset);
  if (!validation.valid || integrity.length)
    throw new Error(
      `Référence refusée : ${validation.findings.length} chaînes suspectes, ${integrity.length} relations manquantes.`
    );
  // Scanner également les profils partageables : les métadonnées du catalogue peuvent contenir des identités.
  const configFindings = validateAnonymizedDataset({
    fixtureSystem,
    fixtureCatalogue
  } as unknown as RawDataset);
  if (!configFindings.valid)
    throw new Error(`Configurations refusées : ${configFindings.findings.length} chaînes suspectes.`);
  assertCoherence(result.dataset, fixtureSystem, fixtureCatalogue);
  await validateV1Reference();
  const stem = `${options.name}-reference`;
  const files = new Map<string, string>([
    [`fixtures/${stem}.json`, JSON.stringify(result.dataset, null, 2) + '\n'],
    [`config/system.${stem}.yaml`, stringify(fixtureSystem)],
    [`config/catalogue.${stem}.yaml`, stringify(fixtureCatalogue)],
    [`config/local/system.${options.name}-github-reference.yaml`, stringify(githubSystem)],
    [`config/local/catalogue.${options.name}-github-reference.yaml`, stringify(githubCatalogue)],
    [
      `data/raw/${options.name}.trace.json`,
      JSON.stringify(buildTraceManifest(raw, result.dataset, options.input), null, 2) + '\n'
    ]
  ]);
  /** Calcule une empreinte du contenu exact écrit, sans enregistrer la graine privée. */
  const digest = (value: string) => createHash('sha256').update(value).digest('hex');
  files.set(
    `fixtures/${stem}.json.manifest.json`,
    JSON.stringify(
      {
        schemaVersion: 1,
        rawSha256: digest(rawContent),
        dateOffsetDays: offset,
        anonymizeComponents: Boolean(options.anonymizeComponents),
        artifacts: Object.fromEntries(
          [...files]
            .filter(([path]) => !path.startsWith('data/') && !path.startsWith('config/local/'))
            .map(([path, content]) => [path, digest(content)])
        ),
        v1Reference: 'checked',
        approval: 'review-required'
      },
      null,
      2
    ) + '\n'
  );
  files.set(
    `fixtures/${stem}.json.validation.md`,
    `# Validation de la référence ${options.name}\n\n` +
      `Anonymisation automatique, relations et paires de configurations : contrôlées.\n\n` +
      `${raw.repositories.length} repositories, ${result.report.issues} issues, ${result.report.pullRequests} PR.\n\n` +
      `Référence V1 existante : contrôlée, conservée.\n\n` +
      `Revue humaine requise : labels, types, milestones, statuts, branches et tags métier sont conservés.\n\n` +
      `Usage fixture : npm run pipeline -- --source fixture --fixture fixtures/${stem}.json\n\n` +
      `Usage GitHub : npm run pipeline -- --source github --system-config config/local/system.${options.name}-github-reference.yaml --catalogue-config config/local/catalogue.${options.name}-github-reference.yaml\n`
  );
  const root = resolve(options.outputRoot ?? rootPath);
  const forbidden = [options.input, options.selection?.systemConfig, options.selection?.catalogueConfig]
    .filter((path): path is string => Boolean(path))
    .map((path) => resolve(path));
  const backups = new Map<string, string>();
  // Examiner toutes les destinations avant toute écriture ; refuser les liens symboliques.
  for (const path of files.keys()) {
    const target = resolve(root, path);
    if (forbidden.includes(target)) throw new Error('Une sortie ne peut pas remplacer une entrée.');
    try {
      const stat = await lstat(target);
      if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Destination non régulière : ${path}`);
      if (!options.force) throw new Error(`Fichier existant : ${path}. Utiliser --force explicitement.`);
      backups.set(target, await readFile(target, 'utf8'));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  const privateRoot = join(root, 'data/raw');
  await mkdir(privateRoot, { recursive: true });
  const stage = await mkdtemp(join(privateRoot, '.reference-stage-'));
  const published: string[] = [];
  try {
    for (const [path, content] of files) {
      const staged = join(stage, path);
      await mkdir(dirname(staged), { recursive: true });
      await writeFile(staged, content, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    }
    for (const path of files.keys()) {
      const target = resolve(root, path);
      await mkdir(dirname(target), { recursive: true });
      // Une seconde vérification empêche d'écraser un fichier apparu après la préparation.
      if (!options.force) await link(join(stage, path), target);
      else await rename(join(stage, path), target);
      published.push(target);
    }
  } catch (error) {
    for (const target of published.reverse()) {
      const previous = backups.get(target);
      if (previous !== undefined) await writeFile(target, previous, 'utf8');
      else await rm(target);
    }
    throw error;
  } finally {
    await rm(stage, { recursive: true, force: true });
  }
  return [...files.keys()];
}
