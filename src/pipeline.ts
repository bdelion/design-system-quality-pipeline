/**
 * @module pipeline
 * Orchestre collecte, normalisation, contrôles qualité, analyses et snapshots.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { loadDataset } from './datasets.js';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { calculateKpis } from './analytics/kpis.js';
import { readJson, writeJson } from './lib/files.js';
import { generateDashboard } from './dashboard/generate.js';
import { normalizeGithub } from './normalizers/github.js';
import { evaluateDataQuality, summarizeQuality } from './quality/rules.js';
import { buildSnapshot } from './snapshots/snapshot.js';
import type { Snapshot } from './domain/types.js';
import { calculateFlowMetrics } from './analytics/flows.js';
import { applyComponentVersionVerdicts } from './analytics/component-versions.js';
import { diffSnapshots } from './snapshots/diff.js';
import { latestComparableSnapshot } from './snapshots/history.js';
import { readdir, lstat } from 'node:fs/promises';

/** Rejoue un jeu autonome hors réseau et écrit uniquement dans sa destination explicite. */
export async function runPipeline(datasetPath: string, outputPath: string): Promise<Snapshot> {
  const { config, catalogue, rawData: raw } = await loadDataset(datasetPath);
  const inputDirectory = (await lstat(datasetPath)).isDirectory()
    ? resolve(datasetPath)
    : dirname(resolve(datasetPath));
  const outputRelative = relative(inputDirectory, resolve(outputPath));
  if (
    !outputRelative ||
    (outputRelative !== '..' && !outputRelative.startsWith('..' + sep) && !isAbsolute(outputRelative))
  )
    throw new Error('Choisir un dossier de sorties distinct du dataset.');
  const runPath = resolve(outputPath, 'runs');
  const normalized = normalizeGithub(raw, config.github, catalogue ?? undefined, config.auditVersion);
  applyComponentVersionVerdicts(normalized);
  const qualityIssues = evaluateDataQuality(raw, normalized, config.github);
  const analytics = calculateKpis(
    normalized,
    qualityIssues,
    config.github.accessibilityRecognition,
    catalogue !== null
  );
  const capturedAt = new Date().toISOString();
  const previousSnapshot = latestComparableSnapshot(await loadSnapshots(runPath), {
    scope: config.scope,
    modelVersion: config.modelVersion,
    ruleVersion: config.ruleVersion
  });
  const snapshot = buildSnapshot(
    raw,
    normalized,
    qualityIssues,
    analytics,
    config.modelVersion,
    config.ruleVersion,
    config.scope,
    capturedAt,
    previousSnapshot
  );
  completeSnapshotComparison(previousSnapshot, snapshot);
  await writeJson(`${runPath}/${snapshot.snapshotId}.json`, snapshot);
  await writeJson(resolve(outputPath, 'current/snapshot.json'), snapshot);
  await generateDashboard(snapshot, outputPath, config.githubUrl, config.github.labels.componentPrefix);
  return snapshot;
}

/**
 * Charge snapshots dans le contexte du pipeline de qualité.
 * @returns Résultat du traitement.
 */
async function loadSnapshots(runPath: string): Promise<Snapshot[]> {
  try {
    const files = (await readdir(runPath)).filter((file: string) => file.endsWith('.json'));
    return await Promise.all(files.map((file: string) => readJson<Snapshot>(`${runPath}/${file}`)));
  } catch {
    return [];
  }
}

/** Détermine si le snapshot est complet ou s'il doit être présenté comme partiel. */
export function pipelineStatus(snapshot: Snapshot): 'COMPLETE' | 'PARTIAL' {
  return snapshot.dataQuality.summary.ERROR > 0 || snapshot.dataQuality.summary.WARNING > 0
    ? 'PARTIAL'
    : 'COMPLETE';
}

export { calculateKpis, evaluateDataQuality, normalizeGithub, summarizeQuality };

/** Complète les flux et le journal après attribution de l'identité réelle de la capture, sans identifiant provisoire. */
export function completeSnapshotComparison(previous: Snapshot | undefined, current: Snapshot): void {
  if (
    !previous ||
    previous.scope !== current.scope ||
    previous.modelVersion !== current.modelVersion ||
    previous.ruleVersion !== current.ruleVersion ||
    !(Date.parse(previous.capturedAt) < Date.parse(current.capturedAt))
  )
    return;
  const diff = diffSnapshots(previous, current);
  current.analytics.flows = calculateFlowMetrics(diff, current.dataQuality.issues);
  current.analytics.transitions = diff.businessTransitions;
}
