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

Le **Design System** est l'ensemble cohérent de ressources, Composants, règles et Librairies mis à disposition des produits de l'entreprise.

Un Design System peut contenir plusieurs Librairies.

---

## 3. Librairie

Une **Librairie** est une unité métier du Design System mise à disposition des Applications consommatrices.

### Situation actuelle

Aujourd'hui :

```text
1 Repository = 1 Librairie
1 Librairie = 1 Package
```

Exemples :

| Librairie | Package | Dernière Version PROD déclarée |
|---|---|---|
| Design System React | `@my-enterprise/design-system-react` | `1.7.1` |
| Enterprise Assets | `@my-enterprise/enterprise-assets` | `2.1.0` |
| Design System Metier React | `@my-enterprise/design-system-metier-react` | `0.14.0` |

### Cible

Le modèle doit permettre :

```text
1 Repository = 1..n Librairies
1 Librairie = 1..n Packages
```

---

## 4. Repository

Le **Repository** est un conteneur technique de code et de données GitHub.

Il peut fournir notamment :

- Issues ;
- Pull Requests ;
- Milestones ;
- branches ;
- tags ;
- Releases ;
- informations de projets.

Le Repository est un objet technique. Il ne doit pas remplacer la notion métier de Librairie.

---

## 5. Package

Le **Package** est l'unité technique distribuable correspondant actuellement à une Librairie et pouvant être référencée comme dépendance par une Application.

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

À terme, une Librairie pourra être distribuée par plusieurs Packages.

---

## 6. Version

Une **Version** identifie un état versionné d'un Package.

### Version de base

Le cycle de construction utilise une Version de base :

```text
M.m.r
```

### Types actuellement établis

| Contexte / branche | Version produite |
|---|---|
| `develop` | `M.m.r-SNAPSHOT` |
| `project/***` | `M.m.r-SNAPSHOT` |
| `release/****` | `M.m.r-rc.[build Jenkins]` |
| `hotfix/****` | `M.m.r-hc.[build Jenkins]` |
| PROD | `M.m.r` |

### Version PROD

Une Version PROD :

- ne possède pas de suffixe ;
- est publiée dans un espace Nexus spécifique ;
- possède un tag Git correspondant ;
- doit posséder une Milestone portant son numéro ;
- possède normalement une Release correspondante.

Pour une release standard, elle est produite à la suite du merge de :

```text
release/M.m.r
```

vers :

```text
master
```

Ce merge déclenche automatiquement Jenkins.

Si les stages Jenkins précédant la publication sont tous réussis, Jenkins :

1. crée le tag Git `M.m.r` ;
2. publie le Package `M.m.r` dans Nexus PROD.

---

## 7. Build Jenkins

Le **Build Jenkins** est une exécution de la CI participant à la construction et à la publication des Versions.

Selon le type de branche, Jenkins produit notamment :

```text
develop / project/***
    → M.m.r-SNAPSHOT

release/****
    → M.m.r-rc.[build]

hotfix/****
    → M.m.r-hc.[build]
```

Pour une release standard, le merge de `release/M.m.r` vers `master` déclenche un Build Jenkins qui peut produire la Version PROD.

Le numéro de build Jenkins participe directement au numéro des Versions `rc` et `hc`.

Le Build Jenkins reste à ce stade un objet technique source et non nécessairement un objet métier autonome du modèle normalisé.

---

## 8. Composant

Le **Composant** est une unité fonctionnelle réutilisable appartenant à une Librairie du Design System.

Un Composant peut être associé à :

- des Issues ;
- des Anomalies ;
- des Audits ;
- des Versions ;
- des informations de qualité.

Le catalogue des Composants constitue la référence des Composants connus du pipeline.

---

## 9. Issue

Une **Issue** est un élément de travail provenant actuellement de GitHub.

Elle peut notamment posséder :

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

## 10. Anomalie

Une **Anomalie** est un problème identifié sur le Design System.

La manière de l'identifier doit être configurable.

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

## 11. Amélioration

Une **Amélioration** est une proposition d'amélioration ne correspondant pas nécessairement à une Anomalie ou à une non-conformité.

Un Audit peut produire :

