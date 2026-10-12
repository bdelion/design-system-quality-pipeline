import { createHash, randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rename, rm, writeFile, lstat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parse } from 'yaml';
import type { RawDataset } from './domain/types.js';
import type { PipelineConfig } from './config.js';
import { validateMilestoneDetection } from './config.js';
import { validateAccessibilityRecognition } from './domain/accessibility.js';
import { validateCatalogue, type Catalogue } from './catalogue.js';
import { rootPath } from './lib/paths.js';
import { anonymizeDataset, createAnonymizationMapper } from './anonymization/anonymizer.js';
import { anonymizationAliases, withAliases } from './anonymization/aliases.js';
import { anonymizePipelineConfig } from './anonymization/config.js';
import { inspectRelationalIntegrity, validateAnonymizedDataset } from './anonymization/validator.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import type { GithubQuotaOptions } from './collectors/github-requests.js';

/** Jeu autonome : faits, conventions et enrichissements sont transportés ensemble. */
export interface Dataset {
  schemaVersion: 1;
  kind: 'fixture' | 'demo' | 'local';
  profileId: string;
  config: PipelineConfig;
  catalogue: Catalogue | null;
  rawData: RawDataset;
}

/** Reconnaît un objet JSON sans tableau ni valeur nulle. */
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Lit du JSON sans divulguer un extrait du RAW dans une erreur de parsing. */
export async function readDatasetJson(path: string): Promise<unknown> {
  const content = await readFile(path, 'utf8');
  try {
    return JSON.parse(content);
  } catch {
    throw new Error('Fichier JSON invalide.');
  }
}

