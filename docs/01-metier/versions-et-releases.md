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

Le type de Version effectivement produit dépend notamment du type de branche.

---

## 5. Jenkins

La CI Jenkins produit différentes formes de Versions à partir :

- de la Version `M.m.r` ;
- du type de branche ;
- et, pour certains types de Versions, du numéro de build Jenkins.

Le fonctionnement établi est :

| Branche / événement | Version produite |
|---|---|
| `develop` | `M.m.r-SNAPSHOT` |
| `project/***` | `M.m.r-SNAPSHOT` |
| `release/****` | `M.m.r-rc.[numéro de build]` |
| `hotfix/****` | `M.m.r-hc.[numéro de build]` |
| merge `release/M.m.r` → `master` | `M.m.r` PROD |

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

Ces Versions :

- sont disponibles dans Nexus ;
- sont destinées aux tests d'intégration ;
- n'ont pas vocation à être déployées en production.

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

Exemple :

```text
1.8.0-rc.123
```

Le numéro situé après `rc` correspond au numéro du build Jenkins.

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

Exemple :

```text
1.7.2-hc.42
```

Le numéro situé après `hc` correspond au numéro du build Jenkins.

---

## 9. Production d'une Version PROD

Pour une release standard, une Version PROD est produite au moment du merge de :

```text
release/M.m.r
```

vers :

```text
master
```

### Exemple : production de 1.8.0

```text
release/1.8.0
    │
    │ merge
    ▼
master
    │
    │ déclenchement automatique
    ▼
Jenkins
    │
    ├── stages du pipeline
    │
    └── si tous les stages précédents sont OK
          │
          ├── création du tag Git 1.8.0
          │
          └── publication du Package 1.8.0
                    │
                    ▼
                Nexus PROD
```

Le merge sur `master` est donc l'événement qui déclenche le processus de production de la Version PROD.

La publication effective n'est réalisée que si les stages Jenkins nécessaires ont réussi.

---

## 10. Caractéristiques d'une Version PROD

Une Version PROD :

- possède la forme `M.m.r` ;
- ne possède pas de suffixe ;
- est publiée dans un Repository / espace Nexus spécifique ;
- possède un Tag Git correspondant ;
- doit posséder une Milestone portant exactement son numéro ;
- possède normalement une Release correspondante.

Exemple :

```text
Version PROD : 1.8.0
Nexus PROD : 1.8.0
Tag Git : 1.8.0
Milestone : 1.8.0
Release : normalement présente
```

L'absence de suffixe constitue une caractéristique nécessaire mais ne doit pas être utilisée seule pour qualifier une Version PROD.

---

## 11. Nexus

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

Une Version PROD est publiée dans un espace / Repository Nexus spécifique.

Pour une release standard, Jenkins effectue cette publication après le merge de `release/M.m.r` vers `master`, sous réserve du succès des stages précédents.

---

## 12. Tag Git

Une Version PROD possède un Tag Git correspondant.

Pour une release standard, le Tag est créé par Jenkins.

```text
release/M.m.r
    ↓ merge
master
    ↓
Jenkins
    ↓ succès des stages précédents
Tag Git M.m.r
```

Exemple :

```text
release/1.8.0
    ↓
master
    ↓
Jenkins
    ↓
Tag Git 1.8.0
```

Le Tag fournit un lien traçable entre la Version publiée et le code source correspondant.

---

## 13. Milestone

Une Version PROD doit posséder une Milestone portant exactement son numéro.

```text
Version PROD M.m.r
        │
        └── Milestone M.m.r
```

Exemple :

```text
Version PROD : 1.8.0
Milestone : 1.8.0
```

Cette règle ne doit pas être inversée automatiquement.

L'existence d'une Milestone `M.m.r` ne prouve pas à elle seule que la Version PROD a été publiée.

---

## 14. Release

Une Version PROD possède normalement une Release correspondante.

```text
Version PROD M.m.r
        │
        └── Release M.m.r
```

Cependant :

- son caractère obligatoire n'est pas encore confirmé ;
- le mécanisme qui crée cette Release n'est pas encore documenté ;
- il n'est pas établi que Jenkins la crée.

