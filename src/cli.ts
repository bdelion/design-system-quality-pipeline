/**
 * @module cli
 * Déclare les commandes de la CLI et délègue leur exécution aux services du pipeline.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { prepareReferences } from './anonymization/prepare.js';
import { Command, InvalidArgumentError } from 'commander';
import { validateGithubQuotaOptions, type GithubQuotaOptions } from './collectors/github-requests.js';
import { pipelineSummary } from './lib/cli-output.js';
import { collectFixture } from './collectors/fixture.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import { loadConfig, assertConfigSelection, type ConfigSelection } from './config.js';
import { loadCatalogue } from './catalogue.js';
import { generateCatalogueDraft } from './catalogue-draft.js';
import { runPipeline, pipelineStatus, type CollectionSource } from './pipeline.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { anonymizationAliases, withAliases } from './anonymization/aliases.js';
import { stringify } from 'yaml';
import { DEFAULT_ANONYMIZATION_OPTIONS, type AnonymizationOptions } from './anonymization/types.js';
import { anonymizeDataset, createAnonymizationMapper } from './anonymization/anonymizer.js';
import { anonymizePipelineConfig, anonymizeCatalogue } from './anonymization/config.js';
import { fixturePath, fixtureConfigPaths } from './lib/paths.js';
import {
  assertRelationalIntegrity,
  inspectRelationalIntegrity,
  validateAnonymizedDataset
} from './anonymization/validator.js';
import { buildValidationReport } from './anonymization/validation-report.js';
import { buildTraceManifest, type TraceManifest } from './anonymization/trace.js';
import type { RawDataset } from './domain/types.js';

/** Interface CLI des commandes de collecte, analyse et génération. */
const program = new Command()
  .name('design-system-quality')
  .description('Pipeline de qualité du Design System, en lecture seule sur GitHub')
  .version('0.1.0')
  .hook('preAction', (_parent, command) => {
    assertConfigSelection(command.opts<ConfigSelection>());
    validateGithubQuotaOptions(command.opts<GithubQuotaOptions>());
  });

/** Analyse un entier de quota sans accepter une valeur tronquée ni négative. */
function quotaInteger(value: string): number {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new InvalidArgumentError('Un entier positif ou nul est requis.');
  return Number(value);
}
/** Ajoute les options de quota uniquement aux commandes qui peuvent collecter GitHub. */
function quotaOptions(command: Command): void {
  command
    .option('--wait-for-quota', 'attendre automatiquement le reset du quota avec un décompte')
    .option('--rest-quota-reserve <points>', 'réserve de sécurité REST', quotaInteger, 100)
    .option('--graphql-quota-reserve <points>', 'réserve de sécurité GraphQL', quotaInteger, 100)
    .option('--quota-max-wait <seconds>', 'attente cumulée maximale en secondes', quotaInteger, 7200);
}

// La collecte reste volontairement en lecture seule : elle produit un RAW sans modifier GitHub.

