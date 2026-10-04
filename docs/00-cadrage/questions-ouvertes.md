# Questions ouvertes

## 1. Objectif

Ce document recense les décisions métier et d'architecture qui doivent encore être prises pour stabiliser le modèle du Design System Quality Pipeline.

L'objectif est d'éviter :

- d'introduire des hypothèses implicites ;
- de transformer une situation actuelle en contrainte définitive ;
- de coder des règles métier qui n'ont pas encore été validées.

Les questions doivent être traitées progressivement.

Lorsqu'une réponse est établie, elle doit être reportée dans les documents de référence concernés.

---

# 2. Décisions et faits déjà établis

## D-001 — Repository et Librairie

### Décision actuelle

Aujourd'hui :

```text
1 Repository = 1 Librairie
```

### Cible

Le modèle doit permettre à terme :

```text
1 Repository = 1..n Librairies
```

afin de supporter notamment les monorepos.

---

## D-002 — Librairie et Package

### Fait actuel établi

Une librairie est aujourd'hui distribuée sous la forme d'un package directement consommé par les applications.

Le package possède :

- un nom ;
- des versions.

La relation actuelle est :

```text
Librairie
    │
    └── Package
```

Dans la situation actuelle :

```text
1 Librairie = 1 Package
```

### Cible

Le modèle doit conserver la possibilité :

```text
1 Librairie = 1..n Packages
```

Cette cardinalité est une capacité cible et non une situation actuelle observée.

---

## D-003 — Package et Version

### Fait actuel établi

Une application consomme une version donnée d'un package.

```text
Application
    │
    └── Package @ Version
```

La Version consommée est donc actuellement rattachée au Package.

---

## D-004 — Composant non audité

Un composant non audité ne doit pas être automatiquement considéré comme non conforme.

Il faut distinguer :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Cela permet notamment de séparer :

```text
Couverture d'audit
= audités / périmètre
```

de :

```text
Taux de conformité
= conformes / audités
```

---

## D-005 — Vélocité vide et vélocité zéro

Les valeurs suivantes sont sémantiquement différentes :

```text
velocity = null
velocity = 0
velocity > 0
```

Elles ne doivent pas être normalisées comme une même situation.

---

## D-006 — Criticité

La criticité doit être associée à un domaine.

Il faut notamment pouvoir distinguer :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

Une criticité générique telle que `major` ne suffit pas à elle seule.

---

## D-007 — Anomalie et amélioration

Une anomalie et une proposition d'amélioration sont deux notions différentes.

Un audit peut produire :

```text
Audit
    ├── Anomalies / non-conformités
    └── Propositions d'amélioration
```

Ces objets ne doivent pas être automatiquement agrégés dans les mêmes indicateurs.

---

# 3. Questions ouvertes — Librairies, Packages et Repositories

## Q-001 — Propriétés du Package

Quelles propriétés doivent définir un Package dans le modèle métier ?

Exemples de propriétés à instruire :

- nom ;
- identifiant ;
- source de publication ;
- version actuelle ;
- repository source ;
- librairie associée.

**Statut : À instruire**

---

## Q-002 — Plusieurs packages pour une librairie

Dans quels cas une librairie pourrait-elle être distribuée par plusieurs packages ?

Cette possibilité est une cible du modèle mais aucun cas actuel n'est encore établi.

**Statut : À instruire**

---

## Q-003 — Plusieurs librairies dans un repository

Comment les librairies devront-elles être identifiées dans un futur monorepo ?

Exemples de possibilités à étudier ultérieurement :

- configuration explicite ;
- répertoires ;
- packages ;
- métadonnées de publication.

**Statut : À instruire**

---

## Q-004 — Composants et Packages

Dans le cas futur où une librairie possède plusieurs packages, un composant appartient-il :

- à la librairie ;
- à un package ;
- potentiellement à plusieurs packages ?

**Statut : À instruire**

---

# 4. Questions ouvertes — Versions et Releases

## Q-005 — Source de la Version