/** Valide les collections et champs utilisés avant toute transformation des faits bruts. */
export function validateRaw(value: unknown): asserts value is RawDataset {
  if (
    !object(value) ||
    typeof value.collectedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.collectedAt)) ||
    !Array.isArray(value.repositories) ||
    !Array.isArray(value.catalogueComponents) ||
    typeof value.nexusAvailable !== 'boolean'
  )
    throw new Error('RAW invalide : date, repositories, catalogueComponents ou disponibilité Nexus.');
  /** Vérifie une liste de chaînes sans fabriquer de liste vide quand elle manque. */
  function strings(list: unknown): boolean {
    return Array.isArray(list) && list.every((item) => typeof item === 'string');
  }
  if (!strings(value.catalogueComponents)) throw new Error('RAW invalide : composants déclarés.');
  const repositories = new Set<string>();
  const issueIds = new Set<string>();
  const pullRequestIds = new Set<string>();
  for (const repo of value.repositories) {
    if (
      !object(repo) ||
      typeof repo.id !== 'string' ||
      typeof repo.name !== 'string' ||
      !repo.name ||
      typeof repo.owner !== 'string' ||
      !repo.owner ||
      typeof repo.defaultBranch !== 'string' ||
      !Array.isArray(repo.issues) ||
      !Array.isArray(repo.pullRequests)
    )
      throw new Error('RAW invalide : repository.');
    const key = `${repo.owner}/${repo.name}`;
    if (repositories.has(key)) throw new Error('RAW invalide : repository dupliqué.');
    repositories.add(key);
    for (const issue of repo.issues) {
      if (
        !object(issue) ||
        typeof issue.id !== 'string' ||
        typeof issue.title !== 'string' ||
        typeof issue.number !== 'number' ||
        !Number.isSafeInteger(issue.number) ||
        issue.number < 1 ||
        !['OPEN', 'CLOSED'].includes(String(issue.state)) ||
        typeof issue.issueType !== 'string' ||
        typeof issue.createdAt !== 'string' ||
        !strings(issue.labels) ||
        !strings(issue.criticities) ||
        !strings(issue.parents) ||
        !strings(issue.linkedPullRequestIds) ||
        !Array.isArray(issue.projectStatuses)
      )
        throw new Error('RAW invalide : issue ou relations.');
      if (!issue.id || issueIds.has(issue.id))
        throw new Error('RAW invalide : identifiant d’issue absent ou dupliqué.');
      issueIds.add(issue.id);
      for (const key of [
        'rawIssueType',
        'component',
        'closedAt',
        'firstDoneAt',
        'url',
        'auditedReleaseCandidate'
      ])
        if (issue[key] !== undefined && typeof issue[key] !== 'string')
          throw new Error('RAW invalide : champ facultatif d’issue.');
      for (const status of issue.projectStatuses) {
        if (
          !object(status) ||
          typeof status.projectId !== 'string' ||
          typeof status.projectName !== 'string' ||
          typeof status.status !== 'string'
        )
          throw new Error('RAW invalide : contexte Project.');
        if (
          status.statusHistory !== undefined &&
          (!Array.isArray(status.statusHistory) ||
            status.statusHistory.some(
              (event) =>
                !object(event) || typeof event.status !== 'string' || typeof event.transitionedAt !== 'string'
            ))
        )
          throw new Error('RAW invalide : historique Project.');
      }
      if (
        issue.milestone !== undefined &&
        (!object(issue.milestone) ||
          typeof issue.milestone.title !== 'string' ||
          typeof issue.milestone.id !== 'number' ||
          typeof issue.milestone.number !== 'number')
      )
        throw new Error('RAW invalide : milestone.');
    }
    for (const pr of repo.pullRequests) {
      if (
        !object(pr) ||
        typeof pr.id !== 'string' ||
        typeof pr.number !== 'number' ||
        !Number.isSafeInteger(pr.number) ||
        pr.number < 1 ||
        !['OPEN', 'CLOSED', 'MERGED'].includes(String(pr.state)) ||
        !strings(pr.relatedIssueIds)
      )
        throw new Error('RAW invalide : PR ou relations.');
      if (!pr.id || pullRequestIds.has(pr.id))
        throw new Error('RAW invalide : identifiant de PR absent ou dupliqué.');
      pullRequestIds.add(pr.id);
    }
    if (
      repo.gitTags !== undefined &&
      (!Array.isArray(repo.gitTags) ||
        repo.gitTags.some((tag) => !object(tag) || typeof tag.name !== 'string'))
    )
      throw new Error('RAW invalide : tags.');
    if (
      repo.historicalCatalogues !== undefined &&
      (!Array.isArray(repo.historicalCatalogues) ||
        repo.historicalCatalogues.some(
          (catalogue) =>
            !object(catalogue) ||
            typeof catalogue.tagName !== 'string' ||
            !['available', 'missing', 'invalid'].includes(String(catalogue.status)) ||
            !strings(catalogue.componentNames)
        ))
    )
      throw new Error('RAW invalide : preuves de catalogue historique.');
  }
}