La Release ne doit donc pas encore être utilisée comme invariant obligatoire du modèle.

---

## 15. Cycle complet d'une release standard

Le cycle désormais établi est :

```text
package.json
Version de base M.m.r
        │
        ▼
release/M.m.r
        │
        ├── builds Jenkins
        │     └── M.m.r-rc.[build]
        │
        │ validation de la release
        ▼
merge release/M.m.r → master
        │
        ▼
Jenkins déclenché automatiquement
        │
        ├── stages de build / validation
        │
        └── si succès
              │
              ├── Tag Git M.m.r
              │
              └── Publication Nexus PROD
                    └── Package M.m.r
```

Exemple :

```text
1.8.0
  │
  ├── release/1.8.0
  │     ├── 1.8.0-rc.101
  │     ├── 1.8.0-rc.102
  │     └── ...
  │
  └── merge vers master
        │
        └── Jenkins
              ├── tag 1.8.0
              └── Nexus PROD : 1.8.0
```

Les numéros de build ci-dessus sont uniquement illustratifs ; ils ne décrivent pas des builds réels.

---

## 16. Cycle Hotfix

Le fonctionnement établi jusqu'ici est :

```text
hotfix/****
    │
    └── Jenkins
          └── M.m.r-hc.[build]
```

Le mécanisme exact permettant de passer de cette Hotfix Candidate à une Version PROD reste à préciser.

Il ne doit pas être déduit du workflow des branches `release/***` sans validation.

---

## 17. Classification des Versions

| Catégorie | Forme | Origine / déclencheur |
|---|---|---|
| SNAPSHOT | `M.m.r-SNAPSHOT` | `develop` ou `project/***` |
| Release Candidate | `M.m.r-rc.[build]` | build de `release/****` |
| Hotfix Candidate | `M.m.r-hc.[build]` | build de `hotfix/****` |
| PROD | `M.m.r` | merge de `release/M.m.r` vers `master`, puis succès Jenkins |

Cette classification doit être conservée indépendamment de la simple présence de la Version dans Nexus.

---

## 18. Application consommatrice

Une Application utilise un Package dans une Version donnée.

Pour le futur pilotage des consommateurs, il faudra pouvoir déterminer :

- le Package utilisé ;
- la Version utilisée ;
- la catégorie de cette Version ;
- la dernière Version PROD disponible ;
- l'écart éventuel entre Version utilisée et Version PROD attendue.

Cette distinction sera nécessaire pour mesurer correctement la dette de montée de Version.

---

## 19. Version et Audit

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

## 20. Historisation

Il faut distinguer :

- la Version du Package analysé ;
- la date du Snapshot ;
- la version du modèle analytique ;
- la version des règles.

Ces notions ont des responsabilités différentes.

---

## 21. Principes retenus

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

### Principe 5 — Une release standard devient PROD par merge vers master

Le processus établi est :

```text
release/M.m.r
    ↓
master
    ↓
Jenkins
    ↓ succès
Tag Git M.m.r
+
Publication Nexus PROD M.m.r
```

### Principe 6 — La Milestone est obligatoire pour une PROD

Une Version PROD `M.m.r` doit avoir une Milestone `M.m.r`.

### Principe 7 — La Release GitHub n'est pas encore considérée comme obligatoire

Elle existe normalement, mais son mécanisme de création et son caractère obligatoire restent à confirmer.

### Principe 8 — Conserver les valeurs sources

Le pipeline doit conserver les informations nécessaires à l'explication de la classification et de la publication d'une Version.

---

## 22. Points restant à préciser

Les éléments suivants restent ouverts :

- mécanisme de création de la Release GitHub ;
- caractère obligatoire ou non de cette Release ;
- cycle exact de passage d'une Hotfix Candidate à une Version PROD ;
- branche ou branches impliquées dans ce passage ;
- comportement attendu lorsque la Milestone PROD est absente ;
- comportement attendu lorsque le Tag Git est absent ;
- conventions exactes appliquées aux autres Librairies ;
- source permettant d'identifier les Versions utilisées par les Applications ;
- définition de la dette de montée de Version.

Ces points doivent être instruits progressivement à partir du fonctionnement réel du processus de livraison.