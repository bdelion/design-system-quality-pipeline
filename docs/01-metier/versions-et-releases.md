# Versions et releases

## 1. Objectif

Ce document décrit le cycle de Version des Packages du Design System.

Il vise notamment à distinguer :

- la Version de base du Package ;
- les Versions générées par la CI ;
- les Versions SNAPSHOT ;
- les Release Candidates ;
- les Hotfix Candidates ;
- les Versions PROD ;
- les publications Nexus ;
- les tags Git ;
- les Milestones ;
- les Releases.

---

## 2. Situation actuelle

Une Librairie est actuellement distribuée sous la forme d'un Package.

```text
Librairie
    │
    └── Package
          │
          └── Versions
```

Les Applications utilisent un Package dans une Version donnée.

Plusieurs Versions d'un même Package peuvent être disponibles simultanément dans Nexus avec des finalités différentes.

---

## 3. Exemples de Packages

| Librairie | Package | Dernière Version PROD déclarée |
|---|---|---|
| Design System React | `@my-enterprise/design-system-react` | `1.7.1` |
| Enterprise Assets | `@my-enterprise/enterprise-assets` | `2.1.0` |
| Design System Metier React | `@my-enterprise/design-system-metier-react` | `0.14.0` |

Pour Design System React, il existe actuellement également :

```text
1.8.0-SNAPSHOT
```

dans le contexte de la branche `develop`.

---

## 4. Version de base

Le `package.json` contient une Version de base de forme :

```text
M.m.r
```

Cette Version sert de base à la génération des Versions publiées par la CI Jenkins.

Le type de Version effectivement produit dépend notamment du type de branche.

---

## 5. Jenkins

La CI Jenkins produit différentes formes de Versions à partir :

- de la Version `M.m.r` ;
- du type de branche ;
- et, pour certains types de Versions, du numéro de build Jenkins.

Le fonctionnement établi est :

| Branche | Version produite |
|---|---|
| `develop` | `M.m.r-SNAPSHOT` |
| `project/***` | `M.m.r-SNAPSHOT` |
| `release/****` | `M.m.r-rc.[numéro de build]` |
| `hotfix/****` | `M.m.r-hc.[numéro de build]` |

Le mécanisme exact de production de la Version PROD reste à préciser.

---

## 6. Version SNAPSHOT

Une Version SNAPSHOT possède la forme :

```text
M.m.r-SNAPSHOT
```

Elle est produite depuis :

```text
develop
```

ou :

```text
project/***
```

### Exemple

Pour Design System React :

```text
Version de base : 1.8.0
Branche : develop
Version publiée : 1.8.0-SNAPSHOT
```

Cette Version :

- est disponible dans Nexus ;
- est destinée aux tests d'intégration ;
- n'a pas vocation à être déployée en production.

---

## 7. Release Candidate

Une **Release Candidate** est produite depuis une branche :

```text
release/****
```

Sa forme est :

```text
M.m.r-rc.[numéro de build Jenkins]
```

Exemple de forme :

```text
1.8.0-rc.123
```

Le numéro situé après `rc` correspond au numéro du build Jenkins.

Cette convention permet d'identifier plusieurs builds candidats pour une même Version de base.

L'usage fonctionnel précis de ces Versions dans le processus de validation reste à documenter.

---

## 8. Hotfix Candidate

Une **Hotfix Candidate** est produite depuis une branche :

```text
hotfix/****
```

Sa forme est :

```text
M.m.r-hc.[numéro de build Jenkins]
```

Exemple de forme :

```text
1.7.2-hc.42
```

Le numéro situé après `hc` correspond au numéro du build Jenkins.

L'usage fonctionnel précis de ces Versions dans le processus de validation reste à documenter.

---

## 9. Version PROD

Une **Version PROD** est une Version destinée aux clients et à une utilisation en production.

### Caractéristiques établies

Une Version PROD :

