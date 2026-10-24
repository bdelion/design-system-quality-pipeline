import { describe, expect, it } from 'vitest';
import {
  classifyLabels,
  matchesLabels,
  resolutionReason,
  validateIssuePolicy
} from '../src/domain/issue-policy.js';

describe('Décisions de qualification des issues', () => {
  it('refuse les règles vides et mal structurées sans interdire une liste désactivée', () => {
    expect(() => validateIssuePolicy({ bugInference: { labels: [], prefixes: [''] } })).toThrow();
    expect(() => validateIssuePolicy({ classification: [] })).toThrow();
    expect(() => validateIssuePolicy({ componentLabels: null })).toThrow();
    expect(() =>
      validateIssuePolicy({ resolution: { prefix: 'x:', accepted: 'same', invalid: 'same' } })
    ).toThrow();
    expect(() => validateIssuePolicy({ bugInference: { labels: [], prefixes: [] } })).not.toThrow();
  });
  it('reconnaît les catégories par labels exacts ou préfixes et autorise leur recouvrement', () => {
    expect(classifyLabels(['bug:accessibility', 'bug:functional'])).toEqual(['accessibility', 'functional']);
    expect(classifyLabels(['Accessibility'])).toEqual(['accessibility']);
    expect(classifyLabels(['Reported by user'])).toEqual([]);
    expect(matchesLabels(['VOIR AUDITEUR'], { labels: ['Audit'], prefixes: [] })).toBe(false);
    expect(matchesLabels(['préfixe:valeur'], { labels: [], prefixes: ['préfixe:'] })).toBe(true);
  });

  it('n’applique aucun motif contradictoire ou sans annulation', () => {
    expect(resolutionReason(['resolution:accepted'], false)).toBe('status-conflict');
    expect(resolutionReason(['resolution:accepted', 'resolution:invalid'], true)).toBe('conflict');
    expect(resolutionReason([], true)).toBe('missing');
    expect(resolutionReason(['resolution:invalid'], true)).toBe('invalid');
  });
});
