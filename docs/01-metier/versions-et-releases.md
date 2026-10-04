# Versions et releases

## 1. Objectif

Ce document décrit les notions de Package, Version et Release utilisées ou envisagées par le Design System Quality Pipeline.

L'objectif est notamment d'éviter de confondre plusieurs notions actuellement représentées dans différents systèmes :

- librairie ;
- package ;
- version de package ;
- Milestone GitHub ;
- Release ;
- version d'audit.

---

## 2. Situation actuelle établie

Une librairie du Design System est aujourd'hui distribuée sous la forme d'un package pouvant être directement utilisé par les applications.

Ce package :

- possède un nom ;
- possède plusieurs versions au cours de son cycle de vie ;
- est utilisé par les applications dans une version donnée.

La relation actuellement établie est donc :

```text
Librairie
    │
    │ correspond actuellement à
    ▼
Package
    │
    ├── Version 1
    ├── Version 2
    └── Version N
             ▲
             │ version utilisée
             │
        Application
```

Dans la situation actuelle :

```text
1 Librairie = 1 Package
```

Cette correspondance décrit la situation observée aujourd'hui.

Elle ne doit pas devenir une contrainte structurelle définitive du modèle.

---

## 3. Exemples réels

Trois couples Librairie / Package ont été identifiés.

### Design System React

```text
Librairie : Design System React
Package : @my-enterprise/design-system-react
Version actuelle déclarée : 1.7.1
```

### Enterprise Assets

```text
Librairie : Enterprise Assets
Package : @my-enterprise/enterprise-assets
Version actuelle déclarée : 2.1.0
```

### Design System Metier React

```text
Librairie : Design System Metier React
Package : @my-enterprise/design-system-metier-react
Version actuelle déclarée : 0.14.0
```

Ces exemples confirment la relation actuellement observée :

```text
Librairie
    │
    │ 1:1 actuellement
    ▼
Package
```

Ils confirment également que chaque Package possède une information de Version.

La signification exacte de **version actuelle** reste cependant à préciser.

---

## 4. Package

Le **Package** est l'unité technique distribuable correspondant actuellement à une librairie et pouvant être référencée comme dépendance par une application.

Il constitue donc un élément important pour relier :

- le Design System produit ;
- les versions ;
- les applications consommatrices.

Exemple conceptuel :

```text
Librairie
    │
    └── Package
          ├── Version A
          ├── Version B
          └── Version C
```

### Nom du Package

Les exemples observés montrent que le Package possède un nom permettant de l'identifier :

```text
@my-enterprise/design-system-react
@my-enterprise/enterprise-assets
@my-enterprise/design-system-metier-react
```

Le nom du Package doit être distingué du nom métier de la Librairie.

Par exemple :

```text
Librairie : Design System React
Package : @my-enterprise/design-system-react
```

Les propriétés techniques exactes du Package restent à préciser.

---

## 5. Version

Une **Version** identifie un état versionné d'un Package.

Une application utilise donc un Package dans une Version donnée.

Conceptuellement :

```text
Application
    │
    └── utilise
          │
          ├── Package X
          └── Version Y
```

ou, sous une forme compacte :

```text
Package X @ Version Y
```

Les exemples actuellement connus sont :

```text
@my-enterprise/design-system-react @ 1.7.1
@my-enterprise/enterprise-assets @ 2.1.0
@my-enterprise/design-system-metier-react @ 0.14.0
```

À ce stade, les valeurs `1.7.1`, `2.1.0` et `0.14.0` sont qualifiées de **versions actuelles déclarées**.

Il reste à déterminer précisément ce que signifie « version actuelle ».

---

## 6. Utilisation d'un Package par une Application

La relation entre une Application, un Package et sa Version doit être représentée sans considérer la Version comme un élément consommé indépendamment du Package.

La formulation métier retenue à ce stade est :

> Une application utilise un Package dans une Version donnée.

La représentation correspondante est :

```text
Application
    │
    └── utilise
          │
          ├── Package
          └── Version du Package
```

À terme, cette relation pourra éventuellement être représentée par un objet métier spécifique, par exemple une **Consommation** :

```text
Application
    │
    └── Consommation
          ├── Package
          └── Version
```

Cette représentation n'est cependant **pas encore validée comme objet métier définitif**.

Elle ne doit donc pas encore imposer de choix d'implémentation.

---

## 7. Cible future : plusieurs packages par librairie

Le modèle doit conserver la possibilité qu'une librairie soit distribuée par plusieurs packages.

La cible pourrait alors devenir :

```text
Librairie
    │
    ├── Package A
    │     ├── Version A1
    │     └── Version A2
    │
    └── Package B
          ├── Version B1
          └── Version B2
```

Cette représentation est une **capacité cible**.

Elle ne correspond pas à la situation actuelle établie.

Il ne faut donc pas introduire aujourd'hui des règles métier reposant sur l'existence effective de plusieurs packages par librairie.

---

## 8. Repository et Version

Aujourd'hui, un repository correspond à une librairie.

La chaîne actuellement observée est donc :

```text
Repository
    │
    └── Librairie
          │
          └── Package
                │
                └── Versions
```

À terme, le repository pourra contenir plusieurs librairies.

Le modèle devra donc éviter de déduire définitivement la Version d'une Librairie à partir du seul Repository.

