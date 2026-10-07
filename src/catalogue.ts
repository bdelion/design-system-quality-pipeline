import { Buffer } from 'node:buffer';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import type { NormalizedData, RawDataset } from './domain/types.js';
import { cataloguePath, fixtureConfigPaths } from './lib/paths.js';
import { stableId } from './lib/ids.js';

export type CatalogueStatus = 'stable' | 'experimental' | 'deprecated' | 'removed';

export interface CatalogueAudit {
    frequency: 'monthly' | 'quarterly' | 'yearly';
    lastAuditDate?: string;
}

export interface CatalogueComponent {
    name: string;
    repository?: string;
    stream: string;
    owner: string;
    squad: string;
    status: CatalogueStatus;
    rgaaLevel: string;
    figmaUrl?: string;
    documentationUrl?: string;
    tags: string[];
    audit?: CatalogueAudit;
}

export interface Catalogue {
    version: string;
    components: CatalogueComponent[];
}

export interface HistoricalCatalogueLoad {
    catalogue?: Catalogue;
    reason?: string;
}

const historicalCatalogueFile = 'config/catalogue.yaml';
const catalogueStatuses = new Set<CatalogueStatus>(['stable', 'experimental', 'deprecated', 'removed']);
const auditFrequencies = new Set<CatalogueAudit['frequency']>(['monthly', 'quarterly', 'yearly']);

/** Charge puis valide le catalogue courant. */
export async function loadCatalogue(source: 'fixture' | 'github' = 'github', fixtureFile?: string): Promise<Catalogue> {
    const path = source === 'fixture'
        ? (fixtureFile ? fixtureConfigPaths(fixtureFile).catalogue : cataloguePath.replace(/catalogue\.yaml$/, 'catalogue.fixture.yaml'))
        : cataloguePath;
    let yaml: string;
    try {
        yaml = await readFile(path, 'utf8');
    } catch (error) {
        if (source !== 'fixture' || (error as { code?: string }).code !== 'ENOENT') throw error;
        yaml = await readFile(cataloguePath.replace(/catalogue\.yaml$/, 'catalogue.fixture.yaml'), 'utf8');
    }
    return validateCatalogue(parse(yaml));
}

/** Vérifie la structure métier du catalogue et l'unicité de ses composants. */
export function validateCatalogue(value: unknown): Catalogue {
    if (!isRecord(value) || typeof value.version !== 'string' || !Array.isArray(value.components)) {
        throw new Error('Invalid catalogue: expected a version and a components array.');
    }
    const components = value.components.map((component, index) => validateComponent(component, index));
    if (new Set(components.map((component) => component.name)).size !== components.length) {
        throw new Error('Invalid catalogue: component names must be unique.');
    }
    return { version: value.version, components };
}

/** Reads and validates a catalogue from the exact PROD tag. */
export async function loadCatalogueAtTag(
    repository: string,
    tag: string,
    options: { apiUrl?: string; token: string }
): Promise<HistoricalCatalogueLoad> {
    const apiUrl = (options.apiUrl ?? 'https://api.github.com').replace(/\/+$/, '');
    const repoPath = repository.split('/').map(encodeURIComponent).join('/');
    const url = `${apiUrl}/repos/${repoPath}/contents/${historicalCatalogueFile}?ref=${encodeURIComponent(tag)}`;
    const response = await fetch(url, {
        headers: {
            Accept: 'application/vnd.github+json',
            Authorization: `Bearer ${options.token}`,
            'X-GitHub-Api-Version': '2022-11-28',
            'User-Agent': 'eventail-ds-quality-board'
        }
    });

    if (response.status === 404) {
        return { reason: `Catalogue ${historicalCatalogueFile} absent au tag ${tag}.` };
    }
    if (!response.ok) {
        throw new Error(`GitHub historical catalogue request failed for ${repository}@${tag} (${response.status}).`);
    }

    let payload: { content?: unknown; encoding?: unknown; path?: unknown };
    try {
        payload = await response.json() as { content?: unknown; encoding?: unknown; path?: unknown };
    } catch {
        return { reason: `Réponse GitHub illisible pour ${historicalCatalogueFile} au tag ${tag}.` };
    }
    if (payload.path !== historicalCatalogueFile || payload.encoding !== 'base64' || typeof payload.content !== 'string') {
        return { reason: `Réponse de contenu invalide pour ${historicalCatalogueFile} au tag ${tag}.` };
    }
    try {
        const yaml = Buffer.from(payload.content.replace(/\s/g, ''), 'base64').toString('utf8');
        return { catalogue: validateCatalogue(parse(yaml)) };
    } catch (error) {
        const detail = error instanceof Error ? error.message : 'contenu illisible';
        return { reason: `Catalogue invalide au tag ${tag} : ${detail}` };
    }
}

