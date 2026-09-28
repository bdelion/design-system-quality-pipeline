import { collectFixture } from './collectors/fixture.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import { loadConfig } from './config.js';
import { calculateKpis } from './analytics/kpis.js';
import { readJson, writeJson } from './lib/files.js';
import { currentPath, dashboardPath, runPath } from './lib/paths.js';
import { generateDashboard } from './dashboard/generate.js';
import { normalizeGithub } from './normalizers/github.js';
import { evaluateDataQuality, summarizeQuality } from './quality/rules.js';
import { buildSnapshot } from './snapshots/snapshot.js';
import type { RawDataset, Snapshot } from './domain/types.js';
import { loadCatalogue } from './catalogue.js';
import { calculateFlowMetrics } from './analytics/flows.js';
import { diffSnapshots } from './snapshots/diff.js';
import { readdir } from 'node:fs/promises';

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
  const normalized = normalizeGithub(raw, config.github, catalogue, config.auditVersion);
  const qualityIssues = evaluateDataQuality(raw, normalized, config.github);
  const analytics = calculateKpis(normalized, qualityIssues);
  const previousSnapshot = await loadLatestSnapshot();
  if (previousSnapshot && previousSnapshot.capturedAt < raw.collectedAt) {
    const diff = diffSnapshots(previousSnapshot, {
      snapshotId: 'pending', capturedAt: raw.collectedAt, scope: config.scope, rawData: raw, normalizedData: normalized,
      dataQuality: { issues: qualityIssues, summary: { INFO: 0, WARNING: 0, ERROR: 0 } }, analytics,
      ruleVersion: config.ruleVersion, modelVersion: config.modelVersion, reliability: 'partial'
    });
    analytics.flows = calculateFlowMetrics(diff, qualityIssues);
  }
  const snapshot = buildSnapshot(raw, normalized, qualityIssues, analytics, config.modelVersion, config.ruleVersion, config.scope);
  await writeJson(`${runPath}/${snapshot.snapshotId}.json`, snapshot);
  await writeJson(`${currentPath}/snapshot.json`, snapshot);
  await generateDashboard(snapshot, dashboardPath, config.githubUrl);
  return snapshot;
}


async function loadLatestSnapshot(): Promise<Snapshot | undefined> {
  try {
    const files = (await readdir(runPath)).filter((file: string) => file.endsWith('.json')).sort();
    const latest = files.at(-1);
    return latest ? await readJson<Snapshot>(`${runPath}/${latest}`) : undefined;
  } catch {
    return undefined;
  }
}

/** Vérifie que la collecte couvre tous les repositories demandés par la configuration. */
function validateRepositories(expected: string[], raw: RawDataset): void {
  const actual = new Set(raw.repositories.map((repository) => repository.name));
  const missing = expected.filter((repository) => !actual.has(repository));
  if (missing.length > 0) throw new Error(`Missing configured repositories: ${missing.join(', ')}`);
}

/** Détermine si le snapshot est complet ou s'il doit être présenté comme partiel. */
export function pipelineStatus(snapshot: Snapshot): 'COMPLETE' | 'PARTIAL' {
  return snapshot.dataQuality.summary.ERROR > 0 || snapshot.dataQuality.summary.WARNING > 0 ? 'PARTIAL' : 'COMPLETE';
}

export { calculateKpis, evaluateDataQuality, normalizeGithub, summarizeQuality };
