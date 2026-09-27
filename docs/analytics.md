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


## Contrat de référence

`Analytics.metrics` est la seule source de vérité analytique. Les propriétés historiques (`anomaliesDeclared`, `auditsCoverage`, `conformityRate`, etc.) sont des projections de compatibilité et ne doivent plus être utilisées pour implémenter de nouveaux calculs ou écrans.

## Stock et flux

Les métriques actuellement disponibles sont principalement des **stocks** ou des états observables dans un snapshot. En particulier, `anomaly.correctedEver` signifie « déjà corrigée au moins une fois dans les données disponibles » et `anomaly.reopened` signifie « actuellement dans l'état rouvert ». Ce ne sont pas des flux temporels.

Les vrais flux (`created`, `corrected`, `reopened`, `cancelled`) nécessitent la comparaison de deux snapshots ou un historique d'événements. Ils seront introduits avec une période explicite (`period.from` / `period.to`) et un numérateur/dénominateur correspondant. Tant que cet historique n'existe pas, aucun dashboard ne doit présenter ces états comme des flux sur une période.

## Migration

Lorsqu'un écran a besoin d'un indicateur, il doit récupérer `analytics.metrics[metricId]` et utiliser sa `value`, son `numerator`, son `denominator`, sa `definition`, sa `scope`, sa `reliability` et ses `exclusions`. Cela garantit que le rendu ne réimplémente pas la logique métier.

## Catalogue contractuel

Le catalogue déclaratif est défini dans `src/analytics/catalog.ts`. Il décrit pour chaque métrique son unité, son périmètre, sa définition et sa nature analytique (`stock`, `ratio`, `duration` ou `flow`). Le moteur vérifie à chaque calcul que les identifiants produits sont couverts par ce catalogue.

Les métriques `anomaly.byCategory.*` utilisent un contrat générique ; chaque catégorie concrète est une instance de ce contrat.

Aucune métrique `flow` n'est actuellement produite. Lors de l'introduction de l'historique, une métrique de flux devra obligatoirement porter une période explicite.

## Comparaison de snapshots

`src/snapshots/diff.ts` compare deux snapshots ordonnés et produit des faits de transition sans modifier les snapshots sources : entités ajoutées/supprimées, changements d'état d'anomalies, premières corrections observées, entrées en état `reopened` et passages à `cancelled`.

Une transition est toujours rattachée à la période `[capturedAt du snapshot précédent, capturedAt du snapshot courant]`. Les futurs indicateurs de flux devront être construits à partir de ce delta et porter cette période explicitement.
