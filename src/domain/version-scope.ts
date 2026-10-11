/** Périmètre des versions analysables selon le package déclaré (D-004, issue #39). */
import type { GithubProcessingConfig } from '../config.js';
import type { RawPackageManifest } from './types.js';

/** Extrait la version nominale M.m.r, en conservant la distinction avec l'artefact construit. */
export function nominalVersion(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const match =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?(?:\+[0-9A-Za-z]+(?:[.-][0-9A-Za-z]+)*)?$/.exec(
      value.trim()
    );
  return match ? match.slice(1, 4).join('.') : undefined;
}

/** Extrait une version depuis une milestone suivant la première règle configurée. */
export function milestoneVersionNumber(
  value: string | undefined,
  rules: GithubProcessingConfig
): string | undefined {
  if (!value) return undefined;
  if (!rules.milestoneDetection) return /^\d+\.\d+\.\d+$/.test(value.trim()) ? value.trim() : undefined;
  for (const pattern of rules.milestoneDetection.patterns) {
    const match = new RegExp(pattern.regex, rules.milestoneDetection.caseSensitive ? '' : 'i').exec(
      value.trim()
    );
    const version = match?.groups?.version?.trim();
    if (version) return version;
  }
  return undefined;
}

/** Compare les trois nombres sans arrondi ; retourne une inconnue si la version ou la borne manque. */
export function isFutureVersion(
  value: string | undefined,
  manifest: RawPackageManifest | undefined
): boolean | undefined {
  const candidate = nominalVersion(value);
  const ceiling = manifest?.status === 'available' ? nominalVersion(manifest.version) : undefined;
  if (!candidate || !ceiling) return undefined;
  const left = candidate.split('.').map(BigInt);
  const right = ceiling.split('.').map(BigInt);
  for (let index = 0; index < 3; index++) {
    if (left[index]! !== right[index]!) return left[index]! > right[index]!;
  }
  return false;
}
