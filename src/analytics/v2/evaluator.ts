import { NormalizedData, DataQualityIssue, DqRuleId, DataQualityStatus } from '../../domain/types.js';
import { AnalyticsV2, Metric, MetricReliability } from '../../domain/metrics.js';
import { getDqRulesForMetric } from './dq-impact-map.js';
import { calculateMean, calculateMedian, calculatePercentile90, calculateDaysDifference } from './math.js';

export interface EvaluationOptions {
  periodFrom?: string;
  periodTo?: string;
}

export function evaluateAnalyticsV2(
  data: NormalizedData,
  dqIssues: DataQualityIssue[] = [],
  options: EvaluationOptions = {}
): AnalyticsV2 {
  const nowIso = new Date().toISOString().split('T')[0];
  const period = {
    from: options.periodFrom || '2000-01-01',
    to: options.periodTo || nowIso,
  };

  const activeDqRuleIds = Array.from(new Set(dqIssues.map((issue) => issue.ruleId as DqRuleId)));

  const buildReliability = (metricId: string, excludedCount = 0): MetricReliability => {
    const impactedRules = getDqRulesForMetric(metricId, activeDqRuleIds);
    const relatedIssues = dqIssues.filter((issue) => impactedRules.includes(issue.ruleId as DqRuleId));
    
    let status: DataQualityStatus = 'reliable';
    if (impactedRules.length > 0 || excludedCount > 0) {
      status = 'partial';
    }

    return {
      status,
      impactedByDqRules: impactedRules,
      excludedCount,
      reasons: relatedIssues.map((issue) => `${issue.ruleId}: ${issue.message}`),
    };
  };

  const metrics: Record<string, Metric> = {};

  // FAMILLE A : PATRIMOINE
  const totalComponents = data.components.length;
  metrics['patrimony.components.total'] = {
    id: 'patrimony.components.total',
    name: 'Composants suivis',
    category: 'patrimony',
    unit: 'count',
    value: totalComponents,
    scope: { entityType: 'component', entityIds: data.components.map((c) => c.id) },
    reliability: buildReliability('patrimony.components.total'),
    definition: 'Nombre total de composants déclarés dans le catalogue actif.',
  };

  const auditedComponentIds = new Set(data.audits.map((a) => a.componentId));
  const coveredComponentsCount = data.components.filter((c) => auditedComponentIds.has(c.id)).length;
  const coverageRate = totalComponents > 0 ? Number(((coveredComponentsCount / totalComponents) * 100).toFixed(1)) : 'unknown';

  metrics['patrimony.audits.coverage'] = {
    id: 'patrimony.audits.coverage',
    name: 'Couverture du patrimoine',
    category: 'patrimony',
    unit: 'percentage',
    value: coverageRate,
    numerator: coveredComponentsCount,
    denominator: totalComponents,
    scope: { entityType: 'component', entityIds: data.components.map((c) => c.id) },
    reliability: buildReliability('patrimony.audits.coverage'),
    definition: 'Proportion de composants du patrimoine disposant d’au moins un audit enregistré.',
  };

  // FAMILLE B : ÉTAT QUALITÉ
  const completedAudits = data.audits.filter((a) => a.status === 'completed' || a.status === 'conformal');
  const compliantAudits = completedAudits.filter((a) => a.result === 'compliant' || a.isConformal === true);
  const complianceRate = completedAudits.length > 0 
    ? Number(((compliantAudits.length / completedAudits.length) * 100).toFixed(1)) 
    : 'unknown';

  metrics['quality_state.audits.compliance_rate'] = {
    id: 'quality_state.audits.compliance_rate',
    name: 'Conformité des audits',
    category: 'quality_state',
    unit: 'percentage',
    value: complianceRate,
    numerator: compliantAudits.length,
    denominator: completedAudits.length,
    scope: { entityType: 'audit', entityIds: completedAudits.map((a) => a.id) },
    reliability: buildReliability('quality_state.audits.compliance_rate'),
    definition: 'Part des audits réalisés dont le résultat est conforme.',
  };

  const excludedAnomalies = dqIssues.filter((i) => i.ruleId === 'DQ-008' || i.ruleId === 'DQ-001');
  const excludedAnomalyIds = new Set(excludedAnomalies.map((i) => i.entityId));

  const validAnomalies = data.anomalies.filter((a) => !excludedAnomalyIds.has(a.id));
  const openAnomalies = validAnomalies.filter((a) => a.status === 'open' || a.status === 'in_progress' || a.status === 'reopened');

  const criticalityCounts: Record<string, number> = {};
  const repositoryCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};

  openAnomalies.forEach((a) => {
    const crit = a.severity || a.criticality || 'non_spécifiée';
    criticalityCounts[crit] = (criticalityCounts[crit] || 0) + 1;

    const repo = a.repository || 'inconnu';
    repositoryCounts[repo] = (repositoryCounts[repo] || 0) + 1;

    const cats = Array.isArray(a.categories) ? a.categories : [a.category || 'général'];
    cats.forEach((cat) => {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
  });

  metrics['quality_state.anomalies.open_stock'] = {
    id: 'quality_state.anomalies.open_stock',
    name: 'Anomalies ouvertes (Stock)',
    category: 'quality_state',
    unit: 'count',
    value: openAnomalies.length,
    scope: { entityType: 'anomaly', entityIds: openAnomalies.map((a) => a.id) },
    reliability: buildReliability('quality_state.anomalies.open_stock', excludedAnomalyIds.size),
    definition: 'Stock d’anomalies actuellement ouvertes ou en cours de traitement.',
    breakdowns: [
      { dimension: 'criticality', counts: criticalityCounts },
      { dimension: 'repository', counts: repositoryCounts },
      { dimension: 'category', counts: categoryCounts },
    ],
  };

  // FAMILLE C : PERFORMANCE
  const createdInPeriod = validAnomalies.filter((a) => a.createdAt && a.createdAt >= period.from && a.createdAt <= period.to);
  const resolvedInPeriod = validAnomalies.filter((a) => {
    const resolvedDate = a.firstDoneAt || a.closedAt || a.resolvedAt;
    if (!resolvedDate) return false;
    return (a.status === 'closed' || a.status === 'done') && resolvedDate >= period.from && resolvedDate <= period.to;
  });

  metrics['performance.anomalies.flow_created'] = {
    id: 'performance.anomalies.flow_created',
    name: 'Nouvelles anomalies (Flux)',
    category: 'performance',
    unit: 'count',
    value: createdInPeriod.length,
    scope: { entityType: 'anomaly', entityIds: createdInPeriod.map((a) => a.id) },
    period,
    reliability: buildReliability('performance.anomalies.flow_created'),
    definition: 'Nombre de nouvelles anomalies déclarées sur la période.',
  };

  metrics['performance.anomalies.flow_resolved'] = {
    id: 'performance.anomalies.flow_resolved',
    name: 'Anomalies résolues (Flux)',
    category: 'performance',
    unit: 'count',
    value: resolvedInPeriod.length,
    scope: { entityType: 'anomaly', entityIds: resolvedInPeriod.map((a) => a.id) },
    period,
    reliability: buildReliability('performance.anomalies.flow_resolved'),
    definition: 'Nombre d’anomalies corrigées et clôturées sur la période.',
  };

  const resolutionDelays: number[] = [];
  resolvedInPeriod.forEach((a) => {
    const endDate = a.firstDoneAt || a.closedAt || a.resolvedAt;
    if (a.createdAt && endDate) {
      resolutionDelays.push(calculateDaysDifference(a.createdAt, endDate));
    }
  });

  metrics['performance.anomalies.resolution_time_mean'] = {
    id: 'performance.anomalies.resolution_time_mean',
    name: 'Délai moyen de résolution',
    category: 'performance',
    unit: 'days',
    value: calculateMean(resolutionDelays),
    scope: { entityType: 'anomaly', entityIds: resolvedInPeriod.map((a) => a.id) },
    period,
    reliability: buildReliability('performance.anomalies.resolution_time_mean'),
    definition: 'Temps moyen (en jours) pour corriger une anomalie.',
  };

  metrics['performance.anomalies.resolution_time_median'] = {
    id: 'performance.anomalies.resolution_time_median',
    name: 'Délai médian de résolution',
    category: 'performance',
    unit: 'days',
    value: calculateMedian(resolutionDelays),
    scope: { entityType: 'anomaly', entityIds: resolvedInPeriod.map((a) => a.id) },
    period,
    reliability: buildReliability('performance.anomalies.resolution_time_median'),
    definition: 'Temps médian (en jours) sous lequel 50% des anomalies ont été résolues.',
  };

  metrics['performance.anomalies.resolution_time_p90'] = {
    id: 'performance.anomalies.resolution_time_p90',
    name: 'Délai P90 de résolution',
    category: 'performance',
    unit: 'days',
    value: calculatePercentile90(resolutionDelays),
    scope: { entityType: 'anomaly', entityIds: resolvedInPeriod.map((a) => a.id) },
    period,
    reliability: buildReliability('performance.anomalies.resolution_time_p90'),
    definition: 'Temps (en jours) sous lequel 90% des anomalies ont été résolues.',
  };

  // FAMILLE D : SANTÉ DES DONNÉES
  const impactedMetricIds = Object.keys(metrics).filter((k) => metrics[k].reliability.status !== 'reliable');

  metrics['data_health.issues.total_count'] = {
    id: 'data_health.issues.total_count',
    name: 'Total des réserves DQ',
    category: 'data_health',
    unit: 'count',
    value: dqIssues.length,
    scope: { entityType: 'dq_issue', entityIds: dqIssues.map((i) => i.id || i.ruleId) },
    reliability: { status: 'reliable', impactedByDqRules: [], excludedCount: 0, reasons: [] },
    definition: 'Nombre d’anomalies de qualité de données détectées lors du contrôle.',
  };

  metrics['data_health.metrics.impacted_count'] = {
    id: 'data_health.metrics.impacted_count',
    name: 'Métriques altérées',
    category: 'data_health',
    unit: 'count',
    value: impactedMetricIds.length,
    scope: { entityType: 'dq_issue', entityIds: impactedMetricIds },
    reliability: { status: 'reliable', impactedByDqRules: [], excludedCount: 0, reasons: [] },
    definition: 'Nombre de métriques analytiques dont la fiabilité est dégradée par des règles DQ.',
  };

  return {
    modelVersion: '2.0',
    generatedAt: new Date().toISOString(),
    period,
    metrics,
  };
}