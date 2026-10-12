import { validateAccessibilityRecognition, type AccessibilityRecognition } from './domain/accessibility.js';
/**
 * @module config
 * Charge la configuration de traitement et les paramètres du pipeline.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { readFile } from 'node:fs/promises';
import 'dotenv/config';
import { parse } from 'yaml';
import { configPath, resolveFixtureConfigPaths } from './lib/paths.js';

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

/** Paire explicite de profils ; les deux chemins doivent être fournis ensemble. */
export interface ConfigSelection {
  systemConfig?: string;
  catalogueConfig?: string;
}

/** Refuse une sélection partielle afin de ne pas mélanger des configurations de sources différentes. */
export function assertConfigSelection(selection: ConfigSelection): void {
  if (Boolean(selection.systemConfig) !== Boolean(selection.catalogueConfig))
    throw new Error('Fournir ensemble --system-config et --catalogue-config.');
}

/** Refuse les brouillons, charge la configuration YAML et complète les URLs avec l’environnement. */
export async function loadConfig(
  source: 'fixture' | 'github' = 'github',
  fixtureFile?: string,
  selection: ConfigSelection = {}
): Promise<PipelineConfig> {
  assertConfigSelection(selection);
  const path =
    selection.systemConfig ??
    (source === 'fixture'
      ? (await resolveFixtureConfigPaths(fixtureFile)).system
      : `${configPath}/system.yaml`);
  const content = await readFile(path, 'utf8');
  const systemConfig = parse(content) as PipelineConfig;
  if (
    typeof systemConfig === 'object' &&
    systemConfig !== null &&
    'draft' in systemConfig &&
    systemConfig.draft === true
  )
    throw new Error(
      'Configuration système : brouillon à compléter et à revoir avant utilisation ; retirer draft après validation métier.'
    );
  validateMilestoneDetection(systemConfig.github.milestoneDetection);
  validateAccessibilityRecognition(systemConfig.github.accessibilityRecognition);
  return {
    ...systemConfig,
    githubApiUrl: process.env.GITHUB_API_URL ?? systemConfig.githubApiUrl,
    githubGraphqlUrl: process.env.GITHUB_GRAPHQL_URL ?? systemConfig.githubGraphqlUrl,
    githubUrl: process.env.GITHUB_URL ?? systemConfig.githubUrl
  };
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
