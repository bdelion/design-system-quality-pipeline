# Versions et releases

## 1. Objectif

Ce document décrit le cycle de Version des Packages du Design System et ses relations avec les Audits.

Il distingue notamment :

- la Version de base ;
- les Versions SNAPSHOT ;
- les Release Candidates ;
- les Hotfix Candidates ;
- les Versions PROD ;
- les publications Nexus ;
- les Tags Git ;
- les Milestones ;
- les Audits pré-PROD ;
- les Audits de rattrapage.

---

## 2. Version de base

Le cycle de construction utilise une Version de base :

```text
M.m.r
```

Cette Version sert de base aux différentes Versions produites par Jenkins.

---

## 3. Classification des Versions

| Catégorie | Forme | Origine |
|---|---|---|
| SNAPSHOT | `M.m.r-SNAPSHOT` | `develop` ou `project/***` |
| Release Candidate | `M.m.r-rc.[build]` | `release/***` |
| Hotfix Candidate | `M.m.r-hc.[build]` | `hotfix/***` |
| PROD release | `M.m.r` | merge `release/***` → `master` |
| PROD hotfix | `M.m.r` | merge `hotfix/***` → `master` |

Une Milestone `M.m.r-Audit` n'est pas une Version supplémentaire.

---

## 4. Versions SNAPSHOT

Depuis :

```text
develop
project/***
```

Jenkins produit :

```text
M.m.r-SNAPSHOT
```

Ces Versions peuvent être disponibles dans Nexus mais sont destinées aux tests d'intégration et non à la production.

---

## 5. Release Candidate

Depuis :

```text
release/***
```

Jenkins produit :

```text
M.m.r-rc.[numéro de build Jenkins]
```

Une Release Candidate joue également un rôle important dans le fonctionnement cible des Audits.

L'objectif est de pouvoir auditer une Release Candidate avant la publication de la Version PROD correspondante.

---

## 6. Hotfix Candidate

Depuis :

```text
hotfix/***
```

Jenkins produit :

```text
M.m.r-hc.[numéro de build Jenkins]
```

---

## 7. Production d'une Version PROD

Deux chemins de production sont établis :

```text
release/*** ─┐
             ├── merge vers master
hotfix/*** ──┘
                    │
                    ▼
                 Jenkins
                    │
                    └── succès
                          ├── Tag Git M.m.r
                          └── Nexus PROD M.m.r
```

Une Version PROD :

- ne possède pas de suffixe ;
- est publiée dans un espace Nexus spécifique ;
- possède un Tag Git correspondant ;
- doit posséder une Milestone portant son numéro ;
- possède normalement une Release correspondante.

---

## 8. Milestone de Version

Une Version PROD cible possède une Milestone portant son numéro.

Exemple :

```text
Version : 1.1.0
Milestone : 1.1.0
```

Cette Milestone peut contenir les travaux associés à la préparation de la Version.

Dans le fonctionnement cible des Audits, les Issues d'Audit des Composants évoluent également dans cette Milestone.

---

## 9. Audit pré-PROD — fonctionnement cible

Le fonctionnement souhaité consiste à réaliser les Audits sur une Release Candidate avant la publication de la Version PROD finale.

Exemple :

```text
Milestone 1.1.0
        │
        ├── Issue Audit composant A
        ├── Issue Audit composant B
        └── Issue Audit composant C
        │
        ▼
Release Candidate 1.1.0-rc.n
        │
        ▼
Audits
        │
        ▼
Version PROD 1.1.0
```

L'objectif est de permettre, si possible, la publication d'une Version PROD conforme.

Il faut donc distinguer :

```text
Version effectivement auditée : 1.1.0-rc.n
Version PROD cible            : 1.1.0
Milestone                     : 1.1.0
```

---

## 10. Audit de rattrapage

La convention :

```text
M.m.r-Audit
```

est utilisée pour effectuer un **Audit de rattrapage** lorsque l'Audit n'a pas été réalisé avant la création de la Version PROD.

Exemple :

```text
Version PROD 1.1.0
        │
        ├── Tag Git 1.1.0
        ├── Nexus PROD 1.1.0
        │
        ▼
Audit de rattrapage
        │
        └── Milestone 1.1.0-Audit
```

La Milestone `1.1.0-Audit` fait référence à la Version PROD `1.1.0`.

Elle ne représente pas une Version supplémentaire.

---

## 11. Contenu de la Milestone de rattrapage

La Milestone :

