import type { DataQualityIssue } from '../domain/types.js';

const RULE_METRIC_IMPACTS: Record<string, { pattern: string; action: 'include' | 'exclude' | 'unknown'; reason: string }[]> = {
  'DQ-001': [
    { pattern: 'anomaly.byCriticality.*', action: 'exclude', reason: 'Criticité absente.' },
    { pattern: 'anomaly.criticalityCoverage', action: 'exclude', reason: 'Criticité absente.' }
  ],
  'DQ-002': [
    { pattern: 'anomaly.byCriticality.*', action: 'exclude', reason: 'Plusieurs criticités incompatibles.' },
    { pattern: 'anomaly.criticalityCoverage', action: 'exclude', reason: 'Plusieurs criticités incompatibles.' }
  ],
  'DQ-003': [
    { pattern: 'audit.anomalyCount.*', action: 'exclude', reason: 'Rattachement à plusieurs audits.' },
    { pattern: 'anomaly.correctionDelay.*', action: 'include', reason: 'Le délai reste calculable indépendamment du rattachement.' }
  ],
  'DQ-004': [
    { pattern: 'anomaly.*', action: 'include', reason: 'L’anomalie reste comptable, mais la preuve de correction est incomplète.' }
  ],
  'DQ-005': [
    { pattern: 'anomaly.*', action: 'include', reason: 'L’anomalie reste comptable, mais le lien issue/PR est incohérent.' }
  ],
  'DQ-006': [
    { pattern: 'portfolio.*', action: 'include', reason: 'Le composant reste dans le patrimoine, mais ses métadonnées de référence sont incomplètes.' }
  ],
  'DQ-007': [
    { pattern: 'anomaly.byCategory.*', action: 'include', reason: 'La classification contient un label explicitement inconnu.' }
  ],
  'DQ-008': [
    { pattern: 'anomaly.total', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.open', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.inProgress', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.done', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.byCriticality.*', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.criticalityCoverage', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.byCategory.*', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.correctedEver', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.reopened', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.correctionDelay.*', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.backlog.oldestAge', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' }
  ],
  'DQ-009': [
    { pattern: 'portfolio.release.*', action: 'unknown', reason: 'La preuve de release Nexus est indisponible.' }
  ],
  'DQ-010': [
    { pattern: 'anomaly.total', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.open', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.inProgress', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.done', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.byCriticality.*', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.criticalityCoverage', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.byCategory.*', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.correctedEver', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.reopened', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.correctionDelay.*', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.backlog.oldestAge', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' }
  ]
};

export function matchesMetricPattern(pattern: string, metricId: string): boolean {
  return pattern.endsWith('.*') ? metricId.startsWith(pattern.slice(0, -1)) : pattern === metricId;
}

/** Enrichit les DQ avec leur impact explicite sur les métriques. */
export function applyMetricImpacts(issues: DataQualityIssue[], metricIds: string[]): DataQualityIssue[] {
  return issues.map((issue) => ({
    ...issue,
    impacts: (RULE_METRIC_IMPACTS[issue.ruleId] ?? [])
      .flatMap((candidate) => metricIds
        .filter((metricId) => matchesMetricPattern(candidate.pattern, metricId))
        .map((metricId) => ({
          metricId,
          action: candidate.action,
          reason: candidate.reason
        })))
  }));
}

