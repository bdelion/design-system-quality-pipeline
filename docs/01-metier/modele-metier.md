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
- détecter les applications utilisant des versions anciennes ;
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
    │     │     └── Version
    │     │
    │     └── Composant
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

Le Design System peut contenir plusieurs librairies.

```text
Design System
    │
    ├── Librairie A
    ├── Librairie B
    └── Librairie C
```

---

## 6. Librairie

Une **librairie** est une unité métier du Design System mise à disposition des applications consommatrices.

### Situation actuelle observée

Aujourd'hui :

- un repository correspond à une librairie ;
- une librairie est distribuée sous la forme d'un package ;
- ce package possède un nom ;
- ce package possède des versions ;
- les applications utilisent ce package dans une version donnée.

La relation actuelle peut donc être représentée ainsi :

```text
Repository
    │
    └── Librairie
          │
          └── Package
                │
                └── Version
```

Dans la situation actuelle, la relation entre **Librairie** et **Package** est une relation 1:1.

### Exemples réels observés

| Librairie | Package | Version actuelle déclarée |
|---|---|---|
| Design System React | `@my-enterprise/design-system-react` | `1.7.1` |
| Enterprise Assets | `@my-enterprise/enterprise-assets` | `2.1.0` |
| Design System Metier React | `@my-enterprise/design-system-metier-react` | `0.14.0` |

Ces exemples confirment la correspondance actuellement observée entre une librairie et un package distribué.

La signification exacte de **version actuelle** reste à préciser.

### Cible future

Le modèle ne doit cependant pas dépendre définitivement de cette correspondance.

Il doit pouvoir évoluer vers :

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

Deux évolutions sont donc à anticiper :

- un repository pourra contenir plusieurs librairies ;
- une librairie pourra être distribuée par plusieurs packages.

Ces possibilités constituent des **capacités cibles** et non une description de la situation actuelle.

---

## 7. Repository

Le **repository** est un objet technique provenant du système de gestion de sources, actuellement GitHub.

Il contient notamment :

- les issues ;
- les Pull Requests ;
- les milestones ;
- les informations de projets nécessaires au pipeline.

Le repository ne doit pas devenir l'unité métier fondamentale du modèle.

### Situation actuelle

```text
1 Repository = 1 Librairie
```

### Cible

Le modèle doit permettre :

```text
1 Repository = 1..n Librairies
```

Cette évolution permet notamment de préparer la prise en charge future de monorepos.

---

## 8. Package

Le **package** est l'unité technique distribuable correspondant actuellement à une librairie et pouvant être référencée comme dépendance par une application.

### Situation actuelle observée

Une librairie est actuellement distribuée sous la forme d'un package.

Le package :

- possède un nom permettant de l'identifier ;
- possède plusieurs versions au cours de son cycle de vie ;
- peut être utilisé par une application dans une version donnée.

La relation actuellement établie est :

```text
Librairie
    │
    └── Package
          │
          ├── Version 1
          ├── Version 2
          └── Version N
```

Exemples observés :

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

Une librairie pourra potentiellement être distribuée par plusieurs packages.

Cette possibilité doit être conservée dans le modèle cible sans être considérée comme une situation actuelle.

Les propriétés exactes du Package et son articulation définitive avec Librairie et Version restent à préciser.

---

## 9. Version

Une **version** identifie un état versionné d'un package.

Dans la situation actuelle :

```text
Package
    │
    ├── Version 1
    ├── Version 2
    └── Version N
```

Une application utilise un package dans une version donnée.

```text
Application
    │
    └── utilise
          │
          ├── Package
          └── Version du Package
```

Les exemples fournis identifient actuellement :

- `1.7.1` pour `@my-enterprise/design-system-react` ;
- `2.1.0` pour `@my-enterprise/enterprise-assets` ;
- `0.14.0` pour `@my-enterprise/design-system-metier-react`.

À ce stade, ces valeurs sont qualifiées de **versions actuelles déclarées**.

La signification exacte de « version actuelle » doit encore être établie.

Le modèle détaillé permettant d'articuler :

- Version ;
- Release ;
- Milestone GitHub ;
- package publié ;

reste également à préciser.

---

## 10. Composant

Le **composant** est une unité fonctionnelle du Design System.

Il appartient à une librairie.

```text
Librairie
    │
    ├── Composant A
    ├── Composant B
    └── Composant C
```

Le catalogue des composants constitue la référence permettant d'identifier les composants connus.

Les composants peuvent être associés à :

