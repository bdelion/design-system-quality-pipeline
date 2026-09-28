import { describe, expect, it } from 'vitest';
import fixture from '../fixtures/github.json' with { type: 'json' };
import { anonymizeDataset } from '../src/anonymization/anonymizer.js';
import { assertRelationalIntegrity, validateAnonymizedDataset } from '../src/anonymization/validator.js';
import type { RawDataset } from '../src/domain/types.js';

const options = { seed: 'test-seed', dateOffsetDays: -100, strictText: true, preserveComponentNames: true };

describe('fixture anonymizer', () => {
  it('is deterministic', () => expect(anonymizeDataset(fixture as RawDataset, options).dataset).toEqual(anonymizeDataset(fixture as RawDataset, options).dataset));
  it('preserves analytical structure and relationships', () => {
    const result = anonymizeDataset(fixture as RawDataset, options);
    expect(result.dataset.repositories.length).toBe(fixture.repositories.length);
    expect(result.dataset.repositories.flatMap(r => r.issues).length).toBe(fixture.repositories.flatMap(r => r.issues).length);
    expect(result.dataset.repositories.flatMap(r => r.pullRequests).length).toBe(fixture.repositories.flatMap(r => r.pullRequests).length);
    expect(assertRelationalIntegrity(result.dataset)).toEqual([]);
  });
  it('shifts dates consistently', () => {
    const result = anonymizeDataset(fixture as RawDataset, options);
    const original = new Date(fixture.repositories[0].issues[0].createdAt).getTime();
    const anonymized = new Date(result.dataset.repositories[0].issues[0].createdAt).getTime();
    expect(anonymized - original).toBe(-100 * 86_400_000);
  });
  it('removes free-form text and obvious PII', () => {
    const result = anonymizeDataset(fixture as RawDataset, options);
    expect(result.dataset.repositories[0].issues[0].title).toBe('[anonymized issue]');
    expect(validateAnonymizedDataset(result.dataset).valid).toBe(true);
  });
  it('can anonymize component names when requested', () => {
    const result = anonymizeDataset(fixture as RawDataset, { ...options, preserveComponentNames: false });
    expect(result.dataset.catalogueComponents).not.toContain(fixture.catalogueComponents[0]);
    expect(result.dataset.repositories[0].issues[0].component).not.toBe(fixture.repositories[0].issues[0].component);
  });

});
