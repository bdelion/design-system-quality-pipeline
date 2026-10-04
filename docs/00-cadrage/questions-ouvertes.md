# Questions ouvertes

## 1. Objectif

Ce document recense les décisions métier et d'architecture déjà établies ainsi que les questions qui doivent encore être instruites pour stabiliser le modèle du Design System Quality Pipeline.

L'objectif est d'éviter :

- d'introduire des hypothèses implicites ;
- de transformer une situation actuelle en contrainte définitive ;
- de coder des règles métier qui n'ont pas encore été validées ;
- de perdre la traçabilité des questions déjà posées ;
- de considérer implicitement une question comme résolue parce qu'elle a disparu du document.

Lorsqu'une réponse est établie, elle doit être reportée dans les documents de référence concernés.

---

# 2. Gestion des décisions et questions

Les identifiants des décisions `D-xxx` et des questions `Q-xxx` sont stables.

Une décision ou une question déjà enregistrée ne doit pas être renumérotée en raison d'une réorganisation du document.

Lorsqu'une question est résolue :

- elle reste présente dans ce document ;
- son statut devient `Établi`, `Décidé` ou un statut équivalent ;
- sa réponse est synthétisée dans la question ;
- les documents métier concernés sont mis à jour.

Lorsqu'une nouvelle question apparaît, elle reçoit le prochain identifiant disponible.

Le registre doit donc rester cumulatif et traçable.

---

# 3. Décisions et faits déjà établis

## D-001 — Repository et Librairie

Aujourd'hui :

```text
1 Repository = 1 Librairie
```

Le modèle doit permettre à terme :

```text
1 Repository = 1..n Librairies
```

**Statut : Établi**

---

## D-002 — Librairie et Package

Aujourd'hui :

```text
1 Librairie = 1 Package
```

Cible :

```text
1 Librairie = 1..n Packages
```

**Statut : Établi**

---

## D-003 — Package et Version

Une Application utilise un Package dans une Version donnée.

```text
Application
    └── Package @ Version
```

**Statut : Établi**

---

## D-004 — Version de base

Le cycle de construction utilise une Version de base de forme :

```text
M.m.r
```

La relation exacte entre cette Version de base et la valeur littéralement présente dans `package.json` reste toutefois à préciser.

**Statut : Partiellement établi**

---

## D-005 — Version SNAPSHOT

Depuis :

```text
develop
project/***
```

Jenkins produit des Versions :

```text
M.m.r-SNAPSHOT
```

Ces Versions sont disponibles dans Nexus et sont destinées notamment aux tests d'intégration.

Elles n'ont pas vocation à être déployées en production.

**Statut : Établi**

---

## D-006 — Release Candidate

Depuis :

```text
release/***
```

Jenkins produit :

```text
M.m.r-rc.[numéro de build Jenkins]
```

Le numéro situé après `rc` correspond au numéro du build Jenkins.

**Statut : Établi**

---

## D-007 — Hotfix Candidate

Depuis :

```text
hotfix/***
```

Jenkins produit :

```text
M.m.r-hc.[numéro de build Jenkins]
```

Le numéro situé après `hc` correspond au numéro du build Jenkins.

**Statut : Établi**

---

## D-008 — Production PROD depuis une release

Une Version PROD issue d'une release est produite lors du merge :

```text
release/*** → master
```

Ce merge déclenche automatiquement Jenkins.

Si les stages nécessaires réussissent, Jenkins produit notamment :

```text
Tag Git M.m.r
+
Publication Nexus PROD M.m.r
```

Exemple :

```text
release/1.8.0
    │
    │ merge
    ▼
master
    │
    ▼
Jenkins
    │
    └── succès
          ├── Tag Git 1.8.0
          └── Nexus PROD 1.8.0
```

**Statut : Établi**

---

## D-009 — Production PROD depuis un hotfix

Une Version PROD issue d'un hotfix est produite selon le même principe.

```text
hotfix/*** → master
```

Le merge déclenche Jenkins.

Jenkins produit alors les éléments de la Version PROD, notamment :

```text
Tag Git M.m.r
+
Publication Nexus PROD M.m.r
```

Le mécanisme final de production est donc commun :

```text
release/*** ─┐
             ├──> master → Jenkins → PROD
hotfix/*** ──┘
```

**Statut : Établi**

---

## D-010 — Caractéristiques d'une Version PROD

Une Version PROD :

- possède la forme `M.m.r` ;
- ne possède pas de suffixe ;
- est disponible dans un Repository / espace Nexus spécifique à la production ;
- possède un Tag Git correspondant ;
- doit disposer d'une Milestone portant exactement son numéro ;
- possède normalement une Release GitHub correspondante.

Le caractère obligatoire de la Release GitHub n'est pas encore confirmé.

**Statut : Établi, sauf caractère obligatoire de la Release GitHub**

---

## D-011 — Nexus ne contient pas uniquement des Versions PROD

Nexus peut notamment contenir :

```text
M.m.r
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
```

La présence d'une Version dans Nexus ne suffit donc pas à la qualifier de Version PROD.

**Statut : Établi**

---

## D-012 — Audit cible avant PROD

Le fonctionnement souhaité est de réaliser les Audits avant la création de la Version PROD finale.

Les Audits sont réalisés sur une Release Candidate :

```text
M.m.r-rc.n
```

afin de pouvoir produire, si possible, une Version finale PROD conforme :

```text
M.m.r
```

Conceptuellement :

```text
Release Candidate M.m.r-rc.n
        │
        ▼
Audits des composants
        │
        ▼
Version PROD M.m.r
```

**Statut : Établi**

---

## D-013 — Milestone des Audits pré-PROD

