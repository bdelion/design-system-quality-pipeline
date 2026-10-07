import { stableId } from '../lib/ids.js';
import type { GithubProcessingConfig } from '../config.js';
import type { Catalogue, CatalogueComponent } from '../catalogue.js';
import type {
  Anomaly,
  Audit,
  AuditImprovement,
  Component,
  DataQualityStatus,
  Issue,
  CanonicalIssueType,
  CanonicalProjectStatus,
  Library,
  NormalizedData,
  PullRequest,
  RawDataset,
  RawIssue,
  Version
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
  const versions: Version[] = [];
  const audits: Audit[] = [];
  const anomalies: Anomaly[] = [];
  const auditImprovements: AuditImprovement[] = [];
  const pullRequests: PullRequest[] = [];
  const catalogueByRepositoryAndName = new Map(
    catalogue?.components
      .filter((component) => component.repository)
      .map((component) => [`${component.repository}:${component.name}`, component])
  );
  const resolvedAuditVersion = auditVersion ?? catalogue?.version ?? 'unknown';

  const versionByLibraryAndNumber = new Map<string, Version>();
  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(repository.name)!;
    const milestoneByVersion = new Map<string, string>();
    for (const issue of repository.issues) {
      const number = prodVersionNumber(issue.milestone?.title);
      if (number && issue.milestone) milestoneByVersion.set(number, String(issue.milestone.id));
    }
    const tagByVersion = new Map(
      (repository.gitTags ?? [])
        .map((tag) => [prodVersionNumber(tag.name), tag] as const)
        .filter((entry): entry is [string, NonNullable<typeof entry[1]>] => Boolean(entry[0]))
    );
    const numbers = new Set([...milestoneByVersion.keys(), ...tagByVersion.keys()]);
    for (const number of [...numbers].sort()) {
      const tag = tagByVersion.get(number);
      const milestoneId = milestoneByVersion.get(number);
      const version: Version = {
        versionId: stableId('version', `${library.libraryId}:${number}`),
        libraryId: library.libraryId,
        number,
        ...(tag?.createdAt ? { releasedAt: tag.createdAt } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        ...(tag ? { prodTag: { name: tag.name, ...(tag.createdAt ? { createdAt: tag.createdAt } : {}) } } : {}),
        provenance: { source: 'github', sourceId: tag?.name ?? milestoneId ?? `version:${library.libraryId}:${number}`, collectedAt: raw.collectedAt,},
        dataQualityStatus: tag?.createdAt ? collectedStatus : 'partial'
      };
      versions.push(version);
      versionByLibraryAndNumber.set(`${library.libraryId}:${number}`, version);
    }
  }

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
      const issueTypeRecognition = recognizeIssueType(issue.rawIssueType, rules);
      const recognizedComponentIds = issue.labels
        .filter((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()))
        .map((label) => label.slice(rules.labels.componentPrefix.length).trim())
        .filter(Boolean)
        .map((name) => stableId('component', `${library.libraryId}:${name}`));
      // Transitional bridge for pre-I1 fixtures: legacy fixtures expose the
      // resolved component through RawIssue.component but do not yet carry the
      // native rawIssueType/complete I1 facts. Never use this fallback for new
      // I1 collections.
      const componentIds = issue.rawIssueType === undefined
        && recognizedComponentIds.length === 0
        && issue.component
        ? [componentId]
        : recognizedComponentIds;
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
        projectContexts: (issue.projectStatuses ?? []).map((projectStatus) => {
          const velocity = projectStatus.rawVelocity !== undefined
            ? numericProjectValue(projectStatus.rawVelocity)
            : undefined;
          const statusRecognition = recognizeProjectStatus(projectStatus.status, rules);
          return {
            projectId: projectStatus.projectId,
            projectName: projectStatus.projectName,
            rawStatus: projectStatus.status,
            ...(statusRecognition.status ? { status: statusRecognition.status } : {}),
            ...(statusRecognition.candidateStatuses.length > 1
              ? { candidateStatuses: statusRecognition.candidateStatuses }
              : {}),
            ...(projectStatus.iteration ? { iteration: { ...projectStatus.iteration } } : {}),
            ...(projectStatus.rawVelocity !== undefined ? { rawVelocity: projectStatus.rawVelocity } : {}),
            ...(velocity !== undefined ? { velocity } : {}),
            ...(projectStatus.rawScheduling !== undefined ? { rawScheduling: projectStatus.rawScheduling } : {}),
            statusHistory: (projectStatus.statusHistory ?? []).map((transition) => {
              const recognition = recognizeProjectStatus(transition.status, rules);
              const previousRecognition = recognizeProjectStatus(transition.previousStatus, rules);
              return {
                ...(transition.previousStatus !== undefined ? { previousRawStatus: transition.previousStatus } : {}),
                ...(previousRecognition.status ? { previousStatus: previousRecognition.status } : {}),
                ...(previousRecognition.candidateStatuses.length > 1
                  ? { previousCandidateStatuses: previousRecognition.candidateStatuses }
                  : {}),
                rawStatus: transition.status,
                ...(recognition.status ? { status: recognition.status } : {}),
                ...(recognition.candidateStatuses.length > 1
                  ? { candidateStatuses: recognition.candidateStatuses }
                  : {}),
                transitionedAt: transition.transitionedAt
              };
            })
          };
        }),
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

  // I1 specializations are derived only from normalized Issue facts. Invalid
  // cardinalities never create duplicate or artificial business entities.
  const rawIssueById = new Map(
    raw.repositories.flatMap((repository) => repository.issues).map((issue) => [issue.id, issue])
  );
  const auditByIssueId = new Map<string, Audit>();
  const hasKnownAuditVersion = resolvedAuditVersion !== 'unknown';

  for (const issue of issues) {
    const rawIssue = rawIssueById.get(issue.issueId);
    if (specializationIssueType(issue, rawIssue) !== 'AUDIT' || issue.componentIds.length !== 1) continue;
    const targetNumber = rawIssue?.rawIssueType !== undefined
      ? prodVersionNumber(rawIssue.milestone?.title)
      : (hasKnownAuditVersion ? resolvedAuditVersion : undefined);
    const targetVersion = targetNumber
      ? versionByLibraryAndNumber.get(`${issue.libraryId}:${targetNumber}`)
      : undefined;
    // Legacy fixtures predate Version[] and keep using the configured auditVersion bridge.
    const legacyVersion = rawIssue?.rawIssueType === undefined && targetNumber ? targetNumber : undefined;
    if (!targetVersion && !legacyVersion) continue;
    const componentId = issue.componentIds[0]!;
    const auditId = stableId('audit', issue.issueId);
    const audit: Audit = {
      auditId,
      issueId: issue.issueId,
      libraryId: issue.libraryId,
      componentId,
      ...(targetVersion ? { versionId: targetVersion.versionId } : {}),
      version: targetVersion?.number ?? legacyVersion!,
      status: rawIssue?.auditStatus ?? 'in_progress',
      sourceIssueId: issue.issueId,
      objectiveAuditResult: rawIssue?.auditResult ?? 'in_progress',
      provenance: { source: 'github', sourceId: issue.issueId, collectedAt: raw.collectedAt },
      dataQualityStatus: collectedStatus
    };
    audits.push(audit);
    auditByIssueId.set(issue.issueId, audit);
  }

  for (const issue of issues) {
    const rawIssue = rawIssueById.get(issue.issueId);
    const parentIds = rawIssue?.parents ?? [];
    const validParentAudits = parentIds
      .map((parentId) => auditByIssueId.get(parentId))
      .filter((audit): audit is Audit => Boolean(audit));

    const specializationType = specializationIssueType(issue, rawIssue);

    if (specializationType === 'BUG') {
      const origin: Anomaly['origin'] = parentIds.length === 0
        ? 'HORS_AUDIT'
        : validParentAudits.length === 1 && parentIds.length === 1
          ? 'AUDIT'
          : 'UNDETERMINED';
      const audit = origin === 'AUDIT' ? validParentAudits[0] : undefined;
      const cancelledProjectStatuses = (rawIssue?.projectStatuses ?? [])
        .filter((projectStatus) => rules.cancelledProjectStatuses.some(
          (cancelledStatus) => cancelledStatus.toLowerCase() === projectStatus.status.toLowerCase()
        ));
      const legacyComponentId = audit?.componentId
        ?? (issue.componentIds.length === 1 ? issue.componentIds[0] : undefined);
      anomalies.push({
        anomalyId: stableId('anomaly', issue.issueId),
        issueId: issue.issueId,
        origin,
        ...(audit ? { auditId: audit.auditId } : {}),
        ...(legacyComponentId ? { componentId: legacyComponentId } : {}),
        criticality: criticalityValue(rawIssue?.criticities[0], rules),
        categories: [...issue.accessibilityCategories],
        status: issue.state === 'OPEN' ? 'open' : 'done',
        createdAt: issue.createdAt,
        firstDoneAt: rawIssue?.firstDoneAt,
        everCorrected: Boolean(rawIssue?.firstDoneAt),
        pullRequestRefs: [...issue.linkedPullRequestIds],
        parentRefs: [...parentIds],
        provenance: { source: 'github', sourceId: issue.issueId, collectedAt: raw.collectedAt },
        dataQualityStatus: collectedStatus,
        cancelled: cancelledProjectStatuses.length > 0,
        cancelledProjectStatuses
      });
      continue;
    }

    if (specializationType === 'FEATURE' && parentIds.length === 1 && validParentAudits.length === 1) {
      auditImprovements.push({
        auditImprovementId: stableId('audit-improvement', issue.issueId),
        issueId: issue.issueId,
        auditId: validParentAudits[0]!.auditId,
        provenance: { source: 'github', sourceId: issue.issueId, collectedAt: raw.collectedAt },
        dataQualityStatus: collectedStatus
      });
    }
  }

  return {
    libraries,
    components: [...componentsByName.values()],
    issues,
    versions,
    audits,
    anomalies,
    auditImprovements,
    pullRequests
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
): Anomaly['criticality'] {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return rules.labels.criticalityValues[normalized]
    ?? (['blocking', 'major', 'minor'].includes(normalized)
      ? normalized as Anomaly['criticality']
      : undefined);
}



/**
 * Transitional specialization bridge for pre-I1 fixtures.
 *
 * New data always derives specialization from the canonical Issue Type
 * recalculated from rawIssueType. Old fixtures do not contain rawIssueType;
 * their legacy issueType is used only to keep the migration executable until
 * those fixtures are recollected. It is deliberately not copied into Issue.
 */
function numericProjectValue(value: string | number): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function prodVersionNumber(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return /^\d+\.\d+\.\d+$/.test(normalized) ? normalized : undefined;
}

function specializationIssueType(issue: Issue, rawIssue: RawIssue | undefined): CanonicalIssueType | undefined {
  if (rawIssue?.rawIssueType !== undefined) return issue.issueType;
  const legacy = rawIssue?.issueType;
  return legacy && ['EPIC', 'AUDIT', 'BUG', 'NEW_COMPONENT', 'FEATURE'].includes(legacy)
    ? legacy as CanonicalIssueType
    : undefined;
}


/** Reconnait strictement un statut Project a partir des variantes configurees. */
function recognizeProjectStatus(
  rawValue: string | undefined,
  rules: GithubProcessingConfig
): { status?: CanonicalProjectStatus; candidateStatuses: CanonicalProjectStatus[] } {
  if (!rawValue) return { candidateStatuses: [] };
  const normalizedRaw = rawValue.trim().toLowerCase();
  const canonicalStatuses: CanonicalProjectStatus[] = [
    'BACKLOG', 'READY', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED', 'CANCELLED'
  ];
  const candidates = Object.entries(rules.projectStatuses.keywords)
    .filter(([, variants]) => variants.some((variant) => variant.trim().toLowerCase() === normalizedRaw))
    .map(([canonical]) => canonical)
    .filter((canonical): canonical is CanonicalProjectStatus =>
      canonicalStatuses.includes(canonical as CanonicalProjectStatus)
    );

  if (candidates.length === 1) {
    return { status: candidates[0]!, candidateStatuses: candidates };
  }
  return { candidateStatuses: candidates };
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
