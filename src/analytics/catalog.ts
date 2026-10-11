/**
 * @module analytics.catalog
 * Définit le catalogue contractuel des métriques, leurs unités et leurs périmètres.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type { MetricScope, MetricUnit } from '../domain/types.js';

/** Contrat déclaratif des métriques V2. Une métrique générée doit être décrite ici. */
export interface MetricContract {
  id: string;
  unit: MetricUnit;
  scope: MetricScope;
  definition: string;
  kind: 'stock' | 'ratio' | 'duration' | 'flow';
  numeratorLabel?: string;
  denominatorLabel?: string;
  notes?: string;
}

/**
 * Expose la constante « METRIC_CONTRACTS » du module.
 */
export const METRIC_CONTRACTS: readonly MetricContract[] = [
  ...['total', 'open', 'treated', 'cancelled'].map((name): MetricContract => ({
    id: `issue.${name}`,
    unit: 'count',
    scope: 'issue',
    kind: 'stock',
    definition: (
      {
        total: 'Issues normalisées distinctes, tous types confondus.',
        open: 'Issues non terminées ou sans preuve suffisante de Done et Closed.',
        treated: 'Issues actuellement Done dans leurs Projects et Closed dans GitHub.',
        cancelled: 'Issues annulées dans GitHub Projects ; elles ne sont pas traitées.'
      } as Record<string, string>
    )[name]!
  })),
  ...['global', 'done', 'estimated'].flatMap((cohort) =>
    ['average', 'median', 'p90'].map((statistic): MetricContract => ({
      id: `issue.treatmentDelay.${cohort}.${statistic}`,
      unit: 'days',
      scope: 'issue',
      kind: 'duration',
      definition: `Délai de traitement des issues distinctes : ${statistic}, population ${cohort}. Done et Closed requis ; dates estimées séparées ; annulations et durées invalides exclues.`
    }))
  ),
  ...['pending', 'ongoing', 'cancelled'].map((progress): MetricContract => ({
    id: `audit.${progress}`,
    unit: 'count',
    scope: 'audit',
    kind: 'stock',
    definition: `Audits de progression ${progress}, indépendamment d'un résultat déclaré.`
  })),
  {
    id: 'portfolio.repositories',
    unit: 'count',
    scope: 'portfolio',
    kind: 'stock',
    definition: 'Nombre de repositories distincts effectivement analysés.'
  },
  {
    id: 'portfolio.libraries',
    unit: 'count',
    scope: 'portfolio',
    kind: 'stock',
    definition: 'Nombre de bibliothèques analysées.'
  },
  {
    id: 'portfolio.components',
    unit: 'count',
    scope: 'portfolio',
    kind: 'stock',
    definition: 'Nombre de composants actifs dans le périmètre du patrimoine.'
  },
  {
    id: 'portfolio.componentsAudited',
    unit: 'count',
    scope: 'portfolio',
    kind: 'stock',
    definition: 'Nombre de composants actifs disposant d’au moins un audit terminé.'
  },
  {
    id: 'portfolio.auditCoverage',
    unit: 'percentage',
    scope: 'portfolio',
    kind: 'ratio',
    definition: 'Composants actifs disposant d’un audit terminé / composants actifs du périmètre.',
    numeratorLabel: 'Composants audités',
    denominatorLabel: 'Composants actifs'
  },

  {
    id: 'audit.completed',
    unit: 'count',
    scope: 'audit',
    kind: 'stock',
    definition: 'Nombre d’audits ayant atteint un résultat exploitable.'
  },
  {
    id: 'audit.conform',
    unit: 'count',
    scope: 'audit',
    kind: 'stock',
    definition: 'Nombre d’audits dont le résultat objectif est conforme.'
  },
  {
    id: 'audit.conditional',
    unit: 'count',
    scope: 'audit',
    kind: 'stock',
    definition: 'Nombre d’audits dont le résultat objectif est conditionnel.'
  },
  {
    id: 'audit.nonConform',
    unit: 'count',
    scope: 'audit',
    kind: 'stock',
    definition: 'Nombre d’audits dont le résultat objectif est non conforme.'
  },
  {
    id: 'audit.critical',
    unit: 'count',
    scope: 'audit',
    kind: 'stock',
    definition: 'Nombre d’audits dont le résultat objectif est critique.'
  },
  {
    id: 'audit.conformityRate',
    unit: 'percentage',
    scope: 'audit',
    kind: 'ratio',
    definition: 'Audits conformes / audits terminés.',
    numeratorLabel: 'Audits conformes',
    denominatorLabel: 'Audits terminés'
  },

  {
    id: 'componentVersion.total',
    unit: 'count',
    scope: 'component',
    kind: 'stock',
    definition: 'Nombre de couples Component × Version matérialisés par le Catalogue historique.'
  },
  {
    id: 'componentVersion.covered',
    unit: 'count',
    scope: 'component',
    kind: 'stock',
    definition: 'Nombre de couples Component × Version disposant d’au moins un Audit terminé applicable.'
  },
  {
    id: 'componentVersion.auditCoverage',
    unit: 'percentage',
    scope: 'component',
    kind: 'ratio',
    definition: 'Component × Version couverts / Component × Version matérialisés.',
    numeratorLabel: 'Component × Version couverts',
    denominatorLabel: 'Component × Version matérialisés'
  },
  {
    id: 'componentVersion.conform',
    unit: 'count',
    scope: 'component',
    kind: 'stock',
    definition: 'Nombre de couples Component × Version couverts dont le verdict applicable est conforme.'
  },
  {
    id: 'componentVersion.nonConform',
    unit: 'count',
    scope: 'component',
    kind: 'stock',
    definition: 'Nombre de couples Component × Version couverts dont le verdict applicable est non conforme.'
  },
  {
    id: 'componentVersion.conformityRate',
    unit: 'percentage',
    scope: 'component',
    kind: 'ratio',
    definition: 'Component × Version conformes / Component × Version couverts.',
    numeratorLabel: 'Component × Version conformes',
    denominatorLabel: 'Component × Version couverts'
  },

  {
    id: 'anomaly.total',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies valides dans le périmètre analytique, hors anomalies annulées.'
  },
  {
    id: 'anomaly.open',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies actuellement ouvertes ou rouvertes.'
  },
  {
    id: 'anomaly.inProgress',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies actuellement en cours de traitement.'
  },
  {
    id: 'anomaly.done',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies actuellement terminées.'
  },
  {
    id: 'anomaly.byCriticality.blocking',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies valides de criticité bloquante.'
  },
  {
    id: 'anomaly.byCriticality.major',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies valides de criticité majeure.'
  },
  {
    id: 'anomaly.byCriticality.minor',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies valides de criticité mineure.'
  },
  {
    id: 'anomaly.criticalityCoverage',
    unit: 'percentage',
    scope: 'anomaly',
    kind: 'ratio',
    definition: 'Anomalies valides disposant d’une criticité exploitable / anomalies valides.',
    numeratorLabel: 'Anomalies avec criticité',
    denominatorLabel: 'Anomalies valides'
  },
  {
    id: 'anomaly.byCategory.*',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies valides portant la catégorie considérée.'
  },
  {
    id: 'anomaly.correctedEver',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies valides ayant déjà atteint une première correction métier.'
  },
  {
    id: 'anomaly.reopened',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies actuellement dans l’état rouvert.',
    notes: 'Ce n’est pas un flux de réouvertures sur une période.'
  },
  {
    id: 'anomaly.cancelled',
    unit: 'count',
    scope: 'anomaly',
    kind: 'stock',
    definition: 'Nombre d’anomalies annulées dans les données sources.',
    notes: 'Les anomalies annulées sont exclues des métriques de stock valides.'
  },
  {
    id: 'issue.flow.created',
    unit: 'count',
    scope: 'issue',
    kind: 'flow',
    definition: 'Issues de tous types apparues entre les deux snapshots.'
  },
  {
    id: 'issue.flow.treated',
    unit: 'count',
    scope: 'issue',
    kind: 'flow',
    definition: 'Issues de tous types passées à l’état traité entre les deux snapshots.'
  },
  {
    id: 'issue.flow.reopened',
    unit: 'count',
    scope: 'issue',
    kind: 'flow',
    definition: 'Issues de tous types passées de traité à ouvert entre les deux snapshots.'
  },
  {
    id: 'issue.flow.cancelled',
    unit: 'count',
    scope: 'issue',
    kind: 'flow',
    definition: 'Issues de tous types devenues annulées entre les deux snapshots.'
  },
  {
    id: 'anomaly.flow.created',
    unit: 'count',
    scope: 'anomaly',
    kind: 'flow',
    definition: 'Nombre d’anomalies apparues entre le snapshot précédent et le snapshot courant.'
  },
  {
    id: 'anomaly.flow.corrected',
    unit: 'count',
    scope: 'anomaly',
    kind: 'flow',
    definition: 'Nombre d’anomalies ayant acquis leur première correction entre les deux snapshots.'
  },
  {
    id: 'anomaly.flow.reopened',
    unit: 'count',
    scope: 'anomaly',
    kind: 'flow',
    definition: 'Nombre d’anomalies passées dans l’état rouvert entre les deux snapshots.'
  },
  {
    id: 'anomaly.flow.cancelled',
    unit: 'count',
    scope: 'anomaly',
    kind: 'flow',
    definition: 'Nombre d’anomalies devenues annulées entre les deux snapshots.'
  },
  {
    id: 'anomaly.correctionDelay.average',
    unit: 'days',
    scope: 'anomaly',
    kind: 'duration',
    definition: 'Délai moyen officiel : dernière transition Done ou, à défaut admissible, clôture estimée.'
  },
  {
    id: 'anomaly.correctionDelay.averageActual',
    unit: 'days',
    scope: 'anomaly',
    kind: 'duration',
    definition: 'Délai moyen calculé uniquement depuis les transitions Done.'
  },
  {
    id: 'anomaly.correctionDelay.averageEstimated',
    unit: 'days',
    scope: 'anomaly',
    kind: 'duration',
    definition: 'Délai moyen calculé uniquement depuis les dates de clôture estimées.'
  },
  {
    id: 'anomaly.correctionDelay.median',
    unit: 'days',
    scope: 'anomaly',
    kind: 'duration',
    definition:
      'Délai médian officiel entre la création et la dernière correction Done connue, ou une clôture explicitement estimée admissible.'
  },
  {
    id: 'anomaly.correctionDelay.p90',
    unit: 'days',
    scope: 'anomaly',
    kind: 'duration',
    definition:
      '90e percentile du délai officiel entre la création et la dernière correction Done connue, ou une clôture explicitement estimée admissible.'
  },
  {
    id: 'anomaly.backlog.oldestAge',
    unit: 'days',
    scope: 'anomaly',
    kind: 'duration',
    definition:
      'Âge du plus ancien élément actuellement ouvert, calculé à la date de collecte des sources du snapshot.'
  }
] as const;

