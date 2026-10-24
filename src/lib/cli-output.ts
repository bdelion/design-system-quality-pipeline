import type { Snapshot } from '../domain/types.js';

/**
 * Restitue une synthèse lisible du pipeline sans exposer ses entités ni son identifiant technique.
 * @param snapshot - Résultat déjà calculé et enregistré par le pipeline.
 * @param operation - Libellé de la commande exécutée.
 * @param status - Statut métier déterminé par le pipeline.
 * @returns Compteurs et chemins des sorties, sans charge utile JSON.
 */
export function pipelineSummary(
  snapshot: Snapshot,
  operation: string,
  status: 'COMPLETE' | 'PARTIAL',
  output = 'data/output/demo'
): string {
  const issueCount = snapshot.analytics.metrics['issue.total']?.value;
  return [
    `${operation} ${operation === 'Analyse' ? 'terminée' : 'terminé'}. Statut : ${status === 'COMPLETE' ? 'complet' : 'partiel (réserves Data Quality)'}.`,
    `Données : ${snapshot.rawData.repositories.length} repositories ; ${typeof issueCount === 'number' ? `${issueCount} issues` : 'nombre d’issues indisponible'} ; ${snapshot.normalizedData.pullRequests.length} PR.`,
    `Qualité des données : ${snapshot.dataQuality.summary.ERROR} erreur(s), ${snapshot.dataQuality.summary.WARNING} avertissement(s), ${snapshot.dataQuality.summary.INFO} information(s).`,
    `Snapshot courant : ${output}/current/snapshot.json`,
    `Historique des snapshots : ${output}/runs/`,
    `Dashboard : ${output}/dashboard/index.html`
  ].join('\n');
}