- des issues ;
- des anomalies ;
- des audits ;
- des versions ;
- des informations de qualité.

---

## 11. Issue

Une **Issue** représente un élément de travail suivi dans GitHub.

Son sens métier dépend notamment :

- de son Issue Type ;
- de ses labels ;
- de son statut dans le projet ;
- de ses relations ;
- du workflow auquel elle appartient.

Une Issue ne doit donc pas être assimilée directement à une anomalie.

Elle peut notamment représenter :

- une anomalie ;
- une évolution ;
- une tâche ;
- un audit ;
- une Epic ;
- un nouveau composant ;
- un autre type de travail.

---

## 12. Anomalie

Une **anomalie** représente un problème identifié sur le Design System.

La définition exacte permettant de déterminer qu'une Issue est une anomalie doit être configurable.

Selon les repositories ou organisations, cette information pourra notamment être portée par :

- l'Issue Type ;
- un label ;
- une combinaison de plusieurs informations.

Une anomalie peut être caractérisée par :

- le composant concerné ;
- sa criticité ;
- son domaine de criticité ;
- sa catégorie ;
- son statut ;
- ses dates ;
- ses relations avec un audit ;
- ses relations avec des Pull Requests ;
- sa version ou son contexte de détection.

Une anomalie doit être distinguée d'une proposition d'amélioration.

---

## 13. Audit

Un **audit** représente une opération structurée d'évaluation d'un ou plusieurs composants.

Le modèle doit permettre de distinguer différents types d'audit.

Le premier domaine actuellement identifié est l'accessibilité.

Un audit peut notamment être associé à :

- une campagne ;
- un ou plusieurs composants ;
- une version ;
- un statut ;
- un résultat ;
- des anomalies ;
- des propositions d'amélioration.

Une campagne d'audit doit permettre de déterminer notamment :

- les composants prévus ;
- les composants en cours d'audit ;
- les composants audités ;
- les composants conformes ;
- les composants non conformes.

---

## 14. Conformité

Pour un domaine d'audit donné, il faut distinguer au minimum :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Cette distinction est nécessaire pour éviter de considérer implicitement un composant non audité comme non conforme.

Deux indicateurs différents doivent donc pouvoir être calculés :

```text
Couverture d'audit
= composants audités / composants du périmètre
```

et :

```text
Taux de conformité
= composants conformes / composants audités
```

---

## 15. Application consommatrice

Une **application consommatrice** est une application utilisant une ou plusieurs librairies du Design System.

Ce domaine appartient à la cible future du projet.

Dans la situation actuelle établie, une application utilise un package dans une version donnée :

```text
Application
    │
    └── utilise
          │
          ├── Package
          └── Version du Package
```

À terme, le système devra pouvoir déterminer :

- quelle librairie est utilisée ;
- quel package est utilisé ;
- quelle version est utilisée ;
- quels composants sont utilisés ;
- combien de fois ils sont utilisés ;
- quelle dette de mise à niveau existe ;
- quelles applications nécessitent une action.

Les sources permettant d'obtenir ces informations restent à définir.

---

## 16. Principes structurants

### 16.1. Séparer métier et représentation GitHub

GitHub est actuellement une source de données majeure, mais ses objets ne doivent pas dicter le modèle métier.

### 16.2. Séparer les responsabilités des informations

Les informations doivent conserver leur signification propre :

- **Issue Type** : qu'est-ce que l'objet ?
- **Label** : qu'est-ce qui le caractérise ?
- **Project / Status** : où en est-il ?
- **Iteration / Milestone** : quand ou dans quel lot ?
- **Relations** : à quoi est-il relié ?
- **Catalogue** : quel composant ?
- **Pull Request** : comment le changement est-il implémenté ?
- **Version / Release** : dans quelle livraison ?

### 16.3. Ne pas confondre état actuel et cible

Le modèle doit distinguer explicitement :

- les faits actuellement observés ;
- les règles métier validées ;
- les capacités futures ;
- les décisions restant à prendre.

### 16.4. Conserver la traçabilité

Tout indicateur doit pouvoir être expliqué.

Il doit être possible de remonter :

```text
Indicateur
    ↓
Calcul
    ↓
Entités métier
    ↓
Données normalisées
    ↓
Données sources
```

---

## 17. Évolution attendue du modèle

Le modèle doit pouvoir évoluer sans remettre en cause ses fondations vers :

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

Cette représentation constitue une direction d'architecture métier.

Les cardinalités et responsabilités qui ne sont pas encore établies doivent rester explicitement à confirmer.