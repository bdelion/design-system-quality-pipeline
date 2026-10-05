# Modèle métier

## 1. Objectif

Ce document décrit le modèle métier porté par le projet **Design System Quality Pipeline**.

L'objectif est de disposer d'un vocabulaire et d'un modèle communs permettant de représenter :

- le Design System ;
- ses librairies ;
- les packages distribués ;
- leurs versions ;
- les composants ;
- les travaux réalisés sur ces composants ;
- les anomalies ;
- les audits ;
- les versions et releases ;
- les applications consommatrices ;
- les données nécessaires au pilotage de la qualité et de l'activité.

Ce modèle constitue la référence métier du pipeline.

Il doit rester indépendant :

- de la représentation GitHub des données ;
- de l'implémentation technique du pipeline ;
- de la structure actuelle des repositories ;
- des choix de visualisation du dashboard.

---

## 2. Finalité du système

Le système doit progressivement couvrir trois domaines complémentaires.

### 2.1. Mesure de la qualité du Design System

Le premier objectif est de mesurer la qualité du Design System.

Cela comprend notamment :

- la couverture des audits ;
- la conformité des composants ;
- les anomalies détectées ;
- leur criticité ;
- leur catégorie ;
- leur état de traitement ;
- les délais de correction ;
- la qualité des composants ;
- l'évolution de cette qualité dans le temps.

Ce domaine constitue le besoin prioritaire.

### 2.2. Pilotage opérationnel du Design System

Le système doit également permettre de suivre l'activité des équipes qui maintiennent le Design System.

Cela comprend notamment :

- les travaux en cours ;
- les anomalies ;
- les audits ;
- les sprints ou itérations ;
- les délais ;
- les versions ;
- les releases ;
- les travaux terminés, annulés ou reportés.

### 2.3. Pilotage des consommateurs

À terme, le système devra également permettre d'analyser l'utilisation du Design System dans les applications consommatrices.

Les besoins envisagés comprennent notamment :

- identifier les librairies utilisées par une application ;
- identifier les packages utilisés ;
- identifier les versions utilisées ;
- identifier les composants utilisés ;
- mesurer le nombre d'utilisations de chaque composant ;
- identifier les composants les plus utilisés ;
- détecter les applications utilisant des versions de production anciennes ;
- suivre la dette liée aux montées de version ;
- alerter les Squads responsables ;
- croiser la qualité d'une version du Design System avec son utilisation dans les applications ;
- fournir à terme une information synthétique sur la qualité RGAA / WAI-ARIA associée au Design System utilisé par une application.

Ce domaine est une cible future et nécessite des sources de données complémentaires à GitHub.

---

## 3. Point d'entrée du système

Le dashboard doit constituer un **point d'entrée unique** vers les informations de qualité et de pilotage du Design System.

Il doit proposer :

- une page d'accueil synthétique à l'échelle de l'entreprise ;
- des sections clairement identifiées ;
- des possibilités de navigation vers des niveaux de détail croissants.

Les niveaux de lecture envisagés sont notamment :

1. Portfolio / entreprise ;
2. Librairie ;
3. Composant ;
4. Audit / version ;
5. Issue / élément de traçabilité ;
6. Application consommatrice à terme.

---

## 4. Structure métier générale

Le modèle métier cible peut être représenté de manière simplifiée ainsi :

```text
Design System
    │
    ├── Librairie
    │     │
    │     ├── Package
    │     │     │
    │     │     └── Versions
    │     │
    │     └── Composants
    │
    ├── Audits
    │     │
    │     └── Anomalies / améliorations
    │
    └── Activité
          │
          ├── Issues
          ├── Pull Requests
          ├── Iterations
          ├── Milestones
          └── Releases
```

À terme, le domaine des consommateurs complète ce modèle :

```text
Application
    │
    └── utilise
          │
          └── Package dans une Version donnée
                    │
                    └── correspond à une Librairie
```

---

## 5. Design System

Le **Design System** est l'ensemble cohérent de ressources mises à disposition des produits de l'entreprise.

Dans le périmètre actuel du projet, le système s'intéresse principalement aux librairies techniques contenant des composants réutilisables.

Le Design System peut contenir plusieurs Librairies.

---

## 6. Librairie

Une **Librairie** est une unité métier du Design System mise à disposition des applications consommatrices.

### Situation actuelle observée