Dans le fonctionnement cible, les Issues d'Audit des Composants évoluent dans la Milestone correspondant à la future Version PROD :

```text
M.m.r
```

Exemple :

```text
Milestone 1.1.0
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

**Statut : Établi**

---

## D-014 — Milestone `M.m.r-Audit`

Une Milestone telle que :

```text
1.1.0-Audit
```

ne représente pas une Version supplémentaire du Package.

Elle correspond à un mécanisme de **rattrapage** utilisé lorsque les Audits n'ont pas été réalisés avant la création du Tag et du Package de la Version PROD.

```text
Version PROD 1.1.0
        │
        ▼
Audit de rattrapage
        │
        └── Milestone 1.1.0-Audit
```

La Version de référence reste :

```text
1.1.0
```

**Statut : Établi**

---

## D-015 — Contenu d'une Milestone d'Audit de rattrapage

Une Milestone `M.m.r-Audit` contient uniquement les Issues d'Audit des Composants.

Le fonctionnement établi est :

```text
Milestone 1.1.0-Audit
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

Il existe une Issue d'Audit par Composant à auditer.

Les Anomalies découvertes lors des Audits ne sont pas destinées à être planifiées dans cette Milestone d'Audit.

**Statut : Établi**

---

## D-016 — Traitement des Anomalies découvertes lors d'un Audit

Les Anomalies découvertes à la suite d'un Audit suivent ensuite leur propre processus.

```text
Issue d'Audit
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
    ├── Milestone
    └── Sprint / Iteration
```

L'Audit et la correction de l'Anomalie constituent donc deux processus distincts.

**Statut : Établi**

---

## D-017 — Temporalité des Audits

Le modèle doit distinguer deux situations.

### Fonctionnement cible

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

Cette différence doit être conservée pour l'interprétation de la qualité et de la conformité.

**Statut : Établi**

---

## D-018 — Identification actuelle d'une Issue d'Audit RGAA

Aujourd'hui, une Issue d'Audit RGAA possède le label :

```text
Audit RGAA
```

Le Composant concerné est identifié par un label :

```text
🧩 Component:xxx
```

Exemple :

```text
Issue
├── label : Audit RGAA
└── label : 🧩 Component:Button
```

**Statut : Établi**

---

## D-019 — Identification cible d'une Issue d'Audit

La cible souhaitée est d'utiliser un Issue Type :

```text
🔍 Audit
```

Le modèle cible doit cependant distinguer :

```text
nature du travail
        │
        └── Audit

famille d'Audit
        │
        └── RGAA actuellement
```

La représentation technique de la famille d'Audit reste à décider.

**Statut : Orientation cible établie**

---

## D-020 — Nature d'Audit et famille d'Audit

La nature de l'Issue et la famille d'Audit sont deux dimensions distinctes.

Conceptuellement :

```text
Issue
├── Issue Type      : 🔍 Audit
├── Famille d'Audit : RGAA
└── Composant       : xxx
```

Le fait qu'une Issue représente un Audit ne doit donc pas imposer que toutes les familles d'Audit deviennent des Issue Types différents.

**Statut : Établi comme principe de modélisation**

---

## D-021 — Composant non audité

Un Composant non audité ne doit pas être automatiquement considéré comme non conforme.

Il faut distinguer au minimum :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

**Statut : Établi**

---

## D-022 — Couverture et conformité

La couverture d'Audit et le taux de conformité sont deux indicateurs différents.

```text
Couverture d'Audit
=
Composants audités
/
Composants du périmètre
```

```text
Taux de conformité
=
Composants conformes
/
Composants audités
```

**Statut : Établi comme principe**

---

## D-023 — Vélocité vide et vélocité zéro

Les valeurs suivantes ont des significations différentes :

```text
velocity = null
velocity = 0
velocity > 0
```

Elles ne doivent pas être assimilées.

**Statut : Établi**

---

## D-024 — Criticité

La Criticité doit être associée à un domaine.

Les domaines identifiés comprennent notamment :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

**Statut : Établi**

---

## D-025 — Anomalie et Amélioration

Une Anomalie et une proposition d'Amélioration sont deux notions distinctes.

Un Audit peut potentiellement produire :

```text
Audit
    ├── Anomalies / non-conformités
    └── Propositions d'Amélioration
```

**Statut : Établi**

---

# 4. Questions ouvertes — Librairies, Packages et Repositories

## Q-001 — Propriétés du Package

Quelles propriétés doivent définir un Package dans le modèle métier ?

Éléments déjà établis :

- nom ;
- Version ;
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

# 5. Questions ouvertes — Versions et Releases

## Q-005 — Cycle Release Candidate vers PROD

Le passage :

```text
release/***
    ↓
Release Candidate M.m.r-rc.n
    ↓
merge vers master
    ↓
Jenkins
    ↓
M.m.r PROD
```

est établi.

Le fonctionnement cible prévoit en complément la réalisation des Audits sur une Release Candidate avant ce passage en PROD.

**Statut : Établi**

---

## Q-006 — Cycle Hotfix Candidate vers PROD

Le passage :

```text
hotfix/***
    ↓
Hotfix Candidate M.m.r-hc.n
    ↓
merge vers master
    ↓
Jenkins
    ↓
M.m.r PROD
```

est établi.

**Statut : Établi**

---

## Q-007 — Release GitHub

Une Release GitHub doit-elle systématiquement exister pour toute Version PROD ?

Il est actuellement établi qu'elle existe normalement, mais :

- son caractère obligatoire n'est pas confirmé ;
- son mécanisme de création n'est pas documenté ;
- il n'est pas établi que Jenkins la crée.

**Statut : À confirmer**

---

