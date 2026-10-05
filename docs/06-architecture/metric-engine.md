# Metric Engine

## Statut

**ÉTAT IMPLÉMENTÉ**, sauf mention explicite d'une cible.

## Rôle

Le Metric Engine transforme le modèle normalisé et les impacts Data
Quality en métriques auto-documentées.

``` text
NormalizedData
      +
DataQualityIssue[]
      ↓
Metric Engine
      ↓
Analytics.metrics
```

## Catalogue contractuel

Le contrat déclaratif se trouve dans :

``` text
src/analytics/catalog.ts
```

Chaque métrique calculée doit correspondre à un contrat connu.

Le contrat définit notamment :

-   identifiant ;
-   unité ;
-   scope ;
-   définition ;
-   nature `stock`, `ratio`, `duration` ou `flow` ;
-   labels éventuels du numérateur et du dénominateur ;
-   notes éventuelles.

Le moteur vérifie les identifiants produits afin d'éviter l'apparition
silencieuse d'une métrique non documentée.

## Objet Metric

Une métrique V2 transporte avec sa valeur :

-   numérateur ;
-   dénominateur ;
-   périmètre ;
-   période éventuelle ;
-   définition ;
-   entités sources ;
-   fiabilité ;
-   exclusions ;
-   breakdowns éventuels.

L'objectif est que la restitution puisse expliquer la métrique sans
réimplémenter sa formule.

## Impacts DQ

Les alertes DQ peuvent déclarer des impacts :

``` text
include
exclude
unknown
```

par pattern de métrique.

Le moteur détermine la fiabilité de chaque métrique uniquement à partir
des alertes qui la concernent.

Schématiquement :

``` text
aucune réserve pertinente
    → reliable

réserve pertinente
    → partial

impact unknown
    → unknown
```

Les exclusions sont conservées dans la métrique sous forme d'identifiant
d'entité et de règle.

## Valeur inconnue

Lorsque le calcul n'est pas possible, le moteur utilise :

``` text
unknown
```

et non une valeur numérique inventée.

Cette distinction est particulièrement importante pour les ratios et les
délais.

## Stocks

Les stocks décrivent l'état visible dans le Snapshot courant.

Exemples :

``` text
anomaly.total
anomaly.open
anomaly.correctedEver
```

`correctedEver` signifie qu'une première correction est observable dans
les données disponibles. Il ne s'agit pas du nombre de corrections sur
une période.

## Flux

Les flux sont produits à partir d'un `SnapshotDiff`.

Ils ne sont disponibles que lorsqu'un Snapshot précédent comparable
existe.

Chaque métrique de flux doit porter :

``` text
period.from
period.to
```

Le Metric Engine ne doit pas fabriquer un flux temporel à partir d'un
simple état courant.

## Compatibilité legacy

Le modèle `Analytics` contient encore des propriétés historiques telles
que :

``` text
anomaliesDeclared
anomaliesCorrected
openAnomalies
auditsCoverage
conformityRate
averageCorrectionDelayDays
medianCorrectionDelayDays
```

Elles sont des projections de compatibilité du contrat V2 et sont
marquées comme dépréciées.

Tout nouvel écran ou calcul doit consommer :

``` text
Analytics.metrics
```

ou les flux V2 lorsqu'ils sont applicables.

## Cible

Le catalogue métier final sera plus large que le catalogue technique
actuel.

La prochaine consolidation devra partir :

-   des besoins métier ;
-   des décisions D-001 à D-136 ;
-   des objets et cardinalités consolidés ;
-   des règles DQ applicables.

Le moteur ne doit pas être étendu simplement parce qu'un indicateur
paraît utile : sa définition, son périmètre, ses sources et sa
temporalité doivent être établis auparavant.