Aujourd'hui :

- un Repository correspond à une Librairie ;
- une Librairie est distribuée sous la forme d'un Package ;
- ce Package possède un nom ;
- ce Package possède plusieurs Versions au cours de son cycle de vie ;
- les Applications utilisent le Package dans une Version donnée.

Dans la situation actuelle :

```text
1 Repository = 1 Librairie
1 Librairie = 1 Package
```

### Exemples réels observés

| Librairie | Package | Dernière Version PROD déclarée |
|---|---|---|
| Design System React | `@my-enterprise/design-system-react` | `1.7.1` |
| Enterprise Assets | `@my-enterprise/enterprise-assets` | `2.1.0` |
| Design System Metier React | `@my-enterprise/design-system-metier-react` | `0.14.0` |

### Cible future

Le modèle doit pouvoir évoluer vers :

```text
Repository
    │
    ├── Librairie A
    │     ├── Package A1
    │     └── Package A2
    │
    └── Librairie B
          └── Package B1
```

Le modèle doit donc permettre à terme :

```text
1 Repository = 1..n Librairies
1 Librairie = 1..n Packages
```

---

## 7. Repository

Le **Repository** est un objet technique provenant du système de gestion de sources, actuellement GitHub.

Il contient ou expose notamment :

- les Issues ;
- les Pull Requests ;
- les Milestones ;
- les branches ;
- les tags ;
- les Releases ;
- les informations de projets nécessaires au pipeline.

Le Repository ne doit pas devenir l'unité métier fondamentale du modèle.

---

## 8. Package

Le **Package** est l'unité technique distribuable correspondant actuellement à une Librairie et pouvant être référencée comme dépendance par une Application.

Le Package :

- possède un nom ;
- possède une Version de base ;
- peut donner lieu à plusieurs types de Versions produites par la CI ;
- est publié dans Nexus ;
- peut être utilisé par une Application dans une Version donnée.

Pour Design System React :

```text
Design System React
    │
    └── @my-enterprise/design-system-react
          │
          ├── PROD
          │     └── 1.7.1
          │
          └── develop
                └── 1.8.0-SNAPSHOT
```

---

## 9. Version

Une **Version** identifie un état versionné d'un Package.

Le cycle actuel utilise une Version de base de forme :

```text
M.m.r
```

À partir de cette Version de base et du type de branche, Jenkins produit différentes Versions.

### 9.1. Version SNAPSHOT

Depuis :

- `develop` ;
- `project/***` ;

Jenkins produit :

```text
M.m.r-SNAPSHOT
```

Ces Versions sont disponibles dans Nexus et destinées notamment aux tests d'intégration.

Elles n'ont pas vocation à être déployées en production.

### 9.2. Release Candidate

Depuis une branche :

```text
release/***
```

Jenkins produit :

```text
M.m.r-rc.[numéro de build Jenkins]
```

### 9.3. Hotfix Candidate

Depuis une branche :

```text
hotfix/***
```

Jenkins produit :

```text
M.m.r-hc.[numéro de build Jenkins]
```

### 9.4. Version PROD

Une Version PROD :

- possède la forme `M.m.r` sans suffixe ;
- est disponible dans un Repository / espace Nexus spécifique à la production ;
- possède un tag Git correspondant ;
- doit disposer d'une Milestone portant exactement son numéro ;
- possède normalement une Release correspondante.

Deux chemins de mise en production sont désormais établis :

```text
release/M.m.r ──merge──> master
                         │
                         ▼
                      Jenkins
                         │
                         └── succès
                              ├── tag Git M.m.r
                              └── Nexus PROD M.m.r
```

et :

```text
hotfix/xxx ─────merge──> master
                         │
                         ▼
                      Jenkins
                         │
                         └── succès
                              ├── tag Git M.m.r
                              └── Nexus PROD M.m.r
```

Dans les deux cas, le merge vers `master` déclenche le job Jenkins responsable de la production des éléments de la Version PROD.

---

## 10. Cycle de production des Versions

