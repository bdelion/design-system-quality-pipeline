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
