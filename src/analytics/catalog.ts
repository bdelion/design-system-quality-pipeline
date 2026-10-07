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

export const METRIC_CONTRACTS: readonly MetricContract[] = [
  { id: 'portfolio.repositories', unit: 'count', scope: 'portfolio', kind: 'stock', definition: 'Nombre de repositories distincts effectivement analysés.' },
  { id: 'portfolio.libraries', unit: 'count', scope: 'portfolio', kind: 'stock', definition: 'Nombre de bibliothèques analysées.' },
  { id: 'portfolio.components', unit: 'count', scope: 'portfolio', kind: 'stock', definition: 'Nombre de composants actifs dans le périmètre du patrimoine.' },
  { id: 'portfolio.componentsAudited', unit: 'count', scope: 'portfolio', kind: 'stock', definition: 'Nombre de Components actifs couverts dans au moins une Version historique.' },
  { id: 'portfolio.auditCoverage', unit: 'percentage', scope: 'portfolio', kind: 'ratio', definition: 'Paires Component × Version couvertes par un Audit terminé / paires du Catalogue historique connu.', numeratorLabel: 'Paires couvertes', denominatorLabel: 'Paires historiques connues' },
  { id: 'version.auditCoverage.*', unit: 'percentage', scope: 'version', kind: 'ratio', definition: 'Components du Catalogue historique de la Version disposant d’un Audit terminé / Components du Catalogue historique.' },
  { id: 'version.conformityRate.*', unit: 'percentage', scope: 'version', kind: 'ratio', definition: 'Components couverts dont le dernier Audit applicable est conforme / Components couverts.' },

  { id: 'audit.completed', unit: 'count', scope: 'audit', kind: 'stock', definition: 'Nombre d’audits ayant atteint un résultat exploitable.' },
  { id: 'audit.conform', unit: 'count', scope: 'audit', kind: 'stock', definition: 'Nombre d’audits dont le résultat objectif est conforme.' },
  { id: 'audit.conditional', unit: 'count', scope: 'audit', kind: 'stock', definition: 'Nombre d’audits dont le résultat objectif est conditionnel.' },
  { id: 'audit.nonConform', unit: 'count', scope: 'audit', kind: 'stock', definition: 'Nombre d’audits dont le résultat objectif est non conforme.' },
  { id: 'audit.critical', unit: 'count', scope: 'audit', kind: 'stock', definition: 'Nombre d’audits dont le résultat objectif est critique.' },
  { id: 'audit.conformityRate', unit: 'percentage', scope: 'audit', kind: 'ratio', definition: 'Paires Component × Version couvertes et conformes selon le dernier Audit applicable / paires Component × Version couvertes.', numeratorLabel: 'Paires conformes', denominatorLabel: 'Paires couvertes' },

  { id: 'anomaly.total', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies valides dans le périmètre analytique, hors anomalies annulées.' },
  { id: 'anomaly.open', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies actuellement ouvertes ou rouvertes.' },
  { id: 'anomaly.inProgress', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies actuellement en cours de traitement.' },
  { id: 'anomaly.done', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies actuellement terminées.' },
  { id: 'anomaly.byCriticality.blocking', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies valides de criticité bloquante.' },
  { id: 'anomaly.byCriticality.major', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies valides de criticité majeure.' },
  { id: 'anomaly.byCriticality.minor', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies valides de criticité mineure.' },
  { id: 'anomaly.criticalityCoverage', unit: 'percentage', scope: 'anomaly', kind: 'ratio', definition: 'Anomalies valides disposant d’une criticité exploitable / anomalies valides.', numeratorLabel: 'Anomalies avec criticité', denominatorLabel: 'Anomalies valides' },
  { id: 'anomaly.byCategory.*', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies valides portant la catégorie considérée.' },
  { id: 'anomaly.byOrigin.*', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies par origine métier déterminée.' },
  { id: 'anomaly.correctedEver', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies valides ayant déjà atteint une première correction métier.' },
  { id: 'anomaly.reopened', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Nombre d’anomalies actuellement dans l’état rouvert.', notes: 'Ce n’est pas un flux de réouvertures sur une période.' },
  { id: 'anomaly.cancelled', unit: 'count', scope: 'anomaly', kind: 'stock', definition: 'Indéterminé tant que la sémantique du statut Cancelled n’est pas établie (Q-022).' },
  { id: 'anomaly.flow.created', unit: 'count', scope: 'anomaly', kind: 'flow', definition: 'Nombre d’anomalies apparues entre le snapshot précédent et le snapshot courant.' },
  { id: 'anomaly.flow.corrected', unit: 'count', scope: 'anomaly', kind: 'flow', definition: 'Nombre d’anomalies ayant acquis leur première correction entre les deux snapshots.' },
  { id: 'anomaly.flow.reopened', unit: 'count', scope: 'anomaly', kind: 'flow', definition: 'Nombre d’anomalies passées dans l’état rouvert entre les deux snapshots.' },
  { id: 'anomaly.flow.cancelled', unit: 'count', scope: 'anomaly', kind: 'flow', definition: 'Nombre d’anomalies devenues annulées entre les deux snapshots.' },
  { id: 'anomaly.correctionDelay.average', unit: 'days', scope: 'anomaly', kind: 'duration', definition: 'Délai moyen entre la création et la première correction métier.' },
  { id: 'anomaly.correctionDelay.median', unit: 'days', scope: 'anomaly', kind: 'duration', definition: 'Délai médian entre la création et la première correction métier.' },
  { id: 'anomaly.correctionDelay.p90', unit: 'days', scope: 'anomaly', kind: 'duration', definition: '90e percentile du délai entre la création et la première correction métier.' },
  { id: 'anomaly.backlog.oldestAge', unit: 'days', scope: 'anomaly', kind: 'duration', definition: 'Âge du plus ancien élément actuellement ouvert, calculé par rapport à la date la plus récente connue du snapshot.' }
] as const;

const contractById = new Map(METRIC_CONTRACTS.map((contract) => [contract.id, contract]));

export function getMetricContract(id: string): MetricContract | undefined {
  return contractById.get(id)
    ?? contractById.get(id.startsWith('anomaly.byCategory.') ? 'anomaly.byCategory.*' : id)
    ?? (id.startsWith('version.auditCoverage.')
      ? { id, unit: 'percentage', scope: 'version', kind: 'ratio', definition: 'Components du Catalogue historique de la Version disposant d’un Audit terminé / Components du Catalogue historique.' }
      : undefined)
    ?? (id.startsWith('version.conformityRate.')
      ? { id, unit: 'percentage', scope: 'version', kind: 'ratio', definition: 'Components couverts dont le dernier Audit applicable est conforme / Components couverts.' }
      : undefined)
    ?? (id.startsWith('anomaly.byOrigin.') ? contractById.get('anomaly.byOrigin.*') : undefined);
}

export function assertMetricContract(metricIds: Iterable<string>): void {
  const unknown = [...new Set(metricIds)].filter((id) => !getMetricContract(id));
  if (unknown.length > 0) throw new Error(`Metrics missing from V2 contract: ${unknown.join(', ')}`);
}