const contractById = new Map(METRIC_CONTRACTS.map((contract) => [contract.id, contract]));

/**
 * Recherche le contrat d’une métrique à partir de son identifiant.
 */
export function getMetricContract(id: string): MetricContract | undefined {
  return (
    contractById.get(id) ??
    contractById.get(id.startsWith('anomaly.byCategory.') ? 'anomaly.byCategory.*' : id)
  );
}

/**
 * Vérifie que les métriques demandées disposent d’un contrat déclaré.
 */
export function assertMetricContract(metricIds: Iterable<string>): void {
  const unknown = [...new Set(metricIds)].filter((id) => !getMetricContract(id));
  if (unknown.length > 0) throw new Error(`Metrics missing from V2 contract: ${unknown.join(', ')}`);
}

/** Décrit la formule mathématique sans confondre l'effectif d'une durée et la somme de ses valeurs. */
export function metricFormula(id: string): string {
  const contract = getMetricContract(id);
  if (contract?.kind === 'ratio')
    return '100 × numérateur / dénominateur ; population vide : valeur inconnue.';
  if (contract?.kind === 'stock' || contract?.kind === 'flow')
    return 'Nombre d’identités distinctes retenues après exclusions, dans le périmètre et la période indiqués.';
  if (id.toLowerCase().includes('median'))
    return 'Quantile 0,5 des durées triées ; interpolation linéaire au rang (n − 1) × 0,5.';
  if (id.toLowerCase().includes('p90'))
    return 'Quantile 0,9 des durées triées ; interpolation linéaire au rang (n − 1) × 0,9.';
  if (id.includes('oldest'))
    return 'Date de collecte − date de création la plus ancienne des éléments retenus, en jours calendaires.';
  return 'Somme des durées mesurables / effectif mesurable ; durée = (date de traitement − création) / 86 400 000 ms. Population vide : valeur inconnue.';
}
