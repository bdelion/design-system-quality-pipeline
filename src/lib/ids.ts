/**
 * @module lib.ids
 * Construit des identifiants stables pour les entités du pipeline.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { createHash } from 'node:crypto';

/** Produit un identifiant déterministe pour relier les entités entre snapshots. */
export function stableId(prefix: string, value: string): string {
  return `${prefix}-${createHash('sha256').update(value).digest('hex').slice(0, 12)}`;
}
