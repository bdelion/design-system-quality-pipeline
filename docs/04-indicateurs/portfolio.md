# Indicateurs Portfolio

## 1. Objectif

La vue Portfolio fournit une synthèse transverse sans perdre les
distinctions entre :

-   Librairies ;
-   Components ;
-   Audits ;
-   Anomalies ;
-   Versions ;
-   qualité des données.

Elle doit être compréhensible par un responsable sans exposer
inutilement le jargon interne de Data Quality.

------------------------------------------------------------------------

## 2. Issues globales

Le total Portfolio d'Issues doit compter les Issues distinctes.

Une Issue multi-Component compte :

``` text
1 fois au Portfolio
```

même si elle apparaît dans plusieurs vues Component.

Il est utile de distinguer :

``` text
total Issues distinctes
Issues avec Component
Issues sans Component
```

------------------------------------------------------------------------

## 3. Couverture d'Audit

La couverture peut être agrégée au niveau Portfolio à partir des
Components du périmètre applicable.

``` text
Components couverts
/
Components du Catalogue applicable
```

L'agrégation doit conserver la possibilité de descendre par Librairie.

------------------------------------------------------------------------

## 4. Conformité

Le taux de conformité Portfolio suit la même définition métier :

``` text
Components conformes
/
Components couverts
```

Les Components non audités restent hors du dénominateur de conformité.

Le dashboard ne doit pas inventer un verdict de conformité d'une
Librairie ou du Portfolio si aucune règle métier ne le définit.

Il peut présenter un taux agrégé sans transformer ce taux en verdict
binaire.

------------------------------------------------------------------------

## 5. Anomalies

La vue Portfolio peut présenter :

-   nombre d'Anomalies détectées ;
-   nombre d'Anomalies non traitées ;
-   nombre d'Anomalies traitées ;
-   taux de traitement ;
-   répartition RGAA par criticité ;
-   répartition par catégorie a11y.

Les ventilations ne doivent pas provoquer de double comptage dans le
total distinct.

------------------------------------------------------------------------

## 6. Qualité des données

La vue manager ne doit pas imposer le vocabulaire `DQ-xxx`.

Elle peut présenter des informations orientées impact, par exemple :

``` text
Données complètes
Données partielles
Source indisponible
Valeur non calculable
```

Le détail technique reste accessible dans une vue de traçabilité.

------------------------------------------------------------------------

## 7. Versions

La vue Portfolio peut permettre la navigation vers les Versions de
chaque Librairie.

Un score synthétique de « qualité de Version » n'est pas encore défini
et ne doit pas être inventé.

------------------------------------------------------------------------

## 8. Tendances

Les tendances nécessitent des Snapshots comparables.

Elles doivent être interprétées selon la date de connaissance et non en
recalculant rétroactivement l'histoire avec les données actuelles.
