/**
 * @module cli
 * Déclare les commandes de la CLI et délègue leur exécution aux services du pipeline.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { Command } from 'commander';
import { collectFixture } from './collectors/fixture.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import { loadConfig } from './config.js';
import { loadCatalogue } from './catalogue.js';
import { runPipeline, pipelineStatus, type CollectionSource } from './pipeline.js';
import { readFile, writeFile } from 'node:fs/promises';
import { stringify } from 'yaml';
import { DEFAULT_ANONYMIZATION_OPTIONS, type AnonymizationOptions } from './anonymization/types.js';
import { anonymizeDataset, createAnonymizationMapper } from './anonymization/anonymizer.js';
import { anonymizePipelineConfig, anonymizeCatalogue } from './anonymization/config.js';
import { fixturePath, fixtureConfigPaths } from './lib/paths.js';
import { formatAnonymizationReport } from './anonymization/report.js';
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
  .description('GitHub-first Design System quality pipeline')
  .version('0.1.0');

// La collecte reste volontairement en lecture seule : elle produit un RAW sans modifier GitHub.

program
  .command('fixture:anonymize')
  .description('Create a deterministic anonymized fixture from a RawDataset JSON file')
  .requiredOption('--input <path>', 'input RawDataset JSON file')
  .requiredOption('--output <path>', 'output anonymized fixture JSON file')
  .option('--config-output <path>', 'output anonymized pipeline configuration', '')
  .option('--catalogue-output <path>', 'output anonymized catalogue configuration', '')
  .option('--seed <seed>', 'stable anonymization seed', DEFAULT_ANONYMIZATION_OPTIONS.seed)
  .option(
    '--date-offset-days <days>',
    'shift all dates by this number of days',
    String(DEFAULT_ANONYMIZATION_OPTIONS.dateOffsetDays)
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
        seed: options.seed,
        dateOffsetDays: Number(options.dateOffsetDays),
        strictText: !options.keepText,
        preserveComponentNames: !options.anonymizeComponents
      };
      const result = anonymizeDataset(input, config);
      const mapper = createAnonymizationMapper(config.seed);
      const pipelineConfig = anonymizePipelineConfig(await loadConfig('github'), input, mapper);
      const catalogueConfig = anonymizeCatalogue(await loadCatalogue('github'), input, config, mapper);
      const validation = validateAnonymizedDataset(result.dataset);
      const integrityErrors = assertRelationalIntegrity(result.dataset);
      result.report.suspiciousStrings = validation.findings.length;
      result.report.warnings.push(...integrityErrors);
      await writeFile(options.output, `${JSON.stringify(result.dataset, null, 2)}\n`, 'utf8');
      await writeFile(options.configOutput, stringify(pipelineConfig), 'utf8');
      await writeFile(options.catalogueOutput, stringify(catalogueConfig), 'utf8');
      if (options.trace) {
        const tracePath = options.traceOutput || `${options.output}.trace.json`;
        const trace = buildTraceManifest(input, result.dataset, options.input);
        await writeFile(tracePath, `${JSON.stringify(trace, null, 2)}\n`, 'utf8');
        console.log(`TRACE ${tracePath}`);
      }
      console.log(formatAnonymizationReport(result.report));
      console.log(`OUTPUT ${options.output}`);
      console.log(`CONFIG ${options.configOutput}`);
      console.log(`CATALOGUE ${options.catalogueOutput}`);
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
    console.log(`REPORT ${reportPath}`);
    if (!validation.valid || integrityErrors.length)
      throw new Error(
        `INVALID fixture: ${validation.findings.length} suspicious strings, ${integrityErrors.length} integrity errors`
      );
    console.log(`VALID anonymized fixture: ${dataset.repositories.length} repositories`);
  });

program
  .command('collect')
  .description('Collect read-only data from a fixture or GitHub')
  .option('--source <source>', 'fixture or github', 'fixture')
  .option('--fixture <path>', 'fixture JSON file when source=fixture', fixturePath)
  .option('--output <path>', 'write the RawDataset JSON to this file')
  .action(async (options: { source: CollectionSource; fixture: string; output?: string }) => {
    const config = await loadConfig(
      options.source,
      options.source === 'fixture' ? options.fixture : undefined
    );
    const raw =
      options.source === 'github'
        ? await collectGithub({
            token: githubTokenFromEnvironment(),
            owner: config.githubOwner,
            repositories: config.repositories,
            apiUrl: config.githubApiUrl,
            graphqlUrl: config.githubGraphqlUrl,
            rules: config.github
          })
        : await collectFixture(options.fixture);
    if (options.output) await writeFile(options.output, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
    console.log(
      `COLLECTED ${raw.repositories.length} repositories at ${raw.collectedAt}${options.output ? ` -> ${options.output}` : ''}`
    );
  });

// Cette commande vérifie le périmètre configuré sans lancer les étapes coûteuses du pipeline.
program
  .command('validate')
  .description('Validate configuration and source scope')
  .option('--fixture <path>', 'fixture JSON file', fixturePath)
  .action(async (options: { fixture: string }) => {
    const config = await loadConfig('fixture', options.fixture);
    const raw = await collectFixture(options.fixture);
    const actual = new Set(raw.repositories.map((repository) => repository.name));
    const missing = config.repositories.filter((repository) => !actual.has(repository));
    if (missing.length > 0)
      throw new Error(
        `Missing configured repositories: ${missing.join(', ')}. Fixture: ${options.fixture}. Collected repositories: ${[...actual].join(', ') || '(none)'}. Ensure the fixture and system.fixture.yaml were generated from the same dataset/seed.`
      );
    console.log(`VALID ${config.repositories.length} configured repositories`);
  });

program
  .command('analyze')
  .description('Run normalization, Data Quality and KPI calculations')
  .option('--source <source>', 'fixture or github', 'fixture')
  .option('--fixture <path>', 'fixture JSON file when source=fixture', fixturePath)
  .action(async (options: { source: CollectionSource; fixture: string }) => {
    const snapshot = await runPipeline(options.source, options.fixture);
    console.log(
      `ANALYZED ${snapshot.normalizedData.anomalies.length} anomalies; ${snapshot.dataQuality.issues.length} DQ issues`
    );
  });

program
  .command('snapshot')
  .description('Build and persist an immutable snapshot and dashboard')
  .option('--source <source>', 'fixture or github', 'fixture')
  .option('--fixture <path>', 'fixture JSON file when source=fixture', fixturePath)
  .action(async (options: { source: CollectionSource; fixture: string }) => {
    const snapshot = await runPipeline(options.source, options.fixture);
    console.log(`SNAPSHOT ${snapshot.snapshotId}`);
  });

program
  .command('dashboard')
  .description('Generate static dashboard pages from the current pipeline snapshot')
  .option('--source <source>', 'fixture or github', 'fixture')
  .option('--fixture <path>', 'fixture JSON file when source=fixture', fixturePath)
  .action(async (options: { source: CollectionSource; fixture: string }) => {
    const snapshot = await runPipeline(options.source, options.fixture);
    console.log(`DASHBOARD data/dashboard/index.html (${snapshot.snapshotId})`);
  });

// La commande complète retourne un statut exploitable par un job CI.
program
  .command('pipeline')
  .description('Run the complete fixture or GitHub pipeline')
  .option('--source <source>', 'fixture or github', 'fixture')
  .option('--fixture <path>', 'fixture JSON file when source=fixture', fixturePath)
  .action(async (options: { source: CollectionSource; fixture: string }) => {
    const snapshot = await runPipeline(options.source, options.fixture);
    console.log(`${pipelineStatus(snapshot)} ${snapshot.snapshotId}`);
    console.log(JSON.stringify(snapshot.analytics, null, 2));
  });

await program.parseAsync();
