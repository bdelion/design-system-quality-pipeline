import type { Analytics, DataQualityIssue, KpiValue, NormalizedData } from '../domain/types.js';
import { calculateMetrics } from './metrics.js';

/** Construit un KPI numérique en conservant ses entités sources. */
function kpi(value: number, denominator: number, definition: string, sourceEntityIds: string[], reliability: KpiValue['reliability'] = 'reliable'): KpiValue {
  return { value, numerator: value, denominator, definition, sourceEntityIds, reliability };
}

/** Construit un KPI explicitement inconnu lorsqu'aucun calcul fiable n'est possible. */
function unknownKpi(definition: string): KpiValue {
  return { value: 'unknown', numerator: 'unknown', denominator: 'unknown', definition, sourceEntityIds: [], reliability: 'unknown' };
}

/** Calcule un délai calendaire entre deux dates ISO. */
function correctionDelayDays(createdAt: string, firstDoneAt: string): number {
  return (Date.parse(firstDoneAt) - Date.parse(createdAt)) / 86_400_000;
}

/** Calcule tous les KPI en excluant uniquement les anomalies invalides. */
export function calculateKpis(data: NormalizedData, dqIssues: DataQualityIssue[]): Analytics {
  const excludedAnomalies = new Set(dqIssues.filter((issue) => issue.entityType === 'anomaly' && issue.action === 'exclude').map((issue) => issue.entityId));
  const countedAnomalies = data.anomalies.filter((anomaly) => !anomaly.cancelled && !excludedAnomalies.has(anomaly.anomalyId));
  const completedAudits = data.audits.filter((audit) => audit.status !== 'in_progress' && audit.status !== 'not_evaluated');
  const unreliable = dqIssues.some((issue) => issue.severity === 'ERROR') ? 'partial' : dqIssues.length > 0 ? 'partial' : 'reliable';
  const correctedAnomalies = countedAnomalies.filter((anomaly): anomaly is typeof anomaly & { firstDoneAt: string } => Boolean(anomaly.firstDoneAt));
  const correctionDelays = correctedAnomalies.map((anomaly) => correctionDelayDays(anomaly.createdAt, anomaly.firstDoneAt));
  // Le tri sur une copie permet de conserver l'ordre du snapshot original.
  const sortedDelays = [...correctionDelays].sort((left, right) => left - right);
  const medianDelay = sortedDelays.length === 0 ? undefined : sortedDelays.length % 2 === 1 ? sortedDelays[Math.floor(sortedDelays.length / 2)] : ((sortedDelays[sortedDelays.length / 2 - 1] ?? 0) + (sortedDelays[sortedDelays.length / 2] ?? 0)) / 2;
  return {
    anomaliesDeclared: kpi(countedAnomalies.length, countedAnomalies.length, 'Nombre d’anomalies conservées après les exclusions de qualité des données.', countedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    anomaliesCorrected: kpi(correctedAnomalies.length, countedAnomalies.length, 'Nombre d’anomalies ayant une date de première correction métier.', countedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    openAnomalies: kpi(countedAnomalies.filter((anomaly) => anomaly.status === 'open' || anomaly.status === 'reopened').length, countedAnomalies.length, 'Nombre d’anomalies actuellement ouvertes ou rouvertes.', countedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    anomaliesByCriticality: Object.fromEntries(['blocking', 'major', 'minor'].map((criticality) => [criticality, countedAnomalies.filter((anomaly) => anomaly.criticality === criticality).length])),
    anomaliesByCategory: Object.fromEntries([...new Set(countedAnomalies.flatMap((anomaly) => anomaly.categories))].map((category) => [category, countedAnomalies.filter((anomaly) => anomaly.categories.includes(category)).length])),
    auditsCoverage: kpi(completedAudits.length, data.components.length, 'Nombre d’audits terminés rapporté au nombre de composants découverts.', data.audits.map((audit) => audit.auditId), unreliable),
    conformityRate: kpi(completedAudits.filter((audit) => audit.objectiveAuditResult === 'conform').length, completedAudits.length, 'Nombre de résultats objectifs conformes rapporté au nombre d’audits terminés.', completedAudits.map((audit) => audit.auditId), completedAudits.length === 0 ? 'unknown' : unreliable),
    averageCorrectionDelayDays: correctionDelays.length === 0 ? unknownKpi('Délai moyen entre la création et la première correction métier.') : kpi(Number((correctionDelays.reduce((total, delay) => total + delay, 0) / correctionDelays.length).toFixed(1)), correctionDelays.length, 'Délai moyen entre la création et la première correction métier, en jours.', correctedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    medianCorrectionDelayDays: medianDelay === undefined ? unknownKpi('Délai médian entre la création et la première correction métier.') : kpi(Number(medianDelay.toFixed(1)), correctionDelays.length, 'Délai médian entre la création et la première correction métier, en jours.', correctedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    metrics: calculateMetrics(data, dqIssues)
  };
}
