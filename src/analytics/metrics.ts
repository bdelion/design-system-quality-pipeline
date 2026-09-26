import type { DataQualityIssue, Metric, MetricBreakdown, MetricScope, NormalizedData } from '../domain/types.js';
import { applyMetricImpacts, matchesMetricPattern } from '../lib/metric-impacts.js';

export interface MetricSpec {
  id: string;
  unit: Metric['unit'];
  scope: MetricScope;
  definition: string;
}


function reliabilityFor(metricId: string, issues: DataQualityIssue[]): { status: Metric['reliability']['status']; issueIds: string[] } {
  const relevant = issues.filter((issue) => issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, metricId)));
  const status = relevant.some((issue) => issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, metricId) && impact.action === 'unknown'))
    ? 'unknown'
    : relevant.length > 0 ? 'partial' : 'reliable';
  return { status, issueIds: relevant.map((issue) => issue.id).filter(Boolean) };
}

function metric(spec: MetricSpec, value: number | 'unknown', numerator: number | 'unknown', denominator: number | 'unknown', sourceEntityIds: string[], issues: DataQualityIssue[], breakdowns?: MetricBreakdown[]): Metric {
  const relevant = issues.filter((issue) => issue.impacts.some((impact) => matchesMetricPattern(impact.metricId, spec.id)));
  return {
    id: spec.id,
    value,
    unit: spec.unit,
    numerator,
    denominator,
    scope: spec.scope,
    definition: spec.definition,
    sourceEntityIds,
    reliability: reliabilityFor(spec.id, issues),
    exclusions: relevant.flatMap((issue) => issue.impacts
      .filter((impact) => matchesMetricPattern(impact.metricId, spec.id) && impact.action === 'exclude')
      .map(() => ({ entityId: issue.entityId, ruleId: issue.ruleId }))),
    breakdowns
  };
}

