/**
 * @module normalizers.github
 * Transforme les faits GitHub en entités métier normalisées et traçables.
 * @remarks Documentation des contrats et responsabilités du module.
 */

import { isFutureVersion, milestoneVersionNumber } from '../domain/version-scope.js';
import { stableId } from '../lib/ids.js';
import { validateMilestoneDetection, type GithubProcessingConfig } from '../config.js';
import { issueBusinessState, currentProjectStatus, lastDoneAt } from '../domain/business.js';
import type { Catalogue, CatalogueComponent } from '../catalogue.js';
import {
  historicalRepository,
  validateHistoricalComponents,
  type HistoricalComponentCatalogue
} from '../historical-components.js';
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
 * évaluées par la couche Data Quality. Le package borne les versions et populations
 * accessibilité ; l’activité des issues futures reste conservée.
 * Les stratégies d’audit explicites sont prioritaires sur les anciennes inférences de type.
 *
 * @param raw - Données collectées, incluant les repositories et leurs événements.
 * @param rules - Règles de correspondance et de spécialisation GitHub.
 * @param catalogue - Catalogue de composants éventuellement fourni.
 * @param auditVersion - Version des règles d'audit utilisée pour la provenance.
 * @param githubUrl - Base web capturée, utilisée uniquement en l’absence d’une URL source.
 * @param historicalComponents - Preuves locales de présence et d'identité, sans publication implicite.
 * @returns Données métier normalisées, prêtes pour les contrôles et les KPI.
 */
