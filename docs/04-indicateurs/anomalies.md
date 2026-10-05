# Indicateurs sur les Anomalies

## 1. Population

Une Issue GitHub de type `🐛 Bug` est une **Anomalie hors Audit**.

Lorsqu'une Issue de type `🐛 Bug` est une sub-Issue d'un Audit, elle est
une **Anomalie issue d'un Audit**.

``` text
Anomalie
├── hors Audit
└── issue d'un Audit
```

Cette distinction qualifie l'origine de l'Anomalie sans modifier son
unité de comptage.

------------------------------------------------------------------------

## 2. Unité de comptage

``` text
1 Issue GitHub qualifiée comme Anomalie
=
1 Anomalie comptée
```

Le pipeline ne compte pas les occurrences décrites à l'intérieur du
texte de l'Issue.

------------------------------------------------------------------------

## 3. Stock d'Anomalies

Une vue opérationnelle peut distinguer :

``` text
détectées
traitées
non traitées
```

Une Anomalie traitée est :

``` text
Done + Closed
```

Elle quitte le stock à traiter mais reste dans l'historique.

------------------------------------------------------------------------

## 4. Taux de traitement

### Question

Quelle proportion des Anomalies détectées a été traitée ?

### Formule

``` text
Anomalies traitées
/
Anomalies détectées
```

### Ventilations

La définition peut être ventilée notamment par :

-   Librairie ;
-   Component ;
-   Version / contexte d'Audit ;
-   criticité RGAA pour les Anomalies d'Audit Accessibilité ;
-   catégorie a11y.

------------------------------------------------------------------------

## 5. Anomalies par Component

Une Anomalie d'Audit concerne exactement un Component.

Pour les Issues générales multi-Components, une Issue apparaît dans
chacun des Components concernés mais une seule fois dans le total global
distinct.

La somme des compteurs Component peut donc dépasser le total global.

------------------------------------------------------------------------

## 6. Anomalies par criticité

La ventilation RGAA concerne strictement les Anomalies d'Audit
Accessibilité.

Elle ne doit pas absorber les autres domaines de criticité.

------------------------------------------------------------------------

## 7. Anomalies par catégorie

Les catégories `a11y` permettent notamment de mesurer la répartition des
problèmes d'accessibilité.

Cette ventilation ne change pas l'unité de comptage :

``` text
1 Issue Anomalie = 1 Anomalie
```

------------------------------------------------------------------------

## 8. Délai de correction

Le besoin métier porte sur le délai :

``` text
détection
→
correction
```

avec des agrégats tels que :

-   moyenne ;
-   médiane ;
-   P90.

**Statut : À INSTRUIRE.**

La date de détection et la date de correction ne sont pas encore
suffisamment définies pour produire un indicateur normatif.

------------------------------------------------------------------------

## 9. Anomalies issues d'un Audit

Une Anomalie d'Audit appartient à exactement un Audit.

Cette relation permet des analyses par :

-   Audit ;
-   Component ;
-   Version auditée ;
-   famille d'Audit ;
-   criticité ;
-   catégorie.

------------------------------------------------------------------------

## 10. Erreurs d'intégration clientes

Une Issue annulée parce que le problème est exclusivement une erreur
d'intégration côté Application doit rester visible pour le pilotage de
la Squad.

Elle ne doit pas être intégrée comme Anomalie intrinsèque du Design
System.

Une vue spécifique regroupée par Component est prévue pour ce besoin.

------------------------------------------------------------------------

## 11. Usage des Components

Le rapprochement :

``` text
nombre d'Anomalies
/
fréquence réelle d'utilisation du Component
```

est un besoin futur.

La source permettant de connaître les Applications consommatrices et le
nombre d'occurrences n'est pas encore définie.

------------------------------------------------------------------------

## Origine des Anomalies

### V1

La ventilation d'origine est limitée à :

``` text
Audit
Hors Audit
```

Aucun indicateur V1 ne doit subdiviser `Hors Audit` sans règle métier
supplémentaire.

### V2 --- à challenger

Une évolution pourra chercher à caractériser plus finement la provenance
des Anomalies hors Audit.

Une première dimension métier identifiée est :

``` text
remontée depuis la Squad
vs
remontée depuis l'extérieur de la Squad
```

D'autres dimensions et indicateurs pourront être étudiés, mais ils ne
sont pas encore définis.

Avant de les introduire, il faudra notamment préciser :

- la valeur métier recherchée ;
- la source permettant de déterminer l'origine ;
- la fiabilité de cette source ;
- les catégories utiles ;
- les indicateurs réellement actionnables.

Ces éléments ne font pas partie du contrat V1.

------------------------------------------------------------------------

## Date de détection

Pour les indicateurs portant sur les Anomalies :

``` text
date de détection = date de création GitHub de l'Issue 🐛 Bug
detectedAt = issue.createdAt
```

Cette définition est commune aux Anomalies issues d'un Audit et hors
Audit. Elle fournit le point de départ du calcul du délai
détection → correction. La date de correction est définie séparément.
