# Versions et releases

## 1. Objectif

Ce document décrit le cycle de Version des Packages du Design System et ses relations avec les Audits.

Il distingue notamment :

- la Version déclarée dans `package.json` ;
- la Version d'artefact produite par Jenkins ;
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

## 2. Version déclarée dans `package.json`

Le fichier `package.json` contient une propriété :

```json
{
  "version": "1.8.0"
}
```

Dans le fonctionnement nominal observé sur `develop`, cette valeur est une Version de base de forme :

```text
M.m.r
```

Exemple :

```text
1.8.0
```

Cette valeur ne correspond pas nécessairement à la Version exacte de l'artefact qui sera publié dans Nexus.

Jenkins peut construire la Version finale de l'artefact en fonction du contexte de build.

---

## 3. Version de base et Version d'artefact

Le modèle doit distinguer deux notions.

### Version déclarée

Valeur présente dans `package.json`.

Exemple :

```text
1.8.0
```

### Version d'artefact

Version calculée ou produite par Jenkins pour l'artefact construit.

Exemples :

```text
1.8.0-SNAPSHOT
1.8.0-rc.123
1.8.0-hc.42
1.8.0
```

Conceptuellement :

```text
package.json.version
        │
        ▼
Version déclarée
        │
        ▼
Jenkins + contexte de build
        │
        ▼
Version d'artefact
```

Les noms techniques définitifs de ces deux propriétés seront définis ultérieurement dans le modèle normalisé.

---

## 4. Cas nominal

Dans le cas nominal établi :

```json
{
  "version": "1.8.0"
}
```

Jenkins utilise cette Version comme base et construit la Version d'artefact selon le contexte.

```text
1.8.0
    │
    ▼
Jenkins
    │
    ├── develop / project/***
    │      └── 1.8.0-SNAPSHOT
    │
    ├── release/***
    │      └── 1.8.0-rc.[build]
    │
    ├── hotfix/***
    │      └── 1.8.0-hc.[build]
    │
    └── production
           └── 1.8.0
```

---

## 5. `package.json` contenant déjà `-SNAPSHOT`

Jenkins sait également traiter le cas où `package.json` contient déjà une Version telle que :

```json
{
  "version": "1.8.0-SNAPSHOT"
}
```

Ce cas est supporté.

Il ne faut donc pas définir une règle métier imposant systématiquement :

```text
package.json.version = M.m.r
```

La valeur sans suffixe correspond au fonctionnement nominal actuellement observé, mais elle n'est pas une contrainte absolue du processus Jenkins.

Les règles précises appliquées par Jenkins lorsqu'un suffixe est déjà présent ne sont pas encore documentées.

---

## 6. Classification des Versions d'artefact

| Catégorie | Forme | Origine |
|---|---|---|
| SNAPSHOT | `M.m.r-SNAPSHOT` | `develop` ou `project/***` |
| Release Candidate | `M.m.r-rc.[build]` | `release/***` |
| Hotfix Candidate | `M.m.r-hc.[build]` | `hotfix/***` |
| PROD release | `M.m.r` | merge `release/***` → `master` |
| PROD hotfix | `M.m.r` | merge `hotfix/***` → `master` |

Une Milestone `M.m.r-Audit` n'est pas une Version supplémentaire.

---

## 7. Versions SNAPSHOT

Depuis :

```text
develop
project/***
```

Jenkins produit une Version d'artefact :

```text
M.m.r-SNAPSHOT
```

Dans le fonctionnement nominal, Jenkins ajoute donc le suffixe :

```text
-SNAPSHOT
```

à la Version de base présente dans `package.json`.

Exemple :

```text
package.json
    │
    └── 1.8.0
          │
          ▼
       Jenkins
          │
          └── 1.8.0-SNAPSHOT
```

Ces Versions peuvent être disponibles dans Nexus mais sont destinées aux tests d'intégration et non à la production.

---

## 8. Release Candidate

Depuis :

```text
release/***
```

Jenkins produit :

```text
M.m.r-rc.[numéro de build Jenkins]
```

Exemple conceptuel :

```text
package.json : 1.8.0
branche       : release/***
build Jenkins : 123
        │
        ▼
artefact      : 1.8.0-rc.123
```

Une Release Candidate joue également un rôle important dans le fonctionnement cible des Audits.

