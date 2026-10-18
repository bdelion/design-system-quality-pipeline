import { consolidationSnapshot } from './consolidation.js';

/** Prépare une PROD prouvée et un développement plus récent aux verdicts opposés. */
export function prodAndDevelopmentSnapshot() {
  const snapshot = consolidationSnapshot();
  const versions = snapshot.normalizedData.versions!;
  const prod = versions.find((version) => version.number === '1.0.0')!;
  const development = versions.find((version) => version.number === '2.0.0')!;
  prod.number = '1.7.1';
  prod.prodTag = { name: '1.7.1' };
  prod.channel = 'release';
  development.number = '1.8.0';
  development.channel = 'development';
  delete development.prodTag;
  for (const relation of snapshot.normalizedData.componentVersions!)
    relation.verdict = relation.versionId === prod.versionId ? 'CONFORME' : 'NON_COUVERT';
  delete snapshot.analytics.workspaces;
  return snapshot;
}
