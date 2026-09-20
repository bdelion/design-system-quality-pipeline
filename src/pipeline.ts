import { collectFixture } from './collectors/fixture.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import { loadConfig } from './config.js';
import { calculateKpis } from './analytics/kpis.js';
import { writeJson } from './lib/files.js';
import { currentPath, dashboardPath, runPath } from './lib/paths.js';
import { generateDashboard } from './dashboard/generate.js';
import { normalizeGithub } from './normalizers/github.js';
import { evaluateDataQuality, summarizeQuality } from './quality/rules.js';
import { buildSnapshot } from './snapshots/snapshot.js';
import type { RawDataset, Snapshot } from './domain/types.js';

export type CollectionSource = 'fixture' | 'github';

export async function runPipeline(source: CollectionSource = 'fixture'): Promise<Snapshot> {
  const config = await loadConfig();
  const raw = source === 'github'
    ? await collectGithub({ token: githubTokenFromEnvironment(), owner: config.githubOwner, repositories: config.repositories, apiUrl: config.githubApiUrl, graphqlUrl: config.githubGraphqlUrl, rules: config.github })
    : await collectFixture();
  validateRepositories(config.repositories, raw);
  const normalized = normalizeGithub(raw, config.github);
  const qualityIssues = evaluateDataQuality(raw, normalized, config.github);
  const analytics = calculateKpis(normalized, qualityIssues);
  const snapshot = buildSnapshot(raw, normalized, qualityIssues, analytics, config.modelVersion, config.ruleVersion, config.scope);
  await writeJson(`${runPath}/${snapshot.snapshotId}.json`, snapshot);
  await writeJson(`${currentPath}/snapshot.json`, snapshot);
  await generateDashboard(snapshot, dashboardPath, config.githubUrl);
  return snapshot;
}

function validateRepositories(expected: string[], raw: RawDataset): void {
  const actual = new Set(raw.repositories.map((repository) => repository.name));
  const missing = expected.filter((repository) => !actual.has(repository));
  if (missing.length > 0) throw new Error(`Missing configured repositories: ${missing.join(', ')}`);
}

export function pipelineStatus(snapshot: Snapshot): 'COMPLETE' | 'PARTIAL' | 'FAILED' {
  return snapshot.dataQuality.summary.ERROR > 0 || snapshot.dataQuality.summary.WARNING > 0 ? 'PARTIAL' : 'COMPLETE';
}

export { calculateKpis, evaluateDataQuality, normalizeGithub, summarizeQuality };
