# Anomalies

## Définition actuelle dans le logiciel

La configuration actuelle déclare `BUG` comme Issue Type d'anomalie. Le normaliseur actuel reconnaît donc les anomalies à partir de cette configuration.

## Limite connue

La spécification métier indique que la notion de Bug peut être portée par un label ou un Issue Type, et peut varier selon repository ou organisation.

**Décision non prise :** le modèle cible doit être capable d'exprimer une définition configurable de l'anomalie.

## États normalisés actuels

`open`, `in_progress`, `done`, `reopened`, `cancelled`.

## Criticité

Le modèle actuel utilise :

- `blocking`
- `major`
- `minor`
- absence de criticité.

Les sources métier demandent explicitement de distinguer la criticité accessibilité/RGAA/WAI-ARIA d'autres domaines de criticité : métier, fonctionnelle, technique, developer experience et designer experience.

**Proposition issue des échanges :** introduire une notion de domaine de criticité avant de généraliser les règles DQ. Cette proposition n'est pas encore une décision implémentée.

## Distinction opérationnelle dans le dashboard V2.2

La spécialisation normalisée BUG est conservée conformément au modèle actuel. Elle ne prouve pas, à elle seule, une anomalie RGAA : l'explorateur et la chaîne de preuve indiquent « Bug hors audit · qualification RGAA non prouvée » lorsque aucune criticité ni catégorie accessibilité normalisée n'est présente. Les colonnes de criticité et catégorie restent inconnues ; aucune catégorie RGAA ni relation d'audit n'est inventée. Une origine d'audit nécessite une relation parent explicite, valide et non ambiguë. Les métriques `anomaly.*` portent sur la spécialisation métier configurée, tandis que les répartitions par catégorie/criticité ne comptent que les données reconnues.

## Qualification accessibilité indépendante

**IMPLÉMENTÉ :** `Analytics.workspaces` distingue qualifiée (audit explicitement lié ou label contenant Audit et RGAA), présumée (signaux a11y/RGAA à examiner) et non qualifiée. La spécialisation `Anomaly` reste plus large et ses anciens indicateurs ne deviennent pas des indicateurs RGAA. Aucun label ne crée une relation d’audit. Voir la [population et la liste de revue](../08-implementation/dashboard-role-refactor.md).
