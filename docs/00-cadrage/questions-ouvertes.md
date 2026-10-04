# Questions ouvertes

## 1. Objectif

Ce document recense les faits établis et les questions qui doivent encore être instruites pour stabiliser le modèle du Design System Quality Pipeline.

L'objectif est d'éviter d'introduire dans l'implémentation des hypothèses métier non validées.

---

# 2. Décisions et faits établis

## D-001 — Repository et Librairie

Actuellement :

```text
1 Repository = 1 Librairie
```

Cible :

```text
1 Repository = 1..n Librairies
```

---

## D-002 — Librairie et Package

Actuellement :

```text
1 Librairie = 1 Package
```

Cible :

```text
1 Librairie = 1..n Packages
```

---

## D-003 — Package et Version

Une Application consomme un Package dans une Version donnée.

---

## D-004 — Versions produites

Les formes actuellement établies sont :

| Origine | Version |
|---|---|
| `develop` | `M.m.r-SNAPSHOT` |
| `project/***` | `M.m.r-SNAPSHOT` |
| `release/***` | `M.m.r-rc.[build Jenkins]` |
| `hotfix/***` | `M.m.r-hc.[build Jenkins]` |
| PROD | `M.m.r` |

---

## D-005 — Production depuis une release

```text
release/*** → master → Jenkins → PROD
```

Jenkins produit notamment le Tag Git et le Package Nexus PROD.

---

## D-006 — Production depuis un hotfix

```text
hotfix/*** → master → Jenkins → PROD
```

Jenkins produit notamment le Tag Git et le Package Nexus PROD.

---

## D-007 — Caractéristiques d'une Version PROD

Une Version PROD :

- ne possède pas de suffixe ;
- est disponible dans un espace Nexus spécifique ;
- possède un Tag Git correspondant ;
- doit posséder une Milestone portant son numéro ;
- possède normalement une Release correspondante.

---

## D-008 — Audit pré-PROD

Le fonctionnement cible est de réaliser les Audits avant la création de la Version PROD finale.

L'Audit est effectué sur une Release Candidate :

```text
M.m.r-rc.n
```

Les Issues d'Audit évoluent dans la Milestone :

```text
M.m.r
```

L'objectif est de permettre, si possible, la production d'une Version PROD conforme.

---

## D-009 — Une Issue d'Audit par Composant

Le fonctionnement souhaité repose sur :

```text
1 Composant à auditer
        ↓
1 Issue d'Audit
```

---

## D-010 — Milestone `M.m.r-Audit`

Une Milestone :

```text
M.m.r-Audit
```

correspond à un mécanisme de **rattrapage**.

Elle est utilisée lorsque les Audits n'ont pas été réalisés avant la publication de la Version PROD.

Elle ne représente pas une nouvelle Version.

---

## D-011 — Contenu de `M.m.r-Audit`

Une Milestone de rattrapage contient uniquement les Issues d'Audit des Composants.

```text
M.m.r-Audit
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

Les Anomalies découvertes ne restent pas dans cette Milestone.

---

## D-012 — Traitement des Anomalies découvertes

Une Anomalie découverte pendant un Audit passe ensuite par le Grooming et la pesée avant d'être planifiée.

```text
Audit
    ↓
Anomalie
    ↓
Grooming
    ↓
Pesée
    ↓
