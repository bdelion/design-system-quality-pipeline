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
- les Tags Git ;
- les Milestones ;
- les Releases ;
- les Milestones utilisées pour représenter un contexte d'Audit.

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

Pour Design System React, une Version `1.8.0-SNAPSHOT` est également disponible dans le contexte de la branche `develop`.

---

## 4. Version de base

Le cycle de construction utilise une Version de base de forme :

```text
M.m.r
```

Cette Version sert de base à la génération des Versions publiées par Jenkins.

---

## 5. Classification des Versions

| Catégorie | Forme | Origine / déclencheur |
|---|---|---|
| SNAPSHOT | `M.m.r-SNAPSHOT` | `develop` ou `project/***` |
| Release Candidate | `M.m.r-rc.[build]` | build de `release/***` |
| Hotfix Candidate | `M.m.r-hc.[build]` | build de `hotfix/***` |
| PROD release | `M.m.r` | merge `release/***` → `master`, puis Jenkins |
| PROD hotfix | `M.m.r` | merge `hotfix/***` → `master`, puis Jenkins |

Une Milestone telle que `M.m.r-Audit` n'est pas une Version supplémentaire du Package.

---

## 6. Version SNAPSHOT

Une Version SNAPSHOT possède la forme :

```text
M.m.r-SNAPSHOT
```

Elle est produite depuis :

- `develop` ;
- `project/***`.

Ces Versions :

- sont disponibles dans Nexus ;
- sont destinées aux tests d'intégration ;
- n'ont pas vocation à être déployées en production.

---

## 7. Release Candidate

Une **Release Candidate** est produite depuis :

```text
release/***
```

Sa forme est :

```text
M.m.r-rc.[numéro de build Jenkins]
```

Le numéro situé après `rc` correspond au numéro du build Jenkins.

---

## 8. Hotfix Candidate

Une **Hotfix Candidate** est produite depuis :

```text
hotfix/***
```

Sa forme est :

```text
M.m.r-hc.[numéro de build Jenkins]
```

Le numéro situé après `hc` correspond au numéro du build Jenkins.

---

## 9. Production PROD depuis une release

Une Version PROD issue d'une release est produite lors du merge de :

```text
release/***
```

vers :

```text
master
```

Le merge déclenche automatiquement Jenkins.

Si les stages nécessaires réussissent, Jenkins produit notamment :

- le Tag Git `M.m.r` ;
- le Package `M.m.r` dans Nexus PROD.

```text
release/1.8.0
    │
    │ merge
    ▼
master
    │
    ▼
Jenkins
    │
    └── succès
          ├── Tag Git 1.8.0
          └── Nexus PROD 1.8.0
```

---

## 10. Production PROD depuis un hotfix

Une Version PROD issue d'un hotfix suit le même principe de publication.

La branche :

```text
hotfix/xxx
```

produit d'abord des Hotfix Candidates :

```text
M.m.r-hc.[build Jenkins]
```

Lorsqu'elle est mergée vers :

```text
master
```

le job Jenkins est déclenché.

À l'issue du processus, Jenkins produit les éléments de la Version PROD, notamment :

- le Tag Git `M.m.r` ;
- le Package `M.m.r` publié dans Nexus PROD.

```text
hotfix/xxx
    │
    │ merge
    ▼
master
    │
    ▼
Jenkins
    │
    └── succès
          ├── Tag Git M.m.r
          └── Nexus PROD M.m.r
```

Le workflow de production est donc cohérent entre release et hotfix :

```text
release/*** ─┐
             ├── merge master → Jenkins → PROD
hotfix/*** ──┘
```

---

## 11. Caractéristiques d'une Version PROD

Une Version PROD :

- possède la forme `M.m.r` ;
- ne possède pas de suffixe ;
- est publiée dans un Repository / espace Nexus spécifique ;
- possède un Tag Git correspondant ;
- doit posséder une Milestone portant exactement son numéro ;
- possède normalement une Release correspondante.

L'absence de suffixe constitue une caractéristique nécessaire mais ne doit pas être utilisée seule pour qualifier une Version PROD.

---

## 12. Nexus

Nexus contient plusieurs catégories de Versions.

```text
Nexus
    │
    ├── PROD
    │     └── M.m.r
    │
    └── Versions non-PROD
          ├── M.m.r-SNAPSHOT
          ├── M.m.r-rc.[build]
          └── M.m.r-hc.[build]
```

