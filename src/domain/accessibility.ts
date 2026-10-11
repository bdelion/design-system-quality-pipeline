/** Qualification accessibilité indépendante du type BUG et de l'origine d'audit. */
export interface AccessibilityQualification {
  status: 'qualified' | 'presumed' | 'unqualified';
  reasons: string[];
}
/** Convention configurable de reconnaissance des labels dans un même repository. */
export interface AccessibilityRecognition {
  labelAllOf?: string[];
  repositories?: Record<string, string[]>;
}

/** Qualifie un défaut avec ses preuves, sans créer de relation vers un audit. */
export function accessibilityQualification(
  labels: readonly string[],
  categories: readonly string[],
  criticalities: readonly string[],
  explicitAudit = false,
  tokens: readonly string[] = ['audit', 'rgaa']
): AccessibilityQualification {
  const reasons: string[] = [];
  const explicitLabel =
    tokens.length > 0 &&
    labels.some((label) =>
      tokens.every((token) => label.toLocaleLowerCase('fr').includes(token.toLocaleLowerCase('fr')))
    );
  if (explicitAudit) reasons.push('relation explicite à un audit accessibilité');
  if (explicitLabel) reasons.push('label Audit + RGAA');
  if (categories.length) reasons.push('catégorie accessibilité');
  if (criticalities.length) reasons.push('criticité RGAA');
  if (labels.some((label) => /(?:rgaa|a11y)/i.test(label))) reasons.push('label accessibilité');
  return {
    status: explicitAudit || explicitLabel ? 'qualified' : reasons.length ? 'presumed' : 'unqualified',
    reasons
  };
}

/** Refuse les règles vides ou mal structurées avant d'interpréter les labels de qualification. */
export function validateAccessibilityRecognition(value: unknown): void {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('accessibilityRecognition doit être un objet.');
  const config = value as AccessibilityRecognition;
  if (
    config.repositories !== undefined &&
    (!config.repositories || typeof config.repositories !== 'object' || Array.isArray(config.repositories))
  )
    throw new Error('accessibilityRecognition.repositories doit être un objet.');
  const rules = [
    ...(config.labelAllOf === undefined ? [] : [config.labelAllOf]),
    ...Object.values(config.repositories ?? {})
  ];
  if (
    rules.some(
      (tokens) =>
        !Array.isArray(tokens) ||
        !tokens.length ||
        tokens.some((token) => typeof token !== 'string' || !token.trim())
    )
  )
    throw new Error('Chaque règle accessibilité doit contenir des mots non vides.');
}
