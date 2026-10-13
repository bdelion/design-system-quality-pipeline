import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parse } from 'yaml';
import {
  compareHistoricalVersions,
  historicalRepository,
  validateHistoricalComponents,
  type HistoricalComponentCatalogue
} from './historical-components.js';
import type { RawDataset } from './domain/types.js';

/** Reconnaît un objet YAML avant lecture des déclarations locales. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Vérifie les identités déclarées contre les preuves, sans créer de présence à partir d'une règle. */
function validateIdentityRules(value: Record<string, unknown>, history: HistoricalComponentCatalogue): void {
  if (!Array.isArray(value.identities) || !value.identities.length)
    throw new Error('Identités historiques : déclarations absentes.');
  const ids = new Set<string>();
  for (const identity of value.identities) {
    if (
      !record(identity) ||
      typeof identity.id !== 'string' ||
      !identity.id ||
      ids.has(identity.id) ||
      typeof identity.currentName !== 'string' ||
      !Array.isArray(identity.names) ||
      !identity.names.length
    )
      throw new Error('Identités historiques : déclaration invalide ou dupliquée.');
    ids.add(identity.id);
    const component = history.components.find((c) => c.name === identity.currentName);
    if (!component) throw new Error('Identités historiques : composant déclaré absent du référentiel.');
    const identities = new Set<string>();
    for (const name of identity.names) {
      if (!record(name) || typeof name.name !== 'string' || !name.name)
        throw new Error('Identités historiques : nom invalide.');
      for (const bound of [name.fromVersion, name.throughVersion])
        if (bound !== undefined && (typeof bound !== 'string' || !/^\d+\.\d+\.\d+$/.test(bound)))
          throw new Error('Identités historiques : borne de version invalide.');
      if (
        typeof name.fromVersion === 'string' &&
        typeof name.throughVersion === 'string' &&
        compareHistoricalVersions(name.fromVersion, name.throughVersion) > 0
      )
        throw new Error('Identités historiques : intervalle inversé.');
      const observations = component.history.filter(
        (h) =>
          h.present &&
          (typeof name.fromVersion !== 'string' ||
            compareHistoricalVersions(h.version, name.fromVersion) >= 0) &&
          (typeof name.throughVersion !== 'string' ||
            compareHistoricalVersions(h.version, name.throughVersion) <= 0)
      );
      if (!observations.length || observations.some((h) => h.historicalName !== name.name))
        throw new Error(
          'Identités historiques : les noms par version contredisent les preuves du référentiel.'
        );
      observations.forEach((h) => identities.add(h.identity!));
    }
    if (identities.size !== 1)
      throw new Error('Identités historiques : le renommage ne conserve pas une identité unique.');
  }
  if (value.technicalRowMerges !== undefined) {
    if (!Array.isArray(value.technicalRowMerges))
      throw new Error('Identités historiques : fusions invalides.');
    for (const merge of value.technicalRowMerges) {
      if (
        !record(merge) ||
        typeof merge.component !== 'string' ||
        merge.presence !== 'any-source-present' ||
        !Array.isArray(merge.sourceSymbols) ||
        !merge.sourceSymbols.length ||
        !merge.sourceSymbols.every((s) => typeof s === 'string')
      )
        throw new Error('Identités historiques : règle de fusion non prise en charge.');
      const component = history.components.find((c) => c.name === merge.component);
      const sourceSymbols = merge.sourceSymbols as string[];
      if (
        !component ||
        component.history.some(
          (h) =>
            !sourceSymbols.every((symbol) => h.evidence.some((e) => e.symbol === symbol)) ||
            h.present !==
              h.evidence.some(
                (e) => sourceSymbols.includes(e.symbol) && ['+', '~', '='].includes(e.value.split('\n')[0]!)
              )
        )
      )
        throw new Error(
          'Identités historiques : les lignes source de fusion ne correspondent pas aux preuves.'
        );
    }
  }
  if (
    value.auditAttribution !== undefined &&
    (!record(value.auditAttribution) ||
      value.auditAttribution.rule !== 'target-version-and-historical-name' ||
      value.auditAttribution.unknownVersion !== 'unresolved')
  )
    throw new Error('Identités historiques : règle d’attribution non prise en charge.');
}

/** Charge un référentiel ou un fichier d'identités le désignant, avec affectation explicite au dépôt réel. */
export async function loadHistoricalImport(
  path: string,
  raw: RawDataset,
  repositoryOverride?: string
): Promise<HistoricalComponentCatalogue> {
  const value: unknown = parse(await readFile(path, 'utf8'));
  let history: HistoricalComponentCatalogue;
  if (record(value) && value.identities !== undefined) {
    if (typeof value.historicalCatalogue !== 'string' || !value.historicalCatalogue.trim())
      throw new Error(
        'Identités historiques : renseigner historicalCatalogue avec le chemin relatif du référentiel de présences par version.'
      );
    history = validateHistoricalComponents(
      parse(await readFile(resolve(dirname(path), value.historicalCatalogue), 'utf8'))
    );
    if (value.repository !== history.repository)
      throw new Error('Identités historiques : dépôt incohérent entre les deux fichiers.');
    validateIdentityRules(value, history);
  } else history = validateHistoricalComponents(value);
  if (repositoryOverride !== undefined) history.repository = repositoryOverride;
  historicalRepository(history, raw);
  return history;
}
