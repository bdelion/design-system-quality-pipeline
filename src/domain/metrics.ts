import { DataQualityStatus, DqRuleId } from './types.js';

export type MetricUnit = 'count' | 'percentage' | 'days';
export type MetricCategory = 'patrimony' | 'quality_state' | 'performance' | 'data_health';

export interface MetricScope {
  entityType: 'component' | 'audit' | 'anomaly' | 'repository' | 'dq_issue';
  entityIds: string[];
}

export interface MetricReliability {
  status: DataQualityStatus;
  impactedByDqRules: DqRuleId[];
  excludedCount: number;
  reasons: string[];
}

export interface MetricBreakdown {
  dimension: 'criticality' | 'repository' | 'category' | 'status';
  counts: Record<string, number>;
}

export interface Metric {
  id: string;
  name: string;
  category: MetricCategory;
  unit: MetricUnit;
  value: number | 'unknown';
  numerator?: number | 'unknown';
  denominator?: number | 'unknown';
  scope: MetricScope;
  period?: {
    from: string;
    to: string;
  };
  reliability: MetricReliability;
  definition: string;
  breakdowns?: MetricBreakdown[];
}

export interface AnalyticsV2 {
  modelVersion: '2.0';
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  metrics: Record<string, Metric>;
}