program
  .command('fixture:anonymize')
  .alias('fixture:prepare')
  .description('Anonymiser un RAW local et générer ses profils')
  .requiredOption('--input <path>', 'input RawDataset JSON file')
  .requiredOption('--output <path>', 'output anonymized fixture JSON file')
  .option('--config-output <path>', 'output anonymized pipeline configuration', '')
  .option('--catalogue-output <path>', 'output anonymized catalogue configuration', '')
  .option(
    '--seed <seed>',
    'stable anonymization seed',
    process.env.ANONYMIZATION_SEED || DEFAULT_ANONYMIZATION_OPTIONS.seed
  )
  .option(
    '--date-offset-days <days>',
    'shift all dates by this number of days',
    process.env.ANON_DATE_OFFSET_DAYS || String(DEFAULT_ANONYMIZATION_OPTIONS.dateOffsetDays)
  )
  .option('--keep-text', 'only redact obvious PII instead of replacing free-form text')
  .option('--anonymize-components', 'replace component names as well as repositories/users/IDs')
  .option('--trace-output <path>', 'local RAW trace manifest', '')
  .option('--no-trace', 'do not generate the local RAW trace manifest')
  .action(
    async (options: {
      input: string;
      output: string;
      configOutput: string;
      catalogueOutput: string;
      seed: string;
      dateOffsetDays: string;
      keepText?: boolean;
      anonymizeComponents?: boolean;
      traceOutput: string;
      trace: boolean;
    }) => {
      const input = JSON.parse(await readFile(options.input, 'utf8')) as RawDataset;
      const generatedConfigPaths = fixtureConfigPaths(options.output);
      if (!options.configOutput) options.configOutput = generatedConfigPaths.system;
      if (!options.catalogueOutput) options.catalogueOutput = generatedConfigPaths.catalogue;
      const config: AnonymizationOptions = {
        aliases: anonymizationAliases(input),
        seed: options.seed,
        dateOffsetDays: Number(options.dateOffsetDays),
        strictText: !options.keepText,
        preserveComponentNames: !options.anonymizeComponents
      };
      const result = anonymizeDataset(input, config);
      const mapper = withAliases(createAnonymizationMapper(config.seed), config.aliases ?? {});
      const pipelineConfig = anonymizePipelineConfig(await loadConfig('github'), input, mapper);
      const catalogueConfig = anonymizeCatalogue(await loadCatalogue('github'), input, config, mapper);
      const validation = validateAnonymizedDataset(result.dataset);
      const integrityErrors = assertRelationalIntegrity(result.dataset);
      result.report.suspiciousStrings = validation.findings.length;
      result.report.warnings.push(...integrityErrors);
      //TODO? if (!validation.valid || integrityErrors.length) {
      //   throw new Error(
      //     `Anonymized fixture validation failed (${validation.findings.length} suspicious strings, ${integrityErrors.length} integrity errors)`
      //   );
      // }
      for (const path of [options.output, options.configOutput, options.catalogueOutput]) {
        await mkdir(dirname(path), { recursive: true });
      }
      await writeFile(options.output, `${JSON.stringify(result.dataset, null, 2)}\n`, 'utf8');
      await writeFile(options.configOutput, stringify(pipelineConfig), 'utf8');
      await writeFile(options.catalogueOutput, stringify(catalogueConfig), 'utf8');
      if (options.trace) {
        const tracePath = options.traceOutput || `${options.output}.trace.json`;
        const trace = buildTraceManifest(input, result.dataset, options.input);
        await writeFile(tracePath, `${JSON.stringify(trace, null, 2)}\n`, 'utf8');
        console.log(`Trace locale : ${tracePath}`);
      }
      console.log(
        `Anonymisation terminée : ${result.report.repositories} repositories ; ${result.report.issues} issues ; ${result.report.pullRequests} PR.`
      );
      console.log(
        `Contrôles : ${result.report.suspiciousStrings} valeur(s) suspecte(s) ; ${result.report.warnings.length} réserve(s). Consulter le manifeste généré avant partage.`
      );
      console.log(`Fixture anonymisée : ${options.output}`);
      console.log(`Configuration : ${options.configOutput}`);
      console.log(`Catalogue : ${options.catalogueOutput}`);
      const manifestPath = `${options.output}.manifest.json`;
      /** Calcule une empreinte SHA-256 pour vérifier les artefacts sans exposer leurs identités sources. */
      const digest = (value: string) => createHash('sha256').update(value).digest('hex');
      const manifest = {
        schemaVersion: 1,
        rawSha256: digest(JSON.stringify(input)),
        fixtureSha256: digest(JSON.stringify(result.dataset)),
        systemSha256: digest(stringify(pipelineConfig)),
        catalogueSha256: digest(stringify(catalogueConfig)),
        dateOffsetDays: config.dateOffsetDays,
        strictText: config.strictText,
        preserveComponentNames: config.preserveComponentNames,
        aliases: Object.values(config.aliases ?? {})
        // Ne jamais écrire la graine ni les identités source dans le manifeste.
      };
      await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
      console.log(`Manifeste : ${manifestPath}`);
      if (!validation.valid || integrityErrors.length)
        throw new Error(
          `Anonymized fixture validation failed (${validation.findings.length} suspicious strings, ${integrityErrors.length} integrity errors)`
        );
    }
  );