Quelle est la source de référence permettant d'identifier la version d'un Package ?

**Statut : À instruire**

---

## Q-006 — Version et Release

Quelle est la relation exacte entre :

```text
Version
Release
```

Une Release représente-t-elle systématiquement la publication d'une Version ?

**Statut : À instruire**

---

## Q-007 — Version et Milestone

Quelle relation doit être établie entre :

```text
Version du Package
Milestone GitHub
```

Un Milestone peut actuellement représenter plusieurs notions et ne peut donc pas être assimilé automatiquement à une Version.

**Statut : À instruire**

---

## Q-008 — Version d'audit

La convention :

```text
1.1.0
1.1.0-Audit
```

doit-elle toujours être interprétée comme une même version de référence avec deux contextes différents ?

Le suffixe doit être configurable.

**Statut : À confirmer**

---

# 5. Questions ouvertes — Anomalies

## Q-009 — Définition d'une anomalie

Quelle règle doit déterminer qu'une Issue représente une anomalie ?

Le modèle doit pouvoir supporter :

- Issue Type ;
- label ;
- combinaison de critères ;
- configuration spécifique par repository ou organisation.

**Statut : À instruire**

---

## Q-010 — Origine d'une anomalie

Quelles origines doivent être distinguées ?

Exemples déjà identifiés :

- audit ;
- utilisateur ;
- équipe ;
- autre processus.

**Statut : À instruire**

---

## Q-011 — Date de détection

Quelle date représente la détection d'une anomalie ?

Exemples possibles :

- création de l'Issue ;
- date d'un audit ;
- autre événement.

**Statut : À instruire**

---

## Q-012 — Date de correction

Quelle date représente la correction effective d'une anomalie ?

Exemples possibles :

- fermeture de l'Issue ;
- merge de la Pull Request ;
- publication d'une version ;
- autre événement.

**Statut : À instruire**

---

# 6. Questions ouvertes — Audits

## Q-013 — Objet Audit

L'Audit doit-il devenir un objet métier explicite indépendant de l'Issue GitHub qui peut actuellement le représenter ?

**Statut : À instruire**

---

## Q-014 — Campagne d'audit

Comment une campagne d'audit est-elle identifiée ?

**Statut : À instruire**

---

## Q-015 — Résultat d'un audit

Quelles informations déterminent qu'un composant audité est :

```text
CONFORME
NON CONFORME
```

**Statut : À instruire**

---

## Q-016 — Version auditée

Comment déterminer précisément la version du composant ou de la librairie faisant l'objet d'un audit ?

**Statut : À instruire**

---

# 7. Questions ouvertes — Workflow

## Q-017 — Profils de workflow

Les profils suivants doivent-ils être formalisés comme des profils métier distincts ?

- STANDARD ;
- EPIC ;
- AUDIT ;
- RELEASE ;
- CONCEPTION.

**Statut : À confirmer**

---

## Q-018 — Exceptions aux règles de Pull Request

Pour quels profils une Pull Request n'est-elle pas obligatoire avant le statut Done ?

Les audits et Epics constituent des cas déjà identifiés à étudier.

**Statut : À formaliser**

---

## Q-019 — Statut Cancelled

Quelles propriétés ou relations sont interdites lorsqu'une Issue est Cancelled ?

Les règles actuelles concernant les Pull Requests et Milestones devront être réévaluées dans le modèle de workflow complet.

**Statut : À formaliser**

---

# 8. Questions ouvertes — Applications consommatrices

## Q-020 — Identification des applications

Quelle source permet de connaître la liste des applications qui utilisent ou devraient utiliser le Design System ?

**Statut : Futur**

---

## Q-021 — Détection des packages consommés

Comment déterminer qu'une application consomme un Package donné ?

**Statut : Futur**

---

## Q-022 — Détection de la version consommée

Comment déterminer la version du Package effectivement utilisée par une application ?

Le fait qu'une application consomme une version d'un Package est établi.

