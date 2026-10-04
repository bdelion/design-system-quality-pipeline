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

Un Design System peut contenir plusieurs librairies.

---

## 3. Librairie

### Définition

Unité métier du Design System mise à disposition des applications consommatrices.

### Situation actuelle

Aujourd'hui :

- une librairie correspond à un repository ;
- une librairie est distribuée sous la forme d'un package ;
- ce package peut être utilisé par les applications dans une version donnée.

```text
Repository
    └── Librairie
          └── Package
```

Exemples observés :

| Librairie | Package | Version actuelle déclarée |
|---|---|---|
| Design System React | `@my-enterprise/design-system-react` | `1.7.1` |
| Enterprise Assets | `@my-enterprise/enterprise-assets` | `2.1.0` |
| Design System Metier React | `@my-enterprise/design-system-metier-react` | `0.14.0` |

### Cible future

Le modèle doit permettre :

- plusieurs librairies dans un repository ;
- plusieurs packages pour une librairie.

```text
Repository
    ├── Librairie A
    │     ├── Package A1
    │     └── Package A2
    │
    └── Librairie B
          └── Package B1
```

Ces cardinalités représentent une capacité cible.

Elles ne décrivent pas la situation actuelle.

---

## 4. Repository

### Définition

Conteneur technique de code et de données GitHub.

### Données associées

Un repository peut fournir notamment :

- Issues ;
- Pull Requests ;
- Milestones ;
- informations de projets.

### Situation actuelle

```text
1 Repository = 1 Librairie
```

### Cible

```text
1 Repository = 1..n Librairies
```

Le repository est un objet de source et d'organisation technique. Il ne doit pas remplacer la notion métier de Librairie.

---

## 5. Package

### Définition

Unité technique distribuable correspondant actuellement à une librairie et pouvant être référencée comme dépendance par une application.

### Situation actuelle établie

Aujourd'hui, une librairie est distribuée sous la forme d'un package.

Le package :

- possède un nom permettant de l'identifier ;
- possède plusieurs versions au cours de son cycle de vie ;
- peut être utilisé par une application dans une version donnée.

```text
Librairie
    └── Package
          ├── Version 1
          ├── Version 2
          └── Version N
```

Les exemples réels actuellement identifiés sont :

```text
Design System React
    └── @my-enterprise/design-system-react
          └── version actuelle déclarée : 1.7.1

Enterprise Assets
    └── @my-enterprise/enterprise-assets
          └── version actuelle déclarée : 2.1.0

Design System Metier React
    └── @my-enterprise/design-system-metier-react
          └── version actuelle déclarée : 0.14.0
```

### Cible future

Une librairie pourra être distribuée par plusieurs packages.

```text
Librairie
    ├── Package A
    ├── Package B
    └── Package C
```

Cette possibilité doit être supportée par le modèle cible mais ne constitue pas une situation actuelle établie.

### À préciser

Les propriétés définitives du Package restent à définir.

Il reste notamment à préciser son articulation avec :

- la librairie ;
- les composants ;
- les releases ;
- les versions ;
- les sources de publication.

---

## 6. Version

### Définition

Identification d'un état versionné d'un Package.

### Situation actuelle établie

Une application utilise un Package dans une Version donnée.

```text
Application
    └── utilise
          ├── Package
          └── Version du Package
```

Les versions actuelles déclarées dans les exemples fournis sont :

- `@my-enterprise/design-system-react` : `1.7.1` ;
- `@my-enterprise/enterprise-assets` : `2.1.0` ;
- `@my-enterprise/design-system-metier-react` : `0.14.0`.

La signification exacte de **version actuelle** reste à préciser.

### À préciser

Il reste également à déterminer précisément la relation entre :

- version de package ;
- release ;
- milestone GitHub ;
- version métier de la librairie.

Aucune équivalence définitive entre ces notions ne doit être introduite tant qu'elle n'a pas été validée.

---

## 7. Composant

### Définition

Unité fonctionnelle réutilisable appartenant à une librairie du Design System.

### Relations

```text
Librairie
    └── Composant
```

Un composant peut être associé à :

- des Issues ;
- des anomalies ;
- des audits ;
- des versions ;
- des informations de qualité.

### Référence

Le catalogue des composants constitue la référence des composants connus du pipeline.

---

## 8. Issue

### Définition

Élément de travail provenant actuellement de GitHub.

### Informations métier

Une Issue peut notamment posséder :

- un Issue Type ;
- des labels ;
- un statut de workflow ;
- une vélocité ;
- une Iteration ;
- un Milestone ;
- des relations avec d'autres Issues ;
- des relations avec des Pull Requests ;
- un ou plusieurs composants associés.

### Important

Une Issue n'est pas nécessairement une anomalie.

Son sens métier est déterminé par sa classification et son contexte.

---

## 9. Anomalie

### Définition

Problème identifié sur le Design System et nécessitant potentiellement une correction.

### Identification

La manière d'identifier une anomalie doit être configurable.

Elle peut dépendre :

- de l'Issue Type ;
- d'un label ;
- d'une combinaison de critères ;
- du repository ou de l'organisation.

### Propriétés métier possibles

Une anomalie peut être caractérisée par :

- son composant ;
- son statut ;
- sa criticité ;
- le domaine de sa criticité ;
- sa catégorie ;
- sa date de détection ;
- sa date de correction ;
- son origine ;
- l'audit éventuel dont elle provient ;
- les Pull Requests associées ;
- la version concernée.

---

## 10. Amélioration

