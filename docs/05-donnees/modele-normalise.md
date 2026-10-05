# Modèle normalisé

## Objectif

Le modèle normalisé traduit les données RAW en objets exploitables par
le métier sans exposer directement la structure de l'API GitHub.

Il constitue la frontière entre :

``` text
formats des sources
        ↓
normalisation
        ↓
concepts utilisés par le pipeline
```

## État actuellement implémenté

Le modèle TypeScript actuel contient principalement :

-   `Library` ;
-   `Component` ;
-   `Audit` ;
-   `Anomaly` ;
-   `PullRequest`.

Cet inventaire décrit **l'état du code actuel**. Il ne doit pas être
interprété comme le modèle métier cible complet.

Les décisions D-001 à D-136 ont déjà établi ou introduit des concepts
supplémentaires, notamment autour des Packages, Versions, Improvements,
Catalogues historiques et Audits applicables. Leur traduction dans le
modèle normalisé sera définie après la consolidation métier.

## Relations

Les objets normalisés sont reliés par des identifiants stables.

Le normaliseur peut ainsi établir des relations entre :

-   Library et Components ;
-   Components et Audits ;
-   Audits et Anomalies ;
-   Issues et Pull Requests selon les données disponibles.

Les cardinalités métier cibles ne doivent pas être déduites uniquement
des structures TypeScript actuelles.

## Identifiants stables

L'implémentation utilise `stableId(prefix, value)` pour produire des
identifiants déterministes.

À entrée équivalente, le même objet logique reçoit donc le même
identifiant stable.

Ce mécanisme facilite notamment :

-   les relations entre objets normalisés ;
-   les comparaisons de Snapshots ;
-   la détection de changements entre exécutions.

Un identifiant stable technique ne remplace pas pour autant la
définition d'une identité métier. Cette dernière doit rester documentée
pour chaque objet.

## Provenance

Les entités normalisées conservent une provenance permettant de remonter
vers les données ayant servi à leur construction.

Le modèle actuel utilise notamment des informations telles que :

-   `source` ;
-   `sourceId` ;
-   `collectedAt`.

La provenance permet d'expliquer :

-   l'origine d'une entité ;
-   l'origine d'une alerte DQ ;
-   les entités ayant contribué à une métrique.

## État de qualité

Le contrat actuel définit les statuts :

``` text
reliable
partial
unknown
invalid
```

Ils permettent de distinguer plusieurs situations qui ne doivent pas
être confondues.

Par exemple, une information absente ne doit pas être transformée
artificiellement en valeur zéro.

La stratégie cible de fiabilité est métrique-spécifique : une
incohérence sur une dimension ne doit pas automatiquement rendre toutes
les métriques du Snapshot partielles.

## Exemple : valeur inconnue

Si la date nécessaire au calcul d'un délai n'est pas disponible, le
pipeline doit représenter le délai comme inconnu plutôt que comme nul.

``` text
absence de preuve
≠
valeur métier égale à zéro
```

## Indépendance vis-à-vis des sources

Le modèle normalisé est la couche destinée à accueillir d'autres sources
que GitHub.

Une nouvelle source doit être adaptée vers les concepts normalisés au
moyen d'un mapping explicite, sans imposer son schéma propre au moteur
de métriques ou au dashboard.

## Évolution du modèle

L'enrichissement du modèle doit suivre l'ordre suivant :

1.  décision ou définition métier ;
2.  cardinalités et règles ;
3.  contrat normalisé ;
4.  mapping depuis le RAW ;
5.  Data Quality ;
6.  métriques ;
7.  restitution.

Le code existant ne doit donc pas être utilisé pour limiter
artificiellement le modèle métier cible.
