# Contrat transversal de lecture métier — octobre 2026

Le contrat actuel est détaillé dans [Cohérence des pages](dashboard-coherence.md). Il remplace les anciens replis `Closed → traité` et l'absence de statut d'annulation des audits.

- L'Issue est l'identité GitHub générique. Ses spécialisations normalisées permettent de distinguer Audit, anomalie d'audit, anomalie hors audit ou d'origine indéterminée, Improvement et autre issue.
- L'Audit possède une progression indépendante du résultat : pending, ongoing, completed, cancelled. `completed` exige Done ET Closed ; la date Done peut rester inconnue. Une annulation n'a aucun verdict.
- Une anomalie RGAA n'est pas déduite d'un type BUG générique. L'origine d'audit exige une relation explicite et univoque ; le partage d'un composant ne suffit jamais.
- Component × Version utilise la cohorte Analytics D-220..D-228. Un audit v1 ne constitue pas un audit direct v2 : l'héritage établi est restitué explicitement, et seules les versions PROD antérieures ou égales sont candidates. `NON_COUVERT` est distinct de `NON_CONFORME`.
- Les snapshots de modèles/règles/périmètres différents ne sont pas comparables. Les configurations actives passent au modèle 2.2 et à `dq-2026.10-consolidation` ; les anciens artefacts ne sont pas réécrits.
- Les tests navigateur couvrent les interactions des sept pages et les contrôles automatisés WCAG A/AA, avec la limite habituelle des contrôles automatiques : ils ne remplacent pas une expertise RGAA complète.

Voir le [rapport avec critères et preuves](dashboard-consolidation-complete.md).
