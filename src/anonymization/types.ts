/**
 * @module anonymization.types
 * Décrit les options, résultats et statistiques du processus d’anonymisation.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type { RawDataset } from '../domain/types.js';
/**
 * Définit le contrat de données « AnonymizationOptions » utilisé par le pipeline.
 */
export interface AnonymizationOptions {
  seed: string;
  dateOffsetDays: number;
  strictText: boolean;
  preserveComponentNames: boolean;
}
/**
 * Définit le contrat de données « AnonymizationReport » utilisé par le pipeline.
 */
export interface AnonymizationReport {
  repositories: number;
  issues: number;
  pullRequests: number;
  components: number;
  ownersAnonymized: number;
  repositoryNamesAnonymized: number;
  idsAnonymized: number;
  datesShifted: number;
  textsSanitized: number;
  suspiciousStrings: number;
  warnings: string[];
}
/**
 * Définit le contrat de données « AnonymizationResult » utilisé par le pipeline.
 */
export interface AnonymizationResult {
  dataset: RawDataset;
  report: AnonymizationReport;
}
/**
 * Expose la constante « DEFAULT_ANONYMIZATION_OPTIONS » du module.
 */
export const DEFAULT_ANONYMIZATION_OPTIONS: AnonymizationOptions = {
  seed: 'design-system-quality-pipeline',
  dateOffsetDays: -365,
  strictText: true,
  preserveComponentNames: true
};
