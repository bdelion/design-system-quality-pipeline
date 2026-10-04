# Objets métier

## 1. Objectif

Ce document recense les principaux objets métier manipulés ou envisagés par le Design System Quality Pipeline.

Il distingue :

- les objets métier ;
- les objets provenant des systèmes sources ;
- les objets nécessaires aux futures évolutions.

Leur modèle technique définitif n'est pas nécessairement arrêté.

---

## 2. Design System

### Définition

Ensemble cohérent de ressources, composants, règles et librairies mis à disposition des produits de l'entreprise.

### Relations principales

```text
Design System
    └── Librairie
```

Un Design System peut contenir plusieurs Librairies.

---

## 3. Librairie

### Définition

Unité métier du Design System mise à disposition des Applications consommatrices.

### Situation actuelle

Aujourd'hui :

- une Librairie correspond à un Repository ;
- une Librairie est distribuée sous la forme d'un Package ;
- ce Package peut être utilisé par les Applications dans une Version donnée.

Exemples observés :

| Librairie | Package | Dernière Version PROD déclarée |
|---|---|---|
| Design System React | `@my-enterprise/design-system-react` | `1.7.1` |
| Enterprise Assets | `@my-enterprise/enterprise-assets` | `2.1.0` |
| Design System Metier React | `@my-enterprise/design-system-metier-react` | `0.14.0` |

### Cible future

Le modèle doit permettre :

- plusieurs Librairies dans un Repository ;
- plusieurs Packages pour une Librairie.

Ces cardinalités représentent une capacité cible.

---

## 4. Repository

### Définition

Conteneur technique de code et de données GitHub.

### Données associées

Un Repository peut fournir notamment :

- Issues ;
- Pull Requests ;
- Milestones ;
- branches ;
- tags ;
- Releases ;
- informations de projets.

### Situation actuelle

```text
1 Repository = 1 Librairie
```

### Cible

```text
1 Repository = 1..n Librairies
```

---

## 5. Package

### Définition

Unité technique distribuable correspondant actuellement à une Librairie et pouvant être référencée comme dépendance par une Application.

### Situation actuelle établie

Le Package :

- possède un nom ;
- possède une Version de base ;
- peut produire plusieurs types de Versions ;
- est publié dans Nexus ;
- peut être utilisé par une Application dans une Version donnée.

Exemple :

```text
Design System React
    └── @my-enterprise/design-system-react
          ├── PROD : 1.7.1
          └── develop : 1.8.0-SNAPSHOT
```

### Cible future

Une Librairie pourra être distribuée par plusieurs Packages.

Cette possibilité doit être supportée par le modèle cible mais ne constitue pas une situation actuelle établie.

---

## 6. Version

### Définition

Identification d'un état versionné d'un Package.

### Version de base

Le cycle de construction utilise une Version de base de forme :

```text
M.m.r
```

Cette Version de base est utilisée par la CI Jenkins pour produire différentes Versions selon le type de branche.

### Types actuellement établis

| Contexte / branche | Version produite |
|---|---|
| `develop` | `M.m.r-SNAPSHOT` |
| `project/***` | `M.m.r-SNAPSHOT` |
| `release/****` | `M.m.r-rc.[build Jenkins]` |
| `hotfix/****` | `M.m.r-hc.[build Jenkins]` |
| PROD | `M.m.r` |

### Version SNAPSHOT

Une Version SNAPSHOT :

- est produite depuis `develop` ou `project/***` ;
- possède la forme `M.m.r-SNAPSHOT` ;
- peut être publiée dans Nexus ;
- est destinée aux tests d'intégration ;
- n'a pas vocation à être déployée en production.

### Release Candidate

Une Release Candidate :

- est produite depuis `release/****` ;
- possède la forme `M.m.r-rc.[numéro de build Jenkins]`.

### Hotfix Candidate

Une Hotfix Candidate :

- est produite depuis `hotfix/****` ;
- possède la forme `M.m.r-hc.[numéro de build Jenkins]`.

### Version PROD

Une Version PROD :

- possède la forme `M.m.r` sans suffixe ;
- est disponible dans un espace Nexus spécifique ;
- possède un tag Git correspondant ;
- doit posséder une Milestone portant son numéro ;
- possède normalement une Release correspondante.

Exemple :

```text
1.7.1
├── Nexus PROD
├── tag Git : 1.7.1
├── Milestone : 1.7.1
└── Release : normalement présente
```

La Release n'est pas considérée comme obligatoire à ce stade.

---

## 7. Composant

### Définition

Unité fonctionnelle réutilisable appartenant à une Librairie du Design System.

Un Composant peut être associé à :

- des Issues ;
- des Anomalies ;
- des Audits ;
- des Versions ;
- des informations de qualité.

Le catalogue des composants constitue la référence des Composants connus du pipeline.

---

## 8. Issue

### Définition

Élément de travail provenant actuellement de GitHub.

Une Issue peut notamment posséder :

- un Issue Type ;
- des labels ;
- un statut de workflow ;
- une vélocité ;
- une Iteration ;
- un Milestone ;
- des relations avec d'autres Issues ;
- des relations avec des Pull Requests ;
- un ou plusieurs Composants associés.

Une Issue n'est pas nécessairement une Anomalie.

---

## 9. Anomalie

### Définition

Problème identifié sur le Design System et nécessitant potentiellement une correction.

La manière d'identifier une Anomalie doit être configurable.

Elle peut dépendre :

- de l'Issue Type ;
- d'un label ;
- d'une combinaison de critères ;
- du Repository ou de l'organisation.

Une Anomalie peut être caractérisée par :