L'objectif est de pouvoir auditer une Release Candidate avant la publication de la Version PROD correspondante.

---

## 9. Hotfix Candidate

Depuis :

```text
hotfix/***
```

Jenkins produit :

```text
M.m.r-hc.[numéro de build Jenkins]
```

Exemple conceptuel :

```text
package.json : 1.8.0
branche       : hotfix/***
build Jenkins : 42
        │
        ▼
artefact      : 1.8.0-hc.42
```

---

## 10. Production d'une Version PROD

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

## 11. Milestone de Version

Une Version PROD cible possède une Milestone portant son numéro.

Exemple :

```text
Version   : 1.1.0
Milestone : 1.1.0
```

Cette Milestone peut contenir les travaux associés à la préparation de la Version.

Dans le fonctionnement cible des Audits, les Issues d'Audit des Composants évoluent également dans cette Milestone.

---

## 12. Audit pré-PROD — fonctionnement cible

Le fonctionnement souhaité consiste à réaliser les Audits sur une Release Candidate avant la publication de la Version PROD finale.

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
Version PROD cible             : 1.1.0
Milestone                      : 1.1.0
```

---

## 13. Audit de rattrapage

La convention :

```text
M.m.r-Audit
```

est utilisée pour effectuer un Audit de rattrapage lorsque l'Audit n'a pas été réalisé avant la création de la Version PROD.

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

## 14. Contenu de la Milestone de rattrapage

La Milestone :

```text
M.m.r-Audit
```

ne contient que les Issues d'Audit des Composants.

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

## 15. Anomalies découvertes pendant l'Audit

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

## 16. Deux temporalités d'Audit

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

## 17. Conséquence sur la conformité

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

## 18. Nexus

Nexus peut contenir :

```text
M.m.r
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
```

La présence dans Nexus ne suffit donc pas à qualifier une Version de PROD.

La Version publiée dans Nexus doit être distinguée de la Version déclarée dans `package.json`.

---

## 19. Tag Git

Une Version PROD possède un Tag Git correspondant.

Pour les workflows établis :

```text
release/*** → master ─┐
                      ├── Jenkins → Tag Git M.m.r
hotfix/***  → master ─┘
```

---

## 20. Release

Une Version PROD possède normalement une Release correspondante.

Son caractère systématiquement obligatoire et son mécanisme exact de création restent à confirmer.

---

## 21. Cycle global

```text
package.json.version
        │
        └── généralement M.m.r
                │
                ▼
             Jenkins
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

## 22. Principes retenus

1. La Version déclarée dans `package.json` et la Version d'artefact sont deux notions distinctes.
2. Dans le fonctionnement nominal, `package.json` contient une Version `M.m.r`.
3. Jenkins construit la Version d'artefact en fonction du contexte de build.
4. Jenkins sait également traiter un `package.json` contenant déjà `M.m.r-SNAPSHOT`.
5. La forme `M.m.r` dans `package.json` ne doit donc pas être considérée comme une contrainte absolue.
6. Une Release Candidate peut être la Version effectivement auditée avant la PROD.
7. Le fonctionnement cible consiste à auditer avant la publication PROD.
8. Les Issues d'Audit pré-PROD évoluent dans la Milestone `M.m.r`.
9. `M.m.r-Audit` correspond à un mécanisme de rattrapage.
10. `M.m.r-Audit` n'est pas une Version.
11. Une Milestone de rattrapage ne contient que les Issues d'Audit des Composants.
12. Les Anomalies découvertes suivent ensuite leur propre cycle de Grooming et de planification.
13. La qualité avant PROD et la qualité découverte après PROD doivent être distinguées.

---

## 23. Points restant à préciser

Restent notamment à déterminer :

- le traitement Jenkins exact lorsque `package.json.version` contient déjà un suffixe ;
- comment identifier précisément la Release Candidate auditée ;
- si toutes les Issues d'Audit d'une Version doivent être terminées avant la PROD ;
- ce qui détermine qu'une Version peut être considérée comme conforme ;
- comment traiter une Anomalie détectée sur une Release Candidate avant la PROD ;
- comment relier une Anomalie à son Issue d'Audit ;
- le mécanisme de création de la Release GitHub ;
- le comportement attendu si une Milestone de Version est absente ;
- les règles précises d'historisation de la conformité.