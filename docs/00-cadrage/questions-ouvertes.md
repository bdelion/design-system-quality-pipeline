# Questions ouvertes

## 1. Objectif

Ce document recense les décisions métier et d'architecture qui doivent encore être prises pour stabiliser le modèle du Design System Quality Pipeline.

L'objectif est d'éviter :

- d'introduire des hypothèses implicites ;
- de transformer une situation actuelle en contrainte définitive ;
- de coder des règles métier qui n'ont pas encore été validées.

Lorsqu'une réponse est établie, elle doit être reportée dans les documents de référence concernés.

---

# 2. Décisions et faits déjà établis

## D-001 — Repository et Librairie

Aujourd'hui :

```text
1 Repository = 1 Librairie
```

Le modèle doit permettre à terme :

```text
1 Repository = 1..n Librairies
```

---

## D-002 — Librairie et Package

Une Librairie est aujourd'hui distribuée sous la forme d'un Package.

Aujourd'hui :

```text
1 Librairie = 1 Package
```

Cible :

```text
1 Librairie = 1..n Packages
```

---

## D-003 — Package et Version

Une Application utilise un Package dans une Version donnée.

```text
Application
    └── Package @ Version
```

---

## D-004 — Version de base

Le cycle de construction utilise une Version de base de forme :

```text
M.m.r
```

---

## D-005 — Version SNAPSHOT

Depuis :

```text
develop
project/***
```

Jenkins produit :

```text
M.m.r-SNAPSHOT
```

Ces Versions sont destinées aux tests d'intégration et non au déploiement en production.

---

## D-006 — Release Candidate

Depuis :

```text
release/****
```

Jenkins produit :

```text
M.m.r-rc.[numéro de build Jenkins]
```

---

## D-007 — Hotfix Candidate

Depuis :

```text
hotfix/****
```

Jenkins produit :

```text
M.m.r-hc.[numéro de build Jenkins]
```

---

## D-008 — Production d'une Version PROD standard

Pour une release standard, la Version PROD `M.m.r` est produite lors du merge de :

```text
release/M.m.r
```

vers :

```text
master
```

Ce merge déclenche automatiquement Jenkins.

Si les stages précédents du pipeline sont réussis, Jenkins :

1. crée le Tag Git `M.m.r` ;
2. publie le Package `M.m.r` dans Nexus PROD.

```text
release/M.m.r
    ↓ merge
master
    ↓
Jenkins
    ↓ succès
    ├── Tag Git M.m.r
    └── Nexus PROD M.m.r
```

---

## D-009 — Caractéristiques d'une Version PROD

Une Version PROD :

- ne possède pas de suffixe ;
- est disponible dans un espace Nexus spécifique ;
- possède un Tag Git correspondant ;
- doit posséder une Milestone portant son numéro ;
- possède normalement une Release correspondante.

Le caractère obligatoire de la Release n'est pas encore confirmé.

---

## D-010 — Nexus ne contient pas uniquement des Versions PROD

Nexus peut notamment contenir :

```text
M.m.r
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
```

La présence dans Nexus ne suffit donc pas à qualifier une Version de PROD.

---

## D-011 — Composant non audité

Un Composant non audité ne doit pas être automatiquement considéré comme non conforme.

Il faut distinguer :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

---

## D-012 — Vélocité vide et vélocité zéro

Les valeurs suivantes sont différentes :

```text
velocity = null
velocity = 0
velocity > 0
```

---

## D-013 — Criticité

La Criticité doit être associée à un domaine.

Il faut notamment pouvoir distinguer :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

---

## D-014 — Anomalie et amélioration

Une Anomalie et une proposition d'Amélioration sont deux notions différentes.

---

# 3. Questions ouvertes — Librairies, Packages et Repositories

## Q-001 — Propriétés du Package

Quelles propriétés doivent définir un Package dans le modèle métier ?

Éléments déjà établis :

- nom ;
- Version de base ;
- Versions publiées ;
- publication dans Nexus.

**Statut : À instruire**

---

## Q-002 — Plusieurs Packages pour une Librairie

Dans quels cas une Librairie pourrait-elle être distribuée par plusieurs Packages ?

**Statut : À instruire**

---

## Q-003 — Plusieurs Librairies dans un Repository

Comment les Librairies devront-elles être identifiées dans un futur monorepo ?

**Statut : À instruire**

