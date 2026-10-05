# Rapports historiques

Ce répertoire contient des rapports produits à un instant donné pour
valider, analyser ou documenter un état du pipeline.

Ces documents sont conservés pour leur valeur de traçabilité mais ne
constituent pas la documentation normative courante.

## Règles

Un rapport historique :

-   décrit un état ou une exécution datée ;
-   peut contenir des valeurs devenues obsolètes ;
-   peut refléter un modèle, une fixture ou des règles antérieurs ;
-   ne doit pas être utilisé seul pour définir le comportement métier
    actuel.

Pour connaître le contrat courant, utiliser les pages structurées sous
`docs/00-cadrage/` à `docs/08-implementation/`.

## Rapports archivés

### `analytics-v2-fixture-report.md`

Rapport de validation du contrat Analytics V2 sur une fixture et un
Snapshot daté du `2026-09-08T09:00:00.000Z`.

Il documente notamment :

-   les valeurs alors obtenues pour les métriques Portfolio, Audit et
    Anomaly ;
-   les effets observés de DQ-001, DQ-006, DQ-007 et DQ-009 ;
-   la nécessité d'une fiabilité portée par métrique ;
-   la distinction entre stock et futur flux temporel.

Les valeurs numériques et conclusions liées aux règles DQ doivent être
lues dans leur contexte historique et non comme définitions métier
actuelles.
