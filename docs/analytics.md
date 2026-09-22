# Calculs KPI

Les KPI sont calculés après normalisation et évaluation des règles qualité.

## Périmètre

Les anomalies ciblées par une alerte `action: exclude` sont retirées du périmètre des indicateurs concernés. Les alertes `include` conservent l'objet et rendent la fiabilité `partial`.

Les anomalies annulées sont toujours exclues de tous les KPI, même lorsqu'elles ne déclenchent aucune alerte de relation. Elles restent visibles dans le snapshot pour la traçabilité.

## Indicateurs

- **Anomalies déclarées** : anomalies conservées après exclusion.
- **Anomalies corrigées** : anomalies conservées ayant une date de première correction métier.
- **Anomalies ouvertes** : anomalies `open` ou `reopened`.
- **Répartition par criticité** : comptage par `blocking`, `major` et `minor`.
- **Répartition par catégorie** : comptage par catégorie d'accessibilité.
- **Couverture des audits** : audits terminés rapportés aux composants découverts.
- **Taux de conformité** : audits conformes rapportés aux audits terminés.
- **Délai moyen et médian** : durée entre `createdAt` et `firstDoneAt`.

Une moyenne ou une médiane sans observation est `unknown`. Les dates sont traitées en jours calendaires.