---

## Q-004 — Composants et Packages

Dans le cas futur où une Librairie possède plusieurs Packages, un Composant appartient-il :

- à la Librairie ;
- à un Package ;
- potentiellement à plusieurs Packages ?

**Statut : À instruire**

---

# 4. Questions ouvertes — Versions et Releases

## Q-005 — Release Candidate vers PROD

### Réponse établie pour une release standard

Le passage à PROD se produit lors du merge :

```text
release/M.m.r → master
```

Jenkins est déclenché automatiquement.

Après succès des stages nécessaires :

```text
Tag Git M.m.r
+
Publication Nexus PROD M.m.r
```

**Statut : Établi pour le cycle release standard**

---

## Q-006 — Hotfix Candidate vers PROD

Quel est le processus exact permettant de passer de :

```text
M.m.r-hc.[build]
```

à :

```text
M.m.r
```

Il reste notamment à préciser :

- la branche cible ;
- l'événement déclencheur ;
- le rôle de Jenkins ;
- la création du Tag ;
- la publication Nexus PROD.

**Statut : À instruire**

---

## Q-007 — Release GitHub

Une Release GitHub doit-elle systématiquement exister pour toute Version PROD ?

Il est actuellement établi qu'elle existe normalement, mais :

- son caractère obligatoire n'est pas confirmé ;
- son mécanisme de création n'est pas documenté ;
- il n'est pas établi que Jenkins la crée.

**Statut : À confirmer**

---

## Q-008 — Milestone manquante

Une Version PROD doit avoir une Milestone portant exactement son numéro.

Comment le système doit-il traiter une Version PROD pour laquelle cette Milestone serait absente ?

**Statut : À instruire ultérieurement dans les règles**

---

## Q-009 — Tag Git manquant

Une Version PROD doit posséder un Tag Git correspondant.

Comment le système doit-il traiter une Version PROD publiée dans Nexus lorsque le Tag attendu est absent ?

**Statut : À instruire ultérieurement dans les règles**

---

## Q-010 — Version d'Audit

La convention :

```text
1.1.0
1.1.0-Audit
```

doit-elle toujours être interprétée comme une même Version de référence avec deux contextes différents ?

**Statut : À confirmer**

---

# 5. Questions ouvertes — Anomalies

## Q-011 — Définition d'une Anomalie

Quelle règle doit déterminer qu'une Issue représente une Anomalie ?

**Statut : À instruire**

---

## Q-012 — Origine d'une Anomalie

Quelles origines doivent être distinguées ?

**Statut : À instruire**

---

## Q-013 — Date de détection

Quelle date représente la détection d'une Anomalie ?

**Statut : À instruire**

---

## Q-014 — Date de correction

Quelle date représente la correction effective d'une Anomalie ?

**Statut : À instruire**

---

# 6. Questions ouvertes — Audits

## Q-015 — Objet Audit

L'Audit doit-il devenir un objet métier explicite indépendant de l'Issue GitHub qui peut actuellement le représenter ?

**Statut : À instruire**

---

## Q-016 — Campagne d'Audit

Comment une Campagne d'Audit est-elle identifiée ?

**Statut : À instruire**

---

## Q-017 — Résultat d'un Audit

Quelles informations déterminent qu'un Composant audité est conforme ou non conforme ?

**Statut : À instruire**

---

## Q-018 — Version auditée

Comment déterminer précisément la Version du Composant ou de la Librairie faisant l'objet d'un Audit ?

**Statut : À instruire**

---

# 7. Questions ouvertes — Workflow

## Q-019 — Profils de workflow

Les profils suivants doivent-ils être formalisés comme des profils métier distincts ?

- STANDARD ;
- EPIC ;
- AUDIT ;
- RELEASE ;
- CONCEPTION.

**Statut : À confirmer**

---

## Q-020 — Exceptions aux règles de Pull Request

Pour quels profils une Pull Request n'est-elle pas obligatoire avant le statut Done ?

**Statut : À formaliser**

---

## Q-021 — Statut Cancelled

Quelles propriétés ou relations sont interdites lorsqu'une Issue est Cancelled ?

**Statut : À formaliser**

---

# 8. Questions ouvertes — Applications consommatrices

## Q-022 — Identification des Applications

Quelle source permet de connaître les Applications qui utilisent ou devraient utiliser le Design System ?

**Statut : Futur**

