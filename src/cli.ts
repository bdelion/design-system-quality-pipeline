import { Command } from 'commander';
import { collectFixture } from './collectors/fixture.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import { loadConfig } from './config.js';
import { runPipeline, pipelineStatus, type CollectionSource } from './pipeline.js';
import { readFile, writeFile } from 'node:fs/promises';
import { DEFAULT_ANONYMIZATION_OPTIONS, type AnonymizationOptions } from './anonymization/types.js';
import { anonymizeDataset } from './anonymization/anonymizer.js';
import { formatAnonymizationReport } from './anonymization/report.js';
import { assertRelationalIntegrity, validateAnonymizedDataset } from './anonymization/validator.js';
import type { RawDataset } from './domain/types.js';

/** Interface CLI des commandes de collecte, analyse et génération. */
const program = new Command()
  .name('design-system-quality')
  .description('GitHub-first Design System quality pipeline')
  .version('0.1.0');

// La collecte reste volontairement en lecture seule : elle produit un RAW sans modifier GitHub.

program.command('fixture:anonymize')
  .description('Create a deterministic anonymized fixture from a RawDataset JSON file')
  .requiredOption('--input <path>', 'input RawDataset JSON file')
  .requiredOption('--output <path>', 'output anonymized fixture JSON file')
  .option('--seed <seed>', 'stable anonymization seed', DEFAULT_ANONYMIZATION_OPTIONS.seed)
  .option('--date-offset-days <days>', 'shift all dates by this number of days', String(DEFAULT_ANONYMIZATION_OPTIONS.dateOffsetDays))
  .option('--keep-text', 'only redact obvious PII instead of replacing free-form text')
  .option('--anonymize-components', 'replace component names as well as repositories/users/IDs')
  .action(async (options: { input: string; output: string; seed: string; dateOffsetDays: string; keepText?: boolean; anonymizeComponents?: boolean; }) => {
    const input = JSON.parse(await readFile(options.input, 'utf8')) as RawDataset;
    const config: AnonymizationOptions = { seed: options.seed, dateOffsetDays: Number(options.dateOffsetDays), strictText: !options.keepText, preserveComponentNames: !options.anonymizeComponents };
    const result = anonymizeDataset(input, config);
    const validation = validateAnonymizedDataset(result.dataset);
    const integrityErrors = assertRelationalIntegrity(result.dataset);
    result.report.suspiciousStrings = validation.findings.length;
    result.report.warnings.push(...integrityErrors);
    await writeFile(options.output, `${JSON.stringify(result.dataset, null, 2)}\n`, 'utf8');
    console.log(formatAnonymizationReport(result.report));
    console.log(`OUTPUT ${options.output}`);
    if (!validation.valid || integrityErrors.length) throw new Error(`Anonymized fixture validation failed (${validation.findings.length} suspicious strings, ${integrityErrors.length} integrity errors)`);
  });

program.command('fixture:validate')
  .description('Validate an anonymized RawDataset fixture for PII and broken relations')
  .requiredOption('--input <path>', 'fixture JSON file')
  .action(async (options: { input: string }) => {
    const dataset = JSON.parse(await readFile(options.input, 'utf8')) as RawDataset;
    const validation = validateAnonymizedDataset(dataset);
    const integrityErrors = assertRelationalIntegrity(dataset);
    if (validation.findings.length) console.error(JSON.stringify(validation.findings, null, 2));
    if (integrityErrors.length) console.error(JSON.stringify(integrityErrors, null, 2));
    if (!validation.valid || integrityErrors.length) throw new Error(`INVALID fixture: ${validation.findings.length} suspicious strings, ${integrityErrors.length} integrity errors`);
    console.log(`VALID anonymized fixture: ${dataset.repositories.length} repositories`);
  });

program.command('collect').description('Collect read-only data from a fixture or GitHub').option('--source <source>', 'fixture or github', 'fixture').option('--output <path>', 'write the RawDataset JSON to this file').action(async (options: { source: CollectionSource; output?: string }) => {
  const config = await loadConfig();
  const raw = options.source === 'github'
    ? await collectGithub({ token: githubTokenFromEnvironment(), owner: config.githubOwner, repositories: config.repositories, apiUrl: config.githubApiUrl, graphqlUrl: config.githubGraphqlUrl, rules: config.github })
    : await collectFixture();
  if (options.output) await writeFile(options.output, `${JSON.stringify(raw, null, 2)}\n`, 'utf8');
  console.log(`COLLECTED ${raw.repositories.length} repositories at ${raw.collectedAt}${options.output ? ` -> ${options.output}` : ''}`);
});

// Cette commande vérifie le périmètre configuré sans lancer les étapes coûteuses du pipeline.
program.command('validate').description('Validate configuration and source scope').action(async () => {
  const config = await loadConfig();
  const raw = await collectFixture();
  const actual = new Set(raw.repositories.map((repository) => repository.name));
  const missing = config.repositories.filter((repository) => !actual.has(repository));
  if (missing.length > 0) throw new Error(`Missing configured repositories: ${missing.join(', ')}`);
  console.log(`VALID ${config.repositories.length} configured repositories`);
});

program.command('analyze').description('Run normalization, Data Quality and KPI calculations').option('--source <source>', 'fixture or github', 'fixture').action(async (options: { source: CollectionSource }) => {
  const snapshot = await runPipeline(options.source);
  console.log(`ANALYZED ${snapshot.normalizedData.anomalies.length} anomalies; ${snapshot.dataQuality.issues.length} DQ issues`);
});

program.command('snapshot').description('Build and persist an immutable snapshot and dashboard').option('--source <source>', 'fixture or github', 'fixture').action(async (options: { source: CollectionSource }) => {
  const snapshot = await runPipeline(options.source);
  console.log(`SNAPSHOT ${snapshot.snapshotId}`);
});

program.command('dashboard').description('Generate static dashboard pages from the current pipeline snapshot').option('--source <source>', 'fixture or github', 'fixture').action(async (options: { source: CollectionSource }) => {
  const snapshot = await runPipeline(options.source);
  console.log(`DASHBOARD data/dashboard/index.html (${snapshot.snapshotId})`);
});

// La commande complète retourne un statut exploitable par un job CI.
program.command('pipeline').description('Run the complete fixture or GitHub pipeline').option('--source <source>', 'fixture or github', 'fixture').action(async (options: { source: CollectionSource }) => {
  const snapshot = await runPipeline(options.source);
  console.log(`${pipelineStatus(snapshot)} ${snapshot.snapshotId}`);
  console.log(JSON.stringify(snapshot.analytics, null, 2));
});

await program.parseAsync();
