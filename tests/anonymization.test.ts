import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/my-real-dataset-anonymized.json' with { type: 'json' };
import { anonymizeDataset } from '../src/anonymization/anonymizer.js';
import { assertRelationalIntegrity, inspectRelationalIntegrity, validateAnonymizedDataset } from '../src/anonymization/validator.js';
import { findSuspiciousStrings } from '../src/anonymization/sanitize.js';
import { buildTraceManifest } from '../src/anonymization/trace.js';
import type { RawDataset } from '../src/domain/types.js';

const options = { seed: 'test-seed', dateOffsetDays: -100, strictText: true, preserveComponentNames: true };

describe('fixture anonymizer', () => {
  it('is deterministic', () => expect(anonymizeDataset(fixture as RawDataset, options).dataset).toEqual(anonymizeDataset(fixture as RawDataset, options).dataset));
  it('preserves analytical structure and relationships', () => {
    const source = fixture as RawDataset;
    const result = anonymizeDataset(source, options);

    expect(result.dataset.repositories.length).toBe(source.repositories.length);
    expect(result.dataset.repositories.flatMap(r => r.issues).length).toBe(
      source.repositories.flatMap(r => r.issues).length
    );
    expect(result.dataset.repositories.flatMap(r => r.pullRequests).length).toBe(
      source.repositories.flatMap(r => r.pullRequests).length
    );

    expect(assertRelationalIntegrity(result.dataset)).toHaveLength(
      assertRelationalIntegrity(source).length
    );
  });
  it('shifts dates consistently', () => {
    const result = anonymizeDataset(fixture as RawDataset, options);
    const original = new Date(fixture.repositories[0]!.issues[0]!.createdAt).getTime();
    const anonymized = new Date(result.dataset.repositories[0]!.issues[0]!.createdAt).getTime();
    expect(anonymized - original).toBe(-100 * 86_400_000);
  });
  it('removes free-form text and obvious PII', () => {
    const result = anonymizeDataset(fixture as RawDataset, options);
    expect(result.dataset.repositories[0]!.issues[0]!.title).toBe('[anonymized issue]');
    expect(validateAnonymizedDataset(result.dataset).valid).toBe(true);
  });

  it('does not classify ISO timestamps as phone numbers', () => {
    expect(findSuspiciousStrings('2025-09-28T09:50:53.739Z')).not.toContain('phone');
    expect(findSuspiciousStrings('Contactez-moi au 06 12 34 56 78')).toContain('phone');
  });

  it('creates a local trace manifest back to RAW entities and relation targets', () => {
    const source: RawDataset = {
      collectedAt: '2026-09-28T10:00:00Z', nexusAvailable: false, catalogueComponents: [],
      repositories: [{
        id: 'repo-1', name: 'ds-react', owner: 'myorga', defaultBranch: 'main',
        issues: [{ id: 'repo-1:issue:1', number: 1, title: 'x', state: 'OPEN', issueType: 'BUG', labels: [], criticities: [], parents: [], createdAt: '2026-09-28T10:00:00Z', linkedPullRequestIds: ['repo-1:pr:2'], projectStatuses: [] }],
        pullRequests: [{ id: 'repo-1:pr:2', number: 2, state: 'MERGED', mergedAt: '2026-09-28T10:00:00Z', relatedIssueIds: ['repo-1:issue:1'] }]
      }]
    };
    const anonymized = anonymizeDataset(source, options).dataset;
    const trace = buildTraceManifest(source, anonymized, 'raw.json');
    expect(trace.source.file).toBe('raw.json');
    expect(trace.entities).toHaveLength(3);
    expect(trace.relations.every(relation => relation.targetStatus === 'present-in-source')).toBe(true);
  });

  it('distinguishes a cross-repository relation from a truly missing relation', () => {
    const dataset: RawDataset = {
      collectedAt: '2026-09-28T10:00:00Z', nexusAvailable: false, catalogueComponents: [],
      repositories: [
        { id: 'repo-1', name: 'one', owner: 'o', defaultBranch: 'main', issues: [], pullRequests: [{ id: 'pr-1', number: 1, state: 'OPEN', relatedIssueIds: ['issue-2'] }] },
        { id: 'repo-2', name: 'two', owner: 'o', defaultBranch: 'main', issues: [{ id: 'issue-2', number: 2, title: 'x', state: 'OPEN', issueType: 'BUG', labels: [], criticities: [], parents: [], createdAt: '2026-09-28T10:00:00Z', linkedPullRequestIds: [], projectStatuses: [] }], pullRequests: [] }
      ]
    };
    const errors = inspectRelationalIntegrity(dataset);
    expect(errors).toHaveLength(1);
    expect(errors[0]?.scope).toBe('cross-repository');
  });

  it('can anonymize component names when requested', () => {
    const source = fixture as RawDataset;
    const sourceComponentNames = new Set(
      source.repositories
        .flatMap(repository => repository.issues)
        .map(issue => issue.component)
        .filter((component): component is string => component !== undefined)
    );

    expect(sourceComponentNames.size).toBeGreaterThan(0);

    const result = anonymizeDataset(source, {
      ...options,
      preserveComponentNames: false
    });

    const anonymizedComponentNames = result.dataset.repositories
      .flatMap(repository => repository.issues)
      .map(issue => issue.component)
      .filter((component): component is string => component !== undefined);

    expect(anonymizedComponentNames.length).toBeGreaterThan(0);

    for (const component of anonymizedComponentNames) {
      expect(sourceComponentNames.has(component)).toBe(false);
    }
  });

  it('preserves analytical issue, project status and milestone fields', () => {
    const source: RawDataset = {
      collectedAt: '2026-09-28T10:00:00Z',
      nexusAvailable: false,
      catalogueComponents: [],
      repositories: [{
        id: 'repo-1', name: 'ds-react', owner: 'myorga', defaultBranch: 'main',
        issues: [{
          id: 'repo-1:issue:42', number: 42, title: 'Private issue title',
          state: 'OPEN', issueType: 'BUG', labels: ['📚 Documentation', 'Reported by user'],
          criticities: ['majeure'], parents: [], createdAt: '2026-09-28T10:00:00Z',
          linkedPullRequestIds: [],
          projectStatuses: [{ projectId: 'project-1', projectName: 'Private project', status: '🏗 In progress' }],
          milestone: { id: 7, number: 7, title: '1.8.0', state: 'open' }
        }],
        pullRequests: []
      }]
    };

    const result = anonymizeDataset(source, options).dataset.repositories[0]!.issues[0]!;
    expect(result.labels).toEqual(source.repositories[0]!.issues[0]!.labels);
    expect(result.state).toBe('OPEN');
    expect(result.issueType).toBe('BUG');
    expect(result.projectStatuses[0]!.status).toBe('🏗 In progress');
    expect(result.milestone).toMatchObject({ title: '1.8.0', state: 'open' });
    expect(result.milestone?.id).not.toBe(7);
  });

  it('does not leak rich milestone API fields into the RAW/anonymized model', () => {
    const source = {
      collectedAt: '2026-09-28T10:00:00Z', nexusAvailable: false, catalogueComponents: [],
      repositories: [{
        id: 'repo-1', name: 'ds-react', owner: 'myorga', defaultBranch: 'main', issues: [{
          id: 'repo-1:issue:1', number: 1, title: 'Private title', state: 'OPEN', issueType: 'BUG', labels: [],
          criticities: [], parents: [], createdAt: '2026-09-28T10:00:00Z', linkedPullRequestIds: [], projectStatuses: [],
          milestone: { id: 7, number: 7, title: '1.8.0', state: 'open', description: 'SECRET', creator: { login: 'martin-matin' }, html_url: 'https://github.enterprise.io/private' }
        }], pullRequests: []
      }]
    } as unknown as RawDataset;

    const result = anonymizeDataset(source, options).dataset.repositories[0]!.issues[0]!.milestone;
    expect(result).toEqual({ id: expect.any(Number), number: 7, title: '1.8.0', state: 'open' });
    expect(result).not.toHaveProperty('description');
    expect(result).not.toHaveProperty('creator');
    expect(result).not.toHaveProperty('html_url');
  });

});