```text
Audit
    ├── Anomalies / non-conformités
    └── Propositions d'amélioration
```

---

## 12. Criticité

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

## 13. Audit

Un **Audit** est une opération structurée visant à évaluer un périmètre du Design System.

L'accessibilité constitue le premier domaine identifié.

Un Audit peut être relié notamment à :

- une Campagne ;
- un Composant ;
- une Version ;
- un résultat ;
- des Anomalies ;
- des Améliorations.

---

## 14. Campagne d'Audit

Une **Campagne d'Audit** est un ensemble cohérent d'Audits réalisés dans un même contexte.

Elle doit permettre de suivre notamment :

- les Composants prévus ;
- les Composants en cours ;
- les Composants terminés ;
- les Composants conformes ;
- les Composants non conformes.

---

## 15. Conformité

Les états métier minimaux sont :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un Composant non audité ne doit pas être automatiquement considéré comme non conforme.

---

## 16. Pull Request

Une **Pull Request** représente une proposition de modification du code.

Une Pull Request peut être reliée à une ou plusieurs Issues.

La présence obligatoire ou non d'une Pull Request dépend du type de workflow.

---

## 17. Projet et statut

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

## 18. Iteration

Une **Iteration** est une période de travail planifiée utilisée pour organiser les travaux.

Elle peut notamment servir à calculer :

- nombre d'Issues prévues ;
- nombre d'Issues terminées ;
- nombre d'Issues annulées ;
- report ;
- vélocité ;
- capacité ;
- état du sprint.

---

## 19. Milestone

Une **Milestone** est un objet GitHub utilisé pour différents types de regroupements.

Les usages identifiés comprennent notamment :

- versions ;
- versions d'Audit ;
- horizons de planification ;
- lots de conception.

### Version PROD

Une Version PROD doit disposer d'une Milestone portant exactement son numéro.

```text
Version PROD : 1.8.0
Milestone : 1.8.0
```

Cela ne signifie pas que toute Milestone représente une Version PROD.

---

## 20. Tag Git

Un **Tag Git** identifie un point du Repository.

Une Version PROD possède un Tag correspondant exactement à son numéro.

Pour une release standard, ce Tag est créé par Jenkins après le merge de `release/M.m.r` vers `master`, à condition que les stages Jenkins précédents soient réussis.

```text
release/1.8.0
    ↓ merge master
Jenkins
    ↓ succès
tag 1.8.0
```

---

## 21. Release

Une **Release** est une information de publication associée au Repository.

Pour une Version PROD, une Release correspondante existe normalement.

Son caractère systématiquement obligatoire n'est toutefois pas établi.

Le mécanisme qui crée cette Release n'est pas encore documenté.

---

## 22. Publication Nexus

Une **Publication Nexus** correspond à la mise à disposition d'une Version d'un Package dans Nexus.

Plusieurs types de Versions peuvent être publiés.

Pour une release standard, après le merge de `release/M.m.r` vers `master`, Jenkins publie la Version `M.m.r` dans l'espace Nexus PROD si les stages précédents sont réussis.

```text
master
    ↓
Jenkins
    ↓ succès
Package M.m.r
    ↓
Nexus PROD
```

---

## 23. Application consommatrice

Une **Application consommatrice** utilise une ou plusieurs Librairies du Design System.

Une Application utilise un Package dans une Version donnée.

À terme, le système devra notamment distinguer :

- Version PROD ;
- Version SNAPSHOT ;
- Release Candidate ;
- Hotfix Candidate.

---

## 24. Snapshot

Un **Snapshot** est une photographie du système à un instant donné.

Il permet de conserver :

- les indicateurs ;
- leur contexte ;
- la version du modèle ;
- la version des règles ;
- les informations nécessaires à leur interprétation.

---

## 25. Indicateur

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

## 26. Relation synthétique entre les objets

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

Pour une release standard :

```text
release/M.m.r
    ↓
merge master
    ↓
Build Jenkins automatique
    ↓
stages réussis
    ├── Tag Git M.m.r
    └── Publication Nexus PROD M.m.r
```

Cette chaîne doit rester traçable dans le futur modèle de données.