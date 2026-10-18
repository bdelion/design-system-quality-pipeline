import type { DataQualityIssue, RawDataset, RawIssue, Snapshot } from '../../src/domain/types.js';
import { normalizeGithub } from '../../src/normalizers/github.js';
import { applyComponentVersionVerdicts } from '../../src/analytics/component-versions.js';
import { calculateKpis } from '../../src/analytics/kpis.js';
import { buildSnapshot } from '../../src/snapshots/snapshot.js';
import { rules } from './consolidation.js';

export const fixtureVersion = 'dashboard-load-v1';
export type BenchmarkScenario = 'control' | 'load';
const capturedAt = '2026-09-30T00:00:00.000Z';

/** Construit une charge entièrement fictive ; seules les conventions de normalisation sont réutilisées. */
export function benchmarkSnapshot(scenario: BenchmarkScenario, seed = 81): Snapshot {
  if (!Number.isSafeInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('Graine uint32 requise');
  const load = scenario === 'load';
  if (!load && scenario !== 'control') throw new Error('Scénario inconnu');
  let state = seed >>> 0;
  /** Produit un entier pseudo-aléatoire stable, indépendant de l’horloge et de la plateforme. */
  function next(): number {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  }
  const raw: RawDataset = {
    collectedAt: capturedAt,
    nexusAvailable: false,
    catalogueComponents: [],
    repositories: []
  };
  for (let repo = 0; repo < (load ? 3 : 1); repo++) {
    const names = Array.from(
      { length: load ? (repo === 0 ? 80 : 75) : 4 },
      (_, index) => `Component${repo}_${String(index).padStart(3, '0')}`
    );
    const versions = Array.from({ length: load ? 10 : 3 }, (_, index) => `1.${index}.0`);
    const issues: RawIssue[] = Array.from({ length: load ? 600 : 24 }, (_, index) => {
      const audit = index < versions.length;
      const number = index + 1;
      const version = versions[index % versions.length]!;
      const closed = audit || index % 3 !== 0;
      const component = names[index % names.length]!;
      return {
        id: `bench-r${repo}-issue-${number}`,
        number,
        title: `Synthétique ${audit ? 'audit' : 'anomalie'} ${number} · ${next().toString(16).padStart(8, '0')}`,
        state: closed ? 'CLOSED' : 'OPEN',
        issueType: audit ? 'AUDIT' : 'BUG',
        rawIssueType: audit ? 'audit' : 'bug',
        url: `https://example.invalid/benchmark/repo-${repo}/issues/${number}`,
        labels: [`Component:${component}`, ...(audit ? [] : ['Audit', 'RGAA', 'rgaa:major', 'a11y:focus'])],
        criticities: audit ? [] : ['major'],
        parents: audit ? [] : [`bench-r${repo}-issue-${(index % versions.length) + 1}`],
        createdAt: '2026-09-01T00:00:00Z',
        ...(closed ? { closedAt: '2026-09-06T00:00:00Z' } : {}),
        linkedPullRequestIds: [],
        projectStatuses: [
          {
            projectId: `bench-project-${repo}`,
            projectName: `Projet synthétique ${repo}`,
            status: closed ? 'Done' : 'In progress',
            statusHistory: [
              { status: closed ? 'Done' : 'In progress', transitionedAt: '2026-09-05T00:00:00Z' }
            ]
          }
        ],
        milestone: {
          id: (index % versions.length) + 1,
          number: (index % versions.length) + 1,
          title: version
        },
        ...(audit ? { auditedReleaseCandidate: `${version}-rc.1` } : {})
      };
    });
    const pullRequests = Array.from({ length: load ? 500 : 18 }, (_, index) => {
      const id = `bench-r${repo}-pr-${index}`;
      const issue = issues[index % issues.length]!;
      issue.linkedPullRequestIds.push(id);
      return {
        id,
        number: issues.length + index + 1,
        state: 'MERGED' as const,
        mergedAt: '2026-09-04T00:00:00Z',
        relatedIssueIds: [issue.id]
      };
    });
    raw.repositories.push({
      id: `bench-repo-${repo}`,
      owner: 'benchmark',
      name: `repo-${repo}`,
      defaultBranch: 'main',
      issues,
      pullRequests,
      gitTags: versions.map((name) => ({ name, createdAt: '2026-09-03T00:00:00Z' })),
      historicalCatalogues: versions.map((tagName) => ({
        tagName,
        status: 'available',
        componentNames: names
      }))
    });
  }
  const data = normalizeGithub(raw, rules, undefined, fixtureVersion, 'https://example.invalid');
  applyComponentVersionVerdicts(data);
  // Diagnostics de charge explicitement artificiels : aucun constat de qualité sur des données réelles.
  const diagnostics: DataQualityIssue[] = Array.from({ length: load ? 3000 : 30 }, (_, index) => ({
    id: `bench-diagnostic-${index}`,
    ruleId: 'BENCH-SYNTHETIC',
    severity: index % 3 === 0 ? 'ERROR' : 'WARNING',
    action: 'include',
    entityType: 'Issue',
    entityId: data.issues![index % data.issues!.length]!.issueId,
    message: `Diagnostic synthétique de charge ${index}`,
    detectedAt: capturedAt,
    impacts: []
  }));
  const snapshot = buildSnapshot(
    raw,
    data,
    diagnostics,
    calculateKpis(data, diagnostics),
    fixtureVersion,
    fixtureVersion,
    `benchmark-${scenario}-${seed}`,
    capturedAt
  );
  // L'identité aléatoire de production est remplacée uniquement dans ce générateur de test.
  snapshot.snapshotId = `${fixtureVersion}-${scenario}-${seed}`;
  return snapshot;
}

/** Expose les volumes effectivement obtenus, plutôt que les seuls volumes demandés. */
export function benchmarkCounts(snapshot: Snapshot) {
  return {
    repositories: snapshot.rawData.repositories.length,
    issues: snapshot.normalizedData.issues?.length ?? 0,
    pullRequests: snapshot.normalizedData.pullRequests.length,
    componentVersions: snapshot.normalizedData.componentVersions?.length ?? 0,
    diagnostics: snapshot.dataQuality.issues.length
  };
}
