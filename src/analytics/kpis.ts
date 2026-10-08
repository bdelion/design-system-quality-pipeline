/**
 * @module analytics.kpis
 * Assemble les indicateurs V1 à partir des données normalisées et de Data Quality.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type { Analytics, DataQualityIssue, NormalizedData } from '../domain/types.js';
import { calculateMetrics } from './metrics.js';

/**
 * Adaptateur de compatibilité temporaire.
 *
 * Le contrat analytique de référence est désormais `Analytics.metrics`.
 * Les propriétés historiques ci-dessous ne recalculent plus aucune donnée :
 * elles projettent uniquement les métriques V2 afin d'éviter deux définitions
 * concurrentes d'un même indicateur. Elles sont conservées temporairement
 * pour les consommateurs legacy et pourront être supprimées dans une version
 * majeure après migration de ces consommateurs.
 *
 * @param data - Modèle métier normalisé.
 * @param dqIssues - Diagnostics de qualité qui influencent la fiabilité.
 * @returns Métriques de référence et projections de compatibilité legacy.
 */
export function calculateKpis(data: NormalizedData, dqIssues: DataQualityIssue[]): Analytics {
  const metrics = calculateMetrics(data, dqIssues);
  /**
   * Réalise le traitement « metric » dans le pipeline de qualité.
   *
   * @param id - Valeur de « id » utilisée par ce traitement.
   * @returns Résultat du traitement.
   */
  const metric = (id: string) => metrics[id];
  /**
   * Réalise le traitement « as legacy » dans le pipeline de qualité.
   *
   * @param id - Valeur de « id » utilisée par ce traitement.
   * @returns Résultat du traitement.
   */
  const asLegacy = (id: string) => {
    const value = metric(id);
    if (!value) throw new Error(`Missing V2 metric: ${id}`);
    return {
      value: value.value,
      numerator: value.numerator ?? value.value,
      denominator: value.denominator ?? value.value,
      definition: value.definition,
      sourceEntityIds: value.sourceEntityIds,
      reliability: value.reliability.status
    };
  };

  return {
    anomaliesDeclared: asLegacy('anomaly.total'),
    anomaliesCorrected: asLegacy('anomaly.correctedEver'),
    openAnomalies: asLegacy('anomaly.open'),
    anomaliesByCriticality: Object.fromEntries(
      ['blocking', 'major', 'minor'].map((criticality) => [
        criticality,
        metric(`anomaly.byCriticality.${criticality}`)?.value ?? 'unknown'
      ])
    ),
    anomaliesByCategory: Object.fromEntries(
      Object.entries(metrics)
        .filter(([id]) => id.startsWith('anomaly.byCategory.'))
        .map(([id, value]) => [id.replace('anomaly.byCategory.', ''), value.value])
    ),
    auditsCoverage: asLegacy('portfolio.auditCoverage'),
    conformityRate: asLegacy('audit.conformityRate'),
    averageCorrectionDelayDays: asLegacy('anomaly.correctionDelay.average'),
    medianCorrectionDelayDays: asLegacy('anomaly.correctionDelay.median'),
    metrics
  };
}
