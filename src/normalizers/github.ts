import { stableId } from '../lib/ids.js';
import type { GithubProcessingConfig } from '../config.js';
import type { Catalogue, CatalogueComponent } from '../catalogue.js';
import type {
  Anomaly,
  Audit,
  Component,
  DataQualityStatus,
  Issue,
  CanonicalIssueType,
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
  catalogue?: Catalogue,
  auditVersion?: string
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
  const issues: Issue[] = [];
  const audits: Audit[] = [];
  const anomalies: Anomaly[] = [];
  const pullRequests: PullRequest[] = [];
  const catalogueByRepositoryAndName = new Map(
    catalogue?.components
      .filter((component) => component.repository)
      .map((component) => [`${component.repository}:${component.name}`, component])
  );
  const resolvedAuditVersion = auditVersion ?? catalogue?.version ?? 'unknown';

  // Le catalogue peut matérialiser un composant même lorsqu'aucune issue GitHub ne le mentionne.
  for (const catalogueComponent of catalogue?.components ?? []) {
    if (!catalogueComponent.repository) continue;
    const library = libraryByRepository.get(catalogueComponent.repository);
    if (!library) continue;
    const key = `${library.libraryId}:${catalogueComponent.name}`;
    componentsByName.set(key, {
      componentId: stableId('component', key),
      name: catalogueComponent.name,
      libraryId: library.libraryId,
      status: catalogueComponent.status === 'stable' ? 'active' : catalogueComponent.status,
      aliases: [],
      discoverySource: 'catalogue',
      tags: catalogueComponent.tags,
      ...catalogueMetadata(catalogueComponent),
      provenance: { source: 'catalogue', sourceId: catalogueComponent.name, collectedAt: raw.collectedAt },
      dataQualityStatus: 'reliable'
    });
  }

  // Les composants sont indexés par bibliothèque pour éviter les collisions entre repositories.
  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(repository.name)!;
    for (const issue of repository.issues) {
      const componentName = issue.component ?? 'unknown';
      const componentId = stableId('component', `${library.libraryId}:${componentName}`);
      const cancelledProjectStatuses = (issue.projectStatuses ?? [])
        .filter((projectStatus) => rules.cancelledProjectStatuses.some((cancelledStatus) => cancelledStatus.toLowerCase() === projectStatus.status.toLowerCase()));
      const issueTypeRecognition = recognizeIssueType(issue.rawIssueType, rules);
      const componentIds = issue.labels
        .filter((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()))
        .map((label) => label.slice(rules.labels.componentPrefix.length).trim())
        .filter(Boolean)
        .map((name) => stableId('component', `${library.libraryId}:${name}`));
      const criticalities = issue.labels
        .filter((label) => label.toLowerCase().startsWith(rules.labels.accessibilityCriticalityPrefix.toLowerCase()))
        .map((label) => label.slice(rules.labels.accessibilityCriticalityPrefix.length).trim());
      const accessibilityCategories = issue.labels
        .filter((label) => label.toLowerCase().startsWith(rules.labels.accessibilityCategoryPrefix.toLowerCase()))
        .map((label) => label.slice(rules.labels.accessibilityCategoryPrefix.length).trim());
      issues.push({
        issueId: issue.id,
        repositoryId: repository.id,
        libraryId: library.libraryId,
        number: issue.number,
        title: issue.title,
        url: issue.url ?? `https://github.com/${repository.owner}/${repository.name}/issues/${issue.number}`,
        state: issue.state,
        createdAt: issue.createdAt,
        ...(issue.closedAt ? { closedAt: issue.closedAt } : {}),
        labels: [...issue.labels],
        ...(issue.milestone ? { milestoneId: String(issue.milestone.id) } : {}),
        ...(issue.rawIssueType ? { rawIssueType: issue.rawIssueType } : {}),
        ...(issueTypeRecognition.issueType ? { issueType: issueTypeRecognition.issueType } : {}),
        ...(issueTypeRecognition.candidateIssueTypes.length > 1
          ? { candidateIssueTypes: issueTypeRecognition.candidateIssueTypes }
          : {}),
        componentIds,
        criticalities,
        accessibilityCategories,
        ...(issue.parents.length === 1 ? { parentIssueId: issue.parents[0] } : {}),
        subIssueIds: [],
        linkedPullRequestIds: [...issue.linkedPullRequestIds],
        projectContexts: (issue.projectStatuses ?? []).map((projectStatus) => ({
          projectId: projectStatus.projectId,
          projectName: projectStatus.projectName,
          rawStatus: projectStatus.status,
          statusHistory: []
        })),
        provenance: { source: 'github', sourceId: issue.id, collectedAt: raw.collectedAt },
        dataQualityStatus: collectedStatus
      });
      if (!componentsByName.has(`${library.libraryId}:${componentName}`)) {
        const catalogueComponent = catalogueByRepositoryAndName.get(`${repository.name}:${componentName}`);
        const inCatalogue = Boolean(catalogueComponent) || raw.catalogueComponents.includes(componentName);
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
        `${library.libraryId}:${componentName}:${resolvedAuditVersion}`
      );
      if (!audits.some((audit) => audit.auditId === auditId)) {
        audits.push({
          auditId,
          libraryId: library.libraryId,
          componentId,
          version: resolvedAuditVersion,
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
          .filter((label) => label.toLowerCase().startsWith(rules.labels.accessibilityCategoryPrefix.toLowerCase()))
          .map((label) => label.slice(rules.labels.accessibilityCategoryPrefix.length)),
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

  const issueById = new Map(issues.map((issue) => [issue.issueId, issue]));
  for (const issue of issues) {
    if (!issue.parentIssueId) continue;
    const parent = issueById.get(issue.parentIssueId);
    if (parent && !parent.subIssueIds.includes(issue.issueId)) parent.subIssueIds.push(issue.issueId);
  }

  return { libraries, components: [...componentsByName.values()], issues, audits, anomalies, pullRequests };
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


/** Reconnait strictement une valeur d'Issue Type à partir des variantes configurées. */
function recognizeIssueType(
  rawValue: string | undefined,
  rules: GithubProcessingConfig
): { issueType?: CanonicalIssueType; candidateIssueTypes: CanonicalIssueType[] } {
  if (!rawValue) return { candidateIssueTypes: [] };
  const normalizedRaw = rawValue.trim().toLowerCase();
  const candidates = Object.entries(rules.issueTypes.keywords)
    .filter(([, variants]) => variants.some((variant) => variant.trim().toLowerCase() === normalizedRaw))
    .map(([canonical]) => canonical)
    .filter((canonical): canonical is CanonicalIssueType =>
      ['EPIC', 'AUDIT', 'BUG', 'NEW_COMPONENT', 'FEATURE'].includes(canonical)
    );

  if (candidates.length === 1) {
    return { issueType: candidates[0]!, candidateIssueTypes: candidates };
  }
  return { candidateIssueTypes: candidates };
}
