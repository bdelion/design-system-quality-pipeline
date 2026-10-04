# Versions et releases

## 1. Objectif

Ce document décrit les notions de Package, Version et Release utilisées ou envisagées par le Design System Quality Pipeline.

L'objectif est notamment d'éviter de confondre plusieurs notions :

- Librairie ;
- Package ;
- Version de Package ;
- Version de production ;
- Version SNAPSHOT ;
- Milestone GitHub ;
- Release ;
- version d'audit.

---

## 2. Situation actuelle établie

Une Librairie du Design System est aujourd'hui distribuée sous la forme d'un Package pouvant être directement utilisé par les Applications.

Ce Package :

- possède un nom ;
- possède plusieurs Versions au cours de son cycle de vie ;
- est publié dans Nexus ;
- peut avoir simultanément plusieurs Versions disponibles avec des finalités différentes.

La relation générale est :

```text
Librairie
    │
    │ correspond actuellement à
    ▼
Package
    │
    └── Versions
          │
          ├── PROD
          └── SNAPSHOT
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

Dernière version PROD déclarée :
1.7.1

Version actuelle sur develop :
1.8.0-SNAPSHOT
```

La Version `1.7.1` :

- est publiée dans Nexus ;
- est disponible pour les clients ;
- constitue actuellement la dernière Version PROD déclarée.

La Version `1.8.0-SNAPSHOT` :

- est déclarée dans le `package.json` de la branche `develop` ;
- est également disponible dans Nexus ;
- est destinée aux tests d'intégration ;
- n'a pas vocation à être déployée comme Version PROD.

### Enterprise Assets

```text
Librairie : Enterprise Assets
Package : @my-enterprise/enterprise-assets
Dernière version PROD déclarée : 2.1.0
```

Aucune information supplémentaire n'est encore établie ici concernant une éventuelle Version SNAPSHOT.

### Design System Metier React

```text
Librairie : Design System Metier React
Package : @my-enterprise/design-system-metier-react
Dernière version PROD déclarée : 0.14.0
```

Aucune information supplémentaire n'est encore établie ici concernant une éventuelle Version SNAPSHOT.

---

## 4. Package

Le **Package** est l'unité technique distribuable correspondant actuellement à une Librairie et pouvant être référencée comme dépendance par une Application.

Il constitue un élément important pour relier :

- le Design System produit ;
- les Versions publiées ;
- les Applications consommatrices.

Exemple :

```text
Design System React
    │
    └── @my-enterprise/design-system-react
          │
          ├── 1.7.1
          └── 1.8.0-SNAPSHOT
```

Le nom du Package doit être distingué du nom métier de la Librairie.

---

## 5. Version

Une **Version** identifie un état versionné d'un Package.

La Version seule ne suffit pas nécessairement à déterminer sa finalité.

Le modèle doit distinguer le numéro de Version de son contexte d'utilisation.

Exemple :

```text
Package
    │
    ├── 1.7.1
    │     └── PROD
    │
    └── 1.8.0-SNAPSHOT
          └── tests d'intégration
```

---

## 6. Version PROD

### Définition actuellement établie

Une **Version PROD** est une Version du Package :

- publiée dans Nexus ;
- disponible pour les clients ;
- destinée à être utilisée en production.

Pour Design System React :

```text
Package : @my-enterprise/design-system-react
Version PROD actuelle : 1.7.1
```

L'expression **version actuelle**, lorsqu'elle est utilisée dans un contexte de pilotage des consommateurs, doit donc être évitée lorsqu'elle est ambiguë.

Il est préférable de parler explicitement de :

```text
dernière Version PROD
```

lorsque c'est cette information qui est recherchée.

---

## 7. Version SNAPSHOT

### Définition actuellement établie

Une **Version SNAPSHOT** peut être publiée dans Nexus tout en n'étant pas destinée à la production.

Pour Design System React :

```text
Branche : develop
Version package.json : 1.8.0-SNAPSHOT
Publication Nexus : oui
Usage : tests d'intégration
Déploiement PROD : non
```

La disponibilité dans Nexus ne constitue donc pas à elle seule une preuve qu'une Version peut être utilisée en production.

---

## 8. Nexus

Nexus est actuellement utilisé comme source de publication des Packages.

L'exemple de Design System React montre que Nexus peut contenir simultanément :

```text
@my-enterprise/design-system-react
    │
    ├── 1.7.1
    │     └── PROD
    │
    └── 1.8.0-SNAPSHOT
          └── intégration
```

Il faut donc distinguer :

```text
Version publiée
```

de :

```text
Version destinée à la production
```