```text
M.m.r-Audit
```

ne contient que les Issues d'Audit des Composants.

Exemple :

```text
1.1.0-Audit
    │
    ├── Audit composant A
    ├── Audit composant B
    └── Audit composant C
```

Les Anomalies découvertes pendant ces Audits ne sont pas destinées à rester dans cette Milestone.

Elles passent ensuite par le Grooming, la pesée et la planification.

---

## 12. Anomalies découvertes pendant l'Audit

Une Anomalie détectée pendant un Audit suit son propre cycle :

```text
Audit
    │
    ▼
Anomalie détectée
    │
    ▼
Grooming
    │
    ▼
Pesée
    │
    ▼
Planification
    │
    ├── Milestone
    └── Sprint
```

La Milestone de correction de l'Anomalie peut donc être différente de la Milestone utilisée pour l'Audit.

---

## 13. Deux temporalités

Le modèle doit distinguer deux situations.

### Cible

```text
Release Candidate
    ↓
Audit
    ↓
Version PROD
```

### Rattrapage

```text
Version PROD
    ↓
Audit
```

Cette différence doit être conservée dans le modèle normalisé et dans les indicateurs de qualité.

---

## 14. Conséquence sur la conformité

Dans le fonctionnement cible, les Audits participent à la préparation d'une Version PROD que l'on souhaite conforme.

Dans le fonctionnement de rattrapage, la conformité est évaluée après que la Version PROD a déjà été publiée.

Les indicateurs devront donc pouvoir distinguer notamment :

- Version auditée avant PROD ;
- Version non auditée avant PROD ;
- Audit de rattrapage ;
- résultat de conformité connu avant PROD ;
- résultat de conformité découvert après PROD.

Les définitions précises de ces indicateurs restent à formaliser.

---

## 15. Nexus

Nexus peut contenir :

```text
M.m.r
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
```

La présence dans Nexus ne suffit donc pas à qualifier une Version de PROD.

---

## 16. Tag Git

Une Version PROD possède un Tag Git correspondant.

Pour les workflows établis :

```text
release/*** → master ─┐
                      ├── Jenkins → Tag Git M.m.r
hotfix/***  → master ─┘
```

---

## 17. Release

Une Version PROD possède normalement une Release correspondante.

Son caractère systématiquement obligatoire et son mécanisme exact de création restent à confirmer.

---

## 18. Cycle global

```text
Version de base M.m.r
        │
        ├── develop / project
        │     └── M.m.r-SNAPSHOT
        │
        ├── release
        │     ├── M.m.r-rc.[build]
        │     │       │
        │     │       └── Audit pré-PROD souhaité
        │     │
        │     └── merge master
        │           └── Jenkins
        │                 └── M.m.r PROD
        │
        └── hotfix
              ├── M.m.r-hc.[build]
              └── merge master
                    └── Jenkins
                          └── M.m.r PROD
```

Si l'Audit n'a pas été effectué avant la PROD :

```text
M.m.r PROD
    │
    ▼
Milestone M.m.r-Audit
    │
    └── Audits de rattrapage
```

---

## 19. Principes retenus

1. Une Release Candidate peut être la Version effectivement auditée avant la PROD.
2. Le fonctionnement cible consiste à auditer avant la publication PROD.
3. Les Issues d'Audit pré-PROD évoluent dans la Milestone `M.m.r`.
4. `M.m.r-Audit` correspond à un mécanisme de rattrapage.
5. `M.m.r-Audit` n'est pas une Version.
6. Une Milestone de rattrapage ne contient que les Issues d'Audit des Composants.
7. Les Anomalies découvertes suivent ensuite leur propre cycle de Grooming et de planification.
8. La qualité avant PROD et la qualité découverte après PROD doivent être distinguées.
9. La valeur source des Milestones doit être conservée.
10. Le suffixe `-Audit` doit être configurable.

---

## 20. Points restant à préciser

Restent notamment à déterminer :

- comment identifier précisément la Release Candidate auditée ;
- si toutes les Issues d'Audit d'une Version doivent être terminées avant la PROD ;
- ce qui détermine qu'une Version peut être considérée comme conforme ;
- comment traiter une Anomalie détectée sur une Release Candidate avant la PROD ;
- comment relier une Anomalie à son Issue d'Audit ;
- le mécanisme de création de la Release GitHub ;
- le comportement attendu si une Milestone de Version est absente ;
- les règles précises d'historisation de la conformité.