/** Populations et agrégats pré-calculés communs aux espaces métier du dashboard. */
import type { NormalizedData, DataQualityIssue } from '../domain/types.js';
import { projectIssueFacts, type IssueFact } from './issues.js';
import {
  accessibilityQualification,
  type AccessibilityRecognition,
  type AccessibilityQualification
} from '../domain/accessibility.js';
import { durationStatistics } from './statistics.js';

/** Défaut distinct avec qualification, origine et dimensions de filtrage. */
export interface AccessibilityRow extends IssueFact {
  qualification: AccessibilityQualification;
  criticality: string;
  categories: string[];
  origin: string;
}
/** Résultats calculés pour un périmètre précis, avec dénominateurs visibles. */
export interface WorkspaceSummary {
  declared: number;
  treated: number;
  cancelled: number;
  remaining: number;
  qualified: number;
  presumed: number;
  unqualified: number;
  treatmentRate: number | null;
  average: number | null;
  median: number | null;
  p90: number | null;
  measured: number;
  estimated: number;
  actual: number;
  components: number;
  covered: number;
  conform: number;
  nonConform: number;
  nonCovered: number;
  unknown: number;
  coverage: number | null;
  conformity: number | null;
  criticalities: Record<string, { declared: number; treated: number; average: number | null; count: number }>;
  categories: Record<string, number>;
  byComponent: Record<string, number>;
  sourceIds: string[];
  qualityIssues: number;
}
/** Contrat additif : les anciens snapshots sont projetés sans être réécrits. */
export interface WorkspaceAnalytics {
  version: 1;
  available: boolean;
  rows: AccessibilityRow[];
  review: AccessibilityRow[];
  scopes: { repository: string; component: string; version: string; summary: WorkspaceSummary }[];
}

