import { consolidationSnapshot } from './consolidation.js';
import { calculateKpis } from '../../src/analytics/kpis.js';

/** Prépare cinq identités, dont deux incarnations de Tag et un renommage déclaré, sur deux versions. */
export function componentPopulationsSnapshot() {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const base = data.components[0]!;
  data.components = [
    { ...base, componentId: 'tag-old', name: 'Tag', status: 'removed' as const, aliases: [] },
    { ...base, componentId: 'tag-new', name: 'Tag', status: 'active' as const, aliases: [] },
    { ...base, componentId: 'renamed', name: 'Renamed', status: 'active' as const, aliases: ['OldName'] },
    { ...base, componentId: 'modal', name: 'Modal', status: 'active' as const, aliases: [] },
    { ...base, componentId: 'mystery', name: 'Mystery', status: 'active' as const, aliases: [] }
  ];
  const versions = data.versions!.filter((version) => version.libraryId === base.libraryId);
  versions.forEach((version, index) => {
    version.number = `${index + 1}.0.0`;
    version.prodTag = { name: version.number };
    version.channel = 'release';
  });
  data.versions = versions;
  const relation = data.componentVersions![0]!;
  data.componentVersions = [
    ['tag-old', 0],
    ['renamed', 0],
    ['tag-new', 1],
    ['renamed', 1],
    ['modal', 1]
  ].map(([id, index], order) => ({
    ...relation,
    componentVersionId: `presence-${order}`,
    componentId: String(id),
    versionId: versions[Number(index)]!.versionId,
    verdict: order === 4 ? ('NON_COUVERT' as const) : ('CONFORME' as const),
    applicableAuditIds: [],
    provenance: { ...relation.provenance, sourceId: `catalogue-proof-${order}` }
  }));
  const library = data.libraries.find((item) => item.libraryId === base.libraryId)!;
  data.libraries = [library];
  const repository = snapshot.rawData.repositories.find(
    (item) => `${item.owner}/${item.name}` === library.repository
  )!;
  repository.historicalCatalogues = [
    { tagName: '1.0.0', status: 'available', componentNames: ['Tag', 'OldName'] },
    { tagName: '2.0.0', status: 'available', componentNames: ['Tag', 'Renamed', 'Modal', 'Mystery'] }
  ];
  snapshot.analytics = calculateKpis(data, snapshot.dataQuality.issues);
  return snapshot;
}
