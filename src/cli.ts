import { Command } from 'commander';
import { collectFixture } from './collectors/fixture.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import { loadConfig } from './config.js';
import { runPipeline, pipelineStatus, type CollectionSource } from './pipeline.js';

const program = new Command()
  .name('design-system-quality')
  .description('GitHub-first Design System quality pipeline')
  .version('0.1.0');

program.command('collect').description('Collect read-only data from a fixture or GitHub').option('--source <source>', 'fixture or github', 'fixture').action(async (options: { source: CollectionSource }) => {
  const config = await loadConfig();
  const raw = options.source === 'github'
    ? await collectGithub({ token: githubTokenFromEnvironment(), owner: config.githubOwner, repositories: config.repositories, apiUrl: config.githubApiUrl, rules: config.github })
    : await collectFixture();
  console.log(`COLLECTED ${raw.repositories.length} repositories at ${raw.collectedAt}`);
});

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

program.command('pipeline').description('Run the complete fixture or GitHub pipeline').option('--source <source>', 'fixture or github', 'fixture').action(async (options: { source: CollectionSource }) => {
  const snapshot = await runPipeline(options.source);
  console.log(`${pipelineStatus(snapshot)} ${snapshot.snapshotId}`);
  console.log(JSON.stringify(snapshot.analytics, null, 2));
});

await program.parseAsync();
