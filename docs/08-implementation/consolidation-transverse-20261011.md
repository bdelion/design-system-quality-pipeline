# Contrat transversal de lecture métier — octobre 2026

## Sémantique

- **Issue** : objet GitHub générique ; les types `BUG` et `AUDIT` ne prouvent pas à eux seuls une anomalie RGAA ou un audit normalisé.
- **Audit** : entité normalisée, rattachée à un composant et, lorsqu'elle est connue, à une version canonique. Les états `not_evaluated` et `in_progress` n'ont pas de verdict définitif.
- **Anomalie RGAA** : entité normalisée distincte de l'audit. Une anomalie n'est attribuée à un audit qu'en présence d'un lien explicite.
- **Component × Version** : le verdict analytique `NON_COUVERT` n'est pas synonyme de `NON_CONFORME`. Un audit de v1 ne vaut pas preuve de conformité de v2.

## Contrats et limites

Le module `src/dashboard/audit-read-model.ts` centralise la classification, la séparation progression/verdict et la lecture traçable des relations d'audit. Les KPI restent produits par Analytics : la couche HTML ne doit pas recalculer les verdicts.

Les données manquantes ne sont jamais déduites d'une simple coïncidence de composant ou de l'état GitHub `CLOSED`. Les références de version non résolues doivent rester visibles comme telles.

## Points restant à vérifier en intégration

- Les pages dynamiques issues/composants/cartographie utilisent des scripts clients indépendants : leur navigation contextuelle et leurs filtres doivent être testés en navigateur.
- Les états d'audit ne comportent pas encore de statut d'annulation dédié dans le contrat `AuditStatus` ; une extension de modèle est nécessaire pour distinguer explicitement l'annulation.
- Les indicateurs de flux temporels nécessitent deux snapshots comparables ; un seul snapshot ne permet pas de reconstituer les transitions.