/** Construit les populations sans assimiler un BUG générique à une anomalie d'accessibilité. */
export function workspaceAnalytics(
  data: NormalizedData,
  quality: readonly DataQualityIssue[] = [],
  recognition: AccessibilityRecognition = {}
): WorkspaceAnalytics {
  const facts = projectIssueFacts(data, quality, recognition);
  const issueById = new Map((data.issues ?? []).map((issue) => [issue.issueId, issue]));
  const versionById = new Map((data.versions ?? []).map((version) => [version.versionId, version]));
  const componentById = new Map(data.components.map((component) => [component.componentId, component]));
  const repositoryById = new Map(data.libraries.map((library) => [library.libraryId, library.repository]));
  const currentVersions = new Map<string, string>();
  for (const version of data.versions ?? []) {
    const previous = versionById.get(currentVersions.get(version.libraryId) ?? '');
    if (!previous || version.number.localeCompare(previous.number, 'en', { numeric: true }) > 0)
      currentVersions.set(version.libraryId, version.versionId);
  }
  const distinctAnomalies = [
    ...new Map(data.anomalies.map((anomaly) => [anomaly.issueId, anomaly])).values()
  ];
  const rows: AccessibilityRow[] = distinctAnomalies.flatMap((anomaly) => {
    const fact = facts.find((item) => item.id === anomaly.issueId);
    if (!fact) return [];
    const issue = issueById.get(anomaly.issueId)!;
    const tokens = recognition.repositories?.[fact.repo] ?? recognition.labelAllOf ?? ['audit', 'rgaa'];
    const qualification = accessibilityQualification(
      issue.labels,
      issue.accessibilityCategories,
      issue.criticalities,
      anomaly.origin === 'AUDIT' &&
        Boolean(anomaly.auditId && data.audits.some((audit) => audit.auditId === anomaly.auditId)),
      tokens
    );
    if (
      quality.some(
        (diagnostic) =>
          [anomaly.anomalyId, issue.issueId].includes(diagnostic.entityId) &&
          diagnostic.impacts.some(
            (impact) => impact.action === 'exclude' && impact.metricId.startsWith('anomaly.correctionDelay.')
          )
      )
    ) {
      fact.delay = null;
      fact.source = 'unavailable';
    }
    const applicable = (data.componentVersions ?? []).filter(
      (relation) => anomaly.auditId && relation.applicableAuditIds?.includes(anomaly.auditId)
    );
    return [
      {
        ...fact,
        qualification,
        criticality: anomaly.criticality ?? 'unknown',
        categories: anomaly.categories,
        origin: anomaly.origin,
        versionIds: [...new Set([...fact.versionIds, ...applicable.map((relation) => relation.versionId)])],
        versions: [
          ...new Set([
            ...fact.versions,
            ...applicable.flatMap((relation) => versionById.get(relation.versionId)?.number ?? [])
          ])
        ]
      }
    ];
  });
  const contexts = new Map<string, { repository: string; component: string; version: string }>();
  /** Enregistre uniquement les intersections réellement présentes et leurs agrégations partielles. */
  function register(repository: string, components: string[], versions: string[]): void {
    for (const repo of ['', repository])
      for (const component of [
        '',
        ...components,
        ...components.map((id) => componentById.get(id)?.name ?? id)
      ])
        for (const version of ['', ...versions, ...versions.map((id) => versionById.get(id)?.number ?? id)]) {
          const context = { repository: repo, component, version };
          contexts.set(JSON.stringify(context), context);
        }
  }
  register('', [], []);
  for (const library of data.libraries) register(library.repository, [], []);
  for (const component of data.components)
    register(repositoryById.get(component.libraryId) ?? '', [component.componentId], []);
  for (const row of rows) register(row.repo, row.componentIds, row.versionIds);
  for (const relation of data.componentVersions ?? [])
    register(
      repositoryById.get(componentById.get(relation.componentId)?.libraryId ?? '') ?? '',
      [relation.componentId],
      [relation.versionId]
    );
  const scopes = [...contexts.values()].map((context) => {
    const selected = rows.filter(
      (row) =>
        (!context.repository || row.repo === context.repository) &&
        (!context.component ||
          row.componentIds.includes(context.component) ||
          row.components.includes(context.component)) &&
        (!context.version ||
          row.versionIds.includes(context.version) ||
          row.versions.includes(context.version))
    );
    const population = selected.filter((row) => row.qualification.status !== 'unqualified');
    const active = population.filter((row) => row.status !== 'cancelled');
    const treated = active.filter((row) => row.status === 'closed');
    const stats = durationStatistics(treated);
    const components = data.components.filter(
      (component) =>
        (Boolean(context.version) || component.status !== 'removed') &&
        (!context.component ||
          component.componentId === context.component ||
          component.name === context.component) &&
        (!context.repository || repositoryById.get(component.libraryId) === context.repository)
    );
    const relations = (data.componentVersions ?? []).filter(
      (relation) =>
        components.some((component) => component.componentId === relation.componentId) &&
        (context.version
          ? relation.versionId === context.version ||
            versionById.get(relation.versionId)?.number === context.version
          : relation.versionId ===
            currentVersions.get(componentById.get(relation.componentId)?.libraryId ?? ''))
    );
    const conform = relations.filter((relation) => relation.verdict === 'CONFORME').length;
    const nonConform = relations.filter((relation) => relation.verdict === 'NON_CONFORME').length;
    const nonCovered = relations.filter((relation) => relation.verdict === 'NON_COUVERT').length;
    const unknown = context.version
      ? relations.filter((relation) => !relation.verdict).length
      : components.filter(
          (component) => !relations.some((relation) => relation.componentId === component.componentId)
        ).length + relations.filter((relation) => !relation.verdict).length;
    const componentCount = context.version ? relations.length : components.length;
    const criticalities = Object.fromEntries(
      ['blocking', 'major', 'minor', 'unknown'].map((key) => {
        const declared = active.filter((row) => row.criticality === key);
        const done = declared.filter((row) => row.status === 'closed');
        const statistic = durationStatistics(done).global;
        return [
          key,
          {
            declared: declared.length,
            treated: done.length,
            average: statistic.average ?? null,
            count: statistic.count
          }
        ];
      })
    );
    const categories: Record<string, number> = {},
      byComponent: Record<string, number> = {};
    for (const row of active) {
      for (const category of new Set(row.categories)) categories[category] = (categories[category] ?? 0) + 1;
      for (const component of new Set(row.components))
        byComponent[component] = (byComponent[component] ?? 0) + 1;
    }
    const relevantIds = new Set([
      ...data.libraries
        .filter(
          (library) =>
            (!context.repository || library.repository === context.repository) &&
            (!context.component ||
              components.some((component) => component.libraryId === library.libraryId)) &&
            (!context.version ||
              (data.versions ?? []).some(
                (version) =>
                  version.libraryId === library.libraryId &&
                  (version.versionId === context.version || version.number === context.version)
              ))
        )
        .map((library) => library.libraryId),
      ...selected.map((row) => row.id),
      ...selected.flatMap((row) => row.anomalyIds),
      ...relations.map((relation) => relation.componentVersionId)
    ]);
    const summary: WorkspaceSummary = {
      declared: active.length,
      treated: treated.length,
      cancelled: population.filter((row) => row.status === 'cancelled').length,
      remaining: active.length - treated.length,
      qualified: population.filter((row) => row.qualification.status === 'qualified').length,
      presumed: population.filter((row) => row.qualification.status === 'presumed').length,
      unqualified: selected.filter((row) => row.qualification.status === 'unqualified').length,
      treatmentRate: active.length ? (treated.length * 100) / active.length : null,
      average: stats.global.average ?? null,
      median: stats.global.median ?? null,
      p90: stats.global.p90 ?? null,
      measured: stats.global.count,
      estimated: stats.estimated.count,
      actual: stats.done.count,
      components: componentCount,
      covered: conform + nonConform,
      conform,
      nonConform,
      nonCovered,
      unknown,
      coverage: componentCount && !unknown ? ((conform + nonConform) * 100) / componentCount : null,
      conformity: conform + nonConform ? (conform * 100) / (conform + nonConform) : null,
      criticalities,
      categories,
      byComponent,
      sourceIds: active.map((row) => row.id),
      qualityIssues: quality.filter((item) => relevantIds.has(item.entityId)).length
    };
    return { ...context, summary };
  });
  return {
    version: 1,
    available: data.issues !== undefined,
    rows,
    scopes,
    review: rows.filter(
      (row) =>
        row.qualification.status !== 'unqualified' &&
        !row.qualification.reasons.includes('label Audit + RGAA')
    )
  };
}
/** Convertit la liste de revue en CSV UTF-8, sans modifier ses qualifications ou ses relations. */
export function accessibilityReviewCsv(rows: readonly AccessibilityRow[]): string {
  /** Protège les champs textuels contre l'interprétation en formule par les tableurs. */
  function cell(value: unknown): string {
    const text = String(value ?? '');
    const safe = /^\s*[=+@-]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  }
  return (
    '\ufeff' +
    [
      [
        'Repository',
        'Issue',
        'Titre',
        'URL',
        'Labels',
        'Qualification',
        'Motifs',
        'Criticité',
        'Catégories',
        'Composants',
        'Audits explicites',
        'Origine',
        'État'
      ],
      ...rows.map((row) => [
        row.repo,
        row.number,
        row.title,
        row.url,
        row.labels.join(' | '),
        row.qualification.status,
        row.qualification.reasons.join(' | '),
        row.criticality,
        row.categories.join(' | '),
        row.components.join(' | '),
        row.auditIds.join(' | '),
        row.origin,
        row.status
      ])
    ]
      .map((row) => row.map(cell).join(';'))
      .join('\r\n') +
    '\r\n'
  );
}