- possède une Version sans suffixe ;
- est disponible dans un Repository / espace Nexus spécifique ;
- existe sous forme de tag Git ;
- doit posséder une Milestone portant exactement son numéro ;
- possède normalement une Release correspondante.

### Exemple

Pour Design System React :

```text
Version PROD : 1.7.1
```

Les éléments associés sont :

```text
Package
└── @my-enterprise/design-system-react
      │
      └── Version PROD 1.7.1
            ├── Nexus PROD
            ├── tag Git 1.7.1
            ├── Milestone 1.7.1
            └── Release normalement présente
```

### Absence de suffixe

Une Version PROD ne possède pas les suffixes utilisés par les Versions intermédiaires :

```text
-SNAPSHOT
-rc.[build]
-hc.[build]
```

L'absence de suffixe constitue une caractéristique d'une Version PROD, mais ne doit pas être utilisée seule pour qualifier la Version.

---

## 10. Nexus

Nexus contient plusieurs catégories de Versions.

Le système doit donc distinguer au minimum :

```text
Nexus
    │
    ├── espace / Repository PROD
    │     └── M.m.r
    │
    └── autres Versions publiées
          ├── M.m.r-SNAPSHOT
          ├── M.m.r-rc.[build]
          └── M.m.r-hc.[build]
```

La présence d'une Version dans Nexus ne suffit donc pas à déterminer qu'il s'agit d'une Version PROD.

L'espace Nexus dans lequel elle est publiée constitue une information métier importante.

---

## 11. Tag Git

Une Version PROD existe sous forme de tag Git.

La correspondance attendue est :

```text
Version PROD M.m.r
        │
        └── Tag Git M.m.r
```

Exemple :

```text
Version PROD : 1.7.1
Tag Git : 1.7.1
```

Cette information fournit un élément de traçabilité entre la Version distribuée et le code source.

---

## 12. Milestone

Une Version PROD doit posséder une Milestone portant son nom.

La correspondance attendue est :

```text
Version PROD M.m.r
        │
        └── Milestone M.m.r
```

Exemple :

```text
Version PROD : 1.7.1
Milestone : 1.7.1
```

Cette règle ne doit pas être inversée automatiquement.

L'existence d'une Milestone `M.m.r` ne suffit pas à elle seule à prouver que la Version PROD correspondante a été publiée.

Les Milestones peuvent avoir d'autres usages dans le projet.

---

## 13. Release

Une Version PROD possède normalement une Release correspondante.

La relation observée est donc généralement :

```text
Version PROD M.m.r
        │
        └── Release M.m.r
```

Cependant, le terme « normalement » signifie que l'existence de la Release n'est pas encore établie comme invariant obligatoire.

La présence ou l'absence d'une Release pourra ultérieurement devenir :

- une information de cohérence ;
- une règle de workflow ;
- ou une règle de qualité des données ;

mais cette décision n'est pas encore prise.

---

## 14. Synthèse du cycle de Versions

Le cycle actuellement établi est :

```text
package.json
Version de base M.m.r
        │
        │
        ├── develop
        │     │
        │     └── Jenkins
        │           └── M.m.r-SNAPSHOT
        │
        ├── project/***
        │     │
        │     └── Jenkins
        │           └── M.m.r-SNAPSHOT
        │
        ├── release/****
        │     │
        │     └── Jenkins
        │           └── M.m.r-rc.[build]
        │
        ├── hotfix/****
        │     │
        │     └── Jenkins
        │           └── M.m.r-hc.[build]
        │
        └── PROD
              │
              └── M.m.r
                    ├── Nexus PROD
                    ├── Tag Git M.m.r
                    ├── Milestone M.m.r
                    └── Release normalement présente
```

Le passage exact permettant de produire la Version PROD reste à préciser.

---

## 15. Classification des Versions

Les catégories actuellement établies sont :