Le fonctionnement actuellement établi est :

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
        │     │     └── M.m.r-rc.[build Jenkins]
        │     │
        │     └── merge vers master
        │           └── Jenkins automatique
        │                 └── si succès
        │                       ├── tag Git M.m.r
        │                       └── Nexus PROD M.m.r
        │
        └── hotfix/***
              ├── Jenkins
              │     └── M.m.r-hc.[build Jenkins]
              │
              └── merge vers master
                    └── Jenkins automatique
                          └── si succès
                                ├── tag Git M.m.r
                                └── Nexus PROD M.m.r
```

---

## 11. Composant

Le **Composant** est une unité fonctionnelle du Design System.

Il appartient à une Librairie.

Le catalogue des Composants constitue la référence permettant d'identifier les Composants connus.

Les Composants peuvent être associés à :

- des Issues ;
- des Anomalies ;
- des Audits ;
- des Versions ;
- des informations de qualité.

---

## 12. Issue

Une **Issue** représente un élément de travail suivi dans GitHub.

Son sens métier dépend notamment :

- de son Issue Type ;
- de ses labels ;
- de son statut dans le projet ;
- de ses relations ;
- du workflow auquel elle appartient.

Une Issue ne doit pas être assimilée directement à une Anomalie.

---

## 13. Anomalie

Une **Anomalie** représente un problème identifié sur le Design System.

La définition permettant de déterminer qu'une Issue est une Anomalie doit être configurable.

Une Anomalie peut être caractérisée par :

- le Composant concerné ;
- sa criticité ;
- son domaine de criticité ;
- sa catégorie ;
- son statut ;
- ses dates ;
- ses relations avec un Audit ;
- ses relations avec des Pull Requests ;
- sa Version ou son contexte de détection.

Une Anomalie doit être distinguée d'une proposition d'amélioration.

---

## 14. Audit

Un **Audit** représente une opération structurée d'évaluation d'un ou plusieurs Composants.

Le premier domaine actuellement identifié est l'accessibilité.

Un Audit peut notamment être associé à :

- une campagne ;
- un ou plusieurs Composants ;
- une Version ;
- un statut ;
- un résultat ;
- des Anomalies ;
- des propositions d'amélioration.

---

## 15. Conformité

Pour un domaine d'Audit donné, il faut distinguer au minimum :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Il faut distinguer :

```text
Couverture d'audit
= composants audités / composants du périmètre
```

de :

```text
Taux de conformité
= composants conformes / composants audités
```

---

## 16. Application consommatrice

Une **Application consommatrice** utilise une ou plusieurs Librairies du Design System.

Une Application utilise un Package dans une Version donnée.

Une Version publiée dans Nexus peut notamment être :

- une Version PROD ;
- une Version SNAPSHOT ;
- une Release Candidate ;
- une Hotfix Candidate.

À terme, le système devra pouvoir déterminer :

- quelle Librairie est utilisée ;
- quel Package est utilisé ;
- quelle Version est utilisée ;
- le type ou contexte de cette Version ;
- quels Composants sont utilisés ;
- combien de fois ils sont utilisés ;
- quelle dette de mise à niveau existe ;
- quelles Applications nécessitent une action.

---

## 17. Principes structurants

### 17.1. Séparer métier et représentation technique

GitHub, Jenkins et Nexus sont des systèmes techniques.

Leurs objets doivent alimenter le modèle métier sans le définir implicitement.

### 17.2. Ne pas déduire PROD du seul numéro de Version

L'absence de suffixe est une caractéristique d'une Version PROD, mais sa qualification repose également sur le processus de livraison.

### 17.3. Publication Nexus et qualification PROD sont distinctes

Plusieurs types de Versions peuvent être publiés dans Nexus.

### 17.4. La production PROD est un processus traçable

Les deux chemins établis sont :

```text
release/*** → master → Jenkins → tag + Nexus PROD
hotfix/***  → master → Jenkins → tag + Nexus PROD
```

### 17.5. Conserver la traçabilité

Tout indicateur doit pouvoir être expliqué depuis les données sources jusqu'à sa valeur calculée.

---

## 18. Évolution attendue du modèle

Le modèle doit pouvoir évoluer vers :

```text
Entreprise
    │
    ├── Design System
    │     │
    │     ├── Librairies
    │     │     │
    │     │     ├── Packages
    │     │     │     └── Versions
    │     │     │
    │     │     └── Composants
    │     │
    │     ├── Audits
    │     └── Activité
    │
    └── Applications consommatrices
          │
          ├── Packages utilisés
          ├── Versions utilisées
          ├── Composants utilisés
          └── Dette / qualité associée
```

Les éléments qui ne sont pas encore établis doivent rester explicitement à confirmer.