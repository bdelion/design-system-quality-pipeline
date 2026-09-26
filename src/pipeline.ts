import { NormalizedData, RawDataset } from './domain/types.js';
import { normalizeDataset } from './domain/normalize.js';
import { evaluateDataQuality } from './quality/rules.js';
import { evaluateAnalyticsV2 } from './analytics/v2/evaluator.js';
import { createSnapshot, Snapshot } from './snapshots/snapshot.js';
import { PipelineConfig } from './config.js';

export type CollectorFunction = () => Promise<RawDataset> | RawDataset;

export async function runPipeline(
  collectData: CollectorFunction,
  config: PipelineConfig,
  options: { periodFrom?: string; periodTo?: string } = {}
): Promise<Snapshot> {
  // 1. Collecte des données brutes
  const rawData = await collectData();

  // 2. Normalisation
  const normalizedData: NormalizedData = normalizeDataset(rawData);

  // 3. Contrôle Qualité avec les 3 arguments requis (raw, normalized, config.github)
  const dqIssues = evaluateDataQuality(rawData, normalizedData, config.github);

  // 4. Calcul Analytique V2
  const analytics = evaluateAnalyticsV2(normalizedData, dqIssues, {
    periodFrom: options.periodFrom,
    periodTo: options.periodTo,
  });

  // 5. Génération du Snapshot
  return createSnapshot(normalizedData, dqIssues, analytics);
}