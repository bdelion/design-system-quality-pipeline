# Objets métier

## Statut

**BASE DE TRAVAIL — ENRICHIE LE 04/10/2026**

Ce document décrit les objets métier identifiés dans le projet.

Il distingue les objets métier des objets techniques provenant de GitHub.

---

## 1. Organisation

### Définition

Une Organisation représente un périmètre organisationnel regroupant une ou plusieurs librairies du Design System.

### Situation actuelle

Le projet utilise notamment le owner GitHub pour identifier l'organisation.

### À instruire

La définition métier exacte d'une Organisation et la nécessité de gérer plusieurs organisations ne sont pas encore définies.

---

## 2. Librairie

### Définition

Une Librairie représente une unité métier du Design System suivie par le dashboard.

### Situation actuelle

Aujourd'hui, une librairie correspond principalement à un package distribuable.

### Évolution souhaitée

Le modèle doit pouvoir représenter une librairie fonctionnelle distribuée par plusieurs packages.

```text
Librairie
├── Package A
├── Package B
└── ...
```

### À instruire

La définition exacte d'une librairie indépendante de son ou ses packages n'est pas encore arrêtée.

---

## 3. Package

### Définition

Un Package représente une unité distribuable d'une librairie.

### Situation actuelle

Le besoin identifié correspond principalement à un package associé à une librairie.

### Cible

Une librairie pourra éventuellement être distribuée par plusieurs packages.

### À instruire

Il reste à déterminer :

* comment identifier un package ;
* quel registre utiliser ;
* comment rattacher un package à une librairie ;
* comment rattacher une version à un package ;
* comment gérer plusieurs packages d'une même librairie.

---

## 4. Repository

### Définition

Un Repository est un dépôt technique GitHub.

### Situation actuelle

Dans le périmètre actuel :

```text
1 repository = 1 librairie
```

### Cible

Le modèle doit pouvoir représenter :

```text
1 repository = 1..n librairies
```

notamment pour gérer des monorepos.

### À instruire

La méthode d'identification des librairies présentes dans un repository n'est pas définie.

---

## 5. Composant

### Définition

Un Composant est une unité fonctionnelle d'une librairie du Design System.

### Référence

Le catalogue constitue actuellement une référence pour les composants connus.

### Relations

Un composant doit pouvoir être relié à :

* une librairie ;
* un repository technique ;
* des Issues ;
* des audits ;
* des anomalies ;
* des versions.

La relation exacte entre composant et version reste à préciser.

---

## 6. Issue

### Définition

Une Issue est un objet provenant de GitHub.

Elle peut représenter différents types de travaux.

### Données actuellement exploitées

Le RAW Dataset conserve notamment :

* identifiant ;
* numéro ;
* titre ;
* état ;
* Issue Type ;
* labels ;
* criticités ;
* parents ;
* dates ;
* Pull Requests liées ;
* statuts de Projects ;
* Milestone.

### Important

Une Issue GitHub ne doit pas être considérée automatiquement comme une anomalie.

Elle peut notamment représenter un audit, une fonctionnalité, une tâche, une anomalie ou un autre type de travail.

---

## 7. Anomalie

### Définition de travail

Une Anomalie représente un problème identifié sur un élément du Design System.

### Situation actuelle

Les anomalies sont principalement représentées par des Issues GitHub.

### Point non décidé

La règle actuelle du projet identifie notamment les anomalies à partir de l'Issue Type `BUG`.

Les échanges ont toutefois établi que cette règle est probablement trop restrictive pour constituer une définition métier définitive.

Il est envisagé de permettre une définition configurable reposant notamment sur :

* Issue Type ;
* label ;
* combinaison de critères ;
* règles différentes selon la librairie ou le repository.

**La règle définitive reste à instruire.**

---

## 8. Audit

### Définition de travail

Un Audit représente une évaluation réalisée sur un composant, une librairie, une version ou un autre périmètre.

### Données actuellement identifiées

Le modèle actuel permet notamment de relier un audit à :

* une librairie ;
* un composant ;
* une version ;
* un statut ;
* une Issue source ;
* un résultat.

