import { expect, it } from 'vitest';
import { workspaceAnalytics } from '../src/analytics/workspaces.js';
import { workspaceModel } from '../src/dashboard/workspaces.js';
import { prodAndDevelopmentSnapshot } from './support/workspace-version-snapshot.js';

it('évalue la PROD démontrée par défaut et conserve le développement sélectionné explicitement', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const model = workspaceAnalytics(snapshot.normalizedData);
  const current = model.scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )!.summary;
  expect(current.coverage).toBe(100);
  expect(current.versionSelection?.mode).toBe('current-prod');
  expect(current.versionSelection?.versions).toMatchObject([
    { number: '1.7.1', channel: 'prod', tag: '1.7.1' }
  ]);
  const development = model.scopes.find(
    (scope) => !scope.repository && !scope.component && scope.version === '1.8.0'
  )!.summary;
  expect(development.coverage).toBe(0);
  expect(development.versionSelection?.versions).toMatchObject([{ number: '1.8.0', channel: 'development' }]);
});

it('ne remplace pas une PROD inconnue par une milestone, une date ou une version sans tag', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  for (const version of snapshot.normalizedData.versions!) {
    delete version.prodTag;
    delete version.channel;
  }
  const model = workspaceAnalytics(snapshot.normalizedData);
  const current = model.scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )!.summary;
  expect(current.coverage).toBeNull();
  expect(current.conformity).toBeNull();
  expect(current.unknown).toBeGreaterThan(0);
  expect(current.versionSelection?.missingRepositories).toEqual(['acme/ds-react']);
  const explicit = model.scopes.find(
    (scope) => !scope.repository && !scope.component && scope.version === '1.7.1'
  )!.summary;
  expect(explicit.versionSelection?.versions).toMatchObject([{ number: '1.7.1', channel: 'unpublished' }]);
});

it('prend le numéro PROD le plus élevé parmi les tags exacts, sans exiger une date de tag', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const version = snapshot.normalizedData.versions!.find((item) => item.number === '1.8.0')!;
  version.number = '1.10.0';
  version.channel = 'release';
  version.prodTag = { name: '1.10.0' };
  const current = workspaceAnalytics(snapshot.normalizedData).scopes[0]!.summary;
  expect(current.versionSelection?.versions[0]?.number).toBe('1.10.0');
  version.prodTag.name = '1.10.0-rc.1';
  expect(
    workspaceAnalytics(snapshot.normalizedData).scopes[0]!.summary.versionSelection?.versions[0]?.number
  ).toBe('1.7.1');
});

it('distingue les PROD de plusieurs repositories et signale tout repository sans preuve', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const data = snapshot.normalizedData;
  data.libraries.push({ ...data.libraries[0]!, libraryId: 'other-lib', repository: 'acme/other' });
  const otherVersion = {
    ...data.versions![0]!,
    libraryId: 'other-lib',
    versionId: 'other-version',
    number: '3.2.0',
    channel: 'release' as const,
    prodTag: { name: '3.2.0' }
  };
  data.versions!.push(otherVersion);
  const explicit = workspaceAnalytics(data).scopes.find(
    (scope) => !scope.repository && !scope.component && scope.version === data.versions![0]!.versionId
  )!.summary;
  expect(explicit.coverage).toBe(100);
  expect(explicit.versionSelection?.versions).toHaveLength(1);
  expect(
    workspaceAnalytics(data).scopes[0]!.summary.versionSelection?.versions.map((v) => [
      v.repository,
      v.number
    ])
  ).toEqual([
    ['acme/ds-react', '1.7.1'],
    ['acme/other', '3.2.0']
  ]);
  delete (otherVersion as { prodTag?: { name: string } }).prodTag;
  const current = workspaceAnalytics(data).scopes[0]!.summary;
  expect(current.versionSelection?.missingRepositories).toEqual(['acme/other']);
  expect(current.coverage).toBeNull();
});

