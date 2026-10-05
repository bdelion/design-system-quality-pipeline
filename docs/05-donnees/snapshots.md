# Snapshots

## 1. Rôle

Le Snapshot est une photographie immuable de ce que le pipeline connaît
lors d'une exécution.

Il sépare le calcul de sa restitution :

``` text
collecte
  ↓
normalisation
  ↓
Data Quality
  ↓
Analytics
  ↓
Snapshot
  ├── Dashboard
  ├── Historique
  └── Exports
```

------------------------------------------------------------------------

## 2. Contrat actuellement implémenté

Le Snapshot actuel contient notamment :

``` text
snapshotId
capturedAt
scope
rawData
normalizedData
dataQuality
analytics
ruleVersion
modelVersion
reliability
```

Les données et résultats transmis au Snapshot sont clonés afin que sa
représentation ne change pas après sa construction.

------------------------------------------------------------------------

## 3. capturedAt

`capturedAt` représente :

``` text
la date d'observation du pipeline
```

Il ne faut pas l'utiliser implicitement comme :

-   date de détection d'une Anomalie ;
-   date de correction ;
-   date de fin d'un Audit ;
-   date de Release.

Ces dates métier doivent provenir de règles ou sources explicitement
définies.

------------------------------------------------------------------------

## 4. Deux axes temporels

Le modèle doit distinguer :

### Temps métier

``` text
Release
Audit
détection
correction
décommission
```

### Temps d'observation

``` text
Snapshot.capturedAt
```

Une information peut être observée après la date réelle de l'événement
métier.

------------------------------------------------------------------------

## 5. Immutabilité

Un Snapshot historique doit rester interprétable selon :

``` text
modelVersion
ruleVersion
```

et selon les données effectivement connues lors de sa capture.

Une nouvelle règle ou une nouvelle information ne doit pas modifier
silencieusement un ancien Snapshot.

------------------------------------------------------------------------

## 6. Fiabilité

Le Snapshot possède actuellement une fiabilité globale.

Le contrat analytique possède également une fiabilité par métrique.

La fiabilité métrique-spécifique est la plus précise :

``` text
problème sur une donnée
        ↓
métriques réellement dépendantes
```

et non :

``` text
une alerte DQ
        ↓
toutes les métriques deviennent partielles
```

La fiabilité globale actuelle reste donc une synthèse technique
grossière.

------------------------------------------------------------------------

## 7. Snapshot courant et historique

L'implémentation actuelle distingue notamment :

``` text
data/current/snapshot.json
```

et des Snapshots de runs sous :

``` text
data/runs/
```

La politique cible de conservation et de stockage reste à définir.

------------------------------------------------------------------------

## 8. Snapshot de Release

Le besoin métier impose de pouvoir restituer l'état connu à la
publication d'une Version.

Cela ne signifie pas encore qu'un Snapshot doit nécessairement être créé
exactement à chaque Release : `Q-034` reste ouverte.

Le contrat cible doit néanmoins permettre d'identifier une photographie
historique pertinente pour la Release.

------------------------------------------------------------------------

## 9. Audit de rattrapage

Un Snapshot capturé après un Audit de rattrapage peut contenir une
connaissance plus riche d'une ancienne Version.

Il ne doit pas réécrire le Snapshot ou la vue historique correspondant à
la publication de cette Version.

------------------------------------------------------------------------

## 10. Comparaison

Le diff de deux Snapshots produit des changements observables.

Il ne doit pas fabriquer une date métier exacte lorsque seule une
fenêtre d'observation est connue.

------------------------------------------------------------------------

## 11. Questions ouvertes

Restent notamment à instruire :

-   `Q-034` --- événements déclenchant les Snapshots ;
-   `Q-035` --- représentation complète de la connaissance historique ;
-   `Q-036` --- durée de conservation ;
-   `Q-042` --- stockage cible.

Ces questions doivent être résolues avant de figer la stratégie de
persistance.
