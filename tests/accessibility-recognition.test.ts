import { expect, it } from 'vitest';
import { accessibilityQualification, validateAccessibilityRecognition } from '../src/domain/accessibility.js';

it('conserve les qualifications historiques sans configuration explicite', () => {
  expect(accessibilityQualification(['Audit RGAA'], [], []).status).toBe('qualified');
  expect(accessibilityQualification(['A11Y: focus'], [], []).status).toBe('presumed');
  expect(accessibilityQualification(['fonctionnel'], [], []).status).toBe('unqualified');
});

it('remplace les fragments de présomption sans désactiver les preuves structurelles', () => {
  expect(accessibilityQualification(['a11y'], [], [], false, ['inspection'], ['accès']).status).toBe(
    'unqualified'
  );
  expect(accessibilityQualification(['ACCÈS clavier'], [], [], false, ['inspection'], ['accès']).status).toBe(
    'presumed'
  );
  expect(accessibilityQualification(['a11y'], [], [], false, [], []).status).toBe('unqualified');
  expect(accessibilityQualification([], [], ['major'], false, [], []).status).toBe('presumed');
  expect(accessibilityQualification([], [], [], true, [], []).status).toBe('qualified');
});

it('valide les fragments configurés et autorise la désactivation explicite', () => {
  expect(() => validateAccessibilityRecognition({ labelAnyOf: [] })).not.toThrow();
  expect(() => validateAccessibilityRecognition({ labelAnyOf: [''] })).toThrow();
  expect(() => validateAccessibilityRecognition({ labelAnyOf: 'rgaa' })).toThrow();
});
