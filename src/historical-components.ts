import type { RawDataset } from './domain/types.js';

/** Observation de présence et d'identité d'un composant dans une version. */
export interface HistoricalComponentObservation {
  version: string;
  channel: 'release' | 'development';
  present: boolean;
  change: 'added' | 'modified' | 'unchanged' | 'removed' | 'absent' | 'renamed';
  identity: string | null;
  historicalName: string;
  evidence: { cell: string; symbol: string; value: string }[];
}

/** Référentiel local de présence ; ne constitue ni une publication ni un verdict d'audit. */
export interface HistoricalComponentCatalogue {
  schemaVersion: 1;
  repository: string;
  versions: { version: string; channel: 'release' | 'development'; sourceLabel: string }[];
  components: { name: string; history: HistoricalComponentObservation[] }[];
}

/** Reconnaît un objet non nul pour contrôler un fichier externe sans conversion implicite. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Valide et réduit le référentiel aux preuves utiles, sans transporter les chemins privés du classeur. */
export function validateHistoricalComponents(value: unknown): HistoricalComponentCatalogue {
  /** Interrompt la lecture sans exposer une cellule nominative dans le diagnostic. */
  const fail = (): never => {
    throw new Error(
      'Historique des composants invalide : schéma, versions, identités ou preuves incohérents.'
    );
  };
  if (
    !record(value) ||
    value.schemaVersion !== 1 ||
    typeof value.repository !== 'string' ||
    !value.repository ||
    !Array.isArray(value.versions) ||
    !value.versions.length ||
    !Array.isArray(value.components) ||
    !value.components.length
  )
    return fail();
  const versions: HistoricalComponentCatalogue['versions'] = [];
  for (const version of value.versions) {
    if (
      !record(version) ||
      typeof version.version !== 'string' ||
      !/^\d+\.\d+\.\d+$/.test(version.version) ||
      !['release', 'development'].includes(String(version.channel)) ||
      typeof version.sourceLabel !== 'string' ||
      versions.some((v) => v.version === version.version)
    )
      return fail();
    if (versions.length && compareHistoricalVersions(versions.at(-1)!.version, version.version) >= 0)
      return fail();
    versions.push({
      version: version.version,
      channel: version.channel as 'release' | 'development',
      sourceLabel: version.sourceLabel
    });
  }
  const components: HistoricalComponentCatalogue['components'] = [];
  const identities = new Map<string, string>();
  const historicalNames = new Map<string, string>();
  for (const component of value.components) {
    if (
      !record(component) ||
      typeof component.name !== 'string' ||
      !component.name ||
      components.some((c) => c.name === component.name) ||
      !Array.isArray(component.history) ||
      component.history.length !== versions.length
    )
      return fail();
    const history: HistoricalComponentObservation[] = [];
    const ended = new Set<string>();
    let previous: HistoricalComponentObservation | undefined;
    for (const [index, observation] of component.history.entries()) {
      const version = versions[index]!;
      if (
        !record(observation) ||
        observation.version !== version.version ||
        observation.channel !== version.channel ||
        typeof observation.present !== 'boolean' ||
        typeof observation.historicalName !== 'string' ||
        !observation.historicalName ||
        !['added', 'modified', 'unchanged', 'removed', 'absent', 'renamed'].includes(
          String(observation.change)
        ) ||
        !(
          observation.identity === null ||
          (typeof observation.identity === 'string' && observation.identity.length > 0)
        ) ||
        !Array.isArray(observation.evidence)
      )
        return fail();
      if (observation.present && (!observation.identity || !observation.evidence.length)) return fail();
      if (observation.present) {
        const key = `${version.version}:${observation.historicalName}`;
        const owner = historicalNames.get(key);
        if (owner && owner !== component.name) return fail();
        historicalNames.set(key, component.name);
      }
      if (observation.change === 'removed' && observation.identity !== previous?.identity) return fail();
      if (observation.change === 'absent' && observation.identity !== null) return fail();
      if (
        observation.evidence.some(
          (e) =>
            !record(e) ||
            typeof e.cell !== 'string' ||
            !/^[A-Z]+[1-9]\d*$/.test(e.cell) ||
            typeof e.symbol !== 'string' ||
            typeof e.value !== 'string' ||
            !['', '+', '~', '=', '-'].includes(e.value.split('\n')[0]!)
        )
      )
        return fail();
      if (
        observation.present !==
        observation.evidence.some((e) =>
          ['+', '~', '='].includes((e as { value: string }).value.split('\n')[0]!)
        )
      )
        return fail();
      const wasPresent = previous?.present ?? false;
      if (
        observation.present
          ? wasPresent
            ? !['modified', 'unchanged', 'renamed'].includes(String(observation.change))
            : observation.change !== 'added'
          : observation.change !== (wasPresent ? 'removed' : 'absent')
      )
        return fail();
      if (wasPresent && observation.present && previous!.identity !== observation.identity) return fail();
      if (wasPresent && !observation.present) ended.add(previous!.identity!);
      if (observation.present && ended.has(String(observation.identity))) return fail();
      if (observation.identity) {
        const owner = identities.get(observation.identity);
        if (owner && owner !== component.name) return fail();
        identities.set(observation.identity, component.name);
      }
      const checked = observation as unknown as HistoricalComponentObservation;
      history.push({
        version: checked.version,
        channel: checked.channel,
        present: checked.present,
        change: checked.change,
        identity: checked.identity,
        historicalName: checked.historicalName,
        evidence: checked.evidence.map((e) => ({ cell: e.cell, symbol: e.symbol, value: e.value }))
      });
      previous = checked;
    }
    components.push({ name: component.name, history });
  }
  return { schemaVersion: 1, repository: value.repository, versions, components };
}