Milestone + Sprint
```

Le travail d'Audit et le travail de correction sont donc distincts.

---

## D-013 — Temporalité de la conformité

Il faut distinguer :

```text
Audit avant PROD
```

et :

```text
Audit de rattrapage après PROD
```

Un résultat découvert après la publication ne doit pas être considéré comme connu avant la publication.

---

## D-014 — Composant non audité

Un Composant non audité ne doit pas être automatiquement considéré comme non conforme.

Il faut distinguer :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

---

## D-015 — Vélocité

Les valeurs suivantes sont distinctes :

```text
velocity = null
velocity = 0
velocity > 0
```

---

## D-016 — Criticité

La Criticité doit être associée à un domaine.

Les domaines identifiés comprennent notamment :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

---

## D-017 — Anomalie et Amélioration

Une Anomalie et une proposition d'Amélioration sont deux notions différentes.

---

# 3. Librairies, Packages et Repositories

## Q-001 — Propriétés du Package

Quelles propriétés doivent définir un Package dans le modèle métier ?

**Statut : À instruire**

## Q-002 — Plusieurs Packages

Dans quels cas une Librairie pourrait-elle être distribuée par plusieurs Packages ?

**Statut : À instruire**

## Q-003 — Monorepo

Comment les Librairies devront-elles être identifiées dans un futur monorepo ?

**Statut : À instruire**

## Q-004 — Composants et Packages

Dans une Librairie multi-Packages, à quel niveau appartient un Composant ?

**Statut : À instruire**

---

# 4. Versions et Releases

## Q-005 — Release GitHub

Une Release GitHub doit-elle systématiquement exister pour toute Version PROD et comment est-elle créée ?

**Statut : À confirmer**

## Q-006 — Milestone PROD manquante

Comment traiter une Version PROD dont la Milestone `M.m.r` serait absente ?

**Statut : À instruire ultérieurement**

## Q-007 — Tag manquant

Comment traiter une Version PROD Nexus sans Tag Git correspondant ?

**Statut : À instruire ultérieurement**

---

# 5. Audits

## Q-008 — Identification d'une Issue d'Audit

Comment reconnaît-on précisément une Issue d'Audit dans GitHub ?

**Statut : À instruire**

## Q-009 — Composant d'une Issue d'Audit

Comment l'Issue d'Audit indique-t-elle quel Composant est audité ?

**Statut : À instruire**

## Q-010 — Release Candidate auditée

Comment identifie-t-on précisément la Release Candidate sur laquelle l'Audit a été réalisé ?

**Statut : À instruire**

## Q-011 — Fin d'un Audit

Qu'est-ce qui permet de considérer qu'une Issue d'Audit est terminée ?

**Statut : À instruire**

## Q-012 — Résultat d'un Audit

Qu'est-ce qui permet de déterminer que le Composant est conforme ou non conforme ?

**Statut : À instruire**

## Q-013 — Relation Audit → Anomalie

Comment une Anomalie découverte est-elle reliée à l'Issue d'Audit qui a permis sa détection ?

**Statut : À instruire**

## Q-014 — Campagne d'Audit

Comment une Campagne d'Audit est-elle identifiée ?

**Statut : À instruire**

## Q-015 — Passage en PROD

Toutes les Issues d'Audit prévues doivent-elles être terminées avant que la Version puisse passer en PROD ?

**Statut : À instruire**

## Q-016 — Anomalie détectée avant PROD

Lorsqu'un Audit de Release Candidate détecte une Anomalie, quelles conséquences cette Anomalie peut-elle avoir sur le passage en PROD ?

**Statut : À instruire**

---

# 6. Anomalies

## Q-017 — Définition d'une Anomalie

Quelle règle permet d'identifier une Issue comme une Anomalie ?

**Statut : À instruire**

## Q-018 — Date de détection

Quelle date représente la détection d'une Anomalie ?

**Statut : À instruire**

## Q-019 — Date de correction

Quelle date représente sa correction effective ?

**Statut : À instruire**

---

# 7. Workflow

## Q-020 — Profils

Les profils STANDARD, EPIC, AUDIT, RELEASE et CONCEPTION doivent-ils être formalisés comme des profils métier distincts ?

**Statut : À confirmer**

## Q-021 — Pull Requests

Pour quels profils une Pull Request n'est-elle pas obligatoire avant Done ?

**Statut : À formaliser**

## Q-022 — Cancelled

Quelles propriétés ou relations sont interdites pour une Issue Cancelled ?

**Statut : À formaliser**

---

# 8. Applications consommatrices

## Q-023 — Applications

Quelle source permet d'identifier les Applications qui utilisent ou devraient utiliser le Design System ?

**Statut : Futur**

## Q-024 — Packages

Comment déterminer les Packages utilisés par une Application ?

**Statut : Futur**

## Q-025 — Versions

Comment déterminer les Versions effectivement utilisées ?

**Statut : Futur**

## Q-026 — Composants

Comment analyser les Composants réellement utilisés dans une Application ?

**Statut : Futur**

## Q-027 — Dette de Version

Comment définir la dette liée à l'utilisation d'une ancienne Version PROD ?

**Statut : Futur**

## Q-028 — Alertes

Quelles situations doivent déclencher une alerte à destination de la Squad responsable ?

**Statut : Futur**

---

# 9. Qualité

## Q-029 — Qualité d'une Version

Comment calculer la qualité d'une Version ?

Il faudra notamment distinguer :

- Audit pré-PROD ;
- Audit de rattrapage ;
- état de conformité connu avant la PROD ;
- état découvert après la PROD.

**Statut : À instruire**

## Q-030 — Qualité d'un Composant

Comment calculer la qualité d'un Composant pour une Version donnée ?

**Statut : À instruire**

## Q-031 — Qualité d'une Application

Comment construire une information synthétique de qualité en croisant les Versions et Composants utilisés par une Application avec leur qualité ?

**Statut : Futur**

---

# 10. Historisation

## Q-032 — Snapshots

Quels événements doivent provoquer la création d'un Snapshot ?

**Statut : À instruire**

## Q-033 — Connaissance historique

Comment distinguer l'état de qualité connu à la publication de celui découvert par un Audit ultérieur ?

**Statut : À instruire**

## Q-034 — Conservation

Quelle durée d'historique doit être conservée ?

**Statut : À instruire**

---

# 11. Sources externes

## Q-035 — Nexus

Quelles informations Nexus seront nécessaires au pipeline ?

**Statut : À instruire techniquement**

## Q-036 — Jenkins

Le pipeline devra-t-il interroger directement Jenkins ou les informations GitHub et Nexus seront-elles suffisantes ?

**Statut : À instruire techniquement**

## Q-037 — Consommateurs

Quelle source permettra d'identifier les Applications et leurs dépendances ?

**Statut : Futur**

## Q-038 — Usage

Quelle source permettra de mesurer l'utilisation réelle des Composants ?

**Statut : Futur**

---

# 12. Architecture

## Q-039 — Backend

À quel moment le dashboard statique devra-t-il évoluer vers une architecture avec backend ?

**Statut : À instruire ultérieurement**

## Q-040 — Historique

Quel système devra conserver les Snapshots ?

**Statut : À instruire ultérieurement**

## Q-041 — Multi-source

Comment orchestrer à terme :

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

# 13. Méthode

Pour chaque question :

1. observer le fonctionnement réel ;
2. établir le fait métier ;
3. distinguer fonctionnement actuel, fonctionnement cible et mécanisme transitoire ou de rattrapage ;
4. mettre à jour le modèle métier ;
5. définir les règles ;
6. définir les impacts sur les indicateurs ;
7. seulement ensuite modifier l'implémentation.

Cette distinction entre **existant**, **cible** et **rattrapage** est particulièrement importante pour le domaine des Audits.