it('projette un ancien modèle sans réécrire le snapshot ni perdre les qualifications existantes', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const old = workspaceAnalytics(snapshot.normalizedData);
  delete old.versionSelectionAlgorithm;
  old.scopes[0]!.summary.coverage = 0;
  if (old.rows[0]) old.rows[0].qualification.reasons.push('Convention historique personnalisée');
  snapshot.analytics.workspaces = old;
  const before = JSON.stringify(snapshot);
  const projected = workspaceModel(snapshot);
  expect(projected.versionSelectionAlgorithm).toBe('prod-tag-v1');
  expect(projected.rows).toEqual(old.rows);
  expect(projected.scopes[0]!.summary.coverage).toBe(100);
  expect(JSON.stringify(snapshot)).toBe(before);
});
it('évalue la PROD démontrée par défaut et conserve le développement sélectionné explicitement', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const model = workspaceAnalytics(snapshot.normalizedData);
  const current = model.scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )!.summary;
  expect(current.coverage).toBe(100);
  expect(current.versionSelection?.mode).toBe('current-prod');
  expect(current.versionSelection?.versions).toMatchObject([
    { number: '1.7.1', channel: 'prod', tag: '1.7.1' }
  ]);
  const development = model.scopes.find(
    (scope) => !scope.repository && !scope.component && scope.version === '1.8.0'
  )!.summary;
  expect(development.coverage).toBe(0);
  expect(development.versionSelection?.versions).toMatchObject([{ number: '1.8.0', channel: 'development' }]);
});

it('ne remplace pas une PROD inconnue par une milestone, une date ou une version sans tag', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  for (const version of snapshot.normalizedData.versions!) {
    delete version.prodTag;
    delete version.channel;
  }
  const model = workspaceAnalytics(snapshot.normalizedData);
  const current = model.scopes.find(
    (scope) => !scope.repository && !scope.component && !scope.version
  )!.summary;
  expect(current.coverage).toBeNull();
  expect(current.conformity).toBeNull();
  expect(current.unknown).toBeGreaterThan(0);
  expect(current.versionSelection?.missingRepositories).toEqual(['acme/ds-react']);
  const explicit = model.scopes.find(
    (scope) => !scope.repository && !scope.component && scope.version === '1.7.1'
  )!.summary;
  expect(explicit.versionSelection?.versions).toMatchObject([{ number: '1.7.1', channel: 'unpublished' }]);
});

it('prend le numéro PROD le plus élevé parmi les tags exacts, sans exiger une date de tag', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const version = snapshot.normalizedData.versions!.find((item) => item.number === '1.8.0')!;
  version.number = '1.10.0';
  version.channel = 'release';
  version.prodTag = { name: '1.10.0' };
  const current = workspaceAnalytics(snapshot.normalizedData).scopes[0]!.summary;
  expect(current.versionSelection?.versions[0]?.number).toBe('1.10.0');
  version.prodTag.name = '1.10.0-rc.1';
  expect(
    workspaceAnalytics(snapshot.normalizedData).scopes[0]!.summary.versionSelection?.versions[0]?.number
  ).toBe('1.7.1');
});

it('distingue les PROD de plusieurs repositories et signale tout repository sans preuve', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const data = snapshot.normalizedData;
  data.libraries.push({ ...data.libraries[0]!, libraryId: 'other-lib', repository: 'acme/other' });
  const otherVersion = {
    ...data.versions![0]!,
    libraryId: 'other-lib',
    versionId: 'other-version',
    number: '3.2.0',
    channel: 'release' as const,
    prodTag: { name: '3.2.0' }
  };
  data.versions!.push(otherVersion);
  const explicit = workspaceAnalytics(data).scopes.find(
    (scope) => !scope.repository && !scope.component && scope.version === data.versions![0]!.versionId
  )!.summary;
  expect(explicit.coverage).toBe(100);
  expect(explicit.versionSelection?.versions).toHaveLength(1);
  expect(
    workspaceAnalytics(data).scopes[0]!.summary.versionSelection?.versions.map((v) => [
      v.repository,
      v.number
    ])
  ).toEqual([
    ['acme/ds-react', '1.7.1'],
    ['acme/other', '3.2.0']
  ]);
  delete (otherVersion as { prodTag?: { name: string } }).prodTag;
  const current = workspaceAnalytics(data).scopes[0]!.summary;
  expect(current.versionSelection?.missingRepositories).toEqual(['acme/other']);
  expect(current.coverage).toBeNull();
});

it('projette un ancien modèle sans réécrire le snapshot ni perdre les qualifications existantes', () => {
  const snapshot = prodAndDevelopmentSnapshot();
  const old = workspaceAnalytics(snapshot.normalizedData);
  delete old.versionSelectionAlgorithm;
  old.scopes[0]!.summary.coverage = 0;
  if (old.rows[0]) old.rows[0].qualification.reasons.push('Convention historique personnalisée');
  snapshot.analytics.workspaces = old;
  const before = JSON.stringify(snapshot);
  const projected = workspaceModel(snapshot);
  expect(projected.versionSelectionAlgorithm).toBe('prod-tag-v1');
  expect(projected.rows).toEqual(old.rows);
  expect(projected.scopes[0]!.summary.coverage).toBe(100);
  expect(JSON.stringify(snapshot)).toBe(before);
});
