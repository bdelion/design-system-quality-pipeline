import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { cataloguePath } from './lib/paths.js';

/** Statut de cycle de vie déclaré dans le catalogue de référence. */
export type CatalogueStatus = 'stable' | 'experimental' | 'deprecated' | 'removed';

/** Fréquence et date du dernier audit connu pour un composant. */
export interface CatalogueAudit {
    frequency: 'monthly' | 'quarterly' | 'yearly';
    lastAuditDate?: string;
}

/** Métadonnées de référence utilisées pour enrichir un composant normalisé. */
export interface CatalogueComponent {
    name: string;
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

/** Catalogue complet chargé depuis le fichier YAML versionné. */
export interface Catalogue {
    version: string;
    components: CatalogueComponent[];
}

const catalogueStatuses = new Set<CatalogueStatus>([
    'stable',
    'experimental',
    'deprecated',
    'removed'
]);
const auditFrequencies = new Set<CatalogueAudit['frequency']>(['monthly', 'quarterly', 'yearly']);

/** Charge puis valide le catalogue avant de le rendre disponible au pipeline. */
export async function loadCatalogue(): Promise<Catalogue> {
    const yaml = await readFile(cataloguePath, 'utf8');
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

/** Valide une entrée de composant et refuse les métadonnées ambiguës. */
function validateComponent(value: unknown, index: number): CatalogueComponent {
    if (!isRecord(value)) {
        throw new Error(`Invalid catalogue component at index ${index}: expected an object.`);
    }
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

/** Valide la fréquence et la date facultative d'un audit de catalogue. */
function validateAudit(value: unknown, componentIndex: number): CatalogueAudit {
    if (!isRecord(value) || typeof value.frequency !== 'string' || !auditFrequencies.has(value.frequency as CatalogueAudit['frequency'])) {
        throw new Error(`Invalid catalogue component at index ${componentIndex}: audit frequency is invalid.`);
    }
    if (value.lastAuditDate !== undefined && (typeof value.lastAuditDate !== 'string' || !isIsoDate(value.lastAuditDate))) {
        throw new Error(`Invalid catalogue component at index ${componentIndex}: audit lastAuditDate must be an ISO date.`);
    }
    return value.lastAuditDate === undefined
        ? { frequency: value.frequency as CatalogueAudit['frequency'] }
        : {
                frequency: value.frequency as CatalogueAudit['frequency'],
                lastAuditDate: value.lastAuditDate
            };
}

/** Indique si une valeur YAML peut être traitée comme un objet clé-valeur. */
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** N'accepte que des liens web utilisables dans le dashboard et le catalogue. */
function isUrl(value: string): boolean {
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/** Vérifie le format de date ISO utilisé par les audits. */
function isIsoDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}