import { expect, it } from 'vitest';
import { githubTargets } from '../src/dashboard/assets/github-links.js';
import { simplifiedModel } from '../src/analytics/simplified-dashboard.js';
import { consolidationSnapshot } from './support/consolidation.js';

it('issue #122 : les cumuls ne listent que leurs audits applicables, même avec héritage', () => {
  const snapshot = consolidationSnapshot();
  const data = snapshot.normalizedData;
  const proof = data.audits.find((audit) => audit.issueId === 'audit-a')!;
  const inheritedVersion = data.versions!.find((version) => version.number === '2.0.0')!;
  const relation = data.componentVersions!.find(
    (item) => item.componentId === proof.componentId && item.versionId === inheritedVersion.versionId
  )!;
  const target = data.versions!.find((version) => version.versionId === relation.versionId)!;
  relation.verdict = 'CONFORME';
  relation.applicableAuditIds = [proof.auditId];
  data.audits.push({ ...proof, auditId: 'non-applicable', issueId: 'audit-ongoing', version: target.number });
  const campaign = simplifiedModel(snapshot).campaigns.find((row) => row.version === target.number)!;
  expect(campaign.cells[8]!.value).toBe(1);
  expect(campaign.cells[8]!.refs).toEqual(['audit-a']);
  expect(simplifiedModel(snapshot).issues.find((issue) => issue.id === 'audit-a')!.milestone).toBe('1.0.0');
  relation.verdict = 'NON_CONFORME';
  const nonConform = simplifiedModel(snapshot).campaigns.find((row) => row.version === target.number)!;
  expect(nonConform.cells[9]!.value).toBe(1);
  expect(nonConform.cells[9]!.refs).toEqual(['audit-a']);
  relation.verdict = 'NON_COUVERT';
  relation.applicableAuditIds = [];
  const uncovered = simplifiedModel(snapshot).campaigns.find((row) => row.version === target.number)!;
  expect(uncovered.cells[14]!.refs).toEqual([]);
});

it('issue #122 : conserve plusieurs milestones et ne fabrique pas de milestone manquante', () => {
  const sources = ['1.0.0', '2.0.0'].map((milestone, index) => ({
    url: `https://github.com/acme/ui/issues/${index + 1}`,
    labels: ['Audit RGAA'],
    milestone
  }));
  const universe = [
    ...sources,
    { ...sources[0]!, url: 'https://github.com/acme/ui/issues/3', milestone: '3.0.0' }
  ];
  const query = new URL(
    githubTargets(sources, { matchLabels: true, universe }).links[0]!.url
  ).searchParams.get('q')!;
  expect(query).toContain('milestone:"1.0.0"');
  expect(query).toContain('milestone:"2.0.0"');
  expect(query).not.toContain('3.0.0');
  expect(
    githubTargets([{ url: sources[0]!.url, labels: ['Audit RGAA'] }], { matchLabels: true, universe }).links
  ).toEqual([]);
});

it('issue #122 : les recherches distinguent les milestones sources sans imposer Closed ni les sous-issues', () => {
  const selected = {
    url: 'https://github.com/acme/ui/issues/1',
    labels: ['Audit RGAA'],
    milestone: '1.7.1-Audit'
  };
  const other = { ...selected, url: 'https://github.com/acme/ui/issues/2', milestone: '1.8.0' };
  const result = githubTargets([selected], { matchLabels: true, universe: [selected, other] });
  expect(result.links).toHaveLength(1);
  expect(new URL(result.links[0]!.url).searchParams.get('q')).toBe(
    'is:issue label:"Audit RGAA" milestone:"1.7.1-Audit"'
  );
});