import { buildValidationReport } from '../src/anonymization/validation-report.js';

describe('fixture validation report', () => {
  it('includes suspicious string path and source value', () => {
    const dataset = fixture as RawDataset;
    const validation = validateAnonymizedDataset(dataset);
    const report = buildValidationReport(dataset, validation, [], 'fixture.json');
    if (validation.findings.length) {
      expect(report).toContain('### Detailed findings');
      expect(report).toContain(validation.findings[0]!.path);
      expect(report).toContain(validation.findings[0]!.value);
    }
  });
});

it('preserves historical catalogue evidence and anonymizes its component names consistently', () => {
  const source: RawDataset = {
    collectedAt: '2026-09-28T10:00:00Z', nexusAvailable: false, catalogueComponents: ['Button'],
    repositories: [{
      id: 'repo-1', name: 'ds-react', owner: 'myorga', defaultBranch: 'main', issues: [], pullRequests: [],
      gitTags: [{ name: '1.0.0', createdAt: '2026-09-20T10:00:00Z' }],
      historicalCatalogues: [{ tagName: '1.0.0', status: 'available', componentNames: ['Button'] }]
    }]
  };
  const result = anonymizeDataset(source, { ...options, preserveComponentNames: false }).dataset;
  expect(result.repositories[0]?.historicalCatalogues?.[0]?.status).toBe('available');
  expect(result.repositories[0]?.historicalCatalogues?.[0]?.componentNames[0]).not.toBe('Button');
  expect(result.repositories[0]?.gitTags?.[0]?.createdAt).toBe('2026-06-12T10:00:00.000Z');
});