La présence dans Nexus ne suffit donc pas à qualifier une Version de PROD.

---

## 13. Tag Git

Une Version PROD possède un Tag Git correspondant.

Pour les workflows release et hotfix établis, le Tag est produit par Jenkins après le merge vers `master`.

```text
release/*** → master ─┐
                      ├── Jenkins → Tag Git M.m.r
hotfix/***  → master ─┘
```

---

## 14. Milestone de Version PROD

Une Version PROD doit posséder une Milestone portant exactement son numéro.

```text
Version PROD M.m.r
        │
        └── Milestone M.m.r
```

Exemple :

```text
Version PROD : 1.1.0
Milestone    : 1.1.0
```

L'existence d'une Milestone `M.m.r` ne prouve toutefois pas à elle seule que la Version PROD a été publiée.

---

## 15. Milestone d'Audit

Une Milestone d'Audit telle que :

```text
1.1.0-Audit
```

ne représente pas une nouvelle Version du Package.

Elle représente un contexte d'Audit portant sur la Version PROD :

```text
1.1.0
```

La relation métier est donc :

```text
Version PROD 1.1.0
    │
    ├── Milestone de version : 1.1.0
    │
    └── Milestone d'audit   : 1.1.0-Audit
```

Les deux Milestones font référence à la même Version du Package mais représentent des contextes différents.

---

## 16. Temporalité de l'Audit

Dans le fonctionnement actuellement établi, l'Audit représenté par `1.1.0-Audit` est réalisé **après la mise à disposition de la Version PROD `1.1.0`**.

La chronologie est donc :

```text
Création de la Version PROD 1.1.0
        │
        ├── Tag Git 1.1.0
        ├── Package 1.1.0 dans Nexus PROD
        │
        ▼
Version disponible
        │
        ▼
Audit de la Version 1.1.0
        │
        └── Milestone 1.1.0-Audit
```

L'Audit ne constitue donc pas, dans ce cas, une étape préalable à la publication de la Version PROD.

Cette distinction temporelle est importante pour l'analyse de la qualité.

Un Audit réalisé après la publication d'une Version ne permet pas, à lui seul, d'affirmer que cette Version avait été auditée ou déclarée conforme au moment de sa mise à disposition.

---

## 17. Normalisation d'une Milestone d'Audit

Le pipeline doit pouvoir interpréter une Milestone telle que :

```text
1.1.0-Audit
```

comme une référence à :

```text
Version auditée : 1.1.0
Contexte        : AUDIT
```

Cette normalisation ne doit pas détruire la valeur source.

Le modèle doit donc pouvoir conserver au minimum :

```text
Valeur source       : 1.1.0-Audit
Version de référence: 1.1.0
Contexte            : AUDIT
```

Conceptuellement :

```text
Milestone source
    │
    ├── title              = 1.1.0-Audit
    ├── normalizedVersion  = 1.1.0
    └── context            = AUDIT
```

Les noms techniques définitifs de ces propriétés restent à définir lors de la conception du modèle normalisé.

---

## 18. Suffixe d'Audit

Le suffixe permettant d'identifier une Milestone d'Audit doit rester configurable.

Le fonctionnement observé utilise :

```text
-Audit
```

Le modèle métier ne doit cependant pas dépendre définitivement de cette chaîne de caractères.

Il doit distinguer :

- la valeur source ;
- la règle de reconnaissance ;
- la Version de référence ;
- le contexte métier identifié.

---

## 19. Release

Une Version PROD possède normalement une Release correspondante.

Cependant :

- son caractère obligatoire n'est pas encore confirmé ;
- le mécanisme qui crée cette Release n'est pas encore documenté ;
- il n'est pas établi que Jenkins la crée.

La Release ne doit donc pas encore être utilisée comme invariant obligatoire du modèle.

---

## 20. Cycle global des Versions

Le cycle actuellement établi est :

```text
Version de base M.m.r
        │
        ├── develop
        │     └── Jenkins
        │           └── M.m.r-SNAPSHOT
        │
        ├── project/***
        │     └── Jenkins
        │           └── M.m.r-SNAPSHOT
        │
        ├── release/***
        │     ├── Jenkins
        │     │     └── M.m.r-rc.[build]
        │     │
        │     └── merge master
        │           └── Jenkins
        │                 └── M.m.r PROD
        │                       ├── Tag Git
        │                       └── Nexus PROD
        │
        └── hotfix/***
              ├── Jenkins
              │     └── M.m.r-hc.[build]
              │
              └── merge master
                    └── Jenkins
                          └── M.m.r PROD
                                ├── Tag Git
                                └── Nexus PROD
```