## Q-008 — Milestone PROD manquante

Une Version PROD doit avoir une Milestone portant exactement son numéro.

Comment le système doit-il traiter une Version PROD pour laquelle cette Milestone serait absente ?

**Statut : À instruire ultérieurement dans les règles**

---

## Q-009 — Tag Git manquant

Une Version PROD doit posséder un Tag Git correspondant.

Comment le système doit-il traiter une Version publiée dans Nexus PROD lorsque le Tag attendu est absent ?

**Statut : À instruire ultérieurement dans les règles**

---

## Q-010 — Version d'Audit

La convention :

```text
M.m.r-Audit
```

ne représente pas une Version distincte.

Elle représente un mécanisme d'Audit de rattrapage portant sur la Version PROD :

```text
M.m.r
```

Exemple :

```text
1.1.0-Audit
    ↓
Version concernée : 1.1.0
Contexte          : Audit de rattrapage
```

Dans le fonctionnement cible, l'Audit doit au contraire être réalisé sur une Release Candidate avant la PROD et les Issues d'Audit évoluent dans la Milestone `M.m.r`.

**Statut : Établi**

---

# 6. Questions ouvertes — Anomalies

## Q-011 — Définition d'une Anomalie

Quelle règle doit déterminer qu'une Issue représente une Anomalie ?

Cette règle devra être configurable car la représentation d'un Bug peut varier selon les repositories ou organisations.

**Statut : À instruire**

---

## Q-012 — Origine d'une Anomalie

Quelles origines doivent être distinguées ?

L'Audit constitue au moins une origine possible.

D'autres origines restent à identifier.

**Statut : À instruire**

---

## Q-013 — Date de détection

Quelle date représente la détection d'une Anomalie ?

Dans le cas d'une Anomalie découverte pendant un Audit, il faudra notamment déterminer si cette date correspond :

- au moment de la constatation ;
- à la création de l'Issue ;
- à une autre information.

**Statut : À instruire**

---

## Q-014 — Date de correction

Quelle date représente la correction effective d'une Anomalie ?

**Statut : À instruire**

---

# 7. Questions ouvertes — Audits

## Q-015 — Objet Audit

L'Audit doit-il devenir un objet métier explicite indépendant de l'Issue GitHub qui représente actuellement le travail d'Audit ?

Il est désormais établi qu'il existe une Issue d'Audit par Composant à auditer.

Il reste à déterminer si l'objet métier `Audit` doit être strictement confondu avec cette Issue ou être modélisé séparément.

**Statut : À instruire**

---

## Q-016 — Campagne d'Audit

Comment une Campagne d'Audit est-elle identifiée ?

La Milestone permet de regrouper les Issues d'Audit d'une Version ou d'un rattrapage, mais il reste à déterminer si elle suffit à définir une Campagne métier.

**Statut : À instruire**

---

## Q-017 — Résultat d'un Audit

Quelles informations déterminent qu'un Composant audité est :

```text
AUDITÉ & CONFORME
```

ou :

```text
AUDITÉ & NON CONFORME
```

**Statut : À instruire**

---

## Q-018 — Version auditée

Deux situations sont désormais établies.

### Audit cible pré-PROD

La Version effectivement auditée est une Release Candidate :

```text
M.m.r-rc.n
```

La Version PROD cible est :

```text
M.m.r
```

### Audit de rattrapage

La Version effectivement auditée est la Version PROD :

```text
M.m.r
```

La Milestone peut être :

```text
M.m.r-Audit
```

Il reste à déterminer comment identifier précisément la Release Candidate effectivement utilisée pour un Audit pré-PROD.

**Statut : Partiellement établi**

---

## Q-019 — Temporalité exacte de l'Audit

Il est établi que :

- le fonctionnement cible réalise l'Audit avant la PROD ;
- le mécanisme de rattrapage réalise l'Audit après la PROD.

Il reste à déterminer comment identifier précisément :

- le début de l'Audit ;
- la fin de l'Audit ;
- la date à laquelle un Composant est considéré comme audité.

**Statut : À instruire**

---

# 8. Questions ouvertes — Workflow

## Q-020 — Profils de workflow

Les profils suivants doivent-ils être formalisés comme des profils métier distincts ?

- STANDARD ;
- EPIC ;
- AUDIT ;
- RELEASE ;
- CONCEPTION.

Le comportement spécifique des Issues d'Audit renforce l'intérêt d'un profil `AUDIT`.

**Statut : À confirmer**

---

## Q-021 — Exceptions aux règles de Pull Request

Pour quels profils une Pull Request n'est-elle pas obligatoire avant le statut Done ?

Les Issues d'Audit sont notamment candidates à cette exception.

**Statut : À formaliser**

---

## Q-022 — Statut Cancelled

Quelles propriétés ou relations sont interdites lorsqu'une Issue est Cancelled ?

**Statut : À formaliser**

---

# 9. Questions ouvertes — Applications consommatrices

## Q-023 — Identification des Applications

Quelle source permet de connaître les Applications qui utilisent ou devraient utiliser le Design System ?

**Statut : Futur**

---

## Q-024 — Détection des Packages utilisés

Comment déterminer qu'une Application utilise un Package donné ?

**Statut : Futur**

---

## Q-025 — Détection de la Version utilisée

Comment déterminer la Version effectivement utilisée par une Application ?

**Statut : Futur**

---

## Q-026 — Versions non-PROD utilisées par les consommateurs

Comment traiter une Application utilisant :

```text
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
```

notamment selon qu'il s'agit d'un environnement de test ou de production ?

**Statut : Futur**

---

## Q-027 — Détection des Composants utilisés

Comment analyser le code d'une Application afin d'identifier :