function median(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[middle] : ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function percentile(values: number[], p: number): number | undefined {
  if (values.length === 0) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return (sorted[lower] ?? 0) + ((sorted[upper] ?? 0) - (sorted[lower] ?? 0)) * (index - lower);
}

function delayDays(createdAt: string, firstDoneAt: string): number {
  return (Date.parse(firstDoneAt) - Date.parse(createdAt)) / 86_400_000;
}

/** Construit les métriques V2 sans supprimer les données du snapshot. */
export function calculateMetrics(data: NormalizedData, dqIssues: DataQualityIssue[]): Record<string, Metric> {
  const metricIds = [
    'portfolio.repositories', 'portfolio.libraries', 'portfolio.components', 'portfolio.componentsAudited', 'portfolio.auditCoverage',
    'audit.completed', 'audit.conform', 'audit.conditional', 'audit.nonConform', 'audit.critical', 'audit.conformityRate',
    'anomaly.total', 'anomaly.open', 'anomaly.inProgress', 'anomaly.done', 'anomaly.byCriticality.blocking', 'anomaly.byCriticality.major', 'anomaly.byCriticality.minor',
    'anomaly.criticalityCoverage', 'anomaly.byCategory.*', 'anomaly.created', 'anomaly.corrected', 'anomaly.reopened', 'anomaly.cancelled',
    'anomaly.correctionDelay.average', 'anomaly.correctionDelay.median', 'anomaly.correctionDelay.p90', 'anomaly.backlog.oldestAge'
  ];
  const issues = applyMetricImpacts(dqIssues, metricIds);
  const excluded = (metricId: string) => new Set(issues.flatMap((issue) => issue.impacts.filter((impact) => matchesMetricPattern(impact.metricId, metricId) && impact.action === 'exclude').map((impact) => issue.entityId)));
  const activeComponents = data.components.filter((component) => component.status === 'active');
  const completedAudits = data.audits.filter((audit) => !['in_progress', 'not_evaluated'].includes(audit.status));
  const auditedComponents = new Set(completedAudits.map((audit) => audit.componentId));
  const validAnomalies = data.anomalies.filter((anomaly) => !anomaly.cancelled);
  const anomalyIds = (metricId: string) => validAnomalies.filter((anomaly) => !excluded(metricId).has(anomaly.anomalyId)).map((anomaly) => anomaly.anomalyId);
  const corrected = validAnomalies.filter((anomaly) => Boolean(anomaly.firstDoneAt) && !excluded('anomaly.correctionDelay.average').has(anomaly.anomalyId));
  const delays = corrected.flatMap((anomaly) => anomaly.firstDoneAt ? [delayDays(anomaly.createdAt, anomaly.firstDoneAt)] : []);
  const conform = completedAudits.filter((audit) => audit.objectiveAuditResult === 'conform');
  const m: Record<string, Metric> = {};
  m['portfolio.repositories'] = metric({ id: 'portfolio.repositories', unit: 'count', scope: 'portfolio', definition: 'Nombre de repositories effectivement analysés.' }, data.libraries.length, data.libraries.length, data.libraries.length, data.libraries.map((x) => x.libraryId), issues);
  m['portfolio.libraries'] = metric({ id: 'portfolio.libraries', unit: 'count', scope: 'portfolio', definition: 'Nombre de bibliothèques analysées.' }, data.libraries.length, data.libraries.length, data.libraries.length, data.libraries.map((x) => x.libraryId), issues);
  m['portfolio.components'] = metric({ id: 'portfolio.components', unit: 'count', scope: 'portfolio', definition: 'Nombre de composants actifs dans le périmètre du patrimoine.' }, activeComponents.length, activeComponents.length, activeComponents.length, activeComponents.map((x) => x.componentId), issues);
  m['portfolio.componentsAudited'] = metric({ id: 'portfolio.componentsAudited', unit: 'count', scope: 'portfolio', definition: 'Nombre de composants actifs disposant d’au moins un audit terminé.' }, auditedComponents.size, auditedComponents.size, activeComponents.length, [...auditedComponents], issues);
  m['portfolio.auditCoverage'] = metric({ id: 'portfolio.auditCoverage', unit: 'percentage', scope: 'portfolio', definition: 'Composants actifs disposant d’un audit terminé / composants actifs du périmètre.' }, activeComponents.length ? Number(((auditedComponents.size / activeComponents.length) * 100).toFixed(1)) : 'unknown', auditedComponents.size, activeComponents.length, [...auditedComponents], issues);
  m['audit.completed'] = metric({ id: 'audit.completed', unit: 'count', scope: 'audit', definition: 'Nombre d’audits ayant atteint un résultat exploitable.' }, completedAudits.length, completedAudits.length, data.audits.length, completedAudits.map((x) => x.auditId), issues);
  m['audit.conform'] = metric({ id: 'audit.conform', unit: 'count', scope: 'audit', definition: 'Nombre d’audits dont le résultat objectif est conforme.' }, conform.length, conform.length, completedAudits.length, conform.map((x) => x.auditId), issues);
  m['audit.conditional'] = metric({ id: 'audit.conditional', unit: 'count', scope: 'audit', definition: 'Nombre d’audits conditionnels.' }, completedAudits.filter((x) => x.objectiveAuditResult === 'conditional').length, completedAudits.filter((x) => x.objectiveAuditResult === 'conditional').length, completedAudits.length, completedAudits.map((x) => x.auditId), issues);
  m['audit.nonConform'] = metric({ id: 'audit.nonConform', unit: 'count', scope: 'audit', definition: 'Nombre d’audits non conformes.' }, completedAudits.filter((x) => x.objectiveAuditResult === 'non_conform').length, completedAudits.filter((x) => x.objectiveAuditResult === 'non_conform').length, completedAudits.length, completedAudits.map((x) => x.auditId), issues);
  m['audit.critical'] = metric({ id: 'audit.critical', unit: 'count', scope: 'audit', definition: 'Nombre d’audits critiques.' }, completedAudits.filter((x) => x.objectiveAuditResult === 'critical').length, completedAudits.filter((x) => x.objectiveAuditResult === 'critical').length, completedAudits.length, completedAudits.map((x) => x.auditId), issues);
  m['audit.conformityRate'] = metric({ id: 'audit.conformityRate', unit: 'percentage', scope: 'audit', definition: 'Audits conformes / audits terminés.' }, completedAudits.length ? Number(((conform.length / completedAudits.length) * 100).toFixed(1)) : 'unknown', conform.length, completedAudits.length, completedAudits.map((x) => x.auditId), issues);
  const totalIds = anomalyIds('anomaly.total');
  m['anomaly.total'] = metric({ id: 'anomaly.total', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies non annulées et conservées dans le périmètre général.' }, totalIds.length, totalIds.length, validAnomalies.length, totalIds, issues);
  const openIds = validAnomalies.filter((x) => ['open', 'reopened'].includes(x.status) && !excluded('anomaly.open').has(x.anomalyId)).map((x) => x.anomalyId);
  m['anomaly.open'] = metric({ id: 'anomaly.open', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies actuellement ouvertes ou rouvertes.' }, openIds.length, openIds.length, totalIds.length, openIds, issues);
  const inProgressIds = validAnomalies.filter((x) => x.status === 'in_progress' && !excluded('anomaly.inProgress').has(x.anomalyId)).map((x) => x.anomalyId);
  m['anomaly.inProgress'] = metric({ id: 'anomaly.inProgress', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies actuellement en cours de traitement.' }, inProgressIds.length, inProgressIds.length, totalIds.length, inProgressIds, issues);
  const doneIds = validAnomalies.filter((x) => x.status === 'done' && !excluded('anomaly.done').has(x.anomalyId)).map((x) => x.anomalyId);
  m['anomaly.done'] = metric({ id: 'anomaly.done', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies actuellement terminées.' }, doneIds.length, doneIds.length, totalIds.length, doneIds, issues);
  for (const criticality of ['blocking', 'major', 'minor']) {
    const id = `anomaly.byCriticality.${criticality}`;
    const ids = validAnomalies.filter((x) => x.criticality === criticality && !excluded(id).has(x.anomalyId)).map((x) => x.anomalyId);
    m[id] = metric({ id, unit: 'count', scope: 'anomaly', definition: `Nombre d’anomalies de criticité ${criticality}.` }, ids.length, ids.length, totalIds.length, ids, issues);
  }
  const classifiedIds = validAnomalies.filter((x) => x.criticality && !excluded('anomaly.criticalityCoverage').has(x.anomalyId)).map((x) => x.anomalyId);
  m['anomaly.criticalityCoverage'] = metric({ id: 'anomaly.criticalityCoverage', unit: 'percentage', scope: 'anomaly', definition: 'Anomalies disposant d’une criticité valide / anomalies nécessitant une criticité.' }, totalIds.length ? Number(((classifiedIds.length / totalIds.length) * 100).toFixed(1)) : 'unknown', classifiedIds.length, totalIds.length, classifiedIds, issues);
  const categories = [...new Set(validAnomalies.flatMap((x) => x.categories))];
  for (const category of categories) {
    const id = `anomaly.byCategory.${category}`;
    const ids = validAnomalies.filter((x) => x.categories.includes(category) && !excluded(id).has(x.anomalyId)).map((x) => x.anomalyId);
    m[id] = metric({ id, unit: 'count', scope: 'anomaly', definition: `Nombre d’anomalies portant la catégorie ${category}. Les catégories sont multi-étiquettes.` }, ids.length, ids.length, totalIds.length, ids, issues);
  }
  m['anomaly.created'] = metric({ id: 'anomaly.created', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies créées dans le périmètre du snapshot. La période sera activée avec les snapshots historiques.' }, totalIds.length, totalIds.length, totalIds.length, totalIds, issues);
  m['anomaly.corrected'] = metric({ id: 'anomaly.corrected', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies ayant une première correction métier documentée.' }, corrected.length, corrected.length, totalIds.length, corrected.map((x) => x.anomalyId), issues);
  const reopened = validAnomalies.filter((x) => x.status === 'reopened' && !excluded('anomaly.reopened').has(x.anomalyId));
  m['anomaly.reopened'] = metric({ id: 'anomaly.reopened', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies actuellement rouvertes.' }, reopened.length, reopened.length, totalIds.length, reopened.map((x) => x.anomalyId), issues);
  const cancelled = data.anomalies.filter((x) => x.cancelled);
  m['anomaly.cancelled'] = metric({ id: 'anomaly.cancelled', unit: 'count', scope: 'anomaly', definition: 'Nombre d’anomalies annulées, conservées uniquement pour traçabilité.' }, cancelled.length, cancelled.length, data.anomalies.length, cancelled.map((x) => x.anomalyId), issues);
  m['anomaly.correctionDelay.average'] = metric({ id: 'anomaly.correctionDelay.average', unit: 'days', scope: 'anomaly', definition: 'Délai moyen entre la création et la première correction métier, en jours calendaires.' }, delays.length ? Number((delays.reduce((a, b) => a + b, 0) / delays.length).toFixed(1)) : 'unknown', delays.length, delays.length, corrected.map((x) => x.anomalyId), issues);
  const med = median(delays);
  m['anomaly.correctionDelay.median'] = metric({ id: 'anomaly.correctionDelay.median', unit: 'days', scope: 'anomaly', definition: 'Délai médian entre la création et la première correction métier, en jours calendaires.' }, med === undefined ? 'unknown' : Number(med.toFixed(1)), delays.length, delays.length, corrected.map((x) => x.anomalyId), issues);
  const p90 = percentile(delays, 0.9);
  m['anomaly.correctionDelay.p90'] = metric({ id: 'anomaly.correctionDelay.p90', unit: 'days', scope: 'anomaly', definition: '90e percentile du délai entre création et première correction métier.' }, p90 === undefined ? 'unknown' : Number(p90.toFixed(1)), delays.length, delays.length, corrected.map((x) => x.anomalyId), issues);
  const open = validAnomalies.filter((x) => ['open', 'reopened'].includes(x.status) && !excluded('anomaly.backlog.oldestAge').has(x.anomalyId));
  const now = Date.parse(data.anomalies.reduce((latest, x) => x.createdAt > latest ? x.createdAt : latest, '1970-01-01T00:00:00.000Z'));
  const oldest = open.length ? Math.max(...open.map((x) => now - Date.parse(x.createdAt))) / 86_400_000 : undefined;
  m['anomaly.backlog.oldestAge'] = metric({ id: 'anomaly.backlog.oldestAge', unit: 'days', scope: 'anomaly', definition: 'Âge du plus ancien élément actuellement ouvert, calculé par rapport à la date la plus récente connue du snapshot.' }, oldest === undefined ? 'unknown' : Number(oldest.toFixed(1)), open.length, open.length, open.map((x) => x.anomalyId), issues);
  return m;
}
