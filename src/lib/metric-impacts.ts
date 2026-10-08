import type { DataQualityIssue } from '../domain/types.js';

const RULE_METRIC_IMPACTS: Record<
  string,
  { pattern: string; action: 'include' | 'exclude' | 'unknown'; reason: string }[]
> = {
  'DQ-001': [
    { pattern: 'anomaly.byCriticality.*', action: 'exclude', reason: 'Criticité absente.' },
    { pattern: 'anomaly.criticalityCoverage', action: 'exclude', reason: 'Criticité absente.' }
  ],
  'DQ-002': [
    { pattern: 'anomaly.byCriticality.*', action: 'exclude', reason: 'Plusieurs criticités incompatibles.' },
    {
      pattern: 'anomaly.criticalityCoverage',
      action: 'exclude',
      reason: 'Plusieurs criticités incompatibles.'
    }
  ],
  'DQ-003': [
    { pattern: 'audit.anomalyCount.*', action: 'exclude', reason: 'Rattachement à plusieurs audits.' },
    {
      pattern: 'anomaly.correctionDelay.*',
      action: 'include',
      reason: 'Le délai reste calculable indépendamment du rattachement.'
    }
  ],
  'DQ-004': [
    {
      pattern: 'anomaly.correctedEver',
      action: 'include',
      reason: 'L’anomalie reste comptable, mais la preuve de correction est incomplète.'
    },
    {
      pattern: 'anomaly.correctionDelay.*',
      action: 'include',
      reason: 'Le délai reste calculable, mais la preuve de correction est incomplète.'
    },
    {
      pattern: 'anomaly.flow.corrected',
      action: 'include',
      reason: 'Le flux de correction reste observable, mais la preuve de correction est incomplète.'
    }
  ],
  'DQ-005': [
    {
      pattern: 'anomaly.correctedEver',
      action: 'include',
      reason: 'L’anomalie reste comptable, mais le lien issue/PR est incohérent.'
    },
    {
      pattern: 'anomaly.correctionDelay.*',
      action: 'include',
      reason: 'Le délai reste calculable, mais le lien issue/PR est incohérent.'
    },
    {
      pattern: 'anomaly.flow.corrected',
      action: 'include',
      reason: 'Le flux de correction reste observable, mais le lien issue/PR est incohérent.'
    }
  ],
  'DQ-006': [
    {
      pattern: 'portfolio.*',
      action: 'include',
      reason: 'Le composant reste dans le patrimoine, mais ses métadonnées de référence sont incomplètes.'
    }
  ],
  'DQ-007': [
    {
      pattern: 'anomaly.byCategory.*',
      action: 'include',
      reason: 'La classification contient un label explicitement inconnu.'
    }
  ],
  'DQ-008': [
    {
      pattern: 'anomaly.total',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.open',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.inProgress',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.done',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.byCriticality.*',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.criticalityCoverage',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.byCategory.*',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.correctedEver',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.reopened',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.correctionDelay.*',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.backlog.oldestAge',
      action: 'exclude',
      reason: 'L’issue annulée ne doit contribuer au stock analytique.'
    },
    {
      pattern: 'anomaly.flow.cancelled',
      action: 'exclude',
      reason: 'Le flux d’annulation est déjà représenté par la relation d’annulation source.'
    }
  ],
  'DQ-009': [
    {
      pattern: 'portfolio.release.*',
      action: 'unknown',
      reason: 'La preuve de release Nexus est indisponible.'
    }
  ],
  'DQ-011': [
    {
      pattern: 'anomaly.correctedEver',
      action: 'include',
      reason: 'L’état Done + Closed est observable mais correctedAt reste indéterminable.'
    },
    {
      pattern: 'anomaly.correctionDelay.*',
      action: 'unknown',
      reason: 'Le délai de correction nécessite une date correctedAt fiable.'
    },
    {
      pattern: 'anomaly.flow.corrected',
      action: 'unknown',
      reason: 'Le flux de correction nécessite une date correctedAt fiable.'
    }
  ],
  'DQ-012': [
    {
      pattern: 'audit.completed',
      action: 'include',
      reason: 'L’état Done + Closed est observable mais completedAt reste indéterminable.'
    }
  ],
  'DQ-013': [
    {
      pattern: 'anomaly.correctedEver',
      action: 'include',
      reason: 'Le statut Project Done est incohérent avec une Issue encore ouverte.'
    },
    {
      pattern: 'anomaly.correctionDelay.*',
      action: 'include',
      reason: 'La transition Done reste observable mais la preuve de traitement est incohérente.'
    }
  ],
  'DQ-014': [
    {
      pattern: 'audit.completed',
      action: 'exclude',
      reason: 'Un Audit n’est pas réalisé tant que son Issue GitHub reste ouverte.'
    }
  ],
  'DQ-015': [
    {
      pattern: 'componentVersion.*',
      action: 'unknown',
      reason: 'Le Catalogue historique absent empêche de connaître exhaustivement les Component × Version.'
    }
  ],
  'DQ-016': [
    {
      pattern: 'componentVersion.*',
      action: 'unknown',
      reason: 'Le Catalogue historique invalide empêche de connaître exhaustivement les Component × Version.'
    }
  ],
  'DQ-023': [
    {
      pattern: 'componentVersion.*',
      action: 'unknown',
      reason: 'Un Audit sans Component reconnu peut rendre la couverture historique incomplète.'
    }
  ],
  'DQ-024': [
    {
      pattern: 'componentVersion.*',
      action: 'unknown',
      reason: 'Un Audit multi-Component ambigu peut rendre la couverture historique incomplète.'
    }
  ],
  'DQ-025': [
    {
      pattern: 'componentVersion.*',
      action: 'unknown',
      reason:
        'Un Audit sans Version PROD cible déterminable ne peut contribuer de façon fiable à la couverture historique.'
    }
  ],
  'DQ-029': [
    {
      pattern: 'componentVersion.*',
      action: 'unknown',
      reason: 'Une référence normalisée orpheline compromet la fiabilité de la couverture historique.'
    }
  ],
  'DQ-010': [
    {
      pattern: 'anomaly.total',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.open',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.inProgress',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.done',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.byCriticality.*',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.criticalityCoverage',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.byCategory.*',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.correctedEver',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.reopened',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.correctionDelay.*',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.backlog.oldestAge',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    },
    {
      pattern: 'anomaly.flow.cancelled',
      action: 'exclude',
      reason: 'L’issue annulée possède une relation interdite avec une milestone.'
    }
  ]
};

export function matchesMetricPattern(pattern: string, metricId: string): boolean {
  return pattern.endsWith('.*') ? metricId.startsWith(pattern.slice(0, -1)) : pattern === metricId;
}

/** Enrichit les DQ avec leur impact explicite sur les métriques. */
export function applyMetricImpacts(issues: DataQualityIssue[], metricIds: string[]): DataQualityIssue[] {
  return issues.map((issue) => ({
    ...issue,
    impacts: (RULE_METRIC_IMPACTS[issue.ruleId] ?? []).flatMap((candidate) =>
      metricIds
        .filter((metricId) => matchesMetricPattern(candidate.pattern, metricId))
        .map((metricId) => ({
          metricId,
          action: candidate.action,
          reason: candidate.reason
        }))
    )
  }));
}
