import { describe, expect, it } from 'vitest';
import { contextualHref, matchesFact } from '../src/dashboard/assets/context.js';

/** Vérifie le comportement des filtres partagés, sans figer leur implémentation textuelle. */
describe('filtres contextuels du dashboard', () => {
  const fact = {
    id: 'issue-1',
    repo: 'acme/react',
    components: ['Button', 'Modal'],
    componentIds: ['button', 'modal'],
    versions: ['1.1.0'],
    versionIds: ['v1'],
    auditIds: ['audit-1'],
    anomalyIds: ['anomaly-1'],
    family: 'audit_anomaly'
  };
  it('combine toutes les dimensions et accepte une issue multi-composants', () => {
    expect(
      matchesFact(fact, new URLSearchParams('repository=acme%2Freact&component=Modal&version=1.1.0'))
    ).toBe(true);
    expect(
      matchesFact(fact, new URLSearchParams('repository=acme%2Freact&component=Unknown&version=1.1.0'))
    ).toBe(false);
    expect(matchesFact({ ...fact, versions: [], versionIds: [] }, new URLSearchParams('version=1.1.0'))).toBe(
      false
    );
    expect(matchesFact(fact, new URLSearchParams('audit=audit-2'))).toBe(false);
  });
  it('conserve les paramètres explicites du lien cible et son ancre', () => {
    const href = contextualHref(
      'audits.html?version=2.0.0&audit=audit-2#component-versions',
      new URLSearchParams('repository=acme%2Freact&version=1.1.0&audit=audit-1')
    );
    const target = new URL(href, 'https://example.test/');
    expect(target.searchParams.get('version')).toBe('2.0.0');
    expect(target.searchParams.get('audit')).toBe('audit-2');
    expect(target.searchParams.get('repository')).toBe('acme/react');
    expect(target.hash).toBe('#component-versions');
  });
  it('efface le périmètre ajouté sans conserver des paramètres périmés', () => {
    const original = 'anomalies.html?status=open';
    expect(contextualHref(original, new URLSearchParams('repository=acme%2Freact'))).toContain('repository=');
    expect(contextualHref(original, new URLSearchParams())).toBe(original);
    expect(contextualHref('https://github.com/acme/react', new URLSearchParams('component=Button'))).toBe(
      'https://github.com/acme/react'
    );
  });
});
