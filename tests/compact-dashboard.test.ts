import { describe, it, expect } from 'vitest';
import type { Issue, CanonicalProjectStatus } from '../src/domain/types.js';
import { consolidationSnapshot } from './support/consolidation.js';
import { componentActivityTable } from '../src/analytics/component-activity.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';

/** Produit une issue de test aux dates et statuts explicites, sans réseau. */
function issueFrom(template: Issue, id: string, status: CanonicalProjectStatus | undefined, days = 0): Issue {
  const issue = structuredClone(template);
  issue.issueId = id;
  issue.number = 100 + Number(id.replace(/\D/g, '') || 0);
  issue.createdAt = '2026-09-01T00:00:00Z';
  issue.state = status === 'DONE' ? 'CLOSED' : 'OPEN';
  issue.url = `https://github.com/acme/ds-react/issues/${issue.number}`;
  issue.projectContexts = status
    ? [
        {
          ...template.projectContexts[0]!,
          status,
          statusHistory: [
            {
              status,
              rawStatus: status,
              transitionedAt: new Date(Date.parse(issue.createdAt) + days * 86400000).toISOString()
            }
          ]
        }
      ]
    : [];
  return issue;
}

describe('synthèse compacte et cohortes', () => {
  it('compte les issues distinctes, sépare les inconnus et calcule les délais admissibles', () => {
    const snapshot = consolidationSnapshot();
    const template = snapshot.normalizedData.issues![0]!;
    const component = snapshot.normalizedData.components[0]!;
    snapshot.normalizedData.issues = [
      issueFrom(template, 'i1', 'DONE', 2),
      issueFrom(template, 'i2', 'DONE', 4),
      issueFrom(template, 'i3', 'DONE', 10),
      issueFrom(template, 'i4', 'BACKLOG'),
      issueFrom(template, 'i5', 'CANCELLED'),
      issueFrom(template, 'i6', undefined)
    ];
    for (const issue of snapshot.normalizedData.issues) issue.componentIds = [component.componentId];
    snapshot.normalizedData.issues[3]!.createdAt = '2026-08-01T00:00:00Z';
    snapshot.normalizedData.issues.push(snapshot.normalizedData.issues[0]!);
    const row = componentActivityTable(snapshot).rows.find(
      (item) => item.cells[1]?.value === component.name
    )!;
    expect(row.cells.slice(2, 6).map((cell) => cell.value)).toEqual([6, 1, 3, 1]);
    expect(row.cells[6]?.value).toBeCloseTo(16 / 3);
    expect(row.cells[7]?.value).toBe(4);
    expect(row.cells[8]?.value).toBeCloseTo(8.8);
    expect(row.cells[9]?.refs).toEqual(['i4']);
    expect(row.cells[10]?.value).toBe(1);
    expect(row.cells[11]?.value).toBe(3);
    expect(row.cells[6]?.refs).toEqual(['i1', 'i2', 'i3']);
  });

  it('conserve l’absence d’issues et les dates non exploitables sans faux zéro', () => {
    const snapshot = consolidationSnapshot();
    delete snapshot.normalizedData.issues;
    expect(componentActivityTable(snapshot).rows[0]?.cells[2]?.value).toBeNull();
    expect(componentActivityTable(snapshot).rows[0]?.cells[6]?.value).toBeNull();
  });

  it('distingue la conformité auditée sur la version du cumul avec héritage', () => {
    const snapshot = consolidationSnapshot();
    const data = snapshot.normalizedData;
    const base = data.components[0]!;
    data.components = Array.from({ length: 4 }, (_, index) => ({
      ...base,
      componentId: 'c' + index,
      name: 'Component ' + index
    }));
    const source = data.issues![0]!;
    data.issues = [
      issueFrom(source, 'i1', 'DONE', 2),
      issueFrom(source, 'i2', 'DONE', 3),
      issueFrom(source, 'i3', 'READY'),
      issueFrom(source, 'i4', 'DONE', 1)
    ];
    const audit = data.audits[0]!;
    data.audits = [
      { ...audit, auditId: 'a1', issueId: 'i1', componentId: 'c0', version: '2.0.0' },
      { ...audit, auditId: 'a2', issueId: 'i2', componentId: 'c0', version: '2.0.0' },
      { ...audit, auditId: 'a3', issueId: 'i3', componentId: 'c3', version: '2.0.0' },
      { ...audit, auditId: 'old', issueId: 'i4', componentId: 'c1', version: '1.0.0' }
    ];
    data.versions = [{ ...data.versions![0]!, versionId: 'v2', number: '2.0.0' }];
    data.componentVersions = data.components.map((item, index) => ({
      componentVersionId: 'cv' + index,
      componentId: item.componentId,
      versionId: 'v2',
      verdict: index < 3 ? 'CONFORME' : 'NON_CONFORME',
      applicableAuditIds: index === 1 ? ['old'] : [],
      provenance: item.provenance,
      dataQualityStatus: 'reliable'
    }));
    data.anomalies = [];
    data.auditImprovements = [];
    const row = simplifiedModel(snapshot).campaigns.find((item) => item.version === '2.0.0')!;
    // #127 : deux audits terminés sur quatre composants, sans inclure l’audit en attente.
    expect(row.cells.slice(2, 10).map((cell) => cell.value)).toEqual([4, 3, 1, 0, 2, 50, 3, 1]);
    expect(row.cells[10]?.value).toBe(50);
    expect(row.cells[11]?.value).toBe(75);
    expect(row.cells[8]?.refs).toContain('i4');
    expect(row.cells[10]?.refs).not.toContain('i4');
    delete data.componentVersions;
    expect(
      simplifiedModel(snapshot).campaigns.find((item) => item.version === '2.0.0')?.cells[7]?.value
    ).toBeNull();
  });
  it('préserve les liens de compteurs Enterprise et tous les états d’un total', () => {
    const snapshot = consolidationSnapshot();
    for (const issue of snapshot.normalizedData.issues ?? [])
      issue.url = `https://git.acme.internal/acme/ds-react/issues/${issue.number}`;
    const repository = simplifiedModel(snapshot).tables.find((table) => table.id === 'repositories')!
      .rows[0]!;
    expect(repository.cells[2]!.url).toBe('https://git.acme.internal/acme/ds-react/issues?q=is%3Aissue');
    expect(repository.cells[4]!.url).toBe('https://git.acme.internal/acme/ds-react/pulls?q=is%3Apr');
  });
});
