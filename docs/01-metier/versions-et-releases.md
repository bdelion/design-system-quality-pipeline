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

## 14. Milestone

Une Version PROD doit posséder une Milestone portant exactement son numéro.

```text
Version PROD M.m.r
        │
        └── Milestone M.m.r
```

L'existence d'une Milestone `M.m.r` ne prouve toutefois pas à elle seule que la Version PROD a été publiée.

---

## 15. Release

Une Version PROD possède normalement une Release correspondante.

Cependant :

- son caractère obligatoire n'est pas encore confirmé ;
- le mécanisme qui crée cette Release n'est pas encore documenté ;
- il n'est pas établi que Jenkins la crée.

La Release ne doit donc pas encore être utilisée comme invariant obligatoire du modèle.

---

## 16. Cycle global des Versions

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

---

## 17. Application consommatrice

Une Application utilise un Package dans une Version donnée.

Pour le futur pilotage des consommateurs, il faudra pouvoir déterminer :

- le Package utilisé ;
- la Version utilisée ;
- la catégorie de cette Version ;
- la dernière Version PROD disponible ;
- l'écart éventuel entre Version utilisée et Version PROD attendue.

Cette distinction sera nécessaire pour mesurer correctement la dette de montée de Version.

---

## 18. Version et Audit

Les conventions actuelles peuvent utiliser des Milestones telles que :

```text
1.1.0
1.1.0-Audit
```

Ces valeurs peuvent se rapporter à une même Version de référence avec des contextes différents.

Le suffixe utilisé pour identifier le contexte d'Audit doit être configurable.

Il faut conserver :

- la valeur source de la Milestone ;
- la Version normalisée ;
- le contexte de la Milestone.

---

## 19. Historisation

Il faut distinguer :

- la Version du Package analysé ;
- la date du Snapshot ;
- la version du modèle analytique ;
- la version des règles.

Ces notions ont des responsabilités différentes.

---

## 20. Principes retenus

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

### Principe 6 — La Milestone est obligatoire pour une PROD

Une Version PROD `M.m.r` doit avoir une Milestone `M.m.r`.

### Principe 7 — La Release GitHub n'est pas encore considérée comme obligatoire

Elle existe normalement, mais son mécanisme de création et son caractère obligatoire restent à confirmer.

### Principe 8 — Conserver les valeurs sources

Le pipeline doit conserver les informations nécessaires à l'explication de la classification et de la publication d'une Version.

---

## 21. Points restant à préciser

Les éléments suivants restent ouverts :

- mécanisme de création de la Release GitHub ;
- caractère obligatoire ou non de cette Release ;
- comportement attendu lorsque la Milestone PROD est absente ;
- comportement attendu lorsque le Tag Git est absent ;
- éventuels autres merges réalisés dans les workflows release et hotfix ;
- conventions exactes appliquées aux autres Librairies ;
- source permettant d'identifier les Versions utilisées par les Applications ;
- définition de la dette de montée de Version.

Ces points doivent être instruits progressivement à partir du fonctionnement réel du processus de livraison.