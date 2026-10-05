# Indicateurs par Librairie

## 1. Objectif

La vue Librairie agrège les informations des Components et Issues
appartenant à une Librairie sans supposer que la somme des vues
Component correspond au nombre d'Issues distinctes.

------------------------------------------------------------------------

## 2. Issues

Présenter séparément :

``` text
Issues distinctes de la Librairie
Issues avec au moins un Component
Issues sans Component
```

Une Issue multi-Component compte une seule fois dans le total distinct
de la Librairie.

------------------------------------------------------------------------

## 3. Components

La vue peut présenter :

-   nombre de Components du Catalogue applicable ;
-   Components couverts par un Audit applicable ;
-   Components non couverts ;
-   Components conformes parmi les couverts ;
-   Components non conformes parmi les couverts.

------------------------------------------------------------------------

## 4. Couverture

``` text
Components couverts
/
Components du Catalogue applicable à la Librairie
```

Le Catalogue doit être celui du contexte historique considéré.

------------------------------------------------------------------------

## 5. Conformité

``` text
Components conformes
/
Components couverts
```

Un Component non audité n'est pas placé dans la population non conforme.

------------------------------------------------------------------------

## 6. Anomalies

La vue Librairie peut agréger :

-   détectées ;
-   traitées ;
-   non traitées ;
-   taux de traitement ;
-   criticités RGAA ;
-   catégories a11y.

Le taux de traitement agrégé ne constitue pas un verdict de conformité
de la Librairie.

------------------------------------------------------------------------

## 7. Versions

La vue doit permettre de descendre vers une Version donnée.

Les Audits de rattrapage doivent être distingués des Audits pré-PROD
afin de ne pas réécrire la connaissance disponible au moment de la
publication.

------------------------------------------------------------------------

## 8. Package

Aujourd'hui :

``` text
1 Librairie = 1 Package
```

Le modèle doit permettre plusieurs Packages à terme.

Les indicateurs ne doivent donc pas utiliser durablement le Repository
ou le Package comme identifiant métier unique de la Librairie.
