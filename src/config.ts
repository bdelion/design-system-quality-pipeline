import { type AccessibilityRecognition } from './domain/accessibility.js';
/**
 * @module config
 * Charge la configuration de traitement et les paramètres du pipeline.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import 'dotenv/config';

/** Paramètres de lecture des issues et pull requests GitHub. */
export interface GithubProcessingConfig {
  /** Variantes explicites de labels accessibilité, communes ou par repository. */
  accessibilityRecognition?: AccessibilityRecognition;
  labels: {
    componentPrefix: string;
    accessibilityCriticalityPrefix: string;
    accessibilityCategoryPrefix: string;
    unknown: string;
    criticalityValues: Record<string, 'blocking' | 'major' | 'minor'>;
  };
  issueTypes: {
    anomaly: string;
    keywords: Record<string, string[]>;
  };
  projectStatuses: {
    keywords: Record<string, string[]>;
  };
  /** Conventions de reconnaissance des milestones, évaluées dans l'ordre. */
  milestoneDetection?: {
    caseSensitive?: boolean;
    patterns: { id: string; regex: string; kind: 'release' | 'audit' }[];
  };
  auditDetection?: {
    /** Autorise les anciens types inférés ; désactivé par le profil DSQ pour les nouvelles captures. */
    allowLegacyIssueTypes?: boolean;
    strategies: { issueTypes: string[]; requiredLabels?: string[]; requireComponent?: boolean }[];
  };
  closingKeywords: string[];
  cancelledProjectStatuses: string[];
}

/** Configuration globale nécessaire à l'exécution d'un pipeline. */
export interface PipelineConfig {
  modelVersion: string;
  ruleVersion: string;
  auditVersion: string;
  scope: string;
  githubOwner: string;
  repositories: string[];
  githubApiUrl: string | undefined;
  githubGraphqlUrl: string | undefined;
  githubUrl: string | undefined;
  github: GithubProcessingConfig;
}

/** Vérifie les règles de milestones avant toute normalisation. */
export function validateMilestoneDetection(config: GithubProcessingConfig['milestoneDetection']): void {
  if (!config) return;
  if (!Array.isArray(config.patterns) || config.patterns.length === 0) {
    throw new Error('milestoneDetection.patterns doit contenir au moins une règle');
  }
  const ids = new Set<string>();
  for (const pattern of config.patterns) {
    if (!pattern.id || ids.has(pattern.id))
      throw new Error(`Identifiant de milestone dupliqué ou absent : ${pattern.id}`);
    ids.add(pattern.id);
    if (pattern.kind !== 'release' && pattern.kind !== 'audit')
      throw new Error(`Type de milestone invalide : ${pattern.id}`);
    let regex: RegExp;
    try {
      regex = new RegExp(pattern.regex, config.caseSensitive ? '' : 'i');
    } catch {
      throw new Error(`Expression régulière de milestone invalide : ${pattern.id}`);
    }
    if (!regex.source.includes('(?<version>'))
      throw new Error(`Groupe nommé version manquant : ${pattern.id}`);
  }
}