/** Compare les numéros de versions sans confondre 1.10 et 1.2. */
export function compareHistoricalVersions(left: string, right: string): number {
  const a = left.split('.').map(Number),
    b = right.split('.').map(Number);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! - b[i]!;
  return 0;
}

/** Refuse une affectation à un dépôt absent ou ambigu, sans réutilisation silencieuse d'un alias. */
export function historicalRepository(history: HistoricalComponentCatalogue, raw: RawDataset): string {
  const matches = raw.repositories.filter(
    (repo) => history.repository === repo.name || history.repository === `${repo.owner}/${repo.name}`
  );
  if (matches.length !== 1)
    throw new Error(
      'Historique : le repository doit correspondre exactement à un dépôt du RAW (nom ou owner/nom).'
    );
  if (
    history.versions.some(
      (version) =>
        version.channel === 'development' && matches[0]!.gitTags?.some((tag) => tag.name === version.version)
    )
  )
    throw new Error(
      'Historique : une version de développement possède désormais un tag PROD ; actualiser ses preuves de présence avant l’import.'
    );
  return matches[0]!.name;
}

/** Anonymise les noms et les identités en conservant les cellules justificatives et les liens temporels. */
export function anonymizeHistoricalComponents(
  history: HistoricalComponentCatalogue,
  repository: string,
  componentName: (name: string) => string,
  identity: (name: string) => string
): HistoricalComponentCatalogue {
  return {
    schemaVersion: 1,
    repository,
    versions: history.versions.map((v) => ({
      ...v,
      sourceLabel: v.version + (v.channel === 'development' ? ' (develop)' : '')
    })),
    components: history.components.map((c) => ({
      name: componentName(c.name),
      history: c.history.map((h) => ({
        ...h,
        identity: h.identity ? identity(h.identity) : null,
        historicalName: componentName(h.historicalName),
        evidence: h.evidence.map((e) => ({
          cell: e.cell,
          symbol: componentName(e.symbol),
          value: e.value.split('\n')[0]!
        }))
      }))
    }))
  };
}