| Catégorie | Forme | Origine établie | PROD |
|---|---|---|---|
| SNAPSHOT | `M.m.r-SNAPSHOT` | `develop`, `project/***` | Non |
| Release Candidate | `M.m.r-rc.[build]` | `release/****` | Non établie comme PROD |
| Hotfix Candidate | `M.m.r-hc.[build]` | `hotfix/****` | Non établie comme PROD |
| PROD | `M.m.r` | à préciser | Oui |

Cette classification doit être conservée indépendamment de la simple présence de la Version dans Nexus.

---

## 16. Application consommatrice

Une Application utilise un Package dans une Version donnée.

```text
Application
    │
    └── utilise
          ├── Package
          └── Version
```

Pour le futur pilotage des consommateurs, il faudra pouvoir déterminer :

- le Package utilisé ;
- la Version utilisée ;
- la catégorie de cette Version ;
- la dernière Version PROD disponible ;
- l'écart éventuel entre Version utilisée et Version PROD attendue.

Cette distinction sera nécessaire pour mesurer correctement la dette de montée de Version.

---

## 17. Version et Audit

Les conventions actuelles peuvent utiliser des Milestones telles que :

```text
1.1.0
1.1.0-Audit
```

Ces deux valeurs peuvent se rapporter à une même Version de référence :

```text
1.1.0
```

avec des contextes différents.

Le suffixe utilisé pour identifier le contexte d'Audit doit être configurable.

Il faut conserver :

- la valeur source de la Milestone ;
- la Version normalisée ;
- le contexte de la Milestone.

---

## 18. Version et qualité

La qualité doit pouvoir être analysée dans le contexte d'une Version.

À terme :

```text
Application
    ↓
Package utilisé
    ↓
Version utilisée
    ↓
Composants utilisés
    ↓
Qualité connue des Composants pour cette Version
```

La méthode exacte de calcul d'une éventuelle note ou d'un badge de qualité n'est pas encore définie.

---

## 19. Historisation

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

## 20. Principes retenus

### Principe 1 — La Version est rattachée au Package

Une Version identifie un état versionné d'un Package.

### Principe 2 — La Version de base ne suffit pas à décrire l'artefact publié

La CI peut transformer `M.m.r` en :

```text
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
M.m.r
```

selon le contexte.

### Principe 3 — Le type de branche participe à la classification

Le type de branche est une donnée importante du processus de génération de Version.

### Principe 4 — Nexus contient plusieurs catégories de Versions

Publication dans Nexus et qualification PROD sont deux notions différentes.

### Principe 5 — Une Version PROD est corroborée par plusieurs éléments

Les éléments établis sont :

- absence de suffixe ;
- espace Nexus PROD ;
- tag Git correspondant ;
- Milestone correspondante ;
- Release normalement correspondante.

### Principe 6 — La Milestone est obligatoire pour une PROD

Une Version PROD `M.m.r` doit avoir une Milestone `M.m.r`.

### Principe 7 — La Release n'est pas encore considérée comme obligatoire

Elle existe normalement mais cette propriété n'est pas encore établie comme invariant.

### Principe 8 — Conserver les valeurs sources

Le pipeline doit conserver les informations sources nécessaires à l'explication de la classification d'une Version.

---

## 21. Points restant à préciser

Les éléments suivants restent ouverts :

- mécanisme exact permettant de produire une Version PROD ;
- branche à partir de laquelle une Version PROD est produite ;
- événement déclenchant la publication PROD ;
- rôle exact des branches `release/****` dans le passage de RC à PROD ;
- rôle exact des branches `hotfix/****` dans le passage de HC à PROD ;
- caractère réellement obligatoire ou non d'une Release GitHub ;
- comportement lorsque la Milestone attendue est absente ;
- comportement lorsque le tag attendu est absent ;
- conventions exactes appliquées aux autres Librairies ;
- source permettant d'identifier les Versions utilisées par les Applications ;
- définition de la dette de montée de Version.

Ces points doivent être instruits progressivement à partir du fonctionnement réel du processus de livraison.