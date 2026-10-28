import type { NormalizedData } from './types.js';

/** Bornes inclusives du suivi d’audit, indexées par owner/repository. */
export type AuditTracking = Record<string, string>;

/** Décompose une version SemVer stricte sans perdre la précision de ses nombres. */
function parts(value: string) {
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.exec(
      value
    );
  return match ? { core: match.slice(1, 4).map(BigInt), pre: match[4]?.split('.') } : undefined;
}

/** Compare deux versions selon SemVer, préversions incluses et métadonnées ignorées. */
export function compareAuditVersions(left: string, right: string): number {
  const a = parts(left),
    b = parts(right);
  if (!a || !b) throw new Error('Version de suivi d’audit invalide : SemVer attendu.');
  for (let i = 0; i < 3; i++) {
    if (a.core[i] !== b.core[i]) return a.core[i]! < b.core[i]! ? -1 : 1;
  }
  if (!a.pre || !b.pre) return a.pre === b.pre ? 0 : a.pre ? -1 : 1;
  for (let i = 0; i < Math.max(a.pre.length, b.pre.length); i++) {
    const x = a.pre[i],
      y = b.pre[i];
    if (x === y) continue;
    if (x === undefined || y === undefined) return x === undefined ? -1 : 1;
    const nx = /^\d+$/.test(x),
      ny = /^\d+$/.test(y);
    if (nx && ny) return BigInt(x) < BigInt(y) ? -1 : 1;
    if (nx !== ny) return nx ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return 0;
}

/** Valide les dépôts et bornes avant toute normalisation ; un objet vide exclut tous les dépôts. */
export function validateAuditTracking(value: unknown): asserts value is AuditTracking | undefined {
  if (value === undefined) return;
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.entries(value).some(
      ([repo, version]) => !/^[\w.-]+\/[\w.-]+$/.test(repo) || typeof version !== 'string' || !parts(version)
    )
  )
    throw new Error('auditTracking doit associer owner/repository à une version SemVer minimale.');
}

/** Isole le suivi sans retirer les anciennes données du snapshot ; les anciens contrats restent lisibles. */
export function auditTrackingData(data: NormalizedData): NormalizedData {
  if (data.auditTracking === undefined) return data;
  const libraries = new Map(data.libraries.map((library) => [library.libraryId, library.repository]));
  /** Vérifie la borne du dépôt ; une version inconnue ne devient pas admissible. */
  const included = (library: string, version: string) => {
    const minimum = data.auditTracking![libraries.get(library) ?? ''];
    return (
      minimum !== undefined && parts(version) !== undefined && compareAuditVersions(version, minimum) >= 0
    );
  };
  const versions = (data.versions ?? []).filter((version) => included(version.libraryId, version.number));
  const ids = new Set(versions.map((version) => version.versionId));
  return {
    ...data,
    versions,
    audits: data.audits.filter((audit) => included(audit.libraryId, audit.version)),
    componentVersions: (data.componentVersions ?? []).filter((relation) => ids.has(relation.versionId))
  };
}

/** Repère la plus haute version publiée (tag PROD) ou explicitement en développement de chaque dépôt suivi. */
export function latestAuditVersions(data: NormalizedData): Map<string, string> {
  const latest = new Map<string, string>();
  for (const version of data.versions ?? []) {
    if (!version.prodTag && version.channel !== 'development') continue;
    const item = { libraryId: version.libraryId, version: version.number };
    if (!parts(item.version)) continue;
    const previous = latest.get(item.libraryId);
    if (!previous || compareAuditVersions(item.version, previous) > 0)
      latest.set(item.libraryId, item.version);
  }
  return latest;
}
