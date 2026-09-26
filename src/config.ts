import { readFile } from 'node:fs/promises';
import 'dotenv/config';
import { parse } from 'yaml';
import { configPath } from './lib/paths.js';

/** Paramètres de lecture des issues et pull requests GitHub. */
export interface GithubProcessingConfig {
  labels: {
    componentPrefix: string;
    criticalityPrefix: string;
    categoryPrefix: string;
    unknown: string;
    criticalityValues: Record<string, 'blocking' | 'major' | 'minor'>;
  };
  issueTypes: {
    anomaly: string;
    keywords: Record<string, string[]>;
  };
  closingKeywords: string[];
  cancelledProjectStatuses: string[];
}

/** Configuration globale nécessaire à l'exécution d'un pipeline. */
export interface PipelineConfig {
  modelVersion: string;
  ruleVersion: string;
  scope: string;
  githubOwner: string;
  repositories: string[];
  githubApiUrl: string | undefined;
  githubGraphqlUrl: string | undefined;
  githubUrl: string | undefined;
  github: GithubProcessingConfig;
}

/** Charge la configuration YAML et complète les URLs avec l'environnement. */
export async function loadConfig(): Promise<PipelineConfig> {
  const content = await readFile(`${configPath}/system.yaml`, 'utf8');
  const systemConfig = parse(content) as Omit<PipelineConfig, 'githubApiUrl' | 'githubUrl'>;
  return {
    ...systemConfig,
    githubApiUrl: process.env.GITHUB_API_URL,
    githubGraphqlUrl: process.env.GITHUB_GRAPHQL_URL,
    githubUrl: process.env.GITHUB_URL
  };
}
