import { readFile } from 'node:fs/promises';
import 'dotenv/config';
import { parse } from 'yaml';
import { configPath } from './lib/paths.js';

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
}

export interface PipelineConfig {
  modelVersion: string;
  ruleVersion: string;
  scope: string;
  githubOwner: string;
  repositories: string[];
  githubApiUrl: string | undefined;
  githubUrl: string | undefined;
  github: GithubProcessingConfig;
}

export async function loadConfig(): Promise<PipelineConfig> {
  const content = await readFile(`${configPath}/system.yaml`, 'utf8');
  const systemConfig = parse(content) as Omit<PipelineConfig, 'githubApiUrl' | 'githubUrl'>;
  return {
    ...systemConfig,
    githubApiUrl: process.env.GITHUB_API_URL,
    githubUrl: process.env.GITHUB_URL
  };
}
