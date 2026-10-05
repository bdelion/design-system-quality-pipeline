# Catalogue des indicateurs

## 1. Objectif

Ce dossier décrit les indicateurs métier du **Design System Quality
Pipeline**.

Il distingue trois niveaux :

-   **ÉTABLI** : définition métier suffisamment stabilisée ;
-   **IMPLÉMENTÉ** : métrique présente dans le moteur actuel,
    éventuellement avec une définition historique à confronter au métier
    ;
-   **FUTUR / À INSTRUIRE** : indicateur souhaité mais dont la source,
    la formule ou la sémantique n'est pas encore suffisamment définie.

Un indicateur ne doit pas être considéré comme établi uniquement parce
qu'il existe dans le code.

------------------------------------------------------------------------

## 2. Contrat d'une métrique

Le contrat Analytics V2 actuel représente notamment une métrique avec :

``` text
id
value
unit
numerator
denominator
scope
period?
definition
sourceEntityIds
reliability
exclusions
breakdowns?
```

Ce contrat est une bonne base de traçabilité.

La définition métier doit cependant précéder l'identifiant technique.

------------------------------------------------------------------------

## 3. Fiche de définition

Chaque indicateur stabilisé doit pouvoir répondre aux questions
suivantes.

### Identité

``` text
Nom
Question métier
Statut
```

### Calcul

``` text
Valeur
Unité
Numérateur
Dénominateur
Périmètre
Période
```

### Traçabilité

``` text
Entités sources
Exclusions
Fiabilité
Dimensions de ventilation
```

### Temporalité

``` text
À quel instant la valeur est-elle vraie ?
S'agit-il d'un stock, d'un flux ou d'une photographie historique ?
```

------------------------------------------------------------------------

## 4. Familles d'indicateurs

Le catalogue est organisé par vues métier :

-   Portfolio ;
-   Librairie ;
-   Component ;
-   Anomalies ;
-   Audits Accessibilité ;
-   Sprints ;
-   Versions ;
-   Qualité ;
-   indicateurs futurs.

Ces vues peuvent partager les mêmes métriques avec des scopes
différents.

------------------------------------------------------------------------

## 5. Principes de calcul établis

### Couverture d'Audit

``` text
Components couverts par un Audit applicable
/
Components du Catalogue applicable au périmètre
```

La couverture répond à :

> Quelle part du périmètre possède une information d'Audit applicable ?

### Taux de conformité

``` text
Components conformes
/
Components couverts par un Audit applicable
```

La conformité répond à :

> Parmi les Components dont la conformité est connue par un Audit
> applicable, quelle part est conforme ?

Un Component non audité n'est pas compté comme non conforme.

### Traitement des Anomalies

Le principe historique retenu est :

``` text
Anomalies traitées
/
Anomalies détectées
```

Une Anomalie traitée est `Done + Closed`.

Les vues par criticité doivent utiliser la même définition dans chaque
sous-population.

------------------------------------------------------------------------

## 6. Stock et historique

Il faut distinguer :

``` text
stock actuel
```

de :

``` text
état historique à un instant donné
```

Exemple :

-   nombre d'Anomalies ouvertes aujourd'hui ;
-   nombre d'Anomalies ouvertes au moment de la publication d'une
    Version.

Une correction ultérieure ne doit pas réécrire la photographie
historique d'une ancienne Version.

------------------------------------------------------------------------

## 7. Fiabilité

La fiabilité est attachée à la métrique.

Une alerte Data Quality n'affecte que les indicateurs qui dépendent
réellement de la donnée en cause.

``` text
DQ
  ↓
métriques concernées
  ↓
reliability
```

Le statut global du Snapshot ne doit pas remplacer cette analyse.

------------------------------------------------------------------------

## 8. Dimensions de ventilation

Les dimensions établies ou utiles comprennent notamment :

``` text
Librairie
Component
Version
Sprint / Iteration
criticité
catégorie a11y
Issue Type
Project Status
```

Une ventilation ne change pas la définition de la population globale.

Une Issue multi-Component peut apparaître dans plusieurs ventilations
Component tout en restant une seule Issue dans le total global distinct.

------------------------------------------------------------------------

## 9. Indicateurs non encore normatifs

Les éléments suivants ne disposent pas encore d'une définition métier
complète :

-   score global de qualité d'une Version ;
-   score global de qualité d'un Component ;
-   délai détection → correction d'une Anomalie ;
-   métriques nécessitant la consommation réelle des Applications ;
-   métriques normalisées par le nombre d'occurrences d'un Component ;
-   score ou badge d'une Application.

Ils restent documentés comme besoins ou pistes, pas comme métriques V1
établies.
