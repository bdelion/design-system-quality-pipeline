import { stableId } from '../lib/ids.js';
import type { GithubProcessingConfig } from '../config.js';
import type { Catalogue, CatalogueComponent } from '../catalogue.js';
import type {
  Anomaly,
  Audit,
  Component,
  DataQualityStatus,
  Library,
  NormalizedData,
  PullRequest,
  RawDataset
} from '../domain/types.js';

const collectedStatus: DataQualityStatus = 'reliable';

/** Traduit le modèle RAW GitHub vers le modèle métier indépendant de la source. */
export function normalizeGithub(
  raw: RawDataset,
  rules: GithubProcessingConfig,
  catalogue?: Catalogue
): NormalizedData {
  const libraries: Library[] = raw.repositories.map((repository) => ({
    libraryId: stableId('lib', repository.name),
    name: repository.name,
    repository: `${repository.owner}/${repository.name}`,
    defaultBranch: repository.defaultBranch,
    status: 'active',
    provenance: { source: 'github', sourceId: repository.id, collectedAt: raw.collectedAt },
    dataQualityStatus: collectedStatus
  }));

  const libraryByRepository = new Map(
    raw.repositories.map((repository, index) => [repository.name, libraries[index]!])
  );
  const componentsByName = new Map<string, Component>();
  const audits: Audit[] = [];
  const anomalies: Anomaly[] = [];
  const pullRequests: PullRequest[] = [];
  const catalogueByName = new Map(
    catalogue?.components.map((component) => [component.name, component])
  );

  // Les composants sont indexés par bibliothèque pour éviter les collisions entre repositories.
  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(repository.name)!;
    for (const issue of repository.issues) {
      const componentName = issue.component ?? 'unknown';
      const componentId = stableId('component', `${library.libraryId}:${componentName}`);
      const cancelledProjectStatuses = (issue.projectStatuses ?? [])
        .filter((projectStatus) => rules.cancelledProjectStatuses.some((cancelledStatus) => cancelledStatus.toLowerCase() === projectStatus.status.toLowerCase()));
      if (!componentsByName.has(`${library.libraryId}:${componentName}`)) {
        const inCatalogue = raw.catalogueComponents.includes(componentName);
        const catalogueComponent = catalogueByName.get(componentName);
        componentsByName.set(`${library.libraryId}:${componentName}`, {
          componentId,
          name: componentName,
          libraryId: library.libraryId,
          status: 'active',
          aliases: [],
          discoverySource: inCatalogue ? 'catalogue' : 'suggested',
          tags: catalogueComponent?.tags ?? [],
          ...catalogueMetadata(catalogueComponent),
          provenance: {
            source: inCatalogue ? 'catalogue' : 'github',
            sourceId: issue.id,
            collectedAt: raw.collectedAt
          },
          dataQualityStatus: inCatalogue ? 'reliable' : 'partial'
        });
      }
      const auditId = stableId(
        'audit',
        `${library.libraryId}:${componentName}:2026.09`
      );
      if (!audits.some((audit) => audit.auditId === auditId)) {
        audits.push({
          auditId,
          libraryId: library.libraryId,
          componentId,
          version: '2026.09',
          status: issue.auditStatus ?? 'in_progress',
          sourceIssueId: issue.parents[0] ?? issue.id,
          objectiveAuditResult: issue.auditResult ?? 'in_progress',
          provenance: {
            source: 'github',
            sourceId: issue.parents[0] ?? issue.id,
            collectedAt: raw.collectedAt
          },
          dataQualityStatus: 'partial'
        });
      }
      // Les audits sont créés pour toutes les issues, mais seules les issues BUG deviennent des anomalies.
      if (issue.issueType !== rules.issueTypes.anomaly) continue;
      anomalies.push({
        anomalyId: stableId('anomaly', issue.id),
        auditId,
        componentId,
        criticality: criticalityValue(issue.criticities[0], rules),
        categories: issue.labels
          .filter((label) => label.toLowerCase().startsWith(rules.labels.categoryPrefix.toLowerCase()))
          .map((label) => label.slice(rules.labels.categoryPrefix.length)),
        status: issue.state === 'OPEN' ? 'open' : 'done',
        createdAt: issue.createdAt,
        firstDoneAt: issue.firstDoneAt,
        everCorrected: Boolean(issue.firstDoneAt),
        pullRequestRefs: issue.linkedPullRequestIds,
        parentRefs: issue.parents,
        provenance: {
          source: 'github',
          sourceId: issue.id,
          collectedAt: raw.collectedAt
        },
        dataQualityStatus: collectedStatus,
        cancelled: cancelledProjectStatuses.length > 0,
        cancelledProjectStatuses
      });
    }
    for (const pullRequest of repository.pullRequests) {
      pullRequests.push({
        pullRequestId: pullRequest.id,
        repository: repository.name,
        state: pullRequest.state.toLowerCase() as PullRequest['state'],
        mergedAt: pullRequest.mergedAt,
        relatedIssueIds: pullRequest.relatedIssueIds,
        provenance: {
          source: 'github',
          sourceId: pullRequest.id,
          collectedAt: raw.collectedAt
        },
        dataQualityStatus: collectedStatus
      });
    }
  }

  return { libraries, components: [...componentsByName.values()], audits, anomalies, pullRequests };
}

/** Convertit les métadonnées du catalogue vers le modèle Component. */
function catalogueMetadata(component: CatalogueComponent | undefined): Partial<Component> {
  if (!component) return {};

  // Traduit le cycle de vie du catalogue vers le modèle de composant normalisé.
  return {
    stream: component.stream,
    owner: component.owner,
    squad: component.squad,
    status: component.status === 'stable' ? 'active' : component.status,
    rgaaLevel: component.rgaaLevel,
    ...(component.figmaUrl ? { figmaUrl: component.figmaUrl } : {}),
    ...(component.documentationUrl
      ? { documentationUrl: component.documentationUrl }
      : {}),
    ...(component.audit ? { audit: component.audit } : {})
  };
}

/** Traduit une criticité GitHub en valeur normalisée. */
function criticalityValue(
  value: string | undefined,
  rules: GithubProcessingConfig
): Anomaly['criticality'] {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return rules.labels.criticalityValues[normalized]
    ?? (['blocking', 'major', 'minor'].includes(normalized)
      ? normalized as Anomaly['criticality']
      : undefined);
}
