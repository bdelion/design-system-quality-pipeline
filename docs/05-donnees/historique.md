# Historisation

## 1. Objectif

L'historisation doit permettre de répondre à deux questions différentes
:

``` text
Que savions-nous à un instant donné ?
```

et :

``` text
Que savons-nous aujourd'hui d'un objet historique ?
```

Ces deux vues ne doivent jamais être confondues.

------------------------------------------------------------------------

## 2. Principe de non-réécriture du passé

Une information découverte après un événement historique peut enrichir
la connaissance actuelle sans modifier ce qui était connu à l'époque.

Exemple :

``` text
Version 1.4.0 publiée
        │
        │  aucun Audit disponible à la publication
        ▼
Audit de rattrapage réalisé plus tard
        │
        ▼
connaissance actuelle enrichie
```

La vue historique de la Version à sa publication doit continuer à
indiquer que le résultat d'Audit n'était pas encore connu.

------------------------------------------------------------------------

## 3. Snapshot

Le Snapshot représente l'état connu par le pipeline au moment de sa
capture.

``` text
capturedAt
=
instant d'observation du pipeline
```

Il ne constitue pas automatiquement la date métier des événements
contenus dans le Snapshot.

Par exemple :

``` text
Anomalie observée pour la première fois dans Snapshot N
```

ne signifie pas nécessairement :

``` text
date de détection = Snapshot N.capturedAt
```

------------------------------------------------------------------------

## 4. Comparaison de Snapshots

Le diff répond à :

``` text
qu'est-ce qui a changé entre deux observations ?
```

Il peut produire des faits tels que :

-   entité apparue ;
-   entité disparue ;
-   changement d'état ;
-   première correction devenue observable ;
-   réouverture devenue observable ;
-   annulation devenue observable.

Ces faits sont des transitions observées.

Ils ne remplacent pas une date métier explicite lorsqu'une telle date
est nécessaire.

------------------------------------------------------------------------

## 5. Historique d'une Version

Pour une Version PROD, il faut distinguer au minimum :

### État à la publication

``` text
Version
Catalogue applicable
Audits connus
conformité connue
Anomalies connues
couverture connue
```

### Connaissance actuelle

``` text
état historique initial
+
Audits de rattrapage
+
évolution du traitement des Anomalies
+
autres informations découvertes ultérieurement
```

La seconde vue complète la première ; elle ne la remplace pas.

------------------------------------------------------------------------

## 6. Audits pré-PROD

Dans le fonctionnement cible :

``` text
Release Candidate M.m.r-rc.n
        ↓
Audit
        ↓
Version PROD M.m.r
```

Le résultat d'un Audit terminé avant la publication peut faire partie de
la connaissance disponible à la sortie de la Version.

L'identification précise de la Release Candidate effectivement auditée
reste à instruire.

------------------------------------------------------------------------

## 7. Audits de rattrapage

Dans le fonctionnement de rattrapage :

``` text
Version PROD M.m.r
        ↓
Audit ultérieur
```

La Milestone peut être :

``` text
M.m.r-Audit
```

mais elle désigne toujours la Version métier :

``` text
M.m.r
```

Le résultat enrichit la connaissance actuelle de cette Version sans
modifier rétroactivement l'état connu lors de la publication.

------------------------------------------------------------------------

## 8. Évolution des Anomalies

L'historique doit permettre de distinguer :

``` text
Anomalie connue à la publication
Anomalie découverte ultérieurement
Anomalie non traitée
Anomalie traitée ultérieurement
Anomalie réouverte
Anomalie annulée
```

Une Anomalie traitée quitte le stock courant à traiter mais reste dans
l'historique.

------------------------------------------------------------------------

## 9. Catalogue historique

Le calcul historique d'une couverture doit utiliser le périmètre de
Components applicable à la Version considérée.

Une évolution ultérieure du Catalogue ne doit pas modifier le
dénominateur historique.

Le mécanisme technique permettant de reconstruire ou conserver ce
Catalogue historique reste à définir.

------------------------------------------------------------------------

## 10. Disparition d'une entité entre deux Snapshots

Une absence dans un Snapshot ultérieur ne signifie pas automatiquement
une suppression métier.

Elle peut provenir notamment :

-   d'un changement de périmètre ;
-   d'une collecte incomplète ;
-   d'une indisponibilité de source ;
-   d'un changement d'identité ou de mapping ;
-   d'une décommission réelle.

Le diff doit donc rester un constat d'observation tant que la cause
métier n'est pas établie.

------------------------------------------------------------------------

## 11. Comparabilité

Deux Snapshots ne sont réellement comparables que si leur contexte
permet une interprétation cohérente.

Les dimensions à considérer comprennent notamment :

``` text
scope
modelVersion
ruleVersion
sources disponibles
complétude de collecte
```

La politique technique complète de comparabilité reste à formaliser.

------------------------------------------------------------------------

## 12. Questions encore ouvertes

### Q-034 --- Granularité historique

Quels événements doivent provoquer un Snapshot ?

Pistes existantes :

-   exécution périodique ;
-   Release ;
-   fin de Sprint ;
-   Audit ;
-   exécution manuelle.

**Statut : À instruire.**

### Q-035 --- Historisation de la connaissance

Le principe de non-rétroactivité est établi, mais la représentation
technique complète de la connaissance historique reste à définir.

**Statut : À instruire.**

### Q-036 --- Conservation

La durée et la politique de rétention des Snapshots ne sont pas
définies.

**Statut : À instruire.**

### Q-042 --- Stockage historique

Le système de stockage cible des Snapshots reste à décider.

**Statut : À instruire ultérieurement.**

------------------------------------------------------------------------

## Reconstruction du Catalogue historique

Le Catalogue applicable à une Version PROD `M.m.r` est reconstruit à
partir de l'état du Repository identifié par le Git tag `M.m.r`.

``` text
Version PROD M.m.r
        ↓
Git tag M.m.r
        ↓
contenu du Repository
        ↓
Catalogue historique applicable
```

Cette règle permet de reconstruire le périmètre des Components tel qu'il
existait pour cette Version.

Les indicateurs historiques dépendant du Catalogue, en particulier la
couverture d'Audit, doivent utiliser ce périmètre et non le Catalogue
courant.

