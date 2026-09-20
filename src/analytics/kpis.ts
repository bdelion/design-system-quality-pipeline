import type { Analytics, DataQualityIssue, KpiValue, NormalizedData } from '../domain/types.js';

function kpi(value: number, denominator: number, definition: string, sourceEntityIds: string[], reliability: KpiValue['reliability'] = 'reliable'): KpiValue {
  return { value, numerator: value, denominator, definition, sourceEntityIds, reliability };
}

function unknownKpi(definition: string): KpiValue {
  return { value: 'unknown', numerator: 'unknown', denominator: 'unknown', definition, sourceEntityIds: [], reliability: 'unknown' };
}

function correctionDelayDays(createdAt: string, firstDoneAt: string): number {
  return (Date.parse(firstDoneAt) - Date.parse(createdAt)) / 86_400_000;
}

export function calculateKpis(data: NormalizedData, dqIssues: DataQualityIssue[]): Analytics {
  const excludedAnomalies = new Set(dqIssues.filter((issue) => issue.entityType === 'anomaly' && issue.action === 'exclude').map((issue) => issue.entityId));
  const countedAnomalies = data.anomalies.filter((anomaly) => !excludedAnomalies.has(anomaly.anomalyId));
  const completedAudits = data.audits.filter((audit) => audit.status !== 'in_progress' && audit.status !== 'not_evaluated');
  const unreliable = dqIssues.some((issue) => issue.severity === 'ERROR') ? 'partial' : dqIssues.length > 0 ? 'partial' : 'reliable';
  const correctedAnomalies = countedAnomalies.filter((anomaly): anomaly is typeof anomaly & { firstDoneAt: string } => Boolean(anomaly.firstDoneAt));
  const correctionDelays = correctedAnomalies.map((anomaly) => correctionDelayDays(anomaly.createdAt, anomaly.firstDoneAt));
  const sortedDelays = [...correctionDelays].sort((left, right) => left - right);
  const medianDelay = sortedDelays.length === 0 ? undefined : sortedDelays.length % 2 === 1 ? sortedDelays[Math.floor(sortedDelays.length / 2)] : ((sortedDelays[sortedDelays.length / 2 - 1] ?? 0) + (sortedDelays[sortedDelays.length / 2] ?? 0)) / 2;
  return {
    anomaliesDeclared: kpi(countedAnomalies.length, countedAnomalies.length, 'Nombre d’anomalies conservées après les exclusions de qualité des données.', countedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    anomaliesCorrected: kpi(countedAnomalies.filter((anomaly) => anomaly.everCorrected).length, countedAnomalies.length, 'Nombre d’anomalies ayant une date de première correction métier.', countedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    openAnomalies: kpi(countedAnomalies.filter((anomaly) => anomaly.status === 'open' || anomaly.status === 'reopened').length, countedAnomalies.length, 'Nombre d’anomalies actuellement ouvertes ou rouvertes.', countedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    anomaliesByCriticality: Object.fromEntries(['blocking', 'major', 'minor'].map((criticality) => [criticality, countedAnomalies.filter((anomaly) => anomaly.criticality === criticality).length])),
    auditsCoverage: kpi(completedAudits.length, data.components.length, 'Nombre d’audits terminés rapporté au nombre de composants découverts.', data.audits.map((audit) => audit.auditId), unreliable),
    conformityRate: kpi(completedAudits.filter((audit) => audit.objectiveAuditResult === 'conform').length, completedAudits.length, 'Nombre de résultats objectifs conformes rapporté au nombre d’audits terminés.', completedAudits.map((audit) => audit.auditId), completedAudits.length === 0 ? 'unknown' : unreliable),
    averageCorrectionDelayDays: correctionDelays.length === 0 ? unknownKpi('Délai moyen entre la création et la première correction métier.') : kpi(Number((correctionDelays.reduce((total, delay) => total + delay, 0) / correctionDelays.length).toFixed(1)), correctionDelays.length, 'Délai moyen entre la création et la première correction métier, en jours.', correctedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable),
    medianCorrectionDelayDays: medianDelay === undefined ? unknownKpi('Délai médian entre la création et la première correction métier.') : kpi(Number(medianDelay.toFixed(1)), correctionDelays.length, 'Délai médian entre la création et la première correction métier, en jours.', correctedAnomalies.map((anomaly) => anomaly.anomalyId), unreliable)
  };
}
