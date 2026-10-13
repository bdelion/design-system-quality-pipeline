/**
 * @module pipeline
 * Orchestre collecte, normalisation, contrôles qualité, analyses et snapshots.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { loadDataset } from './datasets.js';
import { loadHistoricalImport } from './historical-import.js';
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

/**
 * Rejoue un dataset ou un RAW contextualisé hors réseau, avec enrichissement historique facultatif.
 * Les entrées et leurs configurations restent intactes ; les preuves locales sont vérifiées avant calcul.
 * @param datasetPath - Dataset autonome ou fichier RAW produit par la collecte.
 * @param outputPath - Destination des snapshots et du dashboard, distincte des entrées.
 * @param historicalInputs - Référentiels de présence ou fichiers d'identités les désignant.
 * @param historicalRepositoryOverride - Dépôt réel auquel affecter explicitement l'unique import.
 */
export async function runPipeline(
  datasetPath: string,
  outputPath: string,
  historicalInputs: string[] = [],
  historicalRepositoryOverride?: string
): Promise<Snapshot> {
  const { config, catalogue, rawData: raw, historicalComponents: embedded } = await loadDataset(datasetPath);
  if (historicalRepositoryOverride !== undefined && historicalInputs.length !== 1)
    throw new Error('--historical-repository exige exactement un fichier --historical-catalogue.');
  const imported = await Promise.all(
    historicalInputs.map((path) => loadHistoricalImport(path, raw, historicalRepositoryOverride))
  );
  const repositories = imported.map((history) =>
    history.repository.includes('/') ? history.repository.split('/')[1]! : history.repository
  );
  if (new Set(repositories).size !== imported.length)
    throw new Error('Plusieurs historiques pour le même dépôt.');
  const historicalComponents = [
    ...(embedded ?? []).filter(
      (history) =>
        !repositories.includes(
          history.repository.includes('/') ? history.repository.split('/')[1]! : history.repository
        )
    ),
    ...imported
  ];
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
  const normalized = normalizeGithub(
    raw,
    config.github,
    catalogue ?? undefined,
    config.auditVersion,
    config.githubUrl,
    historicalComponents
  );
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
