# Snapshots

## 1. Rôle

Le Snapshot est l'enveloppe immuable qui rassemble les données et
résultats d'une exécution du pipeline.

Il permet de séparer :

``` text
calcul du pipeline
        ↓
Snapshot
        ↓
dashboard / historique / exports
```

Le dashboard n'a donc pas besoin de recalculer les règles métier ou
analytiques.

------------------------------------------------------------------------

## 2. Contrat actuellement implémenté

Un Snapshot contient :

-   `snapshotId` ;
-   `capturedAt` ;
-   `scope` ;
-   `rawData` ;
-   `normalizedData` ;
-   `dataQuality` ;
-   `analytics` ;
-   `ruleVersion` ;
-   `modelVersion` ;
-   `reliability`.

`dataQuality` contient les alertes et une synthèse par sévérité.

`analytics` contient le contrat analytique V2 et, lorsqu'ils existent,
les flux calculés par comparaison avec le Snapshot précédent.

------------------------------------------------------------------------

## 3. Immutabilité

`buildSnapshot` clone les structures qui lui sont transmises.

Le Snapshot enregistré ne doit donc pas changer parce qu'un objet en
mémoire est modifié après sa construction.

Ce principe permet :

-   l'explication a posteriori ;
-   la comparaison de deux exécutions ;
-   la reproductibilité des analyses ;
-   la séparation entre production et restitution.

------------------------------------------------------------------------

## 4. Identité et date de capture

L'implémentation actuelle génère un `snapshotId` à partir :

-   de la date de capture ;
-   d'un suffixe UUID.

`capturedAt` représente la date de création du Snapshot.

Cette date est une **date d'observation du pipeline**. Elle ne doit pas
être confondue avec une date métier telle que la date exacte de
détection d'une Anomalie, de correction ou de Release.

------------------------------------------------------------------------

## 5. Versions du modèle et des règles

Le Snapshot conserve :

``` text
modelVersion
ruleVersion
```

Ces informations sont nécessaires pour interpréter un Snapshot
historique lorsque le modèle ou les règles évoluent.

Une comparaison entre Snapshots de versions incompatibles devra être
explicitement encadrée plutôt que supposée valide.

------------------------------------------------------------------------

## 6. Fiabilité

Le Snapshot possède actuellement une propriété globale :

``` text
reliability
```

L'implémentation actuelle la positionne à `partial` dès qu'au moins une
alerte DQ existe.

En parallèle, chaque métrique V2 possède sa propre fiabilité calculée à
partir des impacts DQ qui la concernent.

La fiabilité **métrique-spécifique** constitue le principe analytique le
plus précis :

``` text
problème sur une métrique
≠
toutes les métriques sont nécessairement partielles
```

La fiabilité globale actuelle doit donc être considérée comme une
synthèse technique grossière jusqu'à sa révision éventuelle.

------------------------------------------------------------------------

## 7. Écriture actuelle

Le pipeline produit actuellement :

``` text
data/current/snapshot.json
```

et conserve également des Snapshots de runs sous :

``` text
data/runs/
```

Lors de l'audit M0 :

-   `data/current/snapshot.json` était versionné ;
-   `data/runs/` était ignoré par Git.

Cette situation décrit la politique actuelle du repository ; la
stratégie cible de conservation sera définie séparément.

------------------------------------------------------------------------

## 8. Snapshot comme contrat

Le Snapshot est le contrat de restitution actuel.

Il doit conserver suffisamment d'informations pour :

-   afficher une métrique ;
-   afficher son numérateur et son dénominateur ;
-   expliquer sa définition ;
-   identifier ses entités sources ;
-   exposer sa fiabilité ;
-   exposer ses exclusions ;
-   remonter aux alertes DQ pertinentes.

Le frontend ne doit pas recréer ces décisions.

------------------------------------------------------------------------

## 9. Limites

Un Snapshot représente ce que le pipeline **connaissait au moment de la
capture**.

Il ne doit pas être réinterprété rétroactivement à partir d'informations
découvertes plus tard.

Cette propriété sera particulièrement importante pour les futurs
historiques de Versions et d'Audits de rattrapage.
