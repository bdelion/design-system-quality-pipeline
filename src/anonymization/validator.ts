/**
 * @module anonymization.validator
 * Vérifie la confidentialité et l’intégrité relationnelle des fixtures anonymisées.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import type { RawDataset } from '../domain/types.js';
import { findSuspiciousStrings } from './sanitize.js';

/**
 * Définit le contrat de données « ValidationFinding » utilisé par le pipeline.
 */
export interface ValidationFinding {
  path: string;
  kind: string;
  value: string;
}

/**
 * Définit le contrat de données « ValidationResult » utilisé par le pipeline.
 */
export interface ValidationResult {
  valid: boolean;
  findings: ValidationFinding[];
}

/**
 * Définit le contrat de données « IntegrityFinding » utilisé par le pipeline.
 */
export interface IntegrityFinding {
  type: 'missing-issue' | 'missing-pull-request';
  scope: 'repository' | 'cross-repository';
  repository: string;
  sourceId: string;
  sourcePath: string;
  referenceId: string;
  source: unknown;
}

/**
 * Réalise le traitement « walk » dans le pipeline de qualité.
 *
 * @param value - Valeur de « value » utilisée par ce traitement.
 * @param path - Valeur de « path » utilisée par ce traitement.
 * @param findings - Valeur de « findings » utilisée par ce traitement.
 */
function walk(value: unknown, path: string, findings: ValidationResult['findings']): void {
  if (typeof value === 'string') {
    for (const kind of findSuspiciousStrings(value)) findings.push({ path, kind, value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => walk(v, `${path}[${i}]`, findings));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) walk(v, `${path}.${k}`, findings);
  }
}

/**
 * Recherche les chaînes suspectes dans un jeu de données anonymisé.
 */
export function validateAnonymizedDataset(dataset: RawDataset): ValidationResult {
  const findings: ValidationResult['findings'] = [];
  walk(dataset, '$', findings);
  return { valid: findings.length === 0, findings };
}

/**
 * Identifie les références manquantes entre entités anonymisées.
 */
export function inspectRelationalIntegrity(dataset: RawDataset): IntegrityFinding[] {
  const errors: IntegrityFinding[] = [];
  const globalIssueIds = new Set(
    dataset.repositories.flatMap((repo) => repo.issues.map((issue) => issue.id))
  );
  const globalPrIds = new Set(dataset.repositories.flatMap((repo) => repo.pullRequests.map((pr) => pr.id)));

  for (const [repoIndex, repo] of dataset.repositories.entries()) {
    const issueIds = new Set(repo.issues.map((i) => i.id));
    const prIds = new Set(repo.pullRequests.map((p) => p.id));

    for (const [issueIndex, issue] of repo.issues.entries()) {
      for (const [refIndex, id] of issue.linkedPullRequestIds.entries()) {
        if (!prIds.has(id)) {
          errors.push({
            type: 'missing-pull-request',
            scope: globalPrIds.has(id) ? 'cross-repository' : 'repository',
            repository: repo.name,
            sourceId: issue.id,
            sourcePath: `$.repositories[${repoIndex}].issues[${issueIndex}].linkedPullRequestIds[${refIndex}]`,
            referenceId: id,
            source: issue
          });
        }
      }
    }

    for (const [prIndex, pr] of repo.pullRequests.entries()) {
      for (const [refIndex, id] of pr.relatedIssueIds.entries()) {
        if (!issueIds.has(id)) {
          errors.push({
            type: 'missing-issue',
            scope: globalIssueIds.has(id) ? 'cross-repository' : 'repository',
            repository: repo.name,
            sourceId: pr.id,
            sourcePath: `$.repositories[${repoIndex}].pullRequests[${prIndex}].relatedIssueIds[${refIndex}]`,
            referenceId: id,
            source: pr
          });
        }
      }
    }
  }
  return errors;
}

/**
 * Produit les messages de diagnostic des relations invalides.
 */
export function assertRelationalIntegrity(dataset: RawDataset): string[] {
  return inspectRelationalIntegrity(dataset).map((error) =>
    error.type === 'missing-issue'
      ? `${error.repository}:${error.sourceId} references missing issue ${error.referenceId}`
      : `${error.repository}:${error.sourceId} references missing PR ${error.referenceId}`
  );
}
