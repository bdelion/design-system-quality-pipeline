import type { Audit, Issue } from '../domain/types.js';
import { isCompletedAudit } from '../domain/business.js';
export { isCompletedAudit } from '../domain/business.js';

/**
 * Sélectionne le dernier audit terminé d'un composant, sans dépendre de l'ordre du snapshot.
 * La date de fin métier est prioritaire ; en son absence, la date de collecte est
 * utilisée uniquement pour départager les audits, sans être présentée comme date de fin.
 * Un audit en cours ne remplace jamais le dernier résultat terminé.
 */
export function latestCompletedAudit(
  audits: readonly Audit[],
  issues: readonly Issue[] = []
): Audit | undefined {
  return [...audits]
    .filter((audit) => isCompletedAudit(audit, issues))
    .sort((left, right) => {
      const leftDate = Date.parse(left.completedAt ?? left.provenance.collectedAt);
      const rightDate = Date.parse(right.completedAt ?? right.provenance.collectedAt);
      return (
        rightDate - leftDate ||
        right.version.localeCompare(left.version, undefined, { numeric: true }) ||
        right.auditId.localeCompare(left.auditId)
      );
    })[0];
}
