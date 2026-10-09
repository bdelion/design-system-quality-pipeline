/**
 * @module normalizers.github
 * Transforme les faits GitHub en entités métier normalisées et traçables.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { stableId } from '../lib/ids.js';
import type { GithubProcessingConfig } from '../config.js';
import type { Catalogue, CatalogueComponent } from '../catalogue.js';
import type {
  Anomaly,
  Audit,
  AuditImprovement,
  Component,
  ComponentVersion,
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

/**
 * Normalise les faits collectés depuis GitHub en entités métier V1.
 *
 * Les données RAW restent la source de vérité des faits observés. La normalisation
 * construit les relations entre bibliothèques, versions, composants, audits et
 * anomalies, sans masquer les informations manquantes : elles sont ensuite
 * évaluées par la couche Data Quality.
 *
 * @param raw - Données collectées, incluant les repositories et leurs événements.
 * @param rules - Règles de correspondance et de spécialisation GitHub.
 * @param catalogue - Catalogue de composants éventuellement fourni.
 * @param auditVersion - Version des règles d'audit utilisée pour la provenance.
 * @returns Données métier normalisées, prêtes pour les contrôles et les KPI.
 */
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
  const componentVersions: ComponentVersion[] = [];
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
    const milestoneIdsByVersion = new Map<string, Set<string>>();
    for (const issue of repository.issues) {
      const number = prodVersionNumber(issue.milestone?.title);
      if (!number || !issue.milestone) continue;
      const milestoneIds = milestoneIdsByVersion.get(number) ?? new Set<string>();
      milestoneIds.add(String(issue.milestone.id));
      milestoneIdsByVersion.set(number, milestoneIds);
    }
    const tagByVersion = new Map(
      (repository.gitTags ?? [])
        .map((tag) => [prodVersionNumber(tag.name), tag] as const)
        .filter((entry): entry is [string, NonNullable<(typeof entry)[1]>] => Boolean(entry[0]))
    );
    const numbers = new Set([...milestoneIdsByVersion.keys(), ...tagByVersion.keys()]);
    for (const number of [...numbers].sort()) {
      const tag = tagByVersion.get(number);
      const milestoneIds = [...(milestoneIdsByVersion.get(number) ?? [])].sort();
      const milestoneId = milestoneIds.length === 1 ? milestoneIds[0] : undefined;
      const version: Version = {
        versionId: stableId('version', `${library.libraryId}:${number}`),
        libraryId: library.libraryId,
        number,
        ...(tag?.createdAt ? { releasedAt: tag.createdAt } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        ...(tag
          ? { prodTag: { name: tag.name, ...(tag.createdAt ? { createdAt: tag.createdAt } : {}) } }
          : {}),
        provenance: {
          source: 'github',
          sourceId: tag?.name ?? milestoneId ?? `version:${library.libraryId}:${number}`,
          collectedAt: raw.collectedAt
        },
        dataQualityStatus: tag?.createdAt ? collectedStatus : 'partial'
      };
      versions.push(version);
      versionByLibraryAndNumber.set(`${library.libraryId}:${number}`, version);
    }
  }

  // I4.2: materialize historical Component x Version presence only from exact
  // PROD-tag catalogue evidence. Missing/invalid catalogues are unknown evidence,
  // never interpreted as component disappearance.
  const historicalComponentsById = new Map<string, Component>();
  const historicalComponentNames = new Set<string>();
  const latestHistoricalComponentIdByName = new Map<string, string>();
  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(repository.name)!;
    const snapshots = (repository.historicalCatalogues ?? [])
      .filter((snapshot) => snapshot.status === 'available')
      .flatMap((snapshot) => {
        const number = prodVersionNumber(snapshot.tagName);
        return number ? [{ snapshot, number }] : [];
      })
      .filter((entry) => versionByLibraryAndNumber.has(`${library.libraryId}:${entry.number}`))
      .sort((left, right) => compareProdVersions(left.number, right.number));

    let previousKnownNames: Set<string> | undefined;
    const activeComponentIdByName = new Map<string, string>();
    for (const { snapshot, number } of snapshots) {
      const version = versionByLibraryAndNumber.get(`${library.libraryId}:${number}`)!;
      const names = new Set(snapshot.componentNames);

      // An absence in an available catalogue is positive evidence that the
      // previous identity ended. Unknown snapshots never execute this branch.
      if (previousKnownNames) {
        for (const previousName of previousKnownNames) {
          if (!names.has(previousName)) {
            const endedComponentId = activeComponentIdByName.get(previousName);
            const endedComponent = endedComponentId
              ? historicalComponentsById.get(endedComponentId)
              : undefined;
            if (endedComponent) endedComponent.status = 'removed';
            activeComponentIdByName.delete(previousName);
            latestHistoricalComponentIdByName.delete(`${library.libraryId}:${previousName}`);
          }
        }
      }

      for (const name of [...names].sort()) {
        let componentId = activeComponentIdByName.get(name);
        if (!componentId) {
          const hasPreviousIdentity = [...historicalComponentsById.values()].some(
            (component) => component.libraryId === library.libraryId && component.name === name
          );
          componentId = hasPreviousIdentity
            ? stableId('component', `${library.libraryId}:${name}:from:${number}`)
            : stableId('component', `${library.libraryId}:${name}`);
          activeComponentIdByName.set(name, componentId);
          historicalComponentNames.add(`${library.libraryId}:${name}`);
          if (!historicalComponentsById.has(componentId)) {
            historicalComponentsById.set(componentId, {
              componentId,
              name,
              libraryId: library.libraryId,
              status: 'active',
              aliases: [],
              discoverySource: 'catalogue',
              tags: [],
              provenance: {
                source: 'catalogue',
                sourceId: `${snapshot.tagName}:${name}`,
                collectedAt: raw.collectedAt
              },
              dataQualityStatus: collectedStatus
            });
          }
        }
        componentVersions.push({
          componentVersionId: stableId('component-version', `${componentId}:${version.versionId}`),
          componentId,
          versionId: version.versionId,
          provenance: {
            source: 'catalogue',
            sourceId: `${snapshot.tagName}:${name}`,
            collectedAt: raw.collectedAt
          },
          dataQualityStatus: collectedStatus
        });
        latestHistoricalComponentIdByName.set(`${library.libraryId}:${name}`, componentId);
      }
      previousKnownNames = names;
    }
  }

  // Le catalogue peut matérialiser un composant même lorsqu'aucune issue GitHub ne le mentionne.
  for (const catalogueComponent of catalogue?.components ?? []) {
    if (!catalogueComponent.repository) continue;
    const library = libraryByRepository.get(catalogueComponent.repository);
    if (!library) continue;
    const key = `${library.libraryId}:${catalogueComponent.name}`;
    const componentId = currentComponentId(key, latestHistoricalComponentIdByName, historicalComponentNames);
    componentsByName.set(key, {
      componentId,
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
      const componentKey = `${library.libraryId}:${componentName}`;
      const componentId = currentComponentId(
        componentKey,
        latestHistoricalComponentIdByName,
        historicalComponentNames
      );
      const issueTypeRecognition = recognizeIssueType(issue.rawIssueType, rules);
      const recognizedComponentIds = issue.labels
        .filter((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()))
        .map((label) => label.slice(rules.labels.componentPrefix.length).trim())
        .filter(Boolean)
        .map((name) => {
          const key = `${library.libraryId}:${name}`;
          return currentComponentId(key, latestHistoricalComponentIdByName, historicalComponentNames);
        });
      // Transitional bridge for pre-I1 fixtures: legacy fixtures expose the
      // resolved component through RawIssue.component but do not yet carry the
      // native rawIssueType/complete I1 facts. Never use this fallback for new
      // I1 collections.
      const componentIds =
        issue.rawIssueType === undefined && recognizedComponentIds.length === 0 && issue.component
          ? [componentId]
          : recognizedComponentIds;
      const criticalities = issue.labels
        .filter((label) =>
          label.toLowerCase().startsWith(rules.labels.accessibilityCriticalityPrefix.toLowerCase())
        )
        .map((label) => label.slice(rules.labels.accessibilityCriticalityPrefix.length).trim());
      const accessibilityCategories = issue.labels
        .filter((label) =>
          label.toLowerCase().startsWith(rules.labels.accessibilityCategoryPrefix.toLowerCase())
        )
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
          const velocity =
            projectStatus.rawVelocity !== undefined
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
            ...(projectStatus.rawScheduling !== undefined
              ? { rawScheduling: projectStatus.rawScheduling }
              : {}),
            statusHistory: (projectStatus.statusHistory ?? []).map((transition) => {
              const recognition = recognizeProjectStatus(transition.status, rules);
              const previousRecognition = recognizeProjectStatus(transition.previousStatus, rules);
              return {
                ...(transition.previousStatus !== undefined
                  ? { previousRawStatus: transition.previousStatus }
                  : {}),
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
    const targetNumber =
      rawIssue?.rawIssueType !== undefined
        ? prodVersionNumber(rawIssue.milestone?.title)
        : hasKnownAuditVersion
          ? resolvedAuditVersion
          : undefined;
    const targetVersion = targetNumber
      ? versionByLibraryAndNumber.get(`${issue.libraryId}:${targetNumber}`)
      : undefined;
    // Legacy fixtures predate Version[] and keep using the configured auditVersion bridge.
    const legacyVersion = rawIssue?.rawIssueType === undefined && targetNumber ? targetNumber : undefined;
    if (!targetVersion && !legacyVersion) continue;
    const componentId = issue.componentIds[0]!;
    const auditId = stableId('audit', issue.issueId);
    const completedAt = auditCompletedAt(issue);
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
      ...(rawIssue?.auditedReleaseCandidate
        ? { auditedReleaseCandidate: rawIssue.auditedReleaseCandidate }
        : {}),
      ...(rawIssue?.auditedReleaseCandidate
        ? repositoryReleaseCandidateTag(raw, issue.libraryId, libraries, rawIssue.auditedReleaseCandidate)
        : {}),
      ...(completedAt ? { completedAt } : {}),
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
      const origin: Anomaly['origin'] =
        parentIds.length === 0
          ? 'HORS_AUDIT'
          : validParentAudits.length === 1 && parentIds.length === 1
            ? 'AUDIT'
            : 'UNDETERMINED';
      const audit = origin === 'AUDIT' ? validParentAudits[0] : undefined;
      // Le statut Project canonique prime sur CLOSED (qui peut signifier une annulation).
      const cancelledProjectStatuses = (rawIssue?.projectStatuses ?? []).filter(
        (projectStatus) =>
          rules.cancelledProjectStatuses.some(
            (cancelledStatus) =>
              cancelledStatus.trim().toLowerCase() === projectStatus.status.trim().toLowerCase()
          ) ||
          issue.projectContexts.some(
            (context) => context.projectId === projectStatus.projectId && context.status === 'CANCELLED'
          )
      );
      const isCancelled = issue.projectContexts.some((context) => context.status === 'CANCELLED');
      const currentStatuses = issue.projectContexts.map((context) => context.status);
      const businessStatus: Anomaly['status'] = isCancelled
        ? 'cancelled'
        : currentStatuses.includes('DONE')
          ? 'done'
          : currentStatuses.includes('IN_PROGRESS') || currentStatuses.includes('IN_REVIEW')
            ? 'in_progress'
            : issue.state === 'OPEN'
              ? 'open'
              : 'done';
      const legacyComponentId =
        audit?.componentId ?? (issue.componentIds.length === 1 ? issue.componentIds[0] : undefined);
      const correctedAt = businessCorrectedAt(issue);
      const doneCount = issue.projectContexts.flatMap((context) =>
        context.statusHistory.filter((transition) => transition.status === 'DONE')
      ).length;
      const estimatedAt =
        !isCancelled &&
        cancelledProjectStatuses.length === 0 &&
        issue.state === 'CLOSED' &&
        !currentStatuses.some((status) => status !== 'DONE')
          ? issue.closedAt
          : undefined;
      const effectiveCorrectedAt =
        !isCancelled && cancelledProjectStatuses.length === 0 ? (correctedAt ?? estimatedAt) : undefined;
      const correctionDateSource: Anomaly['correctionDateSource'] =
        isCancelled || !effectiveCorrectedAt
          ? 'unavailable'
          : correctedAt
            ? doneCount > 1
              ? 'last_done'
              : 'done'
            : 'issue_closed';
      anomalies.push({
        anomalyId: stableId('anomaly', issue.issueId),
        issueId: issue.issueId,
        origin,
        ...(audit ? { auditId: audit.auditId } : {}),
        ...(legacyComponentId ? { componentId: legacyComponentId } : {}),
        criticality: criticalityValue(rawIssue?.criticities[0], rules),
        categories: [...issue.accessibilityCategories],
        status: businessStatus,
        detectedAt: issue.createdAt,
        ...(correctedAt && !isCancelled ? { correctedAt } : {}),
        ...(effectiveCorrectedAt ? { effectiveCorrectedAt } : {}),
        correctionDateSource,
        createdAt: issue.createdAt,
        firstDoneAt: effectiveCorrectedAt,
        everCorrected: effectiveCorrectedAt !== undefined,
        pullRequestRefs: [...issue.linkedPullRequestIds],
        parentRefs: [...parentIds],
        provenance: { source: 'github', sourceId: issue.issueId, collectedAt: raw.collectedAt },
        dataQualityStatus: collectedStatus,
        cancelled: isCancelled || cancelledProjectStatuses.length > 0,
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
    components: mergeComponents(historicalComponentsById, componentsByName),
    issues,
    versions,
    componentVersions,
    audits,
    anomalies,
    auditImprovements,
    pullRequests
  };
}

/** Resolve the current identity without reusing an identity whose disappearance was proven. */
function currentComponentId(
  key: string,
  latestHistoricalComponentIdByName: Map<string, string>,
  historicalComponentNames: Set<string>
): string {
  return (
    latestHistoricalComponentIdByName.get(key) ??
    (historicalComponentNames.has(key) ? stableId('component', `${key}:current`) : stableId('component', key))
  );
}

/** Merge historical identities with richer current-catalogue/current-Issue metadata. */
function mergeComponents(
  historical: Map<string, Component>,
  currentByName: Map<string, Component>
): Component[] {
  const byId = new Map(historical);
  for (const component of currentByName.values()) byId.set(component.componentId, component);
  return [...byId.values()].sort(
    (left, right) =>
      left.libraryId.localeCompare(right.libraryId) ||
      left.name.localeCompare(right.name) ||
      left.componentId.localeCompare(right.componentId)
  );
}

/** Numeric comparison for strict M.m.r production versions. */
function compareProdVersions(left: string, right: string): number {
  const leftParts = left.split('.').map(Number);
  const rightParts = right.split('.').map(Number);
  for (let index = 0; index < 3; index += 1) {
    const difference = leftParts[index]! - rightParts[index]!;
    if (difference !== 0) return difference;
  }
  return 0;
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
    ...(component.documentationUrl ? { documentationUrl: component.documentationUrl } : {}),
    ...(component.audit ? { audit: component.audit } : {})
  };
}

/** Traduit une criticité GitHub en valeur normalisée. */
function criticalityValue(value: string | undefined, rules: GithubProcessingConfig): Anomaly['criticality'] {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  return (
    rules.labels.criticalityValues[normalized] ??
    (['blocking', 'major', 'minor'].includes(normalized) ? (normalized as Anomaly['criticality']) : undefined)
  );
}

/**
 * Transitional specialization bridge for pre-I1 fixtures.
 *
 * New data always derives specialization from the canonical Issue Type
 * recalculated from rawIssueType. Old fixtures do not contain rawIssueType;
 * their legacy issueType is used only to keep the migration executable until
 * those fixtures are recollected. It is deliberately not copied into Issue.
 */
/**
 * Retourne l'unique transition canonique vers DONE.
 * Zéro ou plusieurs transitions sont volontairement indéterminables (D-187/D-188).
 */
function uniqueDoneTransitionAt(issue: Issue): string | undefined {
  const doneTransitions = issue.projectContexts.flatMap((context) =>
    context.statusHistory.filter((transition) => transition.status === 'DONE')
  );
  return doneTransitions.length === 1 ? doneTransitions[0]!.transitionedAt : undefined;
}

/** Dernière entrée datée dans DONE, y compris après une réouverture (contrat KPI V3). */
function businessCorrectedAt(issue: Issue): string | undefined {
  const dates = issue.projectContexts
    .flatMap((context) => context.statusHistory)
    .filter((transition) => transition.status === 'DONE')
    .map((transition) => transition.transitionedAt)
    .filter((date) => Number.isFinite(Date.parse(date)))
    .sort((a, b) => Date.parse(a) - Date.parse(b));
  return dates.at(-1);
}

/**
 * Date de réalisation d'un Audit (D-141).
 * L'Issue doit être fermée, son état Project courant doit être DONE et l'entrée
 * dans DONE doit être déterminable sans ambiguïté.
 */
function auditCompletedAt(issue: Issue): string | undefined {
  if (issue.state !== 'CLOSED') return undefined;
  if (!issue.projectContexts.some((context) => context.status === 'DONE')) return undefined;
  return uniqueDoneTransitionAt(issue);
}

/**
 * Réalise le traitement « numeric project value » dans le pipeline de qualité.
 *
 * @param value - Valeur de « value » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function numericProjectValue(value: string | number): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/**
 * Réalise le traitement « prod version number » dans le pipeline de qualité.
 *
 * @param value - Valeur de « value » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function prodVersionNumber(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim();
  return /^\d+\.\d+\.\d+$/.test(normalized) ? normalized : undefined;
}

/**
 * Réalise le traitement « specialization issue type » dans le pipeline de qualité.
 *
 * @param issue - Valeur de « issue » utilisée par ce traitement.
 * @param rawIssue - Valeur de « rawIssue » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function specializationIssueType(
  issue: Issue,
  rawIssue: RawIssue | undefined
): CanonicalIssueType | undefined {
  if (rawIssue?.rawIssueType !== undefined) return issue.issueType;
  const legacy = rawIssue?.issueType;
  return legacy && ['EPIC', 'AUDIT', 'BUG', 'NEW_COMPONENT', 'FEATURE'].includes(legacy)
    ? (legacy as CanonicalIssueType)
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
    'BACKLOG',
    'READY',
    'IN_PROGRESS',
    'IN_REVIEW',
    'DONE',
    'BLOCKED',
    'CANCELLED'
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

/**
 * Réalise le traitement « repository release candidate tag » dans le pipeline de qualité.
 *
 * @param raw - Valeur de « raw » utilisée par ce traitement.
 * @param libraryId - Valeur de « libraryId » utilisée par ce traitement.
 * @param libraries - Valeur de « libraries » utilisée par ce traitement.
 * @param name - Valeur de « name » utilisée par ce traitement.
 * @returns Résultat du traitement.
 */
function repositoryReleaseCandidateTag(
  raw: RawDataset,
  libraryId: string,
  libraries: Library[],
  name: string
): { auditedReleaseCandidateTag: { name: string; createdAt?: string } } | Record<string, never> {
  const library = libraries.find((candidate) => candidate.libraryId === libraryId);
  if (!library) return {};
  const repository = raw.repositories.find(
    (candidate) => `${candidate.owner}/${candidate.name}` === library.repository
  );
  const tag = repository?.gitTags?.find((candidate) => candidate.name === name);
  if (!tag) return {};
  return {
    auditedReleaseCandidateTag: { name: tag.name, ...(tag.createdAt ? { createdAt: tag.createdAt } : {}) }
  };
}