Une Version PROD peut ensuite faire l'objet d'un Audit :

```text
M.m.r PROD
    │
    ▼
Audit post-publication
    │
    └── Milestone M.m.r-Audit
```

---

## 21. Application consommatrice

Une Application utilise un Package dans une Version donnée.

Pour le futur pilotage des consommateurs, il faudra pouvoir déterminer :

- le Package utilisé ;
- la Version utilisée ;
- la catégorie de cette Version ;
- la dernière Version PROD disponible ;
- l'écart éventuel entre Version utilisée et Version PROD attendue.

Cette distinction sera nécessaire pour mesurer correctement la dette de montée de Version.

---

## 22. Version et qualité

La qualité d'une Version doit être analysée en tenant compte de la temporalité des informations disponibles.

Il faut notamment pouvoir distinguer :

```text
Version publiée
    │
    ├── état de qualité connu au moment de la publication
    │
    └── état de qualité connu après des Audits ultérieurs
```

Dans le fonctionnement actuellement observé, certains Audits sont réalisés après la mise à disposition de la Version PROD.

Le modèle historique devra donc éviter de projeter rétroactivement un résultat d'Audit sur un instant où cet Audit n'avait pas encore été réalisé.

La définition précise des indicateurs de qualité par Version reste à instruire.

---

## 23. Historisation

Il faut distinguer :

- la Version du Package analysé ;
- la date de publication de cette Version ;
- la date ou période de l'Audit ;
- la date du Snapshot ;
- la version du modèle analytique ;
- la version des règles.

Ces notions ont des responsabilités différentes.

---

## 24. Principes retenus

### Principe 1 — La Version est rattachée au Package

Une Version identifie un état versionné d'un Package.

### Principe 2 — La Version de base ne suffit pas à décrire l'artefact publié

La CI peut produire :

```text
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
M.m.r
```

### Principe 3 — Le type de branche participe à la classification

Le type de branche est une donnée importante du processus de génération de Version.

### Principe 4 — Nexus contient plusieurs catégories de Versions

Publication dans Nexus et qualification PROD sont deux notions différentes.

### Principe 5 — Release et hotfix utilisent le même mécanisme final de mise en production

```text
branche release ou hotfix
    ↓
merge vers master
    ↓
Jenkins
    ↓ succès
    ├── Tag Git M.m.r
    └── Nexus PROD M.m.r
```

### Principe 6 — La Milestone de Version est obligatoire pour une PROD

Une Version PROD `M.m.r` doit avoir une Milestone `M.m.r`.

### Principe 7 — Une Milestone d'Audit n'est pas une Version

`M.m.r-Audit` représente un contexte d'Audit portant sur la Version PROD `M.m.r`.

### Principe 8 — L'Audit concerné est postérieur à la publication

Dans le fonctionnement observé, l'Audit associé à `M.m.r-Audit` est réalisé après la mise à disposition de `M.m.r`.

### Principe 9 — La Release GitHub n'est pas encore considérée comme obligatoire

Elle existe normalement, mais son mécanisme de création et son caractère obligatoire restent à confirmer.

### Principe 10 — Conserver les valeurs sources

La normalisation d'une Milestone d'Audit ne doit jamais faire perdre son intitulé d'origine.

---

## 25. Points restant à préciser

Les éléments suivants restent ouverts :

- mécanisme de création de la Release GitHub ;
- caractère obligatoire ou non de cette Release ;
- comportement attendu lorsque la Milestone PROD est absente ;
- comportement attendu lorsque le Tag Git est absent ;
- éventuels autres merges réalisés dans les workflows release et hotfix ;
- conventions exactes appliquées aux autres Librairies ;
- modalités précises de création et de clôture d'une Milestone d'Audit ;
- manière d'identifier les Audits appartenant à une Milestone d'Audit ;
- définition de la conformité d'une Version à partir des Audits ;
- source permettant d'identifier les Versions utilisées par les Applications ;
- définition de la dette de montée de Version.

Ces points doivent être instruits progressivement à partir du fonctionnement réel du processus.