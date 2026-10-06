import { stableId } from '../lib/ids.js';
import type { GithubProcessingConfig } from '../config.js';
import type { Catalogue, CatalogueComponent } from '../catalogue.js';
import type {
  Component,
  DataQualityStatus,
  Issue,
  LegacyAnomaly,
  LegacyAudit,
  Library,
  Milestone,
  NormalizedData,
  PullRequest,
  RawDataset
} from '../domain/types.js';
import { rawComponentNames } from '../lib/components.js';
import { normalizeVersions } from './versions.js';

const collectedStatus: DataQualityStatus = 'reliable';

/** Traduit le modèle RAW GitHub vers le modèle métier indépendant de la source. */
export function normalizeGithub(
  raw: RawDataset,
  rules: GithubProcessingConfig,
  catalogue?: Catalogue,
  auditVersion?: string
): NormalizedData {
  const repositories = [...raw.repositories].sort((left, right) => left.id.localeCompare(right.id));
  const orderedIssues = (repository: RawDataset['repositories'][number]) =>
    [...repository.issues].sort((left, right) => left.id.localeCompare(right.id));
  const libraries: Library[] = repositories.map((repository) => ({
    libraryId: stableId('lib', repository.name),
    name: repository.name,
    repository: `${repository.owner}/${repository.name}`,
    defaultBranch: repository.defaultBranch,
    status: 'active',
    provenance: { source: 'github', sourceId: repository.id, collectedAt: raw.collectedAt },
    dataQualityStatus: collectedStatus
  }));

  const libraryByRepository = new Map(
    repositories.map((repository, index) => [repository.name, libraries[index]!])
  );
  const componentsByName = new Map<string, Component>();
  const legacyAudits: LegacyAudit[] = [];
  const legacyAnomalies: LegacyAnomaly[] = [];
  const pullRequests: PullRequest[] = [];
  const issues: Issue[] = [];
  const milestonesById = new Map<string, Milestone>();
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
  for (const repository of repositories) {
    const library = libraryByRepository.get(repository.name)!;
    for (const issue of orderedIssues(repository)) {
      const componentNames = rawComponentNames(issue, rules.labels.componentPrefix);
      const cancelledProjectStatuses = (issue.projectStatuses ?? [])
        .filter((projectStatus) => rules.cancelledProjectStatuses.some((cancelledStatus) => cancelledStatus.toLowerCase() === projectStatus.status.toLowerCase()));
      for (const componentName of [...componentNames].sort()) {
        const componentId = stableId('component', `${library.libraryId}:${componentName}`);
        if (componentsByName.has(`${library.libraryId}:${componentName}`)) continue;
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
      if (issue.milestone) {
        const milestoneId = stableId('milestone', `${repository.id}:${issue.milestone.number}`);
        milestonesById.set(milestoneId, {
          milestoneId,
          repositoryId: repository.id,
          number: issue.milestone.number,
          title: issue.milestone.title,
          ...(issue.milestone.state ? { state: issue.milestone.state } : {})
        });
      }
      if (componentNames.length !== 1) continue;
      const [componentName] = componentNames;
      if (componentName === undefined) continue;
      const componentId = stableId('component', `${library.libraryId}:${componentName}`);
      const auditId = stableId(
        'audit',
        `${library.libraryId}:${componentName}:${resolvedAuditVersion}`
      );
      if (!legacyAudits.some((audit) => audit.auditId === auditId)) {
        legacyAudits.push({
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
      legacyAnomalies.push({
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
    for (const pullRequest of [...repository.pullRequests].sort((left, right) => left.id.localeCompare(right.id))) {
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

  for (const repository of repositories) {
    const library = libraryByRepository.get(repository.name)!;
    const issueIdByRawId = new Map(
      orderedIssues(repository).map((issue) => [issue.id, stableId('issue', issue.id)])
    );
    const pullRequestIds = new Set(repository.pullRequests.map((pullRequest) => pullRequest.id));
    for (const sourceIssue of orderedIssues(repository)) {
      const issueId = issueIdByRawId.get(sourceIssue.id)!;
      const componentNames = rawComponentNames(sourceIssue, rules.labels.componentPrefix);
      const componentIds = componentNames
        .map((name) => componentsByName.get(`${library.libraryId}:${name}`)?.componentId)
        .filter((componentId): componentId is string => componentId !== undefined)
        .sort();
      const parentIds = sourceIssue.parents
        .map((parentId) => issueIdByRawId.get(parentId))
        .filter((parentId): parentId is string => parentId !== undefined);
      const projectStatuses = (sourceIssue.projectStatuses ?? []).map((projectStatus) => ({
        projectId: projectStatus.projectId,
        projectName: projectStatus.projectName,
        status: { rawValue: projectStatus.status },
        fields: (sourceIssue.projectFields ?? [])
          .filter((field) => field.projectId === projectStatus.projectId)
          .map(({ fieldName, value }) => ({ fieldName, value }))
          .sort((left, right) => left.fieldName.localeCompare(right.fieldName)),
        ...(projectStatus.iteration ? { iteration: projectStatus.iteration } : {}),
        ...(projectStatus.velocity !== undefined
          ? { velocity: { rawValue: projectStatus.velocity } }
          : {}),
        ...(projectStatus.scheduling !== undefined
          ? { scheduling: { rawValue: projectStatus.scheduling } }
          : {}),
        transitions: (projectStatus.transitions ?? []).map((transition) => ({
          ...(transition.previousStatus !== undefined
            ? { previousStatus: { rawValue: transition.previousStatus } }
            : {}),
          newStatus: { rawValue: transition.newStatus },
          ...(transition.changedAt !== undefined ? { changedAt: transition.changedAt } : {})
        }))
      })).sort((left, right) => left.projectId.localeCompare(right.projectId));
      const milestoneId = sourceIssue.milestone
        ? stableId('milestone', `${repository.id}:${sourceIssue.milestone.number}`)
        : undefined;
      const accessibilityCategories = sourceIssue.labels
        .filter((label) => label.toLowerCase().startsWith(rules.labels.accessibilityCategoryPrefix.toLowerCase()))
        .map((label) => label.slice(rules.labels.accessibilityCategoryPrefix.length));
      const issueType = canonicalIssueType(sourceIssue.issueType, rules);
      issues.push({
        issueId,
        number: sourceIssue.number,
        title: sourceIssue.title,
        ...(sourceIssue.issueType !== undefined ? { rawIssueType: sourceIssue.issueType } : {}),
        ...(issueType ? { issueType } : {}),
        state: sourceIssue.state,
        createdAt: sourceIssue.createdAt,
        ...(sourceIssue.closedAt ? { closedAt: sourceIssue.closedAt } : {}),
        labels: [...sourceIssue.labels],
        repositoryId: repository.id,
        libraryId: library.libraryId,
        ...(sourceIssue.url ? { url: sourceIssue.url } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        projectStatuses,
        ...(parentIds.length === 1 ? { parentIssueId: parentIds[0] } : {}),
        subIssueIds: orderedIssues(repository)
          .filter((candidate) => candidate.parents.includes(sourceIssue.id))
          .map((candidate) => issueIdByRawId.get(candidate.id)!)
          .sort(),
        linkedPullRequestIds: sourceIssue.linkedPullRequestIds
          .filter((pullRequestId) => pullRequestIds.has(pullRequestId))
          .sort(),
        componentIds,
        criticities: [...sourceIssue.criticities],
        accessibilityCategories,
        provenance: {
          source: 'github',
          sourceId: sourceIssue.id,
          collectedAt: raw.collectedAt
        },
        dataQualityStatus: collectedStatus
      });
    }
  }

  return {
    libraries: [...libraries].sort((left, right) => left.libraryId.localeCompare(right.libraryId)),
    components: [...componentsByName.values()].sort((left, right) => left.componentId.localeCompare(right.componentId)),
    issues: issues.sort((left, right) => left.issueId.localeCompare(right.issueId)),
    milestones: [...milestonesById.values()].sort((left, right) => left.milestoneId.localeCompare(right.milestoneId)),
    versions: normalizeVersions(raw, libraries, [...milestonesById.values()]),
    componentVersions: [],
    audits: [],
    anomalies: [],
    auditImprovements: [],
    legacyAudits: legacyAudits.sort((left, right) => left.auditId.localeCompare(right.auditId)),
    legacyAnomalies: legacyAnomalies.sort((left, right) => left.anomalyId.localeCompare(right.anomalyId)),
    pullRequests: pullRequests.sort((left, right) => left.pullRequestId.localeCompare(right.pullRequestId))
  };
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
): LegacyAnomaly['criticality'] {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return rules.labels.criticalityValues[normalized]
    ?? (['blocking', 'major', 'minor'].includes(normalized)
      ? normalized as LegacyAnomaly['criticality']
      : undefined);
}

/** Resolves only complete, explicitly configured Issue Type variants. */
function canonicalIssueType(
  rawIssueType: string | undefined,
  rules: GithubProcessingConfig
): string | undefined {
  if (rawIssueType === undefined) return undefined;
  const value = rawIssueType.trim().toLowerCase();
  const candidates = Object.entries(rules.issueTypes.keywords)
    .filter(([, variants]) => variants.some((variant) => variant.trim().toLowerCase() === value))
    .map(([canonical]) => canonical)
    .sort();
  return candidates.length === 1 ? candidates[0] : undefined;
}
