# Modèle analytique V2

Les métriques sont calculées après normalisation et contrôle qualité. Une métrique V2 est auto-documentée : valeur, unité, numérateur/dénominateur, périmètre, définition, entités sources, réserves DQ et exclusions sont conservés ensemble dans le snapshot.

## Familles

- `portfolio.*` : état du patrimoine et couverture des audits ;
- `audit.*` : volume et résultats des audits ;
- `anomaly.*` : stock, criticité, catégories et délais de correction.

## Couverture

`portfolio.auditCoverage` mesure les composants actifs disposant d'au moins un audit terminé rapportés aux composants actifs du patrimoine. Le nombre d'audits terminés est une métrique distincte (`audit.completed`).

## Conformité

`audit.conformityRate` mesure les audits conformes rapportés aux audits terminés. Le dashboard doit toujours afficher le numérateur et le dénominateur avec le pourcentage.

## Délais

Les métriques `anomaly.correctionDelay.average`, `.median` et `.p90` utilisent le délai calendaire entre `createdAt` et `firstDoneAt`. Une absence d'observation produit `unknown`.

## Impact des règles DQ

Une règle DQ n'exclut plus implicitement une entité de tous les KPI. Elle déclare ses impacts métrique par métrique : `include`, `exclude` ou `unknown`. La fiabilité d'une métrique dépend uniquement des réserves qui la concernent.

Les données sources et les entités exclues restent conservées dans le snapshot pour permettre l'explication et la correction.