---

## Q-023 — Détection des Packages utilisés

Comment déterminer qu'une Application utilise un Package donné ?

**Statut : Futur**

---

## Q-024 — Détection de la Version utilisée

Comment déterminer la Version effectivement utilisée par une Application ?

**Statut : Futur**

---

## Q-025 — Versions non-PROD utilisées par les consommateurs

Comment traiter une Application utilisant :

```text
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
```

notamment selon qu'il s'agit d'un environnement de test ou de production ?

**Statut : Futur**

---

## Q-026 — Détection des Composants utilisés

Comment analyser le code d'une Application afin d'identifier :

- les Composants utilisés ;
- leur nombre d'utilisations ?

**Statut : Futur**

---

## Q-027 — Dette de montée de Version

Comment définir la dette liée à l'utilisation d'une ancienne Version PROD ?

Il faudra notamment définir :

- dernière Version PROD ;
- Version utilisée ;
- Version attendue ;
- délai acceptable ;
- niveau de dette ;
- équipe responsable.

**Statut : Futur**

---

## Q-028 — Alertes aux Squads

Quelles situations doivent provoquer une alerte à destination d'une Squad responsable d'une Application ?

**Statut : Futur**

---

# 9. Questions ouvertes — Qualité des Applications consommatrices

## Q-029 — Qualité d'une Version

Comment calculer la qualité d'une Version d'une Librairie ?

**Statut : À instruire**

---

## Q-030 — Qualité d'un Composant

Comment calculer la qualité d'un Composant pour une Version donnée ?

**Statut : À instruire**

---

## Q-031 — Badge ou note d'une Application

Comment construire une information synthétique de qualité pour une Application en croisant :

```text
Application
    ↓
Package / Version utilisés
    ↓
Composants utilisés
    ↓
Qualité des Composants
```

**Statut : Futur**

---

## Q-032 — RGAA / WAI-ARIA d'une Application

Quelle signification précise doit avoir une note ou un badge RGAA / WAI-ARIA calculé à partir des Composants du Design System utilisés par une Application ?

**Statut : Futur**

---

# 10. Questions ouvertes — Historisation

## Q-033 — Granularité historique

Quels événements doivent provoquer la création d'un Snapshot ?

Exemples à étudier :

- exécution périodique ;
- Release ;
- fin de sprint ;
- Audit ;
- exécution manuelle.

**Statut : À instruire**

---

## Q-034 — Conservation

Quelle durée d'historique doit être conservée ?

**Statut : À instruire**

---

# 11. Questions ouvertes — Sources externes

## Q-035 — Nexus

Nexus est identifié comme source de publication des Packages et Versions.

Il faudra déterminer les informations nécessaires au pipeline pour identifier :

- l'espace Nexus ;
- le Package ;
- la Version ;
- la catégorie de Version ;
- la dernière Version PROD.

**Statut : À instruire techniquement**

---

## Q-036 — Jenkins

Jenkins intervient dans :

- la génération des Versions SNAPSHOT ;
- la génération des Release Candidates ;
- la génération des Hotfix Candidates ;
- la création du Tag d'une Version PROD standard ;
- la publication de la Version PROD dans Nexus.

Il reste à déterminer si le pipeline doit interroger directement Jenkins ou si GitHub et Nexus fournissent les informations nécessaires aux indicateurs.

**Statut : À instruire techniquement**

---

## Q-037 — Applications consommatrices

Quelle source permettra d'identifier les Applications et leurs dépendances ?

**Statut : Futur**

---

## Q-038 — Usage des Composants

Quelle source ou quel mécanisme permettra de mesurer l'utilisation réelle des Composants dans les Applications ?

**Statut : Futur**

---

# 12. Questions ouvertes — Architecture

## Q-039 — Backend

À quel moment le dashboard statique actuel devra-t-il évoluer vers une architecture avec backend ?

**Statut : À instruire ultérieurement**

---

## Q-040 — Stockage historique

Quel système doit conserver les Snapshots à terme ?

**Statut : À instruire ultérieurement**

---

## Q-041 — Multi-source

Comment orchestrer à terme les différentes sources nécessaires ?

```text
GitHub
Catalogue
Nexus
Jenkins éventuellement
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

Cette approche doit éviter que les contraintes actuelles de GitHub, Jenkins ou Nexus deviennent implicitement la définition du métier.