program
  .command('fixture:validate')
  .description('Validate an anonymized RawDataset fixture for PII and broken relations')
  .requiredOption('--input <path>', 'fixture JSON file')
  .option('--report <path>', 'Markdown validation report', '')
  .option('--trace <path>', 'local RAW trace manifest used to enrich the report', '')
  .action(async (options: { input: string; report: string; trace: string }) => {
    const dataset = JSON.parse(await readFile(options.input, 'utf8')) as RawDataset;
    const validation = validateAnonymizedDataset(dataset);
    const integrityDetails = inspectRelationalIntegrity(dataset);
    const integrityErrors = assertRelationalIntegrity(dataset);
    const reportPath = options.report || `${options.input}.validation.md`;
    let trace: TraceManifest | undefined;
    if (options.trace) trace = JSON.parse(await readFile(options.trace, 'utf8')) as TraceManifest;
    await writeFile(
      reportPath,
      buildValidationReport(dataset, validation, integrityDetails, options.input, trace),
      'utf8'
    );
    console.log(`Rapport : ${reportPath}`);
    if (!validation.valid || integrityErrors.length)
      throw new Error(
        `INVALID fixture: ${validation.findings.length} suspicious strings, ${integrityErrors.length} integrity errors`
      );
    console.log(`Fixture anonymisée valide : ${dataset.repositories.length} repositories.`);
  });