### Définition

Proposition d'amélioration ne correspondant pas nécessairement à une anomalie ou à une non-conformité.

Cette distinction est particulièrement importante pour les audits.

Un audit peut produire :

```text
Audit
    ├── Anomalies / non-conformités
    └── Propositions d'amélioration
```

Ces deux catégories ne doivent pas être automatiquement agrégées dans les mêmes indicateurs.

---

## 11. Criticité

### Définition

Niveau d'importance associé à une anomalie.

La criticité ne doit pas être considérée indépendamment de son domaine.

Il faut pouvoir distinguer notamment :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

Une valeur telle que `major` n'est donc pas suffisante seule.

Le modèle métier doit pouvoir représenter conceptuellement :

```text
Domaine de criticité + Niveau de criticité
```

---

## 12. Audit

### Définition

Opération structurée visant à évaluer un périmètre du Design System.

### Types

Le modèle doit permettre plusieurs types d'audit.

L'accessibilité constitue le premier domaine identifié.

D'autres types pourront être ajoutés ultérieurement.

### Relations possibles

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

### Définition

Ensemble cohérent d'audits réalisés dans un même contexte.

Une campagne doit permettre de suivre notamment :

- les composants prévus ;
- les composants en cours ;
- les composants terminés ;
- les composants conformes ;
- les composants non conformes.

---

## 14. Conformité

### Définition

Résultat d'un audit pour un périmètre donné.

Les états métier minimaux sont :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un composant non audité ne doit pas être automatiquement considéré comme non conforme.

---

## 15. Pull Request

### Définition

Objet GitHub représentant une proposition de modification du code.

Une Pull Request peut être reliée à une ou plusieurs Issues.

Elle constitue une information importante pour déterminer comment certains travaux ont été réalisés.

La présence obligatoire ou non d'une Pull Request dépend du type de workflow.

Par exemple, un audit ou une Epic ne suit pas nécessairement le même cycle qu'un travail de développement standard.

---

## 16. Projet et statut

### Définition

Le projet GitHub permet notamment de représenter l'état d'avancement d'un élément de travail.

Les statuts actuellement identifiés comprennent :

- Backlog ;
- Ready ;
- In progress ;
- In review ;
- Done ;
- Blocked ;
- Cancelled.

Le statut représente **où se trouve le travail dans son workflow**.

Il ne doit pas être confondu avec l'Issue Type ou les labels.

---

## 17. Iteration

### Définition

Période de travail planifiée utilisée pour organiser les travaux.

Elle peut servir à calculer des indicateurs tels que :

- nombre d'Issues prévues ;
- nombre d'Issues terminées ;
- nombre d'Issues annulées ;
- report ;
- vélocité ;
- capacité ;
- état du sprint.

Les règles exactes seront documentées dans le domaine workflow.

---

## 18. Milestone

### Définition

Objet GitHub actuellement utilisé pour représenter différents types de regroupements.

Les usages identifiés comprennent notamment :

- versions ;
- versions d'audit ;
- horizons de planification ;
- lots de conception.

Un Milestone ne doit donc pas être automatiquement assimilé à une Version.

Le pipeline devra interpréter sa signification selon des règles configurables.

---

## 19. Release

### Définition

Notion représentant la mise à disposition d'une version.

La relation exacte entre :

- Release ;
- Version ;
- Package ;
- Milestone ;

reste à formaliser.

Il ne faut pas introduire d'équivalence automatique entre ces objets tant que les règles métier correspondantes ne sont pas établies.

---

## 20. Application consommatrice

### Définition

Application utilisant une ou plusieurs librairies du Design System.

### Situation actuelle établie

Une application utilise un Package dans une Version donnée.

```text
Application
    └── utilise
          ├── Package
          └── Version du Package
```

### Cible future

Le système devra pouvoir enrichir cette relation avec notamment :

- les composants réellement utilisés ;
- leur fréquence d'utilisation ;
- la version attendue ;
- la dette de mise à niveau ;
- la qualité associée aux composants consommés.

Les sources permettant de construire ces informations restent à définir.

---

## 21. Snapshot

### Définition

Photographie du système à un instant donné.

Un Snapshot permet de conserver :

- les indicateurs ;
- leur contexte ;
- la version du modèle ;
- la version des règles ;
- les informations nécessaires à leur interprétation.

La comparaison de plusieurs Snapshots permet d'analyser l'évolution dans le temps.

---

## 22. Indicateur

### Définition

Mesure calculée à partir du modèle normalisé.

Un indicateur doit être explicable et traçable.

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

## 23. Relation synthétique entre les objets

### Situation actuelle

```text
Design System
    │
    └── Repository
          │
          └── Librairie
                │
                ├── Package
                │     │
                │     └── Versions
                │
                └── Composants
                      │
                      ├── Issues
                      ├── Anomalies
                      └── Audits

Application
    │
    └── utilise un Package dans une Version donnée
```

### Cible future

```text
Design System
    │
    ├── Repository
    │     │
    │     └── 1..n Librairies
    │             │
    │             ├── 1..n Packages
    │             │       └── Versions
    │             │
    │             └── Composants
    │
    └── Applications
          │
          └── Consommations
                ├── Package
                ├── Version
                └── Composants utilisés
```

La notion de **Consommation** présentée dans la cible est une représentation conceptuelle pratique.

Elle n'est pas encore validée comme objet métier autonome.

Les cardinalités cibles qui ne correspondent pas encore à une réalité observée restent à valider progressivement.