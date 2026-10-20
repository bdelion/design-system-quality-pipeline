import { describe, expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import { rules as legacyRules } from './support/consolidation.js';
const rules = { ...legacyRules, issuePolicy: {} };
import type { RawDataset, RawIssue } from '../src/domain/types.js';
import { repositoryActivity } from '../src/analytics/repository-activity.js';
import { calculateKpis } from '../src/analytics/kpis.js';
import { workspaceAnalytics } from '../src/analytics/workspaces.js';

/** Produit une issue minimale avec des preuves indépendantes du statut GitHub. */
function issue(
  id: string,
  type: 'AUDIT' | 'BUG' | 'FEATURE',
  labels: string[],
  status = 'Done',
  parents: string[] = []
): RawIssue {
  return {
    id,
    number: Number(id.replace(/\D/g, '')) || 1,
    title: id,
    state: 'CLOSED',
    issueType: type,
    rawIssueType: type.toLowerCase(),
    labels,
    criticities: [],
    parents,
    createdAt: '2026-01-01T00:00:00Z',
    closedAt: '2026-02-01T00:00:00Z',
    linkedPullRequestIds: [],
    projectStatuses: [
      {
        projectId: 'p',
        projectName: 'P',
        status,
        statusHistory: [{ status, transitionedAt: '2026-02-01T00:00:00Z' }]
      }
    ],
    milestone: { id: 1, number: 1, title: '1.7.1' }
  };
}

/** Capture locale : le package 1.8.0 ne borne pas la milestone de correction d’un BUG. */
function dataset(issues: RawIssue[]): RawDataset {
  return {
    collectedAt: '2026-03-01T00:00:00Z',
    catalogueComponents: [],
    nexusAvailable: false,
    repositories: [
      {
        id: 'r',
        name: 'react',
        owner: 'test',
        defaultBranch: 'main',
        packageManifest: { status: 'available', version: '1.8.0' },
        issues,
        pullRequests: [
          { id: 'pr', number: 1, state: 'MERGED', mergedAt: '2026-01-30T00:00:00Z', relatedIssueIds: [] }
        ]
      }
    ]
  };
}

describe('Régressions validées sur les attendus métier', () => {
  it('respecte la désactivation explicite des marqueurs d’accessibilité', () => {
    const bug = issue('bug1', 'BUG', ['Component:Table', 'rgaa:major', 'bug:functional']);
    const data = normalizeGithub(dataset([bug]), {
      ...rules,
      issuePolicy: { classification: { accessibility: { labels: [], prefixes: [] } } }
    });
    expect(data.issues![0]!.review?.kinds).toEqual(['functional']);
    expect(workspaceAnalytics(data).rows[0]!.qualification.status).toBe('unqualified');
  });
  it('conserve un BUG prévu en 1.9.0, rattache chaque composant depuis ses labels et compte les occurrences', () => {
    const audit = issue('audit1', 'AUDIT', ['Component:Table']);
    const bug = issue('bug2', 'BUG', ['Component:Table', 'InputPagination', 'rgaa:major'], 'Ready', [
      'audit1'
    ]);
    bug.milestone!.title = '1.9.0';
    const normalized = normalizeGithub(
      dataset([audit, bug]),
      { ...rules, issuePolicy: { componentLabels: { InputPagination: 'InputPagination' } } },
      undefined,
      '1.7.1'
    );
    expect(normalized.anomalies).toHaveLength(1);
    expect(normalized.issues!.find((item) => item.issueId === 'bug2')!.componentIds).toHaveLength(2);
    expect(repositoryActivity(normalized)[0]!.anomalies).toBe(2);
    expect(calculateKpis(normalized, []).metrics['anomaly.total']!.value).toBe(2);
    expect(normalized.issues!.find((item) => item.issueId === 'bug2')!.review?.correctionVersion).toBe(
      '1.9.0'
    );
  });

  it('exige Done et une PR liée fusionnée, et ne confond pas annulation et correction', () => {
    const withoutPr = issue('bug1', 'BUG', ['Component:Table', 'rgaa:major']);
    const corrected = issue('bug2', 'BUG', ['Component:Table', 'rgaa:major']);
    corrected.linkedPullRequestIds = ['pr'];
    const cancelled = issue('bug3', 'BUG', ['Component:Table', 'resolution:invalid'], 'Cancelled');
    const normalized = normalizeGithub(dataset([withoutPr, corrected, cancelled]), rules);
    expect(normalized.issues!.map((item) => item.review?.correctionConfirmed)).toEqual([false, true, false]);
    expect(normalized.issues![2]!.review?.neutralized).toBe(true);
  });

  it('ne déduit pas le composant depuis un audit et conserve les améliorations séparément', () => {
    const audit = issue('audit1', 'AUDIT', ['Component:Table']);
    const bug = issue('bug2', 'BUG', ['rgaa:major'], 'Ready', ['audit1']);
    const improvement = issue('feature3', 'FEATURE', ['Component:Table', 'Accessibility'], 'Ready', [
      'audit1'
    ]);
    const normalized = normalizeGithub(dataset([audit, bug, improvement]), rules, undefined, '1.7.1');
    expect(normalized.anomalies[0]!.componentId).toBeUndefined();
    expect(normalized.auditImprovements).toHaveLength(1);
    expect(normalized.audits[0]!.objectiveAuditResult).toBe('conform');
  });

  it('vérifie une correction par un audit ultérieur sans anomalie et laisse une vérification indéterminée sinon', () => {
    const bug = issue('bug1', 'BUG', ['Component:Table', 'rgaa:major']);
    bug.linkedPullRequestIds = ['pr'];
    const audit = issue('audit2', 'AUDIT', ['Component:Table']);
    audit.milestone!.title = '1.8.0';
    audit.projectStatuses[0]!.statusHistory![0]!.transitionedAt = '2026-02-15T00:00:00Z';
    const clean = normalizeGithub(dataset([bug, audit]), rules);
    expect(clean.issues![0]!.review?.verification).toBe('verified');
    const newBug = issue('bug3', 'BUG', ['Component:Table', 'rgaa:major'], 'Ready', ['audit2']);
    const blocked = normalizeGithub(dataset([bug, audit, newBug]), rules);
    expect(blocked.issues![0]!.review?.verification).toBe('indeterminate');
  });

  it('conserve les audits Done ouverts et sépare absence de Project, statut absent et statut inconnu renseigné', () => {
    const audit = issue('audit1', 'AUDIT', ['Component:Table']);
    audit.state = 'OPEN';
    const none = issue('bug2', 'BUG', ['Component:Table']);
    none.projectStatuses = [];
    const missing = issue('bug3', 'BUG', ['Component:Table'], '');
    const unknown = issue('bug4', 'BUG', ['Component:Table'], 'Statut personnalisé');
    const normalized = normalizeGithub(dataset([audit, none, missing, unknown]), rules);
    expect(normalized.audits[0]!.lifecycle).toBe('completed');
    expect(normalized.issues!.slice(1).map((item) => item.review?.project)).toEqual([
      'none',
      'missing-status',
      'with-status'
    ]);
  });
});
