import { expect, it } from 'vitest';
import { normalizeGithub } from '../src/normalizers/github.js';
import { applyComponentVersionVerdicts } from '../src/analytics/component-versions.js';
import { consolidationRaw, rawIssue, rules } from './support/consolidation.js';

for (const status of ['Ready', 'Cancelled', 'Done']) {
  it(`D-227 : un défaut hors audit ${status} ne remplace pas le résultat d’un audit applicable`, () => {
    const raw = consolidationRaw();
    const audit = rawIssue('audit-clean', 10, 'audit');
    const bug = rawIssue('outside', 11, 'bug', status);
    bug.labels.push('rgaa:major');
    raw.repositories[0]!.issues = [audit, bug];
    const data = normalizeGithub(raw, { ...rules, issuePolicy: {} });
    applyComponentVersionVerdicts(data);
    const component = data.components.find((component) => component.name === 'Button')!;
    const version = data.versions!.find((version) => version.number === '1.0.0')!;
    const relation = data.componentVersions!.find(
      (relation) => relation.componentId === component.componentId && relation.versionId === version.versionId
    )!;
    expect(data.anomalies).toHaveLength(1);
    expect(data.anomalies[0]!.origin).toBe('HORS_AUDIT');
    expect(relation.verdict).toBe('CONFORME');
    expect(relation.applicableAuditIds).toEqual([data.audits[0]!.auditId]);
  });
}

it('D-228 : un défaut hors audit ne transforme pas un composant sans audit en non conforme', () => {
  const raw = consolidationRaw();
  const bug = rawIssue('outside', 11, 'bug', 'Ready');
  bug.labels.push('rgaa:major');
  raw.repositories[0]!.issues = [bug];
  const data = normalizeGithub(raw, { ...rules, issuePolicy: {} });
  applyComponentVersionVerdicts(data);
  expect(data.componentVersions!.every((relation) => relation.verdict === 'NON_COUVERT')).toBe(true);
  expect(data.anomalies).toHaveLength(1);
});