- les Composants utilisés ;
- leur nombre d'utilisations ?

**Statut : Futur**

---

## Q-028 — Dette de montée de Version

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

## Q-029 — Alertes aux Squads

Quelles situations doivent provoquer une alerte à destination d'une Squad responsable d'une Application ?

**Statut : Futur**

---

# 10. Questions ouvertes — Qualité des Applications consommatrices

## Q-030 — Qualité d'une Version

Comment calculer la qualité d'une Version d'une Librairie ?

La définition devra désormais tenir compte de deux contextes :

```text
Audit pré-PROD
```

et :

```text
Audit de rattrapage post-PROD
```

Il faudra éviter de projeter rétroactivement sur la date de publication un résultat d'Audit obtenu ultérieurement.

**Statut : À instruire**

---

## Q-031 — Qualité d'un Composant

Comment calculer la qualité d'un Composant pour une Version donnée ?

**Statut : À instruire**

---

## Q-032 — Badge ou note d'une Application

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

## Q-033 — RGAA / WAI-ARIA d'une Application

Quelle signification précise doit avoir une note ou un badge RGAA / WAI-ARIA calculé à partir des Composants du Design System utilisés par une Application ?

**Statut : Futur**

---

# 11. Questions ouvertes — Historisation

## Q-034 — Granularité historique

Quels événements doivent provoquer la création d'un Snapshot ?

Exemples à étudier :

- exécution périodique ;
- Release ;
- fin de sprint ;
- Audit ;
- exécution manuelle.

**Statut : À instruire**

---

## Q-035 — Historisation de la connaissance de la qualité

Comment représenter la différence entre :

```text
qualité connue au moment de la publication
```

et :

```text
qualité connue après un Audit ultérieur
```

sans modifier rétroactivement l'état historique ?

Cette question est particulièrement importante pour les Audits de rattrapage.

**Statut : À instruire**

---

## Q-036 — Conservation

Quelle durée d'historique doit être conservée ?

**Statut : À instruire**

---

# 12. Questions ouvertes — Sources externes

## Q-037 — Nexus

Nexus est identifié comme source de publication des Packages et Versions.

Il faudra déterminer les informations nécessaires au pipeline pour identifier :

- l'espace Nexus ;
- le Package ;
- la Version ;
- la catégorie de Version ;
- la dernière Version PROD.

**Statut : À instruire techniquement**

---

## Q-038 — Jenkins

Jenkins intervient dans :

- la génération des Versions SNAPSHOT ;
- la génération des Release Candidates ;
- la génération des Hotfix Candidates ;
- la production des éléments de Version PROD après merge d'une release vers `master` ;
- la production des éléments de Version PROD après merge d'un hotfix vers `master` ;
- la création du Tag Git ;
- la publication du Package dans Nexus PROD.

Il reste à déterminer si le pipeline doit interroger directement Jenkins ou si GitHub et Nexus fournissent les informations nécessaires aux indicateurs.

**Statut : À instruire techniquement**

---

## Q-039 — Applications consommatrices

Quelle source permettra d'identifier les Applications et leurs dépendances ?

**Statut : Futur**

---

## Q-040 — Usage des Composants

Quelle source ou quel mécanisme permettra de mesurer l'utilisation réelle des Composants dans les Applications ?

**Statut : Futur**

---

# 13. Questions ouvertes — Architecture

## Q-041 — Backend

À quel moment le dashboard statique actuel devra-t-il évoluer vers une architecture avec backend ?

**Statut : À instruire ultérieurement**

---

## Q-042 — Stockage historique

Quel système doit conserver les Snapshots à terme ?

**Statut : À instruire ultérieurement**

---

## Q-043 — Multi-source

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

# 14. Nouvelles questions issues de la modélisation des Audits

## Q-044 — Familles d'Audit

Quelles familles d'Audit le modèle doit-il supporter ?

La famille actuellement établie est :

```text
RGAA
```

Il reste à déterminer :

- quelles autres familles existent réellement ;
- quelles familles sont prévues à terme ;
- si certaines notions comme WAI-ARIA constituent une famille autonome ou une caractéristique d'une famille plus large.

**Statut : À instruire**

---

## Q-045 — Représentation de la famille d'Audit

Comment la famille d'Audit doit-elle être représentée dans GitHub ?

La cible envisagée sépare :

```text
Issue Type = 🔍 Audit
```

de :

```text
Famille d'Audit = RGAA
```

Le mécanisme de représentation de la famille reste à déterminer.

Les possibilités à étudier comprennent notamment :

- Label ;
- champ Project ;
- autre mécanisme.

Aucun choix n'est encore arrêté.

**Statut : À instruire**

---

## Q-046 — Cardinalité de la famille d'Audit

Une Issue d'Audit possède-t-elle :

```text
exactement 1 famille
```

ou peut-elle appartenir à plusieurs familles simultanément ?

**Statut : À instruire**

---

## Q-047 — Cardinalité du Composant d'une Issue d'Audit

Il est établi qu'il existe une Issue d'Audit par Composant à auditer.

Faut-il en déduire la règle :

```text
1 Issue d'Audit
=
exactement 1 label 🧩 Component:xxx
```

?

**Statut : À confirmer**

---

## Q-048 — Identification précise de la Release Candidate auditée

Dans le fonctionnement cible, l'Audit est réalisé sur une Release Candidate :

```text
M.m.r-rc.n
```

Comment l'Issue d'Audit permet-elle d'identifier précisément le numéro de Release Candidate effectivement audité ?

Exemple :

```text
1.1.0-rc.123
```

**Statut : À instruire**

---

## Q-049 — Fin d'une Issue d'Audit

