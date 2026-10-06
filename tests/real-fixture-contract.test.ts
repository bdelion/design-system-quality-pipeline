import { describe, expect, it } from 'vitest';
import { collectFixture } from '../src/collectors/fixture.js';
import { loadConfig } from '../src/config.js';
import { normalizeGithub } from '../src/normalizers/github.js';

const fixturePath = 'fixtures/my-real-dataset-anonymized.json';
const [raw, config] = await Promise.all([
  collectFixture(fixturePath),
  loadConfig('fixture', fixturePath)
]);

describe('anonymized real dataset fixture compatibility', () => {
  it('characterizes the source inventory and recovers legacy Component labels', () => {
    const sourceIssues = raw.repositories.flatMap((repository) => repository.issues);
    expect(sourceIssues.length).toBe(1716);

    const componentLabelCount = (issue: (typeof sourceIssues)[number]) =>
      issue.labels.filter((label) =>
        label.toLowerCase().startsWith(config.github.labels.componentPrefix.toLowerCase())
      ).length;
    const sampleCandidates = [
      sourceIssues.find((issue) => componentLabelCount(issue) > 1),
      sourceIssues.find((issue) => componentLabelCount(issue) === 1),
      sourceIssues.find((issue) => componentLabelCount(issue) === 0),
      sourceIssues.find((issue) =>
        issue.milestone && /^\d+\.\d+\.\d+(?:-audit)?$/i.test(issue.milestone.title)
      )
    ].filter((issue): issue is (typeof sourceIssues)[number] => issue !== undefined);
    const samples = [...new Map(sampleCandidates.map((issue) => [issue.id, issue])).values()];
    const sampleIds = new Set(samples.map((issue) => issue.id));
    const sampledRaw = structuredClone(raw);
    for (const repository of sampledRaw.repositories) {
      repository.issues = repository.issues.filter((issue) => sampleIds.has(issue.id));
      repository.pullRequests = [];
    }

    const normalized = normalizeGithub(sampledRaw, config.github);
    const issueBySourceId = new Map(
      normalized.issues.map((issue) => [issue.provenance.sourceId, issue])
    );
    const componentNameById = new Map(
      normalized.components.map((component) => [component.componentId, component.name])
    );
    expect(normalized.issues).toHaveLength(samples.length);

    for (const sourceIssue of samples) {
      const issue = issueBySourceId.get(sourceIssue.id);
      expect(issue).toBeDefined();
      if (!issue) continue;
      const labelNames = sourceIssue.labels
        .filter((label) => label.toLowerCase().startsWith(config.github.labels.componentPrefix.toLowerCase()))
        .map((label) => label.slice(config.github.labels.componentPrefix.length));
      const expectedNames = (sourceIssue.components
        ?? (labelNames.length > 0
          ? labelNames
          : sourceIssue.component !== undefined ? [sourceIssue.component] : []))
        .slice()
        .sort();
      const actualNames = issue.componentIds
        .map((componentId) => componentNameById.get(componentId))
        .filter((name): name is string => name !== undefined)
        .sort();
      expect(actualNames).toEqual(expectedNames);
    }

    expect(normalized.components.length).toBeGreaterThan(0);
    expect(normalized.versions.length).toBeGreaterThan(0);
    expect(normalized.versions.every((version) =>
      !version.published && version.releasedAt === undefined
    )).toBe(true);
  });

  it('does not treat absent release and Project history facts as if the fixture contained them', () => {
    expect(raw.repositories.every((repository) => !repository.tags?.length)).toBe(true);
    expect(raw.repositories.flatMap((repository) => repository.issues)
      .every((issue) => issue.parents.length === 0 && !issue.projectFields?.length)).toBe(true);
    expect(raw.repositories.flatMap((repository) => repository.issues)
      .flatMap((issue) => issue.projectStatuses)
      .every((status) => !status.transitions?.length)).toBe(true);
  });
});