La source permettant de récupérer cette information reste à déterminer.

**Statut : Futur**

---

## Q-023 — Détection des composants utilisés

Comment analyser le code d'une application afin d'identifier :

- les composants utilisés ;
- leur nombre d'utilisations ?

**Statut : Futur**

---

## Q-024 — Dette de montée de version

Comment définir la dette liée à l'utilisation d'une ancienne version du Design System ?

Il faudra notamment définir :

- version actuelle ;
- version attendue ;
- délai acceptable ;
- niveau de dette ;
- équipe responsable.

**Statut : Futur**

---

## Q-025 — Alertes aux Squads

Quelles situations doivent provoquer une alerte à destination d'une Squad responsable d'une application ?

**Statut : Futur**

---

# 9. Questions ouvertes — Qualité des applications consommatrices

## Q-026 — Qualité d'une version

Comment calculer la qualité d'une version d'une librairie ?

**Statut : À instruire**

---

## Q-027 — Qualité d'un composant

Comment calculer la qualité d'un composant pour une version donnée ?

**Statut : À instruire**

---

## Q-028 — Badge ou note d'une application

Comment construire une information synthétique de qualité pour une application en croisant :

```text
Application
    ↓
Package / Version utilisés
    ↓
Composants utilisés
    ↓
Qualité des composants
```

Le besoin est identifié mais le modèle de scoring n'est pas défini.

Aucune formule ne doit être introduite avant validation de ce modèle.

**Statut : Futur**

---

## Q-029 — RGAA / WAI-ARIA d'une application

Quelle signification précise doit avoir une note ou un badge RGAA / WAI-ARIA calculé à partir des composants du Design System utilisés par une application ?

Il faudra notamment déterminer :

- le périmètre évalué ;
- les limites de responsabilité du Design System ;
- la prise en compte des composants utilisés ;
- la version utilisée ;
- les composants non audités ;
- les anomalies ouvertes.

**Statut : Futur**

---

# 10. Questions ouvertes — Historisation

## Q-030 — Granularité historique

Quels événements doivent provoquer la création d'un Snapshot ?

Exemples à étudier :

- exécution périodique ;
- release ;
- fin de sprint ;
- audit ;
- exécution manuelle.

**Statut : À instruire**

---

## Q-031 — Conservation

Quelle durée d'historique doit être conservée ?

**Statut : À instruire**

---

# 11. Questions ouvertes — Sources externes

## Q-032 — Publication des packages

Quelle source permettra de connaître les packages publiés et leurs versions ?

**Statut : À instruire**

---

## Q-033 — Applications consommatrices

Quelle source permettra d'identifier les applications et leurs dépendances ?

**Statut : Futur**

---

## Q-034 — Usage des composants

Quelle source ou quel mécanisme permettra de mesurer l'utilisation réelle des composants dans les applications ?

**Statut : Futur**

---

# 12. Questions ouvertes — Architecture

## Q-035 — Backend

À quel moment le dashboard statique actuel devra-t-il évoluer vers une architecture avec backend ?

**Statut : À instruire ultérieurement**

---

## Q-036 — Stockage historique

Quel système doit conserver les Snapshots à terme ?

**Statut : À instruire ultérieurement**

---

## Q-037 — Multi-source

Comment orchestrer à terme les différentes sources nécessaires ?

```text
GitHub
Catalogue
Publication des Packages
Applications consommatrices
Analyse du code
Autres sources
```

**Statut : À instruire ultérieurement**

---

# 13. Méthode de traitement des questions

Les questions ne doivent pas être résolues toutes en même temps.

Pour chaque question :

1. observer le fonctionnement réel ;
2. établir le fait métier ;
3. distinguer situation actuelle et cible ;
4. mettre à jour le modèle métier ;
5. définir ensuite les règles ;
6. définir les impacts sur les indicateurs ;
7. seulement ensuite modifier l'implémentation.

Cette approche doit éviter que le code ou les contraintes actuelles de GitHub deviennent implicitement la définition du métier.