import { expect, it } from 'vitest';
import { applyAuditDeclarations } from '../src/domain/audit-declarations.js';
import { normalizeGithub } from '../src/normalizers/github.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { consolidationRaw, consolidationSnapshot, rawIssue, rules } from './support/consolidation.js';

it('distingue les enfants BUG RGAA déclarés des inférences, de la documentation et des audits non terminés', () => {
  const raw = consolidationRaw();
  const secondAudit = rawIssue('second-audit', 20, 'audit');
  secondAudit.labels = ['Component:Modal'];
  const inferred = rawIssue('inferred', 21, 'bug', 'Ready', 'OPEN', ['second-audit']);
  delete inferred.rawIssueType;
  inferred.labels = ['Component:Modal', 'rgaa:major'];
  const otherComponent = rawIssue('other-component', 22, 'bug', 'Ready', 'OPEN', ['audit-a']);
  otherComponent.labels = ['Component:Modal', 'rgaa:major'];
  const documentation = rawIssue('documentation', 23, 'bug', 'Ready', 'OPEN', ['audit-a']);
  const ongoingBug = rawIssue('ongoing-bug', 24, 'bug', 'Ready', 'OPEN', ['audit-ongoing']);
  ongoingBug.labels.push('rgaa:major');
  raw.repositories[0]!.issues.push(secondAudit, inferred, otherComponent, documentation, ongoingBug);
  const data = normalizeGithub(raw, { ...rules, issuePolicy: {} });
  expect(data.audits.find((audit) => audit.issueId === 'audit-a')!.declaredRgaaBugIssueIds).toEqual([
    'anomaly-a',
    'other-component'
  ]);
  expect(data.audits.find((audit) => audit.issueId === 'second-audit')!.declaredRgaaBugIssueIds).toEqual([]);
  expect(data.audits.find((audit) => audit.issueId === 'second-audit')!.objectiveAuditResult).toBe(
    'non_conform'
  );
  expect(data.issues!.find((issue) => issue.issueId === 'other-component')!.review!.warnings).toContain(
    'Composant de l’anomalie différent de celui de l’audit'
  );
  const snapshot = consolidationSnapshot();
  snapshot.rawData = raw;
  snapshot.normalizedData = data;
  const row = simplifiedModel(snapshot).campaigns.find((campaign) => campaign.version === '1.0.0')!;
  expect(row.cells[12]!.value).toBe(2);
  expect(row.cells[12]!.refs).toEqual(['anomaly-a', 'other-component']);
  expect(row.cells[17]!.value).toBe(1);
  expect(row.cells[18]!.value).toBe(1);
  for (const audit of data.audits) delete audit.declaredRgaaBugIssueIds;
  const legacy = simplifiedModel(snapshot).campaigns.find((campaign) => campaign.version === '1.0.0')!;
  expect(legacy.cells[12]!.value).toBeNull();
  expect(legacy.cells[17]!.value).toBeNull();
});

it('utilise les variantes BUG et le préfixe RGAA du profil au lieu de noms codés en dur', () => {
  const raw = consolidationRaw();
  const bug = raw.repositories[0]!.issues.find((issue) => issue.id === 'anomaly-a')!;
  bug.rawIssueType = 'Defect';
  bug.labels = ['severity:major'];
  const snapshot = consolidationSnapshot();
  applyAuditDeclarations(snapshot.normalizedData, raw, {
    ...rules,
    issueTypes: { ...rules.issueTypes, keywords: { BUG: ['Defect'] } },
    labels: { ...rules.labels, accessibilityCriticalityPrefix: 'severity:' }
  });
  expect(
    snapshot.normalizedData.audits.find((audit) => audit.issueId === 'audit-a')!.declaredRgaaBugIssueIds
  ).toEqual(['anomaly-a']);
});
