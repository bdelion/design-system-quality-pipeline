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
    { pattern: 'anomaly.correctedEver', action: 'include', reason: 'L’anomalie reste comptable, mais la preuve de correction est incomplète.' },
    { pattern: 'anomaly.correctionDelay.*', action: 'include', reason: 'Le délai reste calculable, mais la preuve de correction est incomplète.' },
    { pattern: 'anomaly.flow.corrected', action: 'include', reason: 'Le flux de correction reste observable, mais la preuve de correction est incomplète.' }
  ],
  'DQ-005': [
    { pattern: 'anomaly.correctedEver', action: 'include', reason: 'L’anomalie reste comptable, mais le lien issue/PR est incohérent.' },
    { pattern: 'anomaly.correctionDelay.*', action: 'include', reason: 'Le délai reste calculable, mais le lien issue/PR est incohérent.' },
    { pattern: 'anomaly.flow.corrected', action: 'include', reason: 'Le flux de correction reste observable, mais le lien issue/PR est incohérent.' }
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
    { pattern: 'anomaly.backlog.oldestAge', action: 'exclude', reason: 'L’issue annulée ne doit contribuer au stock analytique.' },
    { pattern: 'anomaly.flow.cancelled', action: 'exclude', reason: 'Le flux d’annulation est déjà représenté par la relation d’annulation source.' }
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
    { pattern: 'anomaly.backlog.oldestAge', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' },
    { pattern: 'anomaly.flow.cancelled', action: 'exclude', reason: 'L’issue annulée possède une relation interdite avec une milestone.' }
  ],
  'DQ-013': [
    { pattern: 'audit.*', action: 'exclude', reason: 'L’Audit ne possède pas exactement un Component.' },
    { pattern: 'portfolio.auditCoverage', action: 'exclude', reason: 'L’Audit ne possède pas exactement un Component.' }
  ],
  'DQ-014': [
    { pattern: 'audit.*', action: 'exclude', reason: 'La Version cible de l’Audit est inconnue.' },
    { pattern: 'portfolio.auditCoverage', action: 'exclude', reason: 'La Version cible de l’Audit est inconnue.' }
  ],
  'DQ-015': [
    { pattern: 'audit.*', action: 'unknown', reason: 'L’état de réalisation de l’Audit est incohérent.' },
    { pattern: 'portfolio.auditCoverage', action: 'unknown', reason: 'L’état de réalisation de l’Audit est incohérent.' }
  ],
  'DQ-016': [
    { pattern: 'audit.*', action: 'unknown', reason: 'La Release Candidate auditée ne peut pas être établie.' }
  ],
  'DQ-017': [
    { pattern: 'portfolio.auditCoverage', action: 'unknown', reason: 'Le tag PROD exact manque pour déterminer le périmètre historique.' },
    { pattern: 'version.auditCoverage.*', action: 'unknown', reason: 'Le tag PROD exact manque pour déterminer le périmètre historique.' },
    { pattern: 'version.conformityRate.*', action: 'unknown', reason: 'Le tag PROD exact manque pour déterminer le périmètre historique.' }
  ],
  'DQ-018': [
    { pattern: 'portfolio.auditCoverage', action: 'unknown', reason: 'Le Catalogue historique exact de la Version est indisponible.' },
    { pattern: 'version.auditCoverage.*', action: 'unknown', reason: 'Le Catalogue historique exact de la Version est indisponible.' },
    { pattern: 'version.conformityRate.*', action: 'unknown', reason: 'Le Catalogue historique exact de la Version est indisponible.' }
  ],
  'DQ-019': [
    { pattern: 'anomaly.byOrigin.*', action: 'unknown', reason: 'L’origine Audit / hors Audit n’est pas déterminable.' }
  ],
  'DQ-020': [
    { pattern: 'audit.*', action: 'exclude', reason: 'Le Component de l’Anomalie ne correspond pas à celui de l’Audit.' },
    { pattern: 'anomaly.byComponent.*', action: 'exclude', reason: 'Le rattachement Component de cette Anomalie est invalide.' }
  ],
  'DQ-021': [
    { pattern: 'anomaly.open', action: 'unknown', reason: 'Le statut courant du Project manque.' },
    { pattern: 'anomaly.inProgress', action: 'unknown', reason: 'Le statut courant du Project manque.' },
    { pattern: 'anomaly.done', action: 'unknown', reason: 'Le statut courant du Project manque.' },
    { pattern: 'anomaly.reopened', action: 'unknown', reason: 'Le statut courant du Project manque.' },
    { pattern: 'anomaly.cancelled', action: 'unknown', reason: 'La sémantique de Cancelled reste à décider (Q-022).' },
    { pattern: 'anomaly.flow.cancelled', action: 'unknown', reason: 'La sémantique de Cancelled reste à décider (Q-022).' },
    { pattern: 'anomaly.backlog.oldestAge', action: 'unknown', reason: 'Le statut courant du Project manque.' }
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
