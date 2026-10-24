/** Correspondances explicites ; aucune recherche par sous-chaîne libre. */
export interface LabelMatcher {
  labels: string[];
  prefixes: string[];
}

/** Conventions de qualification indépendantes du type et du canal de signalement. */
export interface IssuePolicy {
  classification?: { accessibility?: LabelMatcher; functional?: LabelMatcher };
  bugInference?: LabelMatcher;
  auditorAdvice?: LabelMatcher;
  resolution?: { prefix: string; accepted: string; invalid: string };
  /** Exceptions explicites au préfixe composant ; jamais de rapprochement approximatif. */
  componentLabels?: Record<string, string>;
}

export const defaultIssuePolicy = {
  classification: {
    accessibility: {
      labels: ['bug:accessibility', 'Accessibility'],
      prefixes: ['🚦 rgaa:', '♿ a11y:', 'rgaa:', 'a11y:']
    },
    functional: { labels: ['bug:functional'], prefixes: [] }
  },
  bugInference: {
    labels: ['bug:accessibility', 'bug:functional'],
    prefixes: ['🚦 rgaa:', '♿ a11y:', 'rgaa:', 'a11y:']
  },
  auditorAdvice: { labels: ['VOIR AUDITEUR'], prefixes: [] },
  resolution: { prefix: 'resolution:', accepted: 'accepted', invalid: 'invalid' }
} satisfies IssuePolicy;

/** Compare les labels exactement, ou au début pour les préfixes explicitement configurés. */
export function matchesLabels(labels: readonly string[], matcher: LabelMatcher): boolean {
  return labels.some(
    (label) =>
      matcher.labels.some((value) => label === value) ||
      matcher.prefixes.some((value) => label.startsWith(value))
  );
}

/** Retourne zéro, une ou deux catégories, sans assimiler une inconnue à un bug fonctionnel. */
export function classifyLabels(
  labels: readonly string[],
  policy: IssuePolicy = {}
): ('accessibility' | 'functional')[] {
  return (['accessibility', 'functional'] as const).filter((category) =>
    matchesLabels(labels, policy.classification?.[category] ?? defaultIssuePolicy.classification[category])
  );
}

/** N’autorise une neutralisation qu’avec un motif unique et un statut Cancelled. */
export function resolutionReason(
  labels: readonly string[],
  cancelled: boolean,
  policy: IssuePolicy = {}
): 'accepted' | 'invalid' | 'missing' | 'conflict' | 'status-conflict' {
  const config = policy.resolution ?? defaultIssuePolicy.resolution;
  const accepted = labels.includes(config.prefix + config.accepted);
  const invalid = labels.includes(config.prefix + config.invalid);
  if (accepted && invalid) return 'conflict';
  if ((accepted || invalid) && !cancelled) return 'status-conflict';
  return accepted ? 'accepted' : invalid ? 'invalid' : 'missing';
}

/** Refuse les conventions vides ou invalides avant toute interprétation des données. */
export function validateIssuePolicy(value: unknown): void {
  if (value === undefined) return;
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('issuePolicy doit être un objet.');
  const policy = value as IssuePolicy;
  if (
    policy.classification !== undefined &&
    (!policy.classification ||
      typeof policy.classification !== 'object' ||
      Array.isArray(policy.classification))
  )
    throw new Error('issuePolicy.classification doit être un objet.');
  if (
    policy.resolution !== undefined &&
    (!policy.resolution || typeof policy.resolution !== 'object' || Array.isArray(policy.resolution))
  )
    throw new Error('issuePolicy.resolution doit être un objet.');
  for (const matcher of [
    policy.classification?.accessibility,
    policy.classification?.functional,
    policy.bugInference,
    policy.auditorAdvice
  ]) {
    if (matcher === undefined) continue;
    if (
      !matcher ||
      !Array.isArray(matcher.labels) ||
      !Array.isArray(matcher.prefixes) ||
      [...matcher.labels, ...matcher.prefixes].some((item) => typeof item !== 'string' || !item.trim())
    )
      throw new Error('issuePolicy : labels et prefixes doivent être des listes de chaînes non vides.');
  }
  if (
    policy.resolution &&
    (['prefix', 'accepted', 'invalid'] as const).some(
      (key) => typeof policy.resolution![key] !== 'string' || !policy.resolution![key].trim()
    )
  )
    throw new Error('issuePolicy.resolution invalide.');
  if (policy.resolution && policy.resolution.accepted === policy.resolution.invalid)
    throw new Error('Les motifs de résolution doivent être distincts.');
  if (
    policy.componentLabels !== undefined &&
    (!policy.componentLabels ||
      typeof policy.componentLabels !== 'object' ||
      Array.isArray(policy.componentLabels) ||
      Object.entries(policy.componentLabels).some(
        ([key, name]) => !key.trim() || typeof name !== 'string' || !name.trim()
      ))
  )
    throw new Error('issuePolicy.componentLabels invalide.');
}
