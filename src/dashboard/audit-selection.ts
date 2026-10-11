import type { Audit } from '../domain/types.js';

/** Indique si un audit possède un résultat métier terminé et exploitable. */
export function isCompletedAudit(audit: Audit): boolean {
  return audit.status !== 'in_progress' && audit.status !== 'not_evaluated';
}

/**
 * Sélectionne le dernier audit terminé d'un composant, sans dépendre de l'ordre du snapshot.
 * La date de fin métier est prioritaire ; en son absence, la date de collecte est
 * utilisée uniquement pour départager les audits, sans être présentée comme date de fin.
 * Un audit en cours ne remplace jamais le dernier résultat terminé.
 */
export function latestCompletedAudit(audits: readonly Audit[]): Audit | undefined {
  return [...audits].filter(isCompletedAudit).sort((left, right) => {
    const leftDate = Date.parse(left.completedAt ?? left.provenance.collectedAt);
    const rightDate = Date.parse(right.completedAt ?? right.provenance.collectedAt);
    return rightDate - leftDate || right.version.localeCompare(left.version, undefined, { numeric: true }) || right.auditId.localeCompare(left.auditId);
  })[0];
}