- son Composant ;
- son statut ;
- sa criticité ;
- le domaine de sa criticité ;
- sa catégorie ;
- sa date de détection ;
- sa date de correction ;
- son origine ;
- l'Audit éventuel dont elle provient ;
- les Pull Requests associées ;
- la Version concernée.

---

## 10. Amélioration

Une **Amélioration** est une proposition d'amélioration ne correspondant pas nécessairement à une Anomalie ou à une non-conformité.

```text
Audit
    ├── Anomalies / non-conformités
    └── Propositions d'amélioration
```

Ces deux catégories ne doivent pas être automatiquement agrégées dans les mêmes indicateurs.

---

## 11. Criticité

La **Criticité** est un niveau d'importance associé à une Anomalie.

Elle doit être associée à un domaine.

Il faut pouvoir distinguer notamment :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

---

## 12. Audit

Un **Audit** est une opération structurée visant à évaluer un périmètre du Design System.

L'accessibilité constitue le premier domaine identifié.

```text
Audit
    ├── Campagne
    ├── Composant
    ├── Version
    ├── Résultat
    ├── Anomalies
    └── Améliorations
```

Les cardinalités précises restent à formaliser.

---

## 13. Campagne d'audit

Une **Campagne d'audit** est un ensemble cohérent d'Audits réalisés dans un même contexte.

Elle doit permettre de suivre notamment :

- les Composants prévus ;
- les Composants en cours ;
- les Composants terminés ;
- les Composants conformes ;
- les Composants non conformes.

---

## 14. Conformité

Les états métier minimaux sont :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un Composant non audité ne doit pas être automatiquement considéré comme non conforme.

---

## 15. Pull Request

Une **Pull Request** représente une proposition de modification du code.

Une Pull Request peut être reliée à une ou plusieurs Issues.

La présence obligatoire ou non d'une Pull Request dépend du type de workflow.

---

## 16. Projet et statut

Le projet GitHub permet notamment de représenter l'état d'avancement d'un élément de travail.

Les statuts actuellement identifiés comprennent :

- Backlog ;
- Ready ;
- In progress ;
- In review ;
- Done ;
- Blocked ;
- Cancelled.

---

## 17. Iteration

Une **Iteration** est une période de travail planifiée utilisée pour organiser les travaux.

Elle peut servir à calculer notamment :

- nombre d'Issues prévues ;
- nombre d'Issues terminées ;
- nombre d'Issues annulées ;
- report ;
- vélocité ;
- capacité ;
- état du sprint.

---

## 18. Milestone

Une **Milestone** est un objet GitHub actuellement utilisé pour représenter différents types de regroupements.

Les usages identifiés comprennent notamment :

- versions ;
- versions d'audit ;
- horizons de planification ;
- lots de conception.

### Règle établie pour une Version PROD

Une Version PROD doit disposer d'une Milestone portant son numéro.

Exemple :

```text
Version PROD : 1.7.1
Milestone : 1.7.1
```

Cela ne signifie pas que toute Milestone représente nécessairement une Version PROD.

---

## 19. Tag Git

### Définition

Un **Tag Git** identifie un point du Repository.

### Règle établie pour une Version PROD

Une Version PROD possède un tag Git correspondant à son numéro.

Exemple :

```text
Version PROD : 1.7.1
Tag Git : 1.7.1
```

---

## 20. Release

Une **Release** représente une information de publication associée au Repository.

Pour une Version PROD, une Release correspondante existe normalement.

Cependant, son caractère systématiquement obligatoire n'est pas établi.

La Release ne doit donc pas être utilisée seule comme critère obligatoire de qualification d'une Version PROD.

---

## 21. Publication Nexus

### Définition

Publication d'une Version d'un Package dans Nexus.

### Important

Plusieurs types de Versions sont disponibles dans Nexus.

La publication Nexus ne signifie donc pas automatiquement :

```text
Version = PROD
```

Une Version PROD est disponible dans un espace Nexus spécifique.

Les Versions intermédiaires générées par Jenkins peuvent également être publiées dans Nexus.

---

## 22. Application consommatrice

Une **Application consommatrice** utilise une ou plusieurs Librairies du Design System.

Une Application utilise un Package dans une Version donnée.

Le système devra à terme distinguer :

- Version PROD ;
- Version SNAPSHOT ;
- Release Candidate ;
- Hotfix Candidate.

---

## 23. Snapshot

Un **Snapshot** est une photographie du système à un instant donné.

Il permet de conserver :

- les indicateurs ;
- leur contexte ;
- la version du modèle ;
- la version des règles ;
- les informations nécessaires à leur interprétation.

---

## 24. Indicateur

Un **Indicateur** est une mesure calculée à partir du modèle normalisé.

Il doit notamment pouvoir exposer :

- sa valeur ;
- son unité ;
- son numérateur ;
- son dénominateur ;
- son périmètre ;
- sa période éventuelle ;
- sa définition ;
- les entités sources ;
- sa fiabilité ;
- les exclusions éventuelles.

---

## 25. Relation synthétique entre les objets

```text
Repository
    │
    ├── branches
    ├── tags
    ├── Milestones
    ├── Releases
    │
    └── Librairie
          │
          ├── Package
          │     │
          │     └── Versions
          │           ├── PROD
          │           ├── SNAPSHOT
          │           ├── Release Candidate
          │           └── Hotfix Candidate
          │
          └── Composants
```

Jenkins produit les différentes formes de Versions en fonction du type de branche.

Nexus constitue la source de publication des Packages et de leurs Versions.

La modélisation technique définitive de ces relations reste à définir après stabilisation des règles métier.