/** Vérifie la configuration complète embarquée, sans résoudre de profil par nom de fixture. */
export function validateDatasetConfig(value: unknown): asserts value is PipelineConfig {
  if (!object(value) || value.draft === true || !object(value.github))
    throw new Error('Configuration du dataset invalide.');
  const fields = new Set([
    'modelVersion',
    'ruleVersion',
    'auditVersion',
    'scope',
    'githubOwner',
    'repositories',
    'githubApiUrl',
    'githubGraphqlUrl',
    'githubUrl',
    'github'
  ]);
  if (Object.keys(value).some((key) => !fields.has(key)))
    throw new Error('Configuration du dataset : champ non pris en charge.');
  for (const key of ['githubApiUrl', 'githubGraphqlUrl', 'githubUrl']) {
    if (value[key] === undefined) continue;
    try {
      if (typeof value[key] !== 'string') throw new Error();
      const url = new URL(value[key]);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch {
      throw new Error('Configuration du dataset : URL invalide ou contenant des identifiants.');
    }
  }
  for (const key of ['modelVersion', 'ruleVersion', 'auditVersion', 'scope', 'githubOwner'])
    if (typeof value[key] !== 'string' || !value[key])
      throw new Error('Configuration du dataset : champ obligatoire absent.');
  if (
    !Array.isArray(value.repositories) ||
    new Set(value.repositories).size !== value.repositories.length ||
    !value.repositories.every((item) => typeof item === 'string' && item.length > 0)
  )
    throw new Error('Configuration du dataset : repositories invalides.');
  const github = value.github;
  if (
    !object(github.labels) ||
    !object(github.issueTypes) ||
    !object(github.projectStatuses) ||
    !object(github.labels.criticalityValues) ||
    !object(github.issueTypes.keywords) ||
    !object(github.projectStatuses.keywords) ||
    typeof github.issueTypes.anomaly !== 'string' ||
    !Array.isArray(github.closingKeywords) ||
    !Array.isArray(github.cancelledProjectStatuses)
  )
    throw new Error('Conventions DSQ invalides.');
  for (const key of [
    'componentPrefix',
    'accessibilityCriticalityPrefix',
    'accessibilityCategoryPrefix',
    'unknown'
  ])
    if (typeof github.labels[key] !== 'string' || !github.labels[key])
      throw new Error('Conventions DSQ : label requis.');
  for (const mapping of [github.issueTypes.keywords, github.projectStatuses.keywords])
    if (
      !Object.values(mapping).every(
        (list) => Array.isArray(list) && list.every((item) => typeof item === 'string')
      )
    )
      throw new Error('Conventions DSQ : correspondances invalides.');
  if (
    !Object.values(github.labels.criticalityValues).every((value) =>
      ['blocking', 'major', 'minor'].includes(String(value))
    ) ||
    ![github.closingKeywords, github.cancelledProjectStatuses].every((list) =>
      list.every((item) => typeof item === 'string')
    )
  )
    throw new Error('Conventions DSQ : criticités ou mots-clés invalides.');
  const config = value as unknown as PipelineConfig;
  if (config.github.auditDetection !== undefined) {
    const detection = config.github.auditDetection;
    if (
      !object(detection) ||
      !Array.isArray(detection.strategies) ||
      detection.strategies.some(
        (strategy) =>
          !object(strategy) ||
          !Array.isArray(strategy.issueTypes) ||
          !strategy.issueTypes.every((item) => typeof item === 'string') ||
          (strategy.requiredLabels !== undefined &&
            (!Array.isArray(strategy.requiredLabels) ||
              !strategy.requiredLabels.every((item) => typeof item === 'string'))) ||
          (strategy.requireComponent !== undefined && typeof strategy.requireComponent !== 'boolean')
      )
    )
      throw new Error('Conventions DSQ : stratégies d’audit invalides.');
  }
  if (config.github.milestoneDetection === null)
    throw new Error('Conventions DSQ : règles de milestones invalides.');
  validateMilestoneDetection(config.github.milestoneDetection);
  validateAccessibilityRecognition(config.github.accessibilityRecognition);
}

/** Charge les conventions livrées et leur donne le périmètre explicite de la capture. */
export async function dsqConfig(repositories: string[]): Promise<PipelineConfig> {
  if (
    !repositories.length ||
    repositories.some(
      (name) =>
        !/^[\w.-]+\/[\w.-]+$/.test(name) || name.split('/').some((part) => part === '.' || part === '..')
    ) ||
    new Set(repositories).size !== repositories.length
  )
    throw new Error('Fournir une liste unique de repositories owner/repository.');
  const owners = [...new Set(repositories.map((name) => name.split('/')[0]!))];
  if (owners.length !== 1) throw new Error('Un jeu exige un owner unique ; préparer un jeu par owner.');
  const profile = await readDatasetJson(join(rootPath, 'config/profiles/dsq.json'));
  if (!object(profile)) throw new Error('Profil DSQ invalide.');
  const config = {
    modelVersion: profile.modelVersion,
    ruleVersion: profile.ruleVersion,
    auditVersion: profile.auditVersion,
    github: profile.github,
    scope: `github:${[...repositories].sort().join(',')}`,
    githubOwner: owners[0]!,
    repositories: repositories.map((name) => name.split('/')[1]!),
    githubApiUrl: process.env.GITHUB_API_URL ?? 'https://api.github.com',
    githubGraphqlUrl: process.env.GITHUB_GRAPHQL_URL ?? 'https://api.github.com/graphql',
    githubUrl: process.env.GITHUB_URL ?? 'https://github.com'
  };
  validateDatasetConfig(config);
  return config;
}

/** Contrôle le schéma, le périmètre exact et la cohérence d’un jeu transportable. */
export function validateDataset(value: unknown): asserts value is Dataset {
  if (
    !object(value) ||
    value.schemaVersion !== 1 ||
    !['fixture', 'demo', 'local'].includes(String(value.kind)) ||
    typeof value.profileId !== 'string'
  )
    throw new Error('Dataset : schéma ou provenance invalide.');
  validateRaw(value.rawData);
  validateDatasetConfig(value.config);
  if (value.catalogue !== null) validateCatalogue(value.catalogue);
  const raw = value.rawData;
  const config = value.config;
  if (
    new Set(raw.repositories.map((repo) => repo.owner)).size !== 1 ||
    raw.repositories.some((repo) => repo.owner !== config.githubOwner) ||
    raw.repositories.length !== config.repositories.length ||
    config.repositories.some((name) => !raw.repositories.some((repo) => repo.name === name))
  )
    throw new Error('Dataset : périmètre incohérent.');
  const integrity = inspectRelationalIntegrity(raw);
  if (value.kind === 'fixture' && integrity.length)
    throw new Error(
      `Dataset : ${integrity.length} relations manquantes ; inspecter localement ${integrity
        .slice(0, 5)
        .map((finding) => finding.sourcePath)
        .join(', ')}.`
    );
  if (value.kind === 'fixture' && !validateAnonymizedDataset(value as unknown as RawDataset).valid)
    throw new Error('Dataset : anonymisation à revoir.');
}

/** Charge un jeu autonome ou une capture locale contextualisée ; exclut sa graine privée du rejeu. */
export async function loadDataset(path: string): Promise<Dataset> {
  const directory = (await lstat(path)).isDirectory();
  const file = directory ? join(path, 'dataset.json') : path;
  const content = await readFile(file, 'utf8');
  const provisional = (() => {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new Error('Dataset : JSON invalide.');
    }
  })();
  if (directory || (object(provisional) && provisional.kind === 'fixture')) {
    const manifest = await readDatasetJson(join(directory ? path : dirname(path), 'manifest.json'));
    if (
      !object(manifest) ||
      manifest.schemaVersion !== 1 ||
      manifest.datasetSha256 !== createHash('sha256').update(content).digest('hex')
    )
      throw new Error('Dataset : empreinte ou manifeste invalide.');
  }
  let value = provisional;
  if (
    !directory &&
    object(provisional) &&
    provisional.schemaVersion === undefined &&
    object(provisional.collectionContext)
  ) {
    const context = provisional.collectionContext;
    const facts = { ...provisional };
    delete facts.collectionContext;
    value = {
      schemaVersion: 1,
      kind: 'local',
      profileId: context.profileId,
      config: context.config,
      catalogue: null,
      rawData: facts
    };
  }
  validateDataset(value);
  return value;
}

