/**
 * @module pipeline
 * Orchestre collecte, normalisation, contrôles qualité, analyses et snapshots.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { collectFixture } from './collectors/fixture.js';
import { collectGithub, githubTokenFromEnvironment } from './collectors/github.js';
import { loadConfig } from './config.js';
import { calculateKpis } from './analytics/kpis.js';
import { readJson, writeJson } from './lib/files.js';
import { currentPath, dashboardPath, fixturePath, runPath } from './lib/paths.js';
import { generateDashboard } from './dashboard/generate.js';
import { normalizeGithub } from './normalizers/github.js';
import { evaluateDataQuality, summarizeQuality } from './quality/rules.js';
import { buildSnapshot } from './snapshots/snapshot.js';
import type { RawDataset, Snapshot } from './domain/types.js';
import { loadCatalogue } from './catalogue.js';
import { calculateFlowMetrics } from './analytics/flows.js';
import { applyComponentVersionVerdicts } from './analytics/component-versions.js';
import { diffSnapshots } from './snapshots/diff.js';
import { latestComparableSnapshot } from './snapshots/history.js';
import { readdir } from 'node:fs/promises';

/**
 * Définit le type « CollectionSource » utilisé dans les contrats du pipeline.
 */
export type CollectionSource = 'fixture' | 'github';

/** Exécute la collecte, la normalisation, les contrôles, les KPI et les sorties. */
export async function runPipeline(
  source: CollectionSource = 'fixture',
  selectedFixturePath: string = fixturePath
): Promise<Snapshot> {
  const config = await loadConfig(source, source === 'fixture' ? selectedFixturePath : undefined);
  const catalogue = await loadCatalogue(source, source === 'fixture' ? selectedFixturePath : undefined);
  const raw =
    source === 'github'
      ? await collectGithub({
          token: githubTokenFromEnvironment(),
          owner: config.githubOwner,
          repositories: config.repositories,
          apiUrl: config.githubApiUrl,
          graphqlUrl: config.githubGraphqlUrl,
          rules: config.github
        })
      : await collectFixture(selectedFixturePath);

  // Le catalogue est la référence utilisée pour classer les composants découverts.
  raw.catalogueComponents = catalogue.components.map((component) => component.name);
  validateRepositories(config.repositories, raw, source === 'fixture' ? selectedFixturePath : undefined);
  const normalized = normalizeGithub(raw, config.github, catalogue, config.auditVersion);
  applyComponentVersionVerdicts(normalized);
  const qualityIssues = evaluateDataQuality(raw, normalized, config.github);
  const analytics = calculateKpis(normalized, qualityIssues);
  const capturedAt = new Date().toISOString();
  const previousSnapshot = latestComparableSnapshot(await loadSnapshots(), {
    scope: config.scope,
    modelVersion: config.modelVersion,
    ruleVersion: config.ruleVersion
  });
  if (previousSnapshot && previousSnapshot.capturedAt < capturedAt) {
    const diff = diffSnapshots(previousSnapshot, {
      snapshotId: 'pending',
      capturedAt,
      scope: config.scope,
      rawData: raw,
      normalizedData: normalized,
      dataQuality: { issues: qualityIssues, summary: { INFO: 0, WARNING: 0, ERROR: 0 } },
      analytics,
      ruleVersion: config.ruleVersion,
      modelVersion: config.modelVersion,
      reliability: 'partial'
    });
    analytics.flows = calculateFlowMetrics(diff, qualityIssues);
  }
  const snapshot = buildSnapshot(
    raw,
    normalized,
    qualityIssues,
    analytics,
    config.modelVersion,
    config.ruleVersion,
    config.scope,
    capturedAt
  );
  await writeJson(`${runPath}/${snapshot.snapshotId}.json`, snapshot);
  await writeJson(`${currentPath}/snapshot.json`, snapshot);
  await generateDashboard(snapshot, dashboardPath, config.githubUrl);
  return snapshot;
}

/**
 * Charge snapshots dans le contexte du pipeline de qualité.
 * @returns Résultat du traitement.
 */
async function loadSnapshots(): Promise<Snapshot[]> {
  try {
    const files = (await readdir(runPath)).filter((file: string) => file.endsWith('.json'));
    return await Promise.all(files.map((file: string) => readJson<Snapshot>(`${runPath}/${file}`)));
  } catch {
    return [];
  }
}

/** Vérifie que la collecte couvre tous les repositories demandés par la configuration. */
function validateRepositories(expected: string[], raw: RawDataset, fixtureFile?: string): void {
  const actual = new Set(raw.repositories.map((repository) => repository.name));
  const missing = expected.filter((repository) => !actual.has(repository));
  if (missing.length === 0) return;

  const sourceHint = fixtureFile ? ` Fixture: ${fixtureFile}.` : '';
  const actualRepositories = [...actual].join(', ') || '(none)';
  throw new Error(
    `Missing configured repositories: ${missing.join(', ')}.${sourceHint} Collected repositories: ${actualRepositories}. Generate the fixture and its fixture-specific configuration together with npm run fixture:anonymize, or provide the matching fixture configuration.`
  );
}

/** Détermine si le snapshot est complet ou s'il doit être présenté comme partiel. */
export function pipelineStatus(snapshot: Snapshot): 'COMPLETE' | 'PARTIAL' {
  return snapshot.dataQuality.summary.ERROR > 0 || snapshot.dataQuality.summary.WARNING > 0
    ? 'PARTIAL'
    : 'COMPLETE';
}

export { calculateKpis, evaluateDataQuality, normalizeGithub, summarizeQuality };