/** Loads a test fixture's historical catalogue file using the same validator as GitHub data. */
export async function loadCatalogueFixtureAtTag(
    tag: string,
    fixtureRoot = resolve(process.cwd(), 'fixtures/catalogue-history')
): Promise<HistoricalCatalogueLoad> {
    try {
        let yaml: string;
        try {
            yaml = await readFile(join(fixtureRoot, `${tag}.yaml`), 'utf8');
        } catch (error) {
            if ((error as { code?: string }).code !== 'ENOENT') throw error;
            yaml = await readFile(join(fixtureRoot, `v${tag}.yaml`), 'utf8');
        }
        return { catalogue: validateCatalogue(parse(yaml)) };
    } catch (error) {
        if ((error as { code?: string }).code === 'ENOENT') {
            return { reason: `Historical catalogue fixture for tag ${tag} is unavailable.` };
        }
        const detail = error instanceof Error ? error.message : 'contenu illisible';
        return { reason: `Invalid historical catalogue fixture for tag ${tag}: ${detail}` };
    }
}

/** Adds historical Component x Version memberships without current-catalogue fallback. */
export async function attachHistoricalCatalogues(
    raw: RawDataset,
    data: NormalizedData,
    options: { apiUrl?: string; token?: string; fixtureRoot?: string; source: 'fixture' | 'github' }
): Promise<void> {
    const libraryById = new Map(data.libraries.map((library) => [library.libraryId, library]));
    const componentByKey = new Map(data.components.map((component) => [
        `${component.libraryId}:${component.name}`,
        component
    ]));
    const componentVersions = new Map<string, { componentId: string; versionId: string }>();
    const catalogueLoads = new Map<string, Promise<HistoricalCatalogueLoad>>();

    for (const version of data.versions) {
        const library = libraryById.get(version.libraryId);
        const repository = library
            ? raw.repositories.find((candidate) => candidate.name === library.name)
            : undefined;
        const repo = repository?.owner && repository.name ? `${repository.owner}/${repository.name}` : undefined;
        const tag = version.published && version.tag === version.number ? version.number : undefined;

        if (!tag || !repo) {
            version.catalogueStatus = 'unknown';
            version.catalogueIssue = tag
                ? 'Repository source unavailable for the historical catalogue.'
                : `Exact PROD tag ${version.number} is unavailable; no current-catalogue fallback was used.`;
            continue;
        }

        let result: HistoricalCatalogueLoad;
        if (options.source === 'fixture') {
            result = await loadCatalogueFixtureAtTag(tag, options.fixtureRoot);
        } else {
            if (!options.token) throw new Error('A GitHub token is required to load historical catalogues.');
            const cacheKey = `${repo}@${tag}`;
            let request = catalogueLoads.get(cacheKey);
            if (!request) {
                request = loadCatalogueAtTag(repo, tag, {
                    ...(options.apiUrl ? { apiUrl: options.apiUrl } : {}),
                    token: options.token
                });
                catalogueLoads.set(cacheKey, request);
            }
            result = await request;
        }
        if (!result.catalogue) {
            version.catalogueStatus = 'unknown';
            version.catalogueIssue = result.reason ?? `Historical catalogue unavailable for ${repo}@${tag}.`;
            continue;
        }

        const entries = result.catalogue.components.filter((entry) =>
            !entry.repository
            || entry.repository === repository?.name
            || entry.repository === repo
        );
        version.catalogueStatus = 'known';
        version.catalogueComponents = entries.map((entry) => entry.name).sort();
        version.catalogueSource = {
            repository: repo,
            ref: tag,
            path: historicalCatalogueFile,
            collectedAt: raw.collectedAt
        };
        delete version.catalogueIssue;

        for (const entry of entries) {
            const key = `${version.libraryId}:${entry.name}`;
            let component = componentByKey.get(key);
            if (!component) {
                component = {
                    componentId: stableId('component', key),
                    name: entry.name,
                    libraryId: version.libraryId,
                    status: 'removed',
                    historicalOnly: true,
                    aliases: [],
                    discoverySource: 'catalogue',
                    stream: entry.stream,
                    owner: entry.owner,
                    squad: entry.squad,
                    rgaaLevel: entry.rgaaLevel,
                    tags: [...entry.tags],
                    provenance: { source: 'catalogue', sourceId: `${tag}:${entry.name}`, collectedAt: raw.collectedAt },
                    dataQualityStatus: 'reliable'
                };
                componentByKey.set(key, component);
                data.components.push(component);
            }
            componentVersions.set(`${component.componentId}:${version.versionId}`, {
                componentId: component.componentId,
                versionId: version.versionId
            });
        }
    }

    data.componentVersions = [...componentVersions.values()]
        .sort((left, right) => left.versionId.localeCompare(right.versionId)
            || left.componentId.localeCompare(right.componentId));
}