/**
 * Anonymise puis publie atomiquement un nouveau jeu, sans référence V1 ni catalogue obligatoire.
 * En cas de relation invalide, écrit un diagnostic privé à côté du RAW sans publier de dataset.
 */
export async function prepareDataset(
  input: string,
  output: string,
  seed = '',
  catalogueInput?: string,
  anonymizeComponents = false
): Promise<Dataset> {
  const rawContent = await readFile(input, 'utf8');
  let raw: unknown;
  try {
    raw = JSON.parse(rawContent);
  } catch {
    throw new Error('Fichier JSON invalide.');
  }
  validateRaw(raw);
  const context = object(raw) ? raw.collectionContext : undefined;
  if (
    context !== undefined &&
    (!object(context) ||
      typeof context.profileId !== 'string' ||
      !context.profileId ||
      context.config === undefined)
  )
    throw new Error('Capture : contexte incomplet ou invalide.');
  const effectiveSeed = seed?.trim()
    ? seed
    : object(context) && typeof context.anonymizationSeed === 'string'
      ? context.anonymizationSeed
      : '';
  if (!effectiveSeed.trim())
    throw new Error('RAW ancien sans graine locale : renseigner ANONYMIZATION_SEED ou --seed.');
  const config =
    object(context) && context.config !== undefined
      ? context.config
      : await dsqConfig(raw.repositories.map((repo) => `${repo.owner}/${repo.name}`));
  validateDatasetConfig(config);
  if (
    raw.repositories.length !== config.repositories.length ||
    raw.repositories.some(
      (repo) => repo.owner !== config.githubOwner || !config.repositories.includes(repo.name)
    )
  )
    throw new Error('Capture : profil et périmètre incohérents.');
  const relations = inspectRelationalIntegrity(raw);
  if (relations.length) {
    const diagnosticDirectory = await mkdtemp(join(dirname(resolve(input)), 'fixture-diagnostics-'));
    const reportPath = join(diagnosticDirectory, 'relations.json');
    await writeFile(
      reportPath,
      JSON.stringify(
        {
          explanation:
            'Une relation pointe vers un élément absent du même dépôt dans le RAW. Cela peut provenir d’une collecte incomplète, d’un accès insuffisant ou d’une relation entre dépôts. Vérifier le périmètre et les accès, puis refaire la collecte ; ne pas supprimer la relation pour masquer le problème.',
          privacy: 'Rapport local non anonymisé : ne pas partager sans revue.',
          input: resolve(input),
          relations: relations.map((finding) => {
            const source = finding.source as { number: number };
            return {
              repository: `${config.githubOwner}/${finding.repository}`,
              sourceType: finding.type === 'missing-issue' ? 'PR' : 'issue',
              sourceNumber: source.number,
              missingType: finding.type === 'missing-issue' ? 'issue' : 'PR',
              referenceId: finding.referenceId,
              sourcePath: finding.sourcePath,
              reason:
                finding.scope === 'cross-repository'
                  ? 'Élément trouvé dans un autre dépôt du RAW ; relation entre dépôts.'
                  : 'Élément absent du RAW pour ce dépôt.'
            };
          })
        },
        null,
        2
      ),
      { mode: 0o600 }
    );
    throw new Error(
      `Préparation interrompue : ${relations.length} relations manquantes. Ouvrir le rapport local ${reportPath} pour identifier les issues/PR et les références concernées. Aucun dataset publié. Rapport non anonymisé, à conserver privé.`
    );
  }
  const catalogue = catalogueInput
    ? validateCatalogue(parse(await readFile(catalogueInput, 'utf8')))
    : { version: '1.0', components: [] };
  catalogue.components = catalogue.components.filter(
    (component) => !component.repository || config.repositories.includes(component.repository)
  );
  const options = {
    seed: effectiveSeed,
    dateOffsetDays: -365,
    strictText: true,
    preserveComponentNames: !anonymizeComponents,
    aliases: anonymizationAliases(raw)
  };
  const map = withAliases(createAnonymizationMapper(effectiveSeed), options.aliases);
  const result = anonymizeDataset(raw, options);
  const prefix = config.github.labels.componentPrefix;
  if (anonymizeComponents)
    for (const repo of result.dataset.repositories)
      for (const issue of repo.issues)
        issue.labels = issue.labels.map((label) =>
          label.toLowerCase().startsWith(prefix.toLowerCase())
            ? prefix + ' ' + map('component', label.slice(prefix.length).trim(), 'component')
            : label
        );
  const fixtureConfig = anonymizePipelineConfig(structuredClone(config), raw, map);
  fixtureConfig.scope = `fixture:${fixtureConfig.githubOwner}/${[...fixtureConfig.repositories].sort().join(',')}`;
  fixtureConfig.githubUrl = undefined;
  const overrides = fixtureConfig.github.accessibilityRecognition?.repositories;
  if (overrides)
    fixtureConfig.github.accessibilityRecognition!.repositories = Object.fromEntries(
      Object.entries(overrides).map(([repo, tokens]) => {
        const source = raw.repositories.find((item) => `${item.owner}/${item.name}` === repo);
        return [
          source
            ? `${map('owner', source.owner, 'owner')}/${map('repository', source.name, 'repo')}`
            : map('repository', repo, 'repo'),
          tokens
        ];
      })
    );
  const mappedCatalogue: Catalogue = {
    version: catalogue.version,
    components: catalogue.components.map((component) => ({
      ...component,
      name: anonymizeComponents ? map('component', component.name, 'component') : component.name,
      ...(component.repository ? { repository: map('repository', component.repository, 'repo') } : {})
    }))
  };
  for (const component of mappedCatalogue.components) {
    component.owner = map('catalogue-owner', component.owner, 'owner');
    component.squad = map('squad', component.squad, 'squad');
    component.stream = map('stream', component.stream, 'stream');
    component.tags = component.tags.map((tag) => map('catalogue-tag', tag, 'tag'));
    delete component.documentationUrl;
    delete component.figmaUrl;
    if (component.audit?.lastAuditDate)
      component.audit.lastAuditDate = new Date(Date.parse(component.audit.lastAuditDate) - 365 * 86400000)
        .toISOString()
        .slice(0, 10);
  }
  const dataset: Dataset = {
    schemaVersion: 1,
    kind: 'fixture',
    profileId: object(context) && typeof context.profileId === 'string' ? context.profileId : 'dsq',
    config: fixtureConfig,
    catalogue: catalogueInput ? mappedCatalogue : null,
    rawData: result.dataset
  };
  validateDataset(dataset);
  const target = resolve(output);
  try {
    await lstat(target);
    throw new Error('Destination existante : choisir un nouveau dossier de dataset.');
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  await mkdir(dirname(target), { recursive: true });
  const temporary = await mkdtemp(join(dirname(target), '.dsq-prepare-'));
  try {
    const content = JSON.stringify(dataset, null, 2) + '\n';
    await writeFile(join(temporary, 'dataset.json'), content, 'utf8');
    await writeFile(
      join(temporary, 'manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          datasetSha256: createHash('sha256').update(content).digest('hex'),
          rawSha256: createHash('sha256').update(rawContent).digest('hex'),
          anonymization: { dateOffsetDays: options.dateOffsetDays, anonymizeComponents },
          review: 'required'
        },
        null,
        2
      ) + '\n',
      'utf8'
    );
    await rename(temporary, target);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  return dataset;
}

/** Collecte depuis la liste seule, conserve le profil DSQ appliqué et refuse tout écrasement du RAW. */
export async function collectRepositories(
  repositories: string[],
  output: string,
  options: GithubQuotaOptions = {}
): Promise<RawDataset> {
  try {
    await lstat(output);
    throw new Error('Fichier RAW existant : choisir une nouvelle sortie.');
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
  const config = await dsqConfig(repositories);
  const raw = await collectGithub({
    ...options,
    token: githubTokenFromEnvironment(),
    owner: config.githubOwner,
    repositories: config.repositories,
    apiUrl: config.githubApiUrl,
    graphqlUrl: config.githubGraphqlUrl,
    rules: config.github
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(
    output,
    JSON.stringify(
      {
        ...raw,
        collectionContext: {
          profileId: 'dsq',
          config,
          anonymizationSeed: process.env.ANONYMIZATION_SEED?.trim() || randomBytes(32).toString('hex')
        }
      },
      null,
      2
    ) + '\n',
    { encoding: 'utf8', flag: 'wx' }
  );
  return raw;
}