Quelles conditions permettent de considérer une Issue d'Audit comme terminée ?

Le seul statut `Done` est-il suffisant ou d'autres informations sont-elles nécessaires ?

**Statut : À instruire**

---

## Q-050 — Relation entre une Issue d'Audit et une Anomalie

Lorsqu'une Anomalie est découverte pendant l'Audit d'un Composant, comment cette Anomalie est-elle reliée à l'Issue d'Audit qui a permis sa détection ?

Cette relation est nécessaire pour conserver une traçabilité :

```text
Anomalie
    ↓
Issue d'Audit d'origine
    ↓
Composant
    ↓
Version auditée
```

**Statut : À instruire**

---

## Q-051 — Passage en PROD et couverture des Audits

Toutes les Issues d'Audit prévues pour une Version doivent-elles être terminées avant que la Version puisse passer en PROD ?

Ou une publication PROD reste-t-elle possible avec une couverture d'Audit incomplète ?

**Statut : À instruire**

---

## Q-052 — Passage en PROD et Anomalies détectées

Lorsqu'un Audit de Release Candidate détecte une ou plusieurs Anomalies, quelles Anomalies empêchent la publication de la Version PROD ?

Cette décision dépend-elle notamment :

- de la criticité ;
- du type de non-conformité ;
- de la famille d'Audit ;
- d'une décision humaine ?

**Statut : À instruire**

---

## Q-053 — Migration vers l'Issue Type `🔍 Audit`

Comment effectuer la transition entre la représentation actuelle :

```text
label = Audit RGAA
```

et la cible :

```text
Issue Type = 🔍 Audit
+
Famille d'Audit = ...
```

Il faudra notamment déterminer comment traiter :

- les anciennes Issues ;
- les Issues encore ouvertes au moment de la migration ;
- les Snapshots historiques ;
- les règles de compatibilité du pipeline.

**Statut : À instruire ultérieurement**

---

## Q-054 — Valeur de Version dans `package.json`

Une incohérence apparente reste à clarifier.

Il a été indiqué que, sur `develop`, `package.json` contient actuellement :

```text
1.8.0-SNAPSHOT
```

Il a également été indiqué que Jenkins produit les Versions en fonction du type de branche et de la Version `M.m.r` trouvée dans `package.json`.

Il faut donc déterminer lequel des fonctionnements suivants correspond à la réalité.

### Hypothèse A# Questions ouvertes

## 1. Objectif

Ce document recense les décisions métier et d'architecture déjà établies ainsi que les questions qui doivent encore être instruites pour stabiliser le modèle du Design System Quality Pipeline.

L'objectif est d'éviter :

- d'introduire des hypothèses implicites ;
- de transformer une situation actuelle en contrainte définitive ;
- de coder des règles métier qui n'ont pas encore été validées ;
- de perdre la traçabilité des questions déjà posées ;
- de considérer implicitement une question comme résolue parce qu'elle a disparu du document.

Lorsqu'une réponse est établie, elle doit être reportée dans les documents de référence concernés.

---

# 2. Gestion des décisions et questions

Les identifiants des décisions `D-xxx` et des questions `Q-xxx` sont stables.

Une décision ou une question déjà enregistrée ne doit pas être renumérotée en raison d'une réorganisation du document.

Lorsqu'une question est résolue :

- elle reste présente dans ce document ;
- son statut devient `Établi`, `Décidé` ou un statut équivalent ;
- sa réponse est synthétisée dans la question ;
- les documents métier concernés sont mis à jour.

Lorsqu'une nouvelle question apparaît, elle reçoit le prochain identifiant disponible.

Le registre doit donc rester cumulatif et traçable.

---

# 3. Décisions et faits déjà établis

## D-001 — Repository et Librairie

Aujourd'hui :

```text
1 Repository = 1 Librairie
```

Le modèle doit permettre à terme :

```text
1 Repository = 1..n Librairies
```

**Statut : Établi**

---

## D-002 — Librairie et Package

Aujourd'hui :

```text
1 Librairie = 1 Package
```

Cible :

```text
1 Librairie = 1..n Packages
```

**Statut : Établi**

---

## D-003 — Package et Version

Une Application utilise un Package dans une Version donnée.

```text
Application
    └── Package @ Version
```

**Statut : Établi**

---

## D-004 — Version déclarée dans `package.json`

Dans le fonctionnement nominal observé, `package.json` contient une Version de base de forme :

```text
M.m.r
```

Exemple :

```json
{
  "version": "1.8.0"
}
```

Jenkins construit ensuite la Version d'artefact en fonction du contexte de build.

Jenkins sait également traiter un cas où `package.json` contient déjà :

```text
M.m.r-SNAPSHOT
```

La forme `M.m.r` constitue donc le fonctionnement nominal observé et non une contrainte absolue du processus.

**Statut : Établi**

---

## D-005 — Version SNAPSHOT

Depuis :

```text
develop
project/***
```

Jenkins produit des Versions :

```text
M.m.r-SNAPSHOT
```

Dans le fonctionnement nominal, Jenkins ajoute `-SNAPSHOT` à la Version de base `M.m.r` déclarée dans `package.json`.

Ces Versions sont disponibles dans Nexus et sont destinées notamment aux tests d'intégration.

Elles n'ont pas vocation à être déployées en production.

**Statut : Établi**

---

## D-006 — Release Candidate

Depuis :

```text
release/***
```

Jenkins produit :

```text
M.m.r-rc.[numéro de build Jenkins]
```

Le numéro situé après `rc` correspond au numéro du build Jenkins.

**Statut : Établi**

---

## D-007 — Hotfix Candidate

Depuis :

```text
hotfix/***
```

Jenkins produit :

