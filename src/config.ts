/**
 * @module config
 * Charge la configuration de traitement et les paramètres du pipeline.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { readFile } from 'node:fs/promises';
import 'dotenv/config';
import { parse } from 'yaml';
import { configPath, fixtureConfigPaths } from './lib/paths.js';

/** Paramètres de lecture des issues et pull requests GitHub. */
export interface GithubProcessingConfig {
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

/** Charge la configuration YAML et complète les URLs avec l'environnement. */
export async function loadConfig(
  source: 'fixture' | 'github' = 'github',
  fixtureFile?: string
): Promise<PipelineConfig> {
  const filename =
    source === 'fixture'
      ? fixtureFile
        ? fixtureConfigPaths(fixtureFile).system.split(/[/\\]/).pop()!
        : 'system.fixture.yaml'
      : 'system.yaml';
  let content: string;
  try {
    content = await readFile(`${configPath}/${filename}`, 'utf8');
  } catch (error) {
    if (source !== 'fixture' || (error as { code?: string }).code !== 'ENOENT') throw error;
    // Legacy fallback kept for the default fixture workflow. Never silently
    // switch a fixture to the real GitHub repository configuration first.
    content = await readFile(`${configPath}/system.fixture.yaml`, 'utf8');
  }
  const systemConfig = parse(content) as Omit<PipelineConfig, 'githubApiUrl' | 'githubUrl'>;
  return {
    ...systemConfig,
    githubApiUrl: process.env.GITHUB_API_URL,
    githubGraphqlUrl: process.env.GITHUB_GRAPHQL_URL,
    githubUrl: process.env.GITHUB_URL
  };
}
