import type { IssueFact } from '../analytics/issues.js';
import { projectIssueFacts } from '../analytics/issues.js';
import type { Snapshot } from '../domain/types.js';

const factsBySnapshot = new WeakMap<Snapshot, IssueFact[]>();

/** Projette une seule fois les faits d'un snapshot pendant sa restitution statique. */
export function issueFacts(snapshot: Snapshot): IssueFact[] {
  let facts = factsBySnapshot.get(snapshot);
  if (!facts) {
    facts = projectIssueFacts(snapshot.normalizedData, snapshot.dataQuality.issues);
    for (const fact of facts) {
      const row = snapshot.analytics.workspaces?.rows.find((item) => item.id === fact.id);
      if (row) fact.familyLabel = row.familyLabel;
    }
    factsBySnapshot.set(snapshot, facts);
  }
  return facts;
}

/** Invalide le cache au début d'une génération pour respecter aussi les appels de développement sur un objet modifié. */
export function resetDashboardReadModel(snapshot: Snapshot): void {
  factsBySnapshot.delete(snapshot);
}