```text
M.m.r-hc.[numéro de build Jenkins]
```

Le numéro situé après `hc` correspond au numéro du build Jenkins.

**Statut : Établi**

---

## D-008 — Production PROD depuis une release

Une Version PROD issue d'une release est produite lors du merge :

```text
release/*** → master
```

Ce merge déclenche automatiquement Jenkins.

Si les stages nécessaires réussissent, Jenkins produit notamment :

```text
Tag Git M.m.r
+
Publication Nexus PROD M.m.r
```

**Statut : Établi**

---

## D-009 — Production PROD depuis un hotfix

Une Version PROD issue d'un hotfix est produite selon le même principe :

```text
hotfix/*** → master
```

Le merge déclenche Jenkins qui produit notamment :

```text
Tag Git M.m.r
+
Publication Nexus PROD M.m.r
```

**Statut : Établi**

---

## D-010 — Caractéristiques d'une Version PROD

Une Version PROD :

- possède la forme `M.m.r` ;
- ne possède pas de suffixe ;
- est disponible dans un Repository / espace Nexus spécifique à la production ;
- possède un Tag Git correspondant ;
- doit disposer d'une Milestone portant exactement son numéro ;
- possède normalement une Release GitHub correspondante.

Le caractère obligatoire de la Release GitHub n'est pas encore confirmé.

**Statut : Établi, sauf caractère obligatoire de la Release GitHub**

---

## D-011 — Nexus ne contient pas uniquement des Versions PROD

Nexus peut notamment contenir :

```text
M.m.r
M.m.r-SNAPSHOT
M.m.r-rc.[build]
M.m.r-hc.[build]
```

La présence d'une Version dans Nexus ne suffit donc pas à la qualifier de Version PROD.

**Statut : Établi**

---

## D-012 — Audit cible avant PROD

Le fonctionnement souhaité est de réaliser les Audits avant la création de la Version PROD finale.

Les Audits sont réalisés sur une Release Candidate :

```text
M.m.r-rc.n
```

afin de pouvoir produire, si possible, une Version finale PROD conforme :

```text
M.m.r
```

**Statut : Établi**

---

## D-013 — Milestone des Audits pré-PROD

Dans le fonctionnement cible, les Issues d'Audit des Composants évoluent dans la Milestone correspondant à la future Version PROD :

```text
M.m.r
```

**Statut : Établi**

---

## D-014 — Milestone `M.m.r-Audit`

Une Milestone telle que :

```text
1.1.0-Audit
```

ne représente pas une Version supplémentaire.

Elle correspond à un mécanisme de rattrapage utilisé lorsque les Audits n'ont pas été réalisés avant la création de la Version PROD.

**Statut : Établi**

---

## D-015 — Contenu d'une Milestone d'Audit de rattrapage

Une Milestone `M.m.r-Audit` contient uniquement les Issues d'Audit des Composants.

Il existe une Issue d'Audit par Composant à auditer.

Les Anomalies découvertes ne sont pas destinées à être planifiées dans cette Milestone.

**Statut : Établi**

---

## D-016 — Traitement des Anomalies découvertes lors d'un Audit

Les Anomalies découvertes suivent leur propre processus :

```text
Issue d'Audit
    ↓
Anomalie
    ↓
Grooming
    ↓
Pesée
    ↓
Milestone + Sprint / Iteration
```

**Statut : Établi**

---

## D-017 — Temporalité des Audits

Le modèle doit distinguer :

```text
Release Candidate
    ↓
Audit
    ↓
Version PROD
```

du rattrapage :

```text
Version PROD
    ↓
Audit
```

**Statut : Établi**

---

## D-018 — Identification actuelle d'une Issue d'Audit RGAA

Aujourd'hui :

```text
label : Audit RGAA
label : 🧩 Component:xxx
```

**Statut : Établi**

---

## D-019 — Identification cible d'une Issue d'Audit

La cible souhaitée est :

```text
Issue Type = 🔍 Audit
```

La représentation de la famille d'Audit reste à décider.

**Statut : Orientation cible établie**

---

## D-020 — Nature et famille d'Audit

La nature de l'Issue et la famille d'Audit sont deux dimensions distinctes.

```text
Issue
├── Issue Type      : 🔍 Audit
├── Famille d'Audit : RGAA
└── Composant       : xxx
```

**Statut : Établi comme principe de modélisation**

---

## D-021 — Composant non audité

Il faut distinguer :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un Composant non audité n'est pas automatiquement non conforme.

**Statut : Établi**

---

## D-022 — Couverture et conformité

```text
Couverture d'Audit
=
Composants audités
/
Composants du périmètre
```

```text
Taux de conformité
=
Composants conformes
/
Composants audités
```

**Statut : Établi comme principe**

---

## D-023 — Vélocité vide et vélocité zéro

Les valeurs suivantes ont des significations différentes :

```text
velocity = null
velocity = 0
velocity > 0
```

**Statut : Établi**

---

## D-024 — Criticité

La Criticité doit être associée à un domaine :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

**Statut : Établi**

---

## D-025 — Anomalie et Amélioration

Une Anomalie et une proposition d'Amélioration sont deux notions distinctes.

**Statut : Établi**

---

## D-026 — Version déclarée et Version d'artefact

La Version présente dans `package.json` et la Version effectivement construite/publiée par Jenkins sont deux notions distinctes.

Dans le cas nominal :

```text
package.json.version = 1.8.0
        │
        ▼
Jenkins + contexte
        │
        ├── 1.8.0-SNAPSHOT
        ├── 1.8.0-rc.n
        ├── 1.8.0-hc.n
        └── 1.8.0
```

Le modèle normalisé devra conserver cette distinction.