Cette distinction sera importante lorsque Nexus sera utilisé comme source du pipeline.

---

## 9. Branche et Version

Il est actuellement établi pour Design System React que :

```text
develop
    │
    └── package.json
          │
          └── 1.8.0-SNAPSHOT
```

Cette relation est un fait observé pour cet exemple.

Il reste à déterminer si cette convention est systématique pour les différentes Librairies et comment les Versions PROD sont associées aux branches Git.

Aucune règle générique supplémentaire ne doit être déduite à ce stade.

---

## 10. Utilisation d'un Package par une Application

Une Application utilise un Package dans une Version donnée.

La représentation est :

```text
Application
    │
    └── utilise
          │
          ├── Package
          └── Version du Package
```

Pour le pilotage des consommateurs, il faudra pouvoir distinguer le contexte de cette Version.

Par exemple :

```text
Application
    │
    └── @my-enterprise/design-system-react
          │
          └── 1.7.1
                └── PROD
```

Le système devra à terme permettre d'identifier les Applications utilisant une Version PROD ancienne par rapport à la dernière Version PROD disponible.

---

## 11. Cible future : plusieurs Packages par Librairie

Le modèle doit conserver la possibilité qu'une Librairie soit distribuée par plusieurs Packages.

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

---

## 12. Repository et Version

Aujourd'hui, un Repository correspond à une Librairie.

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

À terme, le Repository pourra contenir plusieurs Librairies.

Le modèle devra donc éviter de déduire définitivement la Version d'une Librairie à partir du seul Repository.

---

## 13. Milestone GitHub

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

## 14. Version et audit

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

---

## 15. Release

La notion de **Release** doit être distinguée de la Version tant que leur relation exacte n'a pas été validée.

Une Release pourrait représenter un événement de publication d'une Version.

Cependant, le modèle définitif doit encore déterminer précisément la relation entre :

```text
Librairie
Package
Version
Release
Milestone
Publication Nexus
```

Aucune équivalence automatique ne doit être introduite à ce stade.

---

## 16. Version et composants utilisés

À terme, l'analyse du code des Applications doit également permettre d'identifier les Composants effectivement utilisés.

Le modèle cible pourra donc relier :

```text
Application
    │
    ├── Package @ Version
    │
    └── Composants utilisés
```

Cela permettra notamment :

- de connaître les Composants les plus utilisés ;
- de mesurer le nombre d'utilisations par Composant ;
- de rapprocher l'usage d'un Composant de son niveau de qualité.

---

## 17. Version et qualité

La qualité doit pouvoir être analysée dans le contexte d'une Version.

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
Qualité connue de ces Composants pour cette Version
```

Ce croisement pourra contribuer à fournir une information de qualité associée à une Application consommatrice.

La méthode exacte de calcul d'une éventuelle note ou d'un badge de qualité n'est pas encore définie.

---

## 18. Historisation

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

## 19. Principes retenus

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

La Version ne doit pas être considérée indépendamment du Package.

### Principe 4 — Publication et production sont deux notions différentes

Une Version présente dans Nexus n'est pas nécessairement une Version PROD.

### Principe 5 — PROD et SNAPSHOT doivent être distingués

Pour Design System React, les contextes actuellement observés sont :

- PROD ;
- SNAPSHOT pour tests d'intégration.

### Principe 6 — Milestone et Version sont des notions distinctes

Un Milestone peut permettre d'identifier une Version, mais il peut également avoir d'autres significations.

### Principe 7 — Release et Version restent distinctes

Leur relation exacte doit être précisée avant d'être intégrée au modèle métier définitif.

### Principe 8 — Conserver la valeur source

Toute normalisation de Version ou de Milestone doit conserver la valeur source afin de garantir la traçabilité.

---

## 20. Points restant à préciser

Les éléments suivants restent volontairement ouverts :

- règle générique permettant d'identifier une Version PROD ;
- règle générique permettant d'identifier une Version SNAPSHOT ;
- conventions utilisées par les autres Librairies ;
- relation exacte entre branche Git et Version ;
- quelles propriétés définissent exactement un Package ;
- comment les Packages sont publiés ;
- comment une Release est créée ;
- relation exacte entre Version et Release ;
- relation exacte entre Version et Milestone ;
- possibilité et organisation future de plusieurs Packages par Librairie ;
- comportement des Versions dans un futur Repository contenant plusieurs Librairies ;
- source permettant d'identifier les Versions réellement utilisées par les Applications ;
- stratégie de détection des Versions PROD obsolètes ;
- définition de la dette de montée de Version.

Ces points doivent être instruits progressivement à partir du fonctionnement réel du Design System.