# Modèle de données

## Entités principales

- `RawProjectStatus` : statut d'une issue dans un GitHub Project, conservé pour chaque issue.
- `RawDataset` : résultat brut d'une collecte.
- `Library` : repository normalisé.
- `Component` : composant identifié dans GitHub et éventuellement enrichi par le catalogue.
- `Audit` : résultat d'audit rattaché à un composant.
- `Anomaly` : problème qualité rattaché à un audit et un composant.
- `PullRequest` : correction ou changement relié aux issues.
- `DataQualityIssue` : décision produite par une règle.
- `Analytics` : KPI calculés avec périmètre et fiabilité.
- `Snapshot` : enveloppe immuable de l'ensemble des résultats.

Une anomalie porte `cancelled` et les statuts Project ayant déclenché cette décision. Un seul Project au statut configuré `Cancelled` suffit pour marquer l'anomalie comme annulée.

## Provenance

Chaque entité normalisée porte `source`, `sourceId` et `collectedAt`. Cette information permet de remonter d'un KPI ou d'une alerte vers l'objet qui l'a produit.

## Fiabilité

Les statuts `reliable`, `partial`, `unknown` et `invalid` évitent de confondre absence de preuve et résultat négatif. Par exemple, une absence de date de correction produit un délai inconnu, pas un délai nul.

## Identifiants

`stableId(prefix, value)` produit un identifiant déterministe. Les mêmes données produisent donc les mêmes identifiants entre deux exécutions, ce qui facilite les comparaisons de snapshots.