---

## 9. Milestone GitHub

Les Milestones GitHub sont actuellement utilisés dans plusieurs contextes.

Ils peuvent notamment représenter :

- une version ;
- une version d'audit ;
- un horizon de planification ;
- un lot de conception.

Un Milestone GitHub ne doit donc pas être assimilé automatiquement à une Version.

Le pipeline doit conserver :

- la valeur source du Milestone ;
- son interprétation métier éventuelle.

---

## 10. Version et audit

Les conventions actuelles peuvent utiliser des Milestones tels que :

```text
1.1.0
1.1.0-Audit
```

Ces deux valeurs peuvent se rapporter à une même version de référence :

```text
1.1.0
```

avec des contextes différents.

Conceptuellement :

```text
1.1.0
    ├── contexte standard
    └── contexte audit
```

Le suffixe utilisé pour identifier le contexte d'audit doit être configurable.

La règle de normalisation doit permettre de distinguer :

- la valeur source ;
- la version normalisée ;
- le type ou contexte du Milestone.

Exemple :

```text
Milestone source : 1.1.0-Audit
Version normalisée : 1.1.0
Contexte : audit
```

---

## 11. Release

La notion de **Release** doit être distinguée de la Version tant que leur relation exacte n'a pas été validée.

Une Release pourrait représenter un événement de publication d'une Version.

Cependant, le modèle définitif doit encore déterminer précisément la relation entre :

```text
Librairie
Package
Version
Release
Milestone
```

Aucune équivalence automatique ne doit être introduite à ce stade.

---

## 12. Version utilisée par une Application

Il est établi qu'une application utilise un Package dans une Version donnée.

Cette relation constitue le point de départ du futur domaine d'analyse des consommateurs.

À terme, elle doit permettre d'identifier notamment :

- les applications utilisant un Package donné ;
- les versions utilisées par ces applications ;
- les applications utilisant une version considérée comme ancienne ;
- les applications devant effectuer une montée de version ;
- la dette de mise à niveau du Design System.

La source permettant de déterminer cette information reste à définir.

---

## 13. Version et composants utilisés

À terme, l'analyse du code des applications doit également permettre d'identifier les composants effectivement utilisés.

Le modèle cible pourra donc relier :

```text
Application
    │
    ├── Package @ Version
    │
    └── Composants utilisés
```

Cela permettra notamment :

- de connaître les composants les plus utilisés ;
- de mesurer le nombre d'utilisations par composant ;
- de rapprocher l'usage d'un composant de son niveau de qualité.

---

## 14. Version et qualité

La qualité doit pouvoir être analysée dans le contexte d'une version.

L'objectif futur est notamment de pouvoir croiser :

```text
Application
    ↓
Package utilisé
    ↓
Version utilisée
    ↓
Composants utilisés
    ↓
Qualité connue de ces composants pour cette version
```

Ce croisement pourra contribuer à fournir une information de qualité associée à une application consommatrice.

La méthode exacte de calcul d'une éventuelle note ou d'un badge de qualité n'est pas encore définie.

Elle ne doit pas être introduite avant la définition d'un modèle de scoring explicite.

---

## 15. Historisation

La notion de Version doit être compatible avec l'historisation du pipeline.

Les Snapshots doivent permettre d'observer l'évolution des indicateurs dans le temps.

Il faut distinguer :

```text
Version du Package analysé
```

de :

```text
Date du Snapshot
```

et de :

```text
Version du modèle analytique
Version des règles
```

Ces notions ont des responsabilités différentes.

---

## 16. Principes retenus

### Principe 1 — Package et Librairie ne doivent pas être confondus définitivement

Aujourd'hui :

```text
1 Librairie = 1 Package
```

mais la cible doit permettre :

```text
1 Librairie = 1..n Packages
```

### Principe 2 — La Version est rattachée au Package

Une Version identifie un état versionné d'un Package.

### Principe 3 — Une Application utilise un Package dans une Version donnée

La Version ne doit pas être considérée comme consommée indépendamment du Package.

### Principe 4 — Milestone et Version sont des notions distinctes

Un Milestone peut permettre d'identifier une Version, mais il peut également avoir d'autres significations.

### Principe 5 — Release et Version restent distinctes

Leur relation exacte doit être précisée avant d'être intégrée au modèle métier définitif.

### Principe 6 — Conserver la valeur source

Toute normalisation de Version ou de Milestone doit conserver la valeur source afin de garantir la traçabilité.

---

## 17. Points restant à préciser

Les éléments suivants restent volontairement ouverts :

- signification exacte de « version actuelle » ;
- source de référence permettant de connaître cette version ;
- quelles propriétés définissent exactement un Package ;
- où est définie la version d'un Package ;
- comment les Packages sont publiés ;
- comment une Release est créée ;
- relation exacte entre Version et Release ;
- relation exacte entre Version et Milestone ;
- possibilité et organisation future de plusieurs Packages par Librairie ;
- comportement des Versions dans un futur Repository contenant plusieurs Librairies ;
- source permettant d'identifier les Versions réellement utilisées par les Applications ;
- stratégie de détection des Versions obsolètes ;
- définition de la dette de montée de Version.

Ces points doivent être instruits progressivement à partir du fonctionnement réel du Design System.