# Quality Rules

Les Quality Rules contrôlent la fiabilité des données après la normalisation GitHub et avant le calcul des KPI. Elles ne suppriment pas les données sources : elles indiquent si une donnée doit être incluse, exclue d'un indicateur ou signalée.

## Comment lire une règle

- **Sévérité** : `ERROR` indique un problème bloquant pour l'indicateur concerné ; `WARNING` indique une réserve de qualité.
- **Action** : `exclude` retire l'objet du KPI concerné, `include` le conserve avec une réserve, `block` bloquerait le traitement.
- **Traçabilité** : chaque anomalie contient la règle, l'entité concernée, le message et la date de détection.

## Règles configurées

| Règle | Sujet | Sévérité | Action |
| --- | --- | --- | --- |
| [DQ-001](quality-rules/DQ-001.md) | Criticité absente | ERROR | exclude |
| [DQ-002](quality-rules/DQ-002.md) | Criticités incompatibles | ERROR | exclude |
| [DQ-003](quality-rules/DQ-003.md) | Parents multiples | ERROR | exclude |
| [DQ-004](quality-rules/DQ-004.md) | PR de correction absente | WARNING | include |
| [DQ-005](quality-rules/DQ-005.md) | PR fusionnée et issue ouverte | WARNING | include |
| [DQ-006](quality-rules/DQ-006.md) | Composant absent du catalogue | WARNING | include |
| [DQ-007](quality-rules/DQ-007.md) | Label inconnu | WARNING | include |
| [DQ-008](quality-rules/DQ-008.md) | Issue annulée référencée par une PR | ERROR | exclude |
| [DQ-009](quality-rules/DQ-009.md) | Nexus indisponible | WARNING | include |
| [DQ-010](quality-rules/DQ-010.md) | Issue annulée rattachée à une milestone | ERROR | exclude |

Les issues dont un Project porte le statut `Cancelled` ne sont pas évaluées par les règles générales `DQ-001` à `DQ-007` et `DQ-009`. Seules les relations interdites couvertes par `DQ-008` et `DQ-010` sont contrôlées.

## Source de vérité

Les identifiants, sévérités, actions et messages sont définis dans [`config/quality-rules.yaml`](../config/quality-rules.yaml). L'implémentation correspondante se trouve dans [`src/quality/rules.ts`](../src/quality/rules.ts).
