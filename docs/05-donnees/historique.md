# Historisation

## 1. Principe

L'historisation actuelle repose sur la comparaison de Snapshots.

``` text
Snapshot N-1
     +
Snapshot N
     ↓
diff
     ↓
faits de transition observables
     ↓
métriques de flow
```

Le diff ne modifie pas les Snapshots sources.

------------------------------------------------------------------------

## 2. Contrat de diff actuel

`src/snapshots/diff.ts` compare notamment :

-   Librairies ;
-   Composants ;
-   Audits ;
-   Anomalies ;
-   Pull Requests.

Pour chaque famille d'entités, il peut identifier :

``` text
added
removed
```

Pour les Anomalies, il produit également :

-   transitions d'état ;
-   Anomalies apparues ;
-   premières corrections devenues observables ;
-   passages à `reopened` ;
-   passages à `cancelled`.

------------------------------------------------------------------------

## 3. Ordre temporel

Le Snapshot précédent doit précéder le Snapshot courant :

``` text
before.capturedAt < after.capturedAt
```

Sinon la comparaison est refusée.

La période du diff est :

``` text
from = before.capturedAt
to   = after.capturedAt
```

------------------------------------------------------------------------

## 4. Flux dérivés

Lorsque le diff est disponible, les flux actuels sont :

``` text
anomaly.flow.created
anomaly.flow.corrected
anomaly.flow.reopened
anomaly.flow.cancelled
```

Ils portent explicitement la période de comparaison.

------------------------------------------------------------------------

## 5. Observation et événement métier

Un changement observé entre deux Snapshots signifie :

> l'état connu au second Snapshot diffère de l'état connu au premier.

Il ne prouve pas nécessairement que l'événement métier s'est produit
exactement à `capturedAt`.

Par exemple, une Anomalie apparue entre deux collectes est observée
comme `created` dans cette période, mais la date exacte de détection
doit provenir d'une source métier appropriée si elle est nécessaire au
KPI.

------------------------------------------------------------------------

## 6. Disparition d'une entité

Une entité absente du second Snapshot apparaît techniquement dans
`removed`.

Cette absence peut cependant avoir plusieurs causes :

-   suppression réelle ;
-   changement de périmètre ;
-   collecte partielle ;
-   indisponibilité d'une source ;
-   évolution d'identité ou de mapping.

Elle ne doit donc pas être interprétée automatiquement comme une
suppression métier sans garantie de complétude et de comparabilité.

------------------------------------------------------------------------

## 7. Comparabilité

La comparaison dépend notamment :

-   des identifiants normalisés ;
-   du périmètre ;
-   de la complétude des sources ;
-   de la compatibilité des versions du modèle et des règles.

L'implémentation actuelle compare les Snapshots à partir de leurs
identifiants normalisés et de leur ordre temporel. Une politique de
comparabilité plus explicite pourra être nécessaire avec l'évolution du
modèle.

------------------------------------------------------------------------

## 8. Historique métier futur

Le diff de Snapshots répond à la question :

``` text
qu'est-ce qui a changé entre deux observations ?
```

Il ne remplace pas tous les historiques métier.

Le modèle futur devra notamment distinguer :

-   état connu lors d'une Release ;
-   Audit réalisé avant PROD ;
-   Audit de rattrapage post-PROD ;
-   évolution ultérieure des Anomalies ;
-   connaissance actuelle ;
-   état historique immuable d'une Version.

Ces besoins seront consolidés avant toute évolution du moteur
d'historisation.