program
  .command('collect')
  .description('Collecter une fixture ou GitHub en lecture seule')
  .option('--source <source>', 'source fixture ou github', 'fixture')
  .option('--fixture <path>', 'fichier JSON local pour la source fixture', fixturePath)
  .option('--system-config <path>', 'profil YAML system explicite')
  .option('--catalogue-config <path>', 'profil YAML catalogue explicite')
  .requiredOption('--output <path>', 'enregistrer le RAW dans ce fichier (obligatoire)')
  .action(
    async (
      options: ConfigSelection &
        GithubQuotaOptions & { source: CollectionSource; fixture: string; output: string }
    ) => {
      const config = await loadConfig(
        options.source,
        options.source === 'fixture' ? options.fixture : undefined,
        options
      );
      if (options.catalogueConfig) await loadCatalogue(options.source, undefined, options);
      const raw =
        options.source === 'github'
          ? await collectGithub({
              ...options,
              token: githubTokenFromEnvironment(),
              owner: config.githubOwner,
              repositories: config.repositories,
              apiUrl: config.githubApiUrl,
              graphqlUrl: config.githubGraphqlUrl,
              rules: config.github
            })
          : await collectFixture(options.fixture);
      await mkdir(dirname(options.output), { recursive: true });
      await writeFile(options.output, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
      console.log(
        `Collecte terminée : ${raw.repositories.length} repositories ; ${raw.repositories.reduce((total, repository) => total + repository.issues.length, 0)} issues.\nFichier RAW : ${options.output}`
      );
    }
  );

// Cette commande vérifie le périmètre configuré sans lancer les étapes coûteuses du pipeline.
program
  .command('validate')
  .description('Vérifier les configurations et le périmètre de la fixture')
  .option('--fixture <path>', 'fixture JSON file', fixturePath)
  .option('--system-config <path>', 'profil YAML system explicite')
  .option('--catalogue-config <path>', 'profil YAML catalogue explicite')
  .action(async (options: ConfigSelection & { fixture: string }) => {
    const config = await loadConfig('fixture', options.fixture, options);
    await loadCatalogue('fixture', options.fixture, options);
    const raw = await collectFixture(options.fixture);
    const actual = new Set(raw.repositories.map((repository) => repository.name));
    const missing = config.repositories.filter((repository) => !actual.has(repository));
    if (missing.length > 0)
      throw new Error(
        `Missing configured repositories: ${missing.join(', ')}. Fixture: ${options.fixture}. Collected repositories: ${[...actual].join(', ') || '(none)'}. Ensure the fixture and system.fixture.yaml were generated from the same dataset/seed.`
      );
    console.log(`Configuration valide : ${config.repositories.length} repositories configurés.`);
  });

program
  .command('analyze')
  .description('Analyser les données en rejouant le pipeline complet')
  .option('--source <source>', 'source fixture ou github', 'fixture')
  .option('--fixture <path>', 'fichier JSON local pour la source fixture', fixturePath)
  .option('--system-config <path>', 'profil YAML system explicite')
  .option('--catalogue-config <path>', 'profil YAML catalogue explicite')
  .action(
    async (options: ConfigSelection & GithubQuotaOptions & { source: CollectionSource; fixture: string }) => {
      const snapshot = await runPipeline(options.source, options.fixture, options);
      console.log(pipelineSummary(snapshot, 'Analyse', pipelineStatus(snapshot)));
    }
  );

program
  .command('snapshot')
  .description('Enregistrer un snapshot et le dashboard en rejouant le pipeline')
  .option('--source <source>', 'source fixture ou github', 'fixture')
  .option('--fixture <path>', 'fichier JSON local pour la source fixture', fixturePath)
  .option('--system-config <path>', 'profil YAML system explicite')
  .option('--catalogue-config <path>', 'profil YAML catalogue explicite')
  .action(
    async (options: ConfigSelection & GithubQuotaOptions & { source: CollectionSource; fixture: string }) => {
      const snapshot = await runPipeline(options.source, options.fixture, options);
      console.log(pipelineSummary(snapshot, 'Snapshot', pipelineStatus(snapshot)));
    }
  );

program
  .command('dashboard')
  .description('Générer le dashboard en rejouant le pipeline complet')
  .option('--source <source>', 'source fixture ou github', 'fixture')
  .option('--fixture <path>', 'fichier JSON local pour la source fixture', fixturePath)
  .option('--system-config <path>', 'profil YAML system explicite')
  .option('--catalogue-config <path>', 'profil YAML catalogue explicite')
  .action(
    async (options: ConfigSelection & GithubQuotaOptions & { source: CollectionSource; fixture: string }) => {
      const snapshot = await runPipeline(options.source, options.fixture, options);
      console.log(pipelineSummary(snapshot, 'Dashboard', pipelineStatus(snapshot)));
    }
  );

// La commande complète retourne un statut exploitable par un job CI.
program
  .command('pipeline')
  .description('Exécuter le pipeline complet depuis une fixture ou GitHub')
  .option('--source <source>', 'source fixture ou github', 'fixture')
  .option('--fixture <path>', 'fichier JSON local pour la source fixture', fixturePath)
  .option('--system-config <path>', 'profil YAML system explicite')
  .option('--catalogue-config <path>', 'profil YAML catalogue explicite')
  .action(
    async (options: ConfigSelection & GithubQuotaOptions & { source: CollectionSource; fixture: string }) => {
      const snapshot = await runPipeline(options.source, options.fixture, options);
      console.log(pipelineSummary(snapshot, 'Pipeline', pipelineStatus(snapshot)));
    }
  );

program
  .command('reference:prepare')
  .description('Préparer les profils GitHub locaux et une référence fixture anonymisée cohérente')
  .requiredOption('--input <path>', 'fichier RAW collecté')
  .requiredOption('--name <name>', 'nom stable de la référence')
  .option('--system-config <path>', 'configuration source system')
  .option('--catalogue-config <path>', 'catalogue source')
  .option('--seed <seed>', 'graine privée reproductible', process.env.ANONYMIZATION_SEED)
  .option('--date-offset-days <days>', 'décalage des dates', process.env.ANON_DATE_OFFSET_DAYS ?? '-365')
  .option('--anonymize-components', 'anonymiser aussi les composants et leurs labels associés')
  .option('--force', 'remplacer explicitement les artefacts de cette référence')
  .action(async (options) => {
    const files = await prepareReferences({
      input: options.input,
      name: options.name,
      seed: options.seed,
      dateOffsetDays: Number(options.dateOffsetDays),
      anonymizeComponents: Boolean(options.anonymizeComponents),
      force: Boolean(options.force),
      selection: options
    });
    for (const file of files) console.log('Fichier généré : ' + file);
    console.log('Référence préparée ; revue des champs métier conservés requise avant partage.');
  });

program
  .command('catalogue:generate')
  .description('Produire un brouillon de catalogue depuis un RAW local, sans inventer les métadonnées')
  .requiredOption('--input <path>', 'fichier RAW JSON local')
  .requiredOption('--output <path>', 'nouveau fichier YAML de brouillon')
  .option('--component-prefix <prefix>', 'préfixe des labels de composant', 'Component:')
  .action(async (options: { input: string; output: string; componentPrefix: string }) => {
    const draft = await generateCatalogueDraft(options.input, options.output, options.componentPrefix);
    console.log(`Brouillon généré : ${draft.components.length} composants détectés.`);
    console.log(`Catalogue : ${options.output}`);
    console.log('Métadonnées à compléter et associations aux repositories à vérifier avant utilisation.');
  });

for (const command of program.commands) {
  if (['collect', 'analyze', 'snapshot', 'dashboard', 'pipeline'].includes(command.name()))
    quotaOptions(command);
}
await program.parseAsync().catch((error: unknown) => {
  console.error('Erreur : ' + (error instanceof Error ? error.message : 'traitement interrompu.'));
  process.exitCode = 1;
});