export function normalizeGithub(
  raw: RawDataset,
  rules: GithubProcessingConfig,
  catalogue?: Catalogue,
  auditVersion?: string,
  githubUrl = 'https://github.com',
  historicalComponents: HistoricalComponentCatalogue[] = []
): NormalizedData {
  validateMilestoneDetection(rules.milestoneDetection);
  const localHistories = new Map(
    historicalComponents.map((input) => {
      const history = validateHistoricalComponents(input);
      return [historicalRepository(history, raw), history] as const;
    })
  );
  if (localHistories.size !== historicalComponents.length)
    throw new Error('Plusieurs historiques pour le même dépôt.');
  const libraries: Library[] = raw.repositories.map((repository) => ({
    libraryId: stableId('lib', repository.name),
    name: repository.name,
    repository: `${repository.owner}/${repository.name}`,
    defaultBranch: repository.defaultBranch,
    ...(repository.packageManifest ? { packageManifest: { ...repository.packageManifest } } : {}),
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

  const allowLegacyAudit = rules.auditDetection?.allowLegacyIssueTypes !== false;
  const futureAuditIssueIds = new Set(
    raw.repositories.flatMap((repository) =>
      repository.issues
        .filter(
          (issue) =>
            (isFutureVersion(
              milestoneVersionNumber(issue.milestone?.title, rules),
              repository.packageManifest
            ) ||
              (issue.rawIssueType === undefined &&
                allowLegacyAudit &&
                issue.issueType === 'AUDIT' &&
                isFutureVersion(resolvedAuditVersion, repository.packageManifest))) &&
            ((allowLegacyAudit &&
              (recognizeIssueType(issue.rawIssueType, rules).issueType === 'AUDIT' ||
                (issue.rawIssueType === undefined && issue.issueType === 'AUDIT'))) ||
              configuredAuditIssue(
                issue,
                rules,
                issue.labels.filter((label) =>
                  label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase())
                ).length
              ))
        )
        .map((issue) => issue.id)
    )
  );
  const futureIssueIds = new Set(
    raw.repositories.flatMap((repository) =>
      repository.issues
        .filter(
          (issue) =>
            isFutureVersion(
              milestoneVersionNumber(issue.milestone?.title, rules),
              repository.packageManifest
            ) ||
            futureAuditIssueIds.has(issue.id) ||
            (issue.parents.length === 1 && futureAuditIssueIds.has(issue.parents[0]!))
        )
        .map((issue) => issue.id)
    )
  );
  const manifestByLibrary = new Map(libraries.map((library) => [library.libraryId, library.packageManifest]));
  const versionByLibraryAndNumber = new Map<string, Version>();
  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(repository.name)!;
    const milestoneIdsByVersion = new Map<string, Set<string>>();
    for (const issue of repository.issues) {
      const number = milestoneVersionNumber(issue.milestone?.title, rules);
      if (!number || !issue.milestone || isFutureVersion(number, repository.packageManifest)) continue;
      const milestoneIds = milestoneIdsByVersion.get(number) ?? new Set<string>();
      milestoneIds.add(String(issue.milestone.id));
      milestoneIdsByVersion.set(number, milestoneIds);
    }
    const tagByVersion = new Map(
      (repository.gitTags ?? [])
        .filter((tag) => !isFutureVersion(tag.name, repository.packageManifest))
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
      const localHistory = localHistories.get(repository.name);
      const localNames = new Set(
        localHistory?.components.flatMap((c) => [c.name, ...c.history.map((h) => h.historicalName)]) ?? []
      );
      const names = new Set(snapshot.componentNames.filter((name) => !localNames.has(name)));

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
              status: 'unknown',
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

  // Les preuves locales complètent les faits GitHub ; elles ne créent jamais de tag PROD.
  for (const [repositoryName, history] of localHistories) {
    const library = libraryByRepository.get(repositoryName)!;
    for (const component of history.components) {
      const latest = component.history
        .filter((h) => !isFutureVersion(h.version, library.packageManifest))
        .at(-1);
      for (const observation of component.history) {
        if (
          !observation.present ||
          !observation.identity ||
          isFutureVersion(observation.version, library.packageManifest)
        )
          continue;
        const componentId = stableId('component', `${library.libraryId}:historical:${observation.identity}`);
        const key = `${library.libraryId}:${component.name}`;
        historicalComponentNames.add(key);
        if (latest?.present && latest.identity === observation.identity)
          latestHistoricalComponentIdByName.set(key, componentId);
        const provenance = {
          source: 'catalogue' as const,
          sourceId: `local-history:${observation.version}:${observation.evidence.map((e) => e.cell).join(',')}`,
          collectedAt: raw.collectedAt
        };
        if (!historicalComponentsById.has(componentId))
          historicalComponentsById.set(componentId, {
            componentId,
            libraryId: library.libraryId,
            name: component.name,
            status: latest?.present && latest.identity === observation.identity ? 'active' : 'removed',
            aliases: [
              ...new Set(
                component.history
                  .filter((h) => h.identity === observation.identity)
                  .map((h) => h.historicalName)
              )
            ].filter((name) => name !== component.name),
            discoverySource: 'catalogue',
            tags: [],
            provenance,
            dataQualityStatus: 'reliable'
          });
        let version = versionByLibraryAndNumber.get(`${library.libraryId}:${observation.version}`);
        if (!version) {
          version = {
            versionId: stableId('version', `${library.libraryId}:${observation.version}`),
            libraryId: library.libraryId,
            number: observation.version,
            channel: observation.channel,
            provenance,
            dataQualityStatus: 'partial'
          };
          versions.push(version);
          versionByLibraryAndNumber.set(`${library.libraryId}:${observation.version}`, version);
        }
        version.channel = version.prodTag ? 'release' : observation.channel;
        componentVersions.push({
          componentVersionId: stableId('component-version', `${componentId}:${version.versionId}`),
          componentId,
          versionId: version.versionId,
          provenance,
          dataQualityStatus: 'reliable'
        });
      }
    }
  }

  /** Résout un nom sur sa version cible ; l'ambiguïté ou l'absence ne devient pas l'identité courante. */
  function resolveIssueComponent(repositoryName: string, name: string, issue: RawIssue): string | undefined {
    const library = libraryByRepository.get(repositoryName)!;
    const history = localHistories.get(repositoryName);
    const candidates = history?.components.filter(
      (c) => c.name === name || c.history.some((h) => h.historicalName === name)
    );
    if (!candidates?.length)
      return currentComponentId(
        `${library.libraryId}:${name}`,
        latestHistoricalComponentIdByName,
        historicalComponentNames
      );
    const repository = raw.repositories.find((r) => r.name === repositoryName)!;
    const parent =
      issue.parents.length === 1 ? repository.issues.find((i) => i.id === issue.parents[0]) : undefined;
    const target =
      milestoneVersionNumber(issue.milestone?.title, rules) ??
      milestoneVersionNumber(parent?.milestone?.title, rules);
    const observations = candidates.flatMap((c) =>
      c.history.filter(
        (h) =>
          h.present &&
          h.identity &&
          !isFutureVersion(h.version, library.packageManifest) &&
          (target ? h.version === target && (h.historicalName === name || c.name === name) : true)
      )
    );
    const identities = [...new Set(observations.map((h) => h.identity!))];
    return identities.length === 1
      ? stableId('component', `${library.libraryId}:historical:${identities[0]!}`)
      : undefined;
  }

  // Le catalogue peut matérialiser un composant même lorsqu'aucune issue GitHub ne le mentionne.
  for (const catalogueComponent of catalogue?.components ?? []) {
    if (!catalogueComponent.repository) continue;
    const library = libraryByRepository.get(catalogueComponent.repository);
    if (!library) continue;
    const key = `${library.libraryId}:${catalogueComponent.name}`;
    if (
      localHistories
        .get(catalogueComponent.repository)
        ?.components.some((c) => c.name === catalogueComponent.name) &&
      !latestHistoricalComponentIdByName.has(key)
    )
      continue;
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
    const currentComponentNames = new Set(
      repository.issues
        .filter((issue) => !futureIssueIds.has(issue.id))
        .flatMap((issue) => [
          ...issue.labels
            .filter((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()))
            .map((label) => label.slice(rules.labels.componentPrefix.length).trim()),
          ...(issue.rawIssueType === undefined && issue.component ? [issue.component] : [])
        ])
    );
    /** Conserve les composants dont la présence est attestée indépendamment de cette issue future. */
    const knownComponent = (name: string): boolean =>
      currentComponentNames.has(name) ||
      componentsByName.has(`${library.libraryId}:${name}`) ||
      latestHistoricalComponentIdByName.has(`${library.libraryId}:${name}`);
    for (const issue of repository.issues) {
      const futureVersion = futureIssueIds.has(issue.id);
      const componentNames = [
        ...new Set([
          ...issue.labels
            .filter((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()))
            .map((label) => label.slice(rules.labels.componentPrefix.length).trim())
            .filter(Boolean),
          ...(issue.rawIssueType === undefined && issue.component ? [issue.component] : [])
        ])
      ].filter((name) => !futureVersion || knownComponent(name));
      const componentName = componentNames[0] ?? '';
      const componentId = resolveIssueComponent(repository.name, componentName, issue);
      const issueTypeRecognition = recognizeIssueType(issue.rawIssueType, rules);
      const recognizedComponentIds = issue.labels
        .filter((label) => label.toLowerCase().startsWith(rules.labels.componentPrefix.toLowerCase()))
        .map((label) => label.slice(rules.labels.componentPrefix.length).trim())
        .filter(Boolean)
        .filter((name) => !futureVersion || knownComponent(name))
        .map((name) => {
          return resolveIssueComponent(repository.name, name, issue);
        })
        .filter((id): id is string => id !== undefined);
      // Transitional bridge for pre-I1 fixtures: legacy fixtures expose the
      // resolved component through RawIssue.component but do not yet carry the
      // native rawIssueType/complete I1 facts. Never use this fallback for new
      // I1 collections.
      const componentIds =
        issue.rawIssueType === undefined &&
        recognizedComponentIds.length === 0 &&
        issue.component &&
        componentNames.length > 0
          ? componentId
            ? [componentId]
            : []
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
        ...(futureVersion ? { futureVersion: true } : {}),
        repositoryId: repository.id,
        libraryId: library.libraryId,
        number: issue.number,
        title: issue.title,
        url:
          issue.url ??
          `${githubUrl.replace(/\/+$/, '')}/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/issues/${issue.number}`,
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
          // La dernière transition datée fait foi ; une valeur non reconnue reste inconnue.
          const latestTransition = (projectStatus.statusHistory ?? [])
            .filter((transition) => Number.isFinite(Date.parse(transition.transitionedAt)))
            .sort((a, b) => Date.parse(a.transitionedAt) - Date.parse(b.transitionedAt))
            .at(-1);
          const latestRecognition = latestTransition
            ? recognizeProjectStatus(latestTransition.status, rules)
            : undefined;
          const currentRecognition = latestRecognition ?? statusRecognition;
          return {
            projectId: projectStatus.projectId,
            projectName: projectStatus.projectName,
            rawStatus: projectStatus.status,
            ...(currentRecognition.status ? { status: currentRecognition.status } : {}),
            ...(currentRecognition.candidateStatuses.length > 1
              ? { candidateStatuses: currentRecognition.candidateStatuses }
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
      for (const name of componentNames) {
        if (
          localHistories
            .get(repository.name)
            ?.components.some((c) => c.name === name || c.history.some((h) => h.historicalName === name))
        )
          continue;
        const key = `${library.libraryId}:${name}`;
        if (componentsByName.has(key)) continue;
        const catalogueComponent = catalogueByRepositoryAndName.get(`${repository.name}:${name}`);
        const inCatalogue = Boolean(catalogueComponent) || raw.catalogueComponents.includes(name);
        componentsByName.set(key, {
          componentId: currentComponentId(key, latestHistoricalComponentIdByName, historicalComponentNames),
          name,
          libraryId: library.libraryId,
          status: catalogueComponent
            ? catalogueComponent.status === 'stable'
              ? 'active'
              : catalogueComponent.status
            : 'unknown',
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
    if (issue.futureVersion) continue;
    const rawIssue = rawIssueById.get(issue.issueId);
    const legacyAudit = allowLegacyAudit && specializationIssueType(issue, rawIssue) === 'AUDIT';
    const configuredAudit = rawIssue
      ? configuredAuditIssue(rawIssue, rules, issue.componentIds.length)
      : false;
    if ((!legacyAudit && !configuredAudit) || issue.componentIds.length !== 1) continue;
    const targetNumber =
      rawIssue?.rawIssueType !== undefined
        ? milestoneVersionNumber(rawIssue.milestone?.title, rules)
        : hasKnownAuditVersion
          ? resolvedAuditVersion
          : undefined;
    if (isFutureVersion(targetNumber, manifestByLibrary.get(issue.libraryId))) continue;
    const targetVersion = targetNumber
      ? versionByLibraryAndNumber.get(`${issue.libraryId}:${targetNumber}`)
      : undefined;
    // Legacy fixtures predate Version[] and keep using the configured auditVersion bridge.
    const legacyVersion = rawIssue?.rawIssueType === undefined && targetNumber ? targetNumber : undefined;
    if (!targetVersion && !legacyVersion) continue;
    const componentId = issue.componentIds[0]!;
    const auditId = stableId('audit', issue.issueId);
    const completedAt = auditCompletedAt(issue);
    const businessState = issueBusinessState(issue);
    const lifecycle =
      businessState === 'cancelled'
        ? 'cancelled'
        : businessState === 'treated'
          ? 'completed'
          : issue.projectContexts.some((context) =>
                ['IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DONE'].includes(currentProjectStatus(context) ?? '')
              )
            ? 'ongoing'
            : 'pending';
    const declaredResult = rawIssue?.auditResult;
    const result =
      lifecycle === 'completed'
        ? declaredResult && ['conform', 'non_conform', 'conditional', 'critical'].includes(declaredResult)
          ? declaredResult
          : 'conform'
        : lifecycle === 'ongoing'
          ? 'in_progress'
          : 'not_evaluated';
    const audit: Audit = {
      auditId,
      issueId: issue.issueId,
      libraryId: issue.libraryId,
      componentId,
      ...(targetVersion ? { versionId: targetVersion.versionId } : {}),
      version: targetVersion?.number ?? legacyVersion!,
      status: lifecycle === 'cancelled' ? 'cancelled' : result,
      lifecycle,
      sourceIssueId: issue.issueId,
      objectiveAuditResult: result,
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
    if (issue.futureVersion) continue;
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
      const isCancelled = issueBusinessState(issue) === 'cancelled';
      const currentStatuses = issue.projectContexts.map(currentProjectStatus);
      const businessStatus: Anomaly['status'] = isCancelled
        ? 'cancelled'
        : issueBusinessState(issue) === 'treated'
          ? 'done'
          : currentStatuses.includes('IN_PROGRESS') || currentStatuses.includes('IN_REVIEW')
            ? 'in_progress'
            : lastDoneAt(issue)
              ? 'reopened'
              : 'open';
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
        currentStatuses.length > 0 &&
        currentStatuses.every((status) => status === 'DONE')
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

  // Les anomalies explicitement liées affectent le résultat, même après correction.
  for (const audit of audits) {
    if (audit.lifecycle !== 'completed') continue;
    if (anomalies.some((anomaly) => anomaly.auditId === audit.auditId)) {
      if (audit.objectiveAuditResult === 'conform') audit.objectiveAuditResult = 'non_conform';
    }
    audit.status = audit.objectiveAuditResult;
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

/** Résout l’identité courante sans réutiliser celle dont la disparition a été prouvée. */
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

/** Fusionne les identités historiques avec les métadonnées du catalogue et des issues courantes. */
function mergeComponents(
  historical: Map<string, Component>,
  currentByName: Map<string, Component>
): Component[] {
  const byId = new Map(historical);
  for (const component of currentByName.values()) {
    const previous = historical.get(component.componentId);
    byId.set(
      component.componentId,
      previous?.provenance.sourceId?.startsWith('local-history:')
        ? {
            ...component,
            status: previous.status,
            aliases: previous.aliases,
            provenance: previous.provenance
          }
        : component
    );
  }
  return [...byId.values()].sort(
    (left, right) =>
      left.libraryId.localeCompare(right.libraryId) ||
      left.name.localeCompare(right.name) ||
      left.componentId.localeCompare(right.componentId)
  );
}

/** Compare numériquement les versions PROD au format strict M.m.r. */
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
/** Dernière entrée datée dans DONE, y compris après une réouverture (contrat KPI V3). */
function businessCorrectedAt(issue: Issue): string | undefined {
  return lastDoneAt(issue);
}

/**
 * Date d'achèvement d'un audit : dernière transition chronologique valide.
 * Une issue fermée n'est terminée que si le dernier état Project est DONE.
 * Aucune date de clôture GitHub n'est inventée en absence d'historique.
 */
function auditCompletedAt(issue: Issue): string | undefined {
  return issueBusinessState(issue) === 'treated' ? lastDoneAt(issue) : undefined;
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

/** Reconnaît les stratégies d'audit configurées avec leurs labels et cardinalité de composant. */
function configuredAuditIssue(
  issue: RawIssue,
  rules: GithubProcessingConfig,
  componentCount: number
): boolean {
  return (
    rules.auditDetection?.strategies.some(
      (strategy) =>
        strategy.issueTypes.some((type) => type.toLowerCase() === (issue.rawIssueType ?? '').toLowerCase()) &&
        (strategy.requiredLabels ?? []).every((label) =>
          issue.labels.some((actual) => actual.toLowerCase() === label.toLowerCase())
        ) &&
        (!strategy.requireComponent || componentCount === 1)
    ) ?? false
  );
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
