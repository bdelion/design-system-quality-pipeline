import type { AuditStatus } from '../domain/types.js';
/** Traduit le résultat d’audit sans modifier son verdict. */
export function auditStatusLabel(value: AuditStatus): string {
  return {
    not_evaluated: 'non évalué',
    in_progress: 'en cours',
    cancelled: 'annulé',
    conform: 'conforme',
    conditional: 'conditionnel',
    non_conform: 'non conforme',
    critical: 'critique'
  }[value];
}