**Statut : Établi**

---

# 4. Questions ouvertes — Librairies, Packages et Repositories

## Q-001 — Propriétés du Package

Quelles propriétés doivent définir un Package dans le modèle métier ?

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

Dans le cas futur où une Librairie possède plusieurs Packages, un Composant appartient-il à la Librairie, à un Package ou potentiellement à plusieurs Packages ?

**Statut : À instruire**

---

# 5. Questions ouvertes — Versions et Releases

## Q-005 — Cycle Release Candidate vers PROD

Le cycle release vers PROD est établi.

Le fonctionnement cible prévoit en complément la réalisation des Audits sur une Release Candidate avant la PROD.

**Statut : Établi**

---

## Q-006 — Cycle Hotfix Candidate vers PROD

Le cycle hotfix vers PROD est établi.

**Statut : Établi**

---

## Q-007 — Release GitHub

Une Release GitHub doit-elle systématiquement exister pour toute Version PROD et comment est-elle créée ?

**Statut : À confirmer**

---

## Q-008 — Milestone PROD manquante

Comment traiter une Version PROD pour laquelle la Milestone `M.m.r` serait absente ?

**Statut : À instruire ultérieurement dans les règles**

---

## Q-009 — Tag Git manquant

Comment traiter une Version publiée dans Nexus PROD lorsque le Tag attendu est absent ?

**Statut : À instruire ultérieurement dans les règles**

---

## Q-010 — Version d'Audit

`M.m.r-Audit` représente un Audit de rattrapage de `M.m.r`, et non une Version distincte.

Le fonctionnement cible réalise l'Audit sur `M.m.r-rc.n` avant la PROD.

**Statut : Établi**

---

# 6. Questions ouvertes — Anomalies

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

# 7. Questions ouvertes — Audits

## Q-015 — Objet Audit

L'Audit doit-il devenir un objet métier explicite indépendant de l'Issue GitHub représentant le travail d'Audit ?

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

Pour un Audit pré-PROD, la Version auditée est une Release Candidate `M.m.r-rc.n`.

Pour un Audit de rattrapage, la Version auditée est la PROD `M.m.r`.

Il reste à déterminer comment identifier précisément la Release Candidate effectivement auditée.

**Statut : Partiellement établi**

---

## Q-019 — Temporalité exacte de l'Audit

Comment identifier précisément :

- le début de l'Audit ;
- la fin de l'Audit ;
- la date à laquelle un Composant est considéré comme audité ?

**Statut : À instruire**

---

# 8. Questions ouvertes — Workflow

## Q-020 — Profils de workflow

Les profils STANDARD, EPIC, AUDIT, RELEASE et CONCEPTION doivent-ils être formalisés comme des profils métier distincts ?

**Statut : À confirmer**

---

## Q-021 — Exceptions aux règles de Pull Request

Pour quels profils une Pull Request n'est-elle pas obligatoire avant Done ?

**Statut : À formaliser**

---

## Q-022 — Statut Cancelled

Quelles propriétés ou relations sont interdites lorsqu'une Issue est Cancelled ?

**Statut : À formaliser**

---

# 9. Questions ouvertes — Applications consommatrices

## Q-023 — Identification des Applications

Quelle source permet de connaître les Applications qui utilisent ou devraient utiliser le Design System ?

**Statut : Futur**

---

## Q-024 — Détection des Packages utilisés

Comment déterminer qu'une Application utilise un Package donné ?

**Statut : Futur**

---

## Q-025 — Détection de la Version utilisée

Comment déterminer la Version effectivement utilisée par une Application ?

**Statut : Futur**

---

## Q-026 — Versions non-PROD utilisées par les consommateurs

Comment traiter une Application utilisant une Version SNAPSHOT, RC ou HC ?

**Statut : Futur**

---

## Q-027 — Détection des Composants utilisés

Comment identifier les Composants utilisés et leur nombre d'utilisations ?

**Statut : Futur**

---

## Q-028 — Dette de montée de Version

Comment définir la dette liée à l'utilisation d'une ancienne Version PROD ?

**Statut : Futur**

---

## Q-029 — Alertes aux Squads

Quelles situations doivent provoquer une alerte à destination d'une Squad responsable ?

**Statut : Futur**

---

# 10. Questions ouvertes — Qualité

## Q-030 — Qualité d'une Version

Comment calculer la qualité d'une Version en distinguant Audit pré-PROD et Audit de rattrapage ?

**Statut : À instruire**

---

## Q-031 — Qualité d'un Composant

Comment calculer la qualité d'un Composant pour une Version donnée ?

**Statut : À instruire**

---

## Q-032 — Badge ou note d'une Application

Comment construire une information synthétique de qualité pour une Application à partir des Packages, Versions et Composants utilisés ?

**Statut : Futur**

---

## Q-033 — RGAA / WAI-ARIA d'une Application

Quelle signification précise doit avoir une note ou un badge RGAA / WAI-ARIA d'une Application ?

**Statut : Futur**

---

# 11. Questions ouvertes — Historisation

## Q-034 — Granularité historique

Quels événements doivent provoquer la création d'un Snapshot ?

**Statut : À instruire**

---

## Q-035 — Historisation de la connaissance de la qualité

Comment distinguer la qualité connue à la publication de celle découverte ultérieurement ?

**Statut : À instruire**

---

## Q-036 — Conservation

Quelle durée d'historique doit être conservée ?

**Statut : À instruire**

---

# 12. Questions ouvertes — Sources externes

## Q-037 — Nexus

Quelles informations Nexus sont nécessaires au pipeline ?

**Statut : À instruire techniquement**

---

## Q-038 — Jenkins