### À instruire

Il reste à préciser :

* les types d'audit ;
* la notion de campagne ;
* les résultats possibles ;
* la relation entre audit et anomalies ;
* la relation entre audit et version.

---

## 9. Pull Request

### Définition

Une Pull Request est un objet GitHub représentant une modification proposée ou réalisée.

Elle constitue notamment une information de traçabilité technique.

### Règle importante

La présence d'une Pull Request n'est pas nécessairement obligatoire pour tous les types de travaux.

Les workflows identifiés distinguent notamment les travaux standards, les audits et les Epics.

---

## 10. Version

### Définition

Une Version représente une version identifiable d'une librairie ou d'un package.

### Situation actuelle

Les versions peuvent être déduites notamment de données GitHub telles que les Milestones.

### À instruire

La relation exacte entre :

* librairie ;
* package ;
* version ;
* release ;
* milestone

reste à définir.

---

## 11. Release

### Définition

Le terme Release désigne un événement ou un artefact de livraison d'une version.

### Situation actuelle

Le projet identifie des besoins liés aux versions et aux releases mais ne dispose pas encore d'un modèle métier complet et indépendant pour les releases.

### À instruire

Il faudra déterminer si une Release constitue :

* un objet métier indépendant ;
* une propriété d'une Version ;
* une représentation GitHub ;
* ou une combinaison de ces concepts.

---

## 12. Iteration

### Définition

Une Iteration représente une période de travail planifiée.

Elle permet notamment de regrouper les travaux d'un sprint.

### Besoins identifiés

Les indicateurs envisagés comprennent notamment :

* début ;
* fin ;
* durée ;
* jours ouvrés ;
* travaux traités ;
* Done ;
* Cancelled ;
* travaux reportés ;
* statut du sprint ;
* vélocité.

Les règles précises restent à définir.

---

## 13. Milestone

### Définition

Une Milestone est un objet GitHub pouvant être utilisé pour plusieurs finalités.

Les usages identifiés comprennent notamment :

* version ;
* audit ;
* planification ;
* lot de travail.

Une Milestone ne doit donc pas être automatiquement assimilée à une Version.

---

## 14. Catalogue

### Définition

Le Catalogue est le référentiel des composants connus.

### Rôle

Il sert notamment à :

* identifier les composants de référence ;
* enrichir les données normalisées ;
* distinguer les composants connus des composants non référencés.

---

## 15. Application consommatrice

### Définition cible

Une Application consommatrice est une application qui utilise une ou plusieurs librairies du Design System.

### Informations recherchées

À terme :

```text
Application
├── Librairie utilisée
│   ├── Version utilisée
│   └── Composants utilisés
│       └── Nombre d'utilisations
└── Dette éventuelle
```

### À instruire

La source et la méthode permettant d'identifier ces informations ne sont pas définies.

---

## 16. Relations principales

Les relations actuellement envisagées sont :

```text
Organisation
    │
    └── Librairie
          ├── Package
          ├── Repository
          ├── Version
          └── Composant
```

et :

```text
Application
    │
    └── utilise
          ├── Librairie
          ├── Version
          └── Composant
```

Ces relations représentent le modèle cible et ne doivent pas être considérées comme entièrement implémentées aujourd'hui.

---

## 17. Principe de séparation

Le projet doit conserver la distinction suivante :

```text
Objet métier
      ↓
Représentation technique éventuelle
      ↓
Source
```

Exemple :

```text
Anomalie
   ↓
Issue GitHub
```

Une Issue GitHub n'est donc pas nécessairement une anomalie.

De même :

```text
Audit
   ↓
Issue GitHub éventuelle
```

Un audit ne doit pas être confondu avec son support technique.

---

## 18. Points à instruire

Les principaux sujets encore ouverts sont :

* Librairie ↔ Package ;
* Librairie ↔ Repository ;
* Package ↔ Version ;
* Version ↔ Release ;
* Version ↔ Milestone ;
* définition d'une anomalie ;
* définition d'un audit ;
* identification d'une application consommatrice ;
* détection des composants utilisés ;
* mesure du nombre d'utilisations d'un composant.
