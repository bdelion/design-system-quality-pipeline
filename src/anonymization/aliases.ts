/** Alias explicites pour des identités lisibles et stables entre collectes. */
import type { RawDataset } from '../domain/types.js';
import type { StableMapper } from './config.js';

/** Charge les alias depuis .env ; les clés sont les noms source, jamais leur position dans le RAW. */
export function anonymizationAliases(
  source: RawDataset,
  env: NodeJS.ProcessEnv = process.env
): Record<string, string> {
  const aliases: Record<string, string> = {};
  const owner = env.ANON_GITHUB_OWNER;
  if (owner) {
    for (const name of new Set(source.repositories.map((repo) => repo.owner)))
      aliases[`owner:${name}`] = owner;
  }
  // Refuser les collisions de noms normalisés : .find() choisirait silencieusement
  // le premier repository, puis les variables suivantes pourraient écraser son alias.
  const normalizedRepositories = new Map<string, string[]>();
  for (const repo of source.repositories) {
    const normalized = repo.name.toUpperCase().replace(/[^A-Z0-9]/g, '_');
    normalizedRepositories.set(normalized, [...(normalizedRepositories.get(normalized) ?? []), repo.name]);
  }

  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith('ANON_REPO_') || !value) continue;
    const sourceName = key.slice('ANON_REPO_'.length);
    const matches = normalizedRepositories.get(sourceName) ?? [];
    if (matches.length === 0) {
      throw new Error(`Alias ${key}: repository source introuvable dans le RAW`);
    }
    if (matches.length > 1) {
      throw new Error(
        `Alias ${key}: nom ambigu (${matches.join(', ')}). Renommer les variables ou utiliser une correspondance explicite.`
      );
    }
    aliases[`repository:${matches[0]!}`] = value;
  }
  const mappedNames = source.repositories
    .map((repo) => aliases[`repository:${repo.name}`])
    .filter((value): value is string => value !== undefined);
  if (new Set(mappedNames).size !== mappedNames.length) throw new Error('Alias repository en doublon');
  if (owner && !/^[a-zA-Z0-9][a-zA-Z0-9-]*$/.test(owner)) throw new Error('ANON_GITHUB_OWNER invalide');
  for (const value of mappedNames) {
    if (!/^[a-zA-Z0-9_.-]+$/.test(value)) throw new Error(`Alias repository invalide : ${value}`);
  }
  return aliases;
}

/** Applique les alias métier avant le repli sur le hash déterministe. */
export function withAliases(map: StableMapper, aliases: Record<string, string>): StableMapper {
  return (namespace, source, prefix) =>
    aliases[`${namespace}:${source}`] ?? map(namespace, source, prefix ?? namespace);
}