Le pipeline doit-il interroger directement Jenkins ou GitHub et Nexus fournissent-ils suffisamment d'informations ?

**Statut : À instruire techniquement**

---

## Q-039 — Applications consommatrices

Quelle source permettra d'identifier les Applications et leurs dépendances ?

**Statut : Futur**

---

## Q-040 — Usage des Composants

Quelle source permettra de mesurer l'utilisation réelle des Composants ?

**Statut : Futur**

---

# 13. Questions ouvertes — Architecture

## Q-041 — Backend

À quel moment le dashboard statique devra-t-il évoluer vers une architecture avec backend ?

**Statut : À instruire ultérieurement**

---

## Q-042 — Stockage historique

Quel système doit conserver les Snapshots à terme ?

**Statut : À instruire ultérieurement**

---

## Q-043 — Multi-source

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

# 14. Nouvelles questions issues de la modélisation des Audits

## Q-044 — Familles d'Audit

Quelles familles d'Audit le modèle doit-il supporter ?

RGAA est actuellement établi.

**Statut : À instruire**

---

## Q-045 — Représentation de la famille d'Audit

Comment représenter la famille d'Audit dans GitHub ?

La cible distingue :

```text
Issue Type = 🔍 Audit
```

de :

```text
Famille d'Audit = RGAA
```

**Statut : À instruire**

---

## Q-046 — Cardinalité de la famille d'Audit

Une Issue d'Audit possède-t-elle exactement une famille ou peut-elle appartenir à plusieurs familles ?

**Statut : À instruire**

---

## Q-047 — Cardinalité du Composant

Une Issue d'Audit doit-elle posséder exactement un label `🧩 Component:xxx` ?

**Statut : À confirmer**

---

## Q-048 — Identification précise de la Release Candidate auditée

Comment identifier précisément la Release Candidate `M.m.r-rc.n` effectivement auditée ?

**Statut : À instruire**

---

## Q-049 — Fin d'une Issue d'Audit

Quelles conditions permettent de considérer une Issue d'Audit comme terminée ?

**Statut : À instruire**

---

## Q-050 — Relation Issue d'Audit / Anomalie

Comment une Anomalie découverte est-elle reliée à l'Issue d'Audit qui a permis sa détection ?

**Statut : À instruire**

---

## Q-051 — Passage en PROD et couverture des Audits

Toutes les Issues d'Audit prévues doivent-elles être terminées avant le passage en PROD ?

**Statut : À instruire**

---

## Q-052 — Passage en PROD et Anomalies détectées

Quelles Anomalies détectées pendant les Audits empêchent la publication de la Version PROD ?

**Statut : À instruire**

---

## Q-053 — Migration vers l'Issue Type `🔍 Audit`

Comment effectuer la transition entre :

```text
label = Audit RGAA
```

et :

```text
Issue Type = 🔍 Audit
+
Famille d'Audit = ...
```

**Statut : À instruire ultérieurement**

---

## Q-054 — Valeur de Version dans `package.json`

Dans le fonctionnement nominal observé, `package.json` contient :

```json
{
  "version": "1.8.0"
}
```

Jenkins ajoute ensuite le suffixe approprié lors de la construction.

Par exemple sur `develop` :

```text
1.8.0
    ↓ Jenkins
1.8.0-SNAPSHOT
```

Jenkins sait également traiter le cas où `package.json` contient déjà :

```json
{
  "version": "1.8.0-SNAPSHOT"
}
```

Il ne faut donc pas imposer comme règle absolue que `package.json.version` soit toujours de forme `M.m.r`.

Il faut distinguer :

- la Version déclarée dans `package.json` ;
- la Version d'artefact calculée ou publiée par Jenkins.

**Statut : Établi**

---

# 15. Méthode de traitement des questions

Les questions ne doivent pas être résolues toutes en même temps.

Pour chaque question :

1. observer le fonctionnement réel ;
2. établir le fait métier ;
3. distinguer situation actuelle et cible ;
4. distinguer fonctionnement nominal et mécanisme de rattrapage ;
5. mettre à jour le modèle métier ;
6. définir ensuite les règles ;
7. définir les impacts sur les indicateurs ;
8. seulement ensuite modifier l'implémentation.

Les identifiants `D-xxx` et `Q-xxx` sont stables et ne doivent pas être renumérotés.

Cette approche doit éviter que les contraintes actuelles de GitHub, Jenkins ou Nexus deviennent implicitement la définition du métier.

```text
package.json
    └── 1.8.0-SNAPSHOT
```

et Jenkins utilise directement ou transforme cette valeur.

### Hypothèse B

```text
package.json
    └── 1.8.0
```

puis Jenkins ajoute :

```text
-SNAPSHOT
-rc.n
-hc.n
```

selon le contexte.

### Hypothèse C

Le fonctionnement est différent.

**Statut : À clarifier**

---

# 15. Méthode de traitement des questions

Les questions ne doivent pas être résolues toutes en même temps.

Pour chaque question :

1. observer le fonctionnement réel ;
2. établir le fait métier ;
3. distinguer situation actuelle et cible ;
4. distinguer fonctionnement nominal et mécanisme de rattrapage ;
5. mettre à jour le modèle métier ;
6. définir ensuite les règles ;
7. définir les impacts sur les indicateurs ;
8. seulement ensuite modifier l'implémentation.

Les identifiants `D-xxx` et `Q-xxx` sont stables et ne doivent plus être renumérotés.

Cette approche doit éviter que :

- les contraintes actuelles de GitHub, Jenkins ou Nexus deviennent implicitement la définition du métier ;
- une décision future modifie artificiellement l'historique de nos réflexions ;
- une question disparaisse sans avoir été explicitement résolue.