import { DqRuleId } from '../../domain/types.js';

export const DQ_METRIC_IMPACT_MAP: Record<DqRuleId, string[]> = {
  'DQ-001': ['quality_state.anomalies.open_stock', 'performance.anomalies.flow_resolved'],
  'DQ-002': ['quality_state.anomalies.open_stock'],
  'DQ-003': ['quality_state.anomalies.open_stock'],
  'DQ-004': [
    'performance.anomalies.flow_resolved',
    'performance.anomalies.resolution_time_mean',
    'performance.anomalies.resolution_time_median',
    'performance.anomalies.resolution_time_p90',
  ],
  'DQ-005': [
    'quality_state.anomalies.open_stock',
    'performance.anomalies.flow_resolved',
  ],
  'DQ-006': ['patrimony.audits.coverage', 'patrimony.components.total'],
  'DQ-007': ['quality_state.anomalies.open_stock'],
  'DQ-008': ['quality_state.anomalies.open_stock', 'performance.anomalies.flow_created'],
  'DQ-009': ['patrimony.components.releases'],
  'DQ-010': ['quality_state.anomalies.open_stock'],
};

export function getDqRulesForMetric(metricId: string, activeDqRules: DqRuleId[]): DqRuleId[] {
  return activeDqRules.filter((ruleId) => {
    const impactedMetrics = DQ_METRIC_IMPACT_MAP[ruleId] || [];
    return impactedMetrics.includes(metricId);
  });
}