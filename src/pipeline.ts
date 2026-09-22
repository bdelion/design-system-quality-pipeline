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
import { loadCatalogue } from './catalogue.js';

export type CollectionSource = 'fixture' | 'github';

/** Exécute la collecte, la normalisation, les contrôles, les KPI et les sorties. */
export async function runPipeline(source: CollectionSource = 'fixture'): Promise<Snapshot> {
  const config = await loadConfig();
  const catalogue = await loadCatalogue();
  const raw = source === 'github'
    ? await collectGithub({
        token: githubTokenFromEnvironment(),
        owner: config.githubOwner,
        repositories: config.repositories,
        apiUrl: config.githubApiUrl,
        graphqlUrl: config.githubGraphqlUrl,
        rules: config.github
      })
    : await collectFixture();

  // Le catalogue est la référence utilisée pour classer les composants découverts.
  raw.catalogueComponents = catalogue.components.map((component) => component.name);
  validateRepositories(config.repositories, raw);
  const normalized = normalizeGithub(raw, config.github, catalogue);
  const qualityIssues = evaluateDataQuality(raw, normalized, config.github);
  const analytics = calculateKpis(normalized, qualityIssues);
  const snapshot = buildSnapshot(raw, normalized, qualityIssues, analytics, config.modelVersion, config.ruleVersion, config.scope);
  await writeJson(`${runPath}/${snapshot.snapshotId}.json`, snapshot);
  await writeJson(`${currentPath}/snapshot.json`, snapshot);
  await generateDashboard(snapshot, dashboardPath, config.githubUrl);
  return snapshot;
}

/** Vérifie que la collecte couvre tous les repositories demandés par la configuration. */
function validateRepositories(expected: string[], raw: RawDataset): void {
  const actual = new Set(raw.repositories.map((repository) => repository.name));
  const missing = expected.filter((repository) => !actual.has(repository));
  if (missing.length > 0) throw new Error(`Missing configured repositories: ${missing.join(', ')}`);
}

/** Détermine si le snapshot est complet ou s'il doit être présenté comme partiel. */
export function pipelineStatus(snapshot: Snapshot): 'COMPLETE' | 'PARTIAL' | 'FAILED' {
  return snapshot.dataQuality.summary.ERROR > 0 || snapshot.dataQuality.summary.WARNING > 0 ? 'PARTIAL' : 'COMPLETE';
}

export { calculateKpis, evaluateDataQuality, normalizeGithub, summarizeQuality };