function validateComponent(value: unknown, index: number): CatalogueComponent {
    if (!isRecord(value)) throw new Error(`Invalid catalogue component at index ${index}: expected an object.`);
    for (const field of ['name', 'stream', 'owner', 'squad', 'status', 'rgaaLevel']) {
        if (typeof value[field] !== 'string' || value[field].length === 0) {
            throw new Error(`Invalid catalogue component at index ${index}: ${field} must be a non-empty string.`);
        }
    }
    if (!catalogueStatuses.has(value.status as CatalogueStatus)) {
        throw new Error(`Invalid catalogue component at index ${index}: status is invalid.`);
    }
    if (!Array.isArray(value.tags) || !value.tags.every((tag): tag is string => typeof tag === 'string' && tag.length > 0)) {
        throw new Error(`Invalid catalogue component at index ${index}: tags must be an array of non-empty strings.`);
    }

    const component: CatalogueComponent = {
        name: value.name as string,
        ...(typeof value.repository === 'string' && value.repository.length > 0 ? { repository: value.repository } : {}),
        stream: value.stream as string,
        owner: value.owner as string,
        squad: value.squad as string,
        status: value.status as CatalogueStatus,
        rgaaLevel: value.rgaaLevel as string,
        tags: value.tags
    };
    for (const field of ['figmaUrl', 'documentationUrl'] as const) {
        if (value[field] !== undefined) {
            if (typeof value[field] !== 'string' || !isUrl(value[field])) {
                throw new Error(`Invalid catalogue component at index ${index}: ${field} must be a valid URL.`);
            }
            component[field] = value[field];
        }
    }
    if (value.audit !== undefined) component.audit = validateAudit(value.audit, index);
    return component;
}

function validateAudit(value: unknown, componentIndex: number): CatalogueAudit {
    if (!isRecord(value) || typeof value.frequency !== 'string' || !auditFrequencies.has(value.frequency as CatalogueAudit['frequency'])) {
        throw new Error(`Invalid catalogue component at index ${componentIndex}: audit frequency is invalid.`);
    }
    if (value.lastAuditDate !== undefined && (typeof value.lastAuditDate !== 'string' || !isIsoDate(value.lastAuditDate))) {
        throw new Error(`Invalid catalogue component at index ${componentIndex}: audit lastAuditDate must be an ISO date.`);
    }
    return value.lastAuditDate === undefined
        ? { frequency: value.frequency as CatalogueAudit['frequency'] }
        : { frequency: value.frequency as CatalogueAudit['frequency'], lastAuditDate: value.lastAuditDate };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

function isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}
