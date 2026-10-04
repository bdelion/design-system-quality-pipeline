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
├── Famille d'Audit : Accessibilité
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

## D-027 — Famille actuelle d'Audit

La seule famille d'Audit actuellement pratiquée est l'**Accessibilité**.

RGAA, WCAG et WAI-ARIA sont a priori traités ensemble par l'auditeur dans ce contexte. Leur modélisation détaillée comme référentiels, standards ou critères reste à instruire.

**Statut : Établi pour le fonctionnement actuel**

---

## D-028 — Fin d'un Audit

Une Issue d'Audit est considérée comme terminée lorsque les deux conditions sont réunies :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

**Statut : Établi**

---

## D-029 — Conformité déduite de l'Audit

Le résultat de conformité n'est actuellement pas saisi explicitement.

Pour un Audit terminé :

```text
0 sub-Issue classée comme Anomalie
→ AUDITÉ & CONFORME

≥ 1 sub-Issue classée comme Anomalie
→ AUDITÉ & NON CONFORME
```

Une sub-Issue d'Amélioration ne rend donc pas, à elle seule, le Composant non conforme.

**Statut : Établi pour le fonctionnement actuel**

---

## D-030 — Classification des sub-Issues d'un Audit d'Accessibilité

Les sub-Issues d'une Issue d'Audit d'Accessibilité peuvent actuellement représenter deux natures métier distinctes :

```text
Issue d'Audit
├── Anomalie
└── Amélioration
```

Une sub-Issue d'Anomalie possède actuellement :

- l'Issue Type `🐛 Bug` ;
- exactement un des labels de criticité RGAA connus : `🚦 rgaa:bloquante`, `🚦 rgaa:majeure` ou `🚦 rgaa:mineure` ;
- un label `♿ a11y:xxx` ;
- un label `🧩 Component:xxx` identique à celui de l'Issue d'Audit parente.

Une sub-Issue d'Amélioration possède actuellement :

- l'Issue Type `✨ Feature` ;
- un label `🧩 Component:xxx` identique à celui de l'Issue d'Audit parente ;
- un type ou une catégorie d'Amélioration qui reste à définir.

**Statut : Partiellement établi — catégorisation des Améliorations à définir**

---

## D-031 — Catégories Accessibilité des Anomalies d'Audit

Les Anomalies issues d'un Audit d'Accessibilité portent un label de forme :

```text
♿ a11y:xxx
```

Les valeurs actuellement observées et connues sont :

- `♿ a11y:image` ;
- `♿ a11y:limite de temps` ;
- `♿ a11y:navigation clavier` ;
- `♿ a11y:propriétés (nom rôle état)` ;
- `♿ a11y:contrastes` ;
- `♿ a11y:espacement des caractères` ;
- `♿ a11y:contrôle au clavier` ;
- `♿ a11y:statut`.

Cette liste correspond aux valeurs connues à ce jour. Elle n'est pas exhaustive et ne doit pas être modélisée comme une énumération fermée.

Les catégories `navigation clavier` et `contrastes` ont été citées plusieurs fois dans l'inventaire fourni ; elles ne sont listées qu'une fois ici sans en déduire l'existence de doublons dans GitHub.

**Statut : Établi pour les valeurs actuellement connues ; référentiel ouvert**

---

## D-032 — Criticité RGAA d'une Anomalie d'Audit

Dans le fonctionnement actuel, une Anomalie issue d'un Audit d'Accessibilité doit porter exactement un label de criticité RGAA parmi :

```text
🚦 rgaa:bloquante
🚦 rgaa:majeure
🚦 rgaa:mineure
```

La cardinalité métier actuelle est donc :

```text
1 Anomalie d'Audit = exactement 1 criticité RGAA
```

Ces trois valeurs constituent le référentiel actuel, mais le modèle doit permettre son évolution si les pratiques changent.

**Statut : Établi pour le fonctionnement actuel**

---

## D-033 — Référentiel de criticité partagé avec l'auditeur

Les trois niveaux de criticité RGAA actuellement utilisés sont partagés avec l'auditeur :

```text
🚦 rgaa:bloquante
🚦 rgaa:majeure
🚦 rgaa:mineure
```

Il s'agit donc d'un référentiel utilisé dans le processus d'Audit et non d'une classification créée uniquement pour les besoins du dashboard.

La définition précise et les critères d'attribution de chacun de ces niveaux ne sont pas encore connus.

**Statut : Établi pour l'usage du référentiel ; sémantique détaillée à confirmer**

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

Dans le contexte d'une sub-Issue créée à partir d'un Audit d'Accessibilité, une Anomalie est actuellement caractérisée par la combinaison suivante :

- Issue Type `🐛 Bug` ;
- un des labels `🚦 rgaa:bloquante`, `🚦 rgaa:majeure` ou `🚦 rgaa:mineure` ;
- un label `♿ a11y:xxx` ;
- un label `🧩 Component:xxx` identique à celui de l'Issue d'Audit parente.

Les valeurs `♿ a11y:xxx` actuellement connues sont : `image`, `limite de temps`, `navigation clavier`, `propriétés (nom rôle état)`, `contrastes`, `espacement des caractères`, `contrôle au clavier` et `statut`. Cette liste n'est pas exhaustive.

Cette réponse établit la règle pour les Anomalies issues d'un Audit d'Accessibilité.

La définition générale d'une Anomalie doit rester configurable car sa représentation peut varier selon les repositories, organisations et origines de l'Issue.

**Statut : Partiellement établi**

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

Le résultat de conformité n'est actuellement pas déclaré explicitement par l'auditeur.

Un Audit est considéré comme réalisé lorsque l'Issue d'Audit est simultanément :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Une fois l'Audit réalisé :

```text
aucune sub-Issue d'Anomalie
→ AUDITÉ & CONFORME

au moins une sub-Issue d'Anomalie
→ AUDITÉ & NON CONFORME
```

La conformité est donc actuellement déduite des relations de l'Issue d'Audit et non saisie dans un champ dédié.

Une sub-Issue d'Anomalie issue d'un Audit d'Accessibilité est reconnue par l'Issue Type `🐛 Bug`, sa criticité RGAA, son label `♿ a11y:xxx` et son label Component identique à celui de l'Audit parent.

Les sub-Issues d'Amélioration ne sont pas comptées comme Anomalies dans cette règle de conformité.

**Statut : Établi pour le fonctionnement actuel**

---

## Q-018 — Version auditée

Pour un Audit pré-PROD, la Version auditée est une Release Candidate `M.m.r-rc.n`.

Pour un Audit de rattrapage, la Version auditée est la PROD `M.m.r`.

Il reste à déterminer comment identifier précisément la Release Candidate effectivement auditée.

**Statut : Partiellement établi**

---

## Q-019 — Temporalité exacte de l'Audit

Un Audit est considéré comme réalisé lorsque l'Issue d'Audit est simultanément :

```text
Project Status = Done
GitHub Issue State = Closed
```

Il reste à déterminer :

- quelle information représente le début de l'Audit ;
- quelle date exacte doit représenter la fin de l'Audit dans les indicateurs historiques ;
- comment historiser un éventuel décalage entre le passage à `Done` et la fermeture de l'Issue.

**Statut : Partiellement établi**

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

La seule famille d'Audit actuellement pratiquée est :

```text
Accessibilité
```

Lors de cet Audit, l'auditeur traite a priori ensemble les problématiques relatives :

- au RGAA ;
- aux WCAG ;
- à WAI-ARIA.

Il n'est pas établi que ces trois notions doivent constituer des familles d'Audit différentes. Elles sont actuellement considérées comme relevant d'un même Audit d'Accessibilité.

Le détail des référentiels, versions et critères réellement utilisés reste à confirmer avec l'auditeur et sa grille de contrôle.

D'autres familles, par exemple Sécurité ou Performance, pourraient être envisagées à terme mais ne correspondent pas aujourd'hui à des pratiques établies.

**Statut : Établi pour le fonctionnement actuel**

---

## Q-045 — Représentation de la famille d'Audit

Comment représenter la famille d'Audit dans GitHub ?

La cible distingue :

```text
Issue Type = 🔍 Audit
```

de :

```text
Famille d'Audit = Accessibilité
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

Une Issue d'Audit est considérée comme terminée lorsque :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Le seul statut Done ou le seul état Closed n'est pas suffisant.

**Statut : Établi**

---

## Q-050 — Relation Issue d'Audit / Anomalie

Une Anomalie découverte pendant un Audit est reliée à l'Issue d'Audit sous forme de sub-Issue.

```text
Issue d'Audit
    ├── Sub-Issue Anomalie A
    ├── Sub-Issue Amélioration B
    └── ...
```

Dans le contexte d'un Audit d'Accessibilité, une sub-Issue d'Anomalie possède actuellement :

- l'Issue Type `🐛 Bug` ;
- un des labels `🚦 rgaa:bloquante`, `🚦 rgaa:majeure` ou `🚦 rgaa:mineure` ;
- un label `♿ a11y:xxx` ;
- le même label `🧩 Component:xxx` que l'Issue d'Audit parente.

Une sub-Issue d'Amélioration utilise l'Issue Type `✨ Feature` et le même label Component que l'Audit parent. Sa catégorisation complémentaire reste à définir.

**Statut : Établi pour la relation et la classification des Anomalies ; catégorisation des Améliorations à instruire**

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

## Q-055 — Template d'Issue d'Audit

À terme, un template GitHub doit fournir le minimum vital nécessaire à une Issue d'Audit.

Ce template doit faciliter :

- le pilotage ;
- la traçabilité ;
- l'exploitation par le dashboard ;
- la compréhension du résultat de l'Audit.

Il n'a pas nécessairement vocation à remplacer la grille ou checklist détaillée utilisée par l'auditeur.

Quel est le minimum d'informations qui doit être demandé par ce template ?

**Statut : À instruire**

---

## Q-056 — Catégorisation des Améliorations issues d'un Audit

Les sub-Issues d'Amélioration issues d'un Audit d'Accessibilité utilisent actuellement :

- l'Issue Type `✨ Feature` ;
- un label `🧩 Component:xxx` identique à celui de l'Issue d'Audit parente.

Il reste à déterminer quel label, champ ou autre mécanisme doit représenter le type ou la catégorie d'Amélioration.

Aucune valeur n'est définie à ce stade.

**Statut : À instruire**

---

## Q-057 — Cardinalité des catégories Accessibilité d’une Anomalie

L’hypothèse métier actuelle est qu’une Anomalie issue d’un Audit d’Accessibilité ne porte qu’un seul label de catégorie `♿ a11y:xxx`.

Cette hypothèse n’est toutefois pas suffisamment confirmée par l’observation des Audits déjà réalisés pour devenir une règle métier.

Tant que cette cardinalité n’est pas vérifiée, le modèle ne doit pas rejeter une Anomalie uniquement parce qu’elle porte plusieurs labels `♿ a11y:xxx`.

Il reste à vérifier sur les Audits réels si la cardinalité attendue est bien :

```text
1 Anomalie d’Audit
=
exactement 1 catégorie ♿ a11y:xxx
```

**Statut : Hypothèse à confirmer**

---

## Q-058 — Évolution du référentiel de criticité RGAA

Dans le fonctionnement actuel, une Anomalie d'Audit doit porter exactement une criticité parmi :

```text
🚦 rgaa:bloquante
🚦 rgaa:majeure
🚦 rgaa:mineure
```

La cardinalité `exactement 1` est établie. Le référentiel doit cependant pouvoir évoluer si les pratiques d'Audit changent.

Il reste à déterminer ultérieurement comment ce référentiel sera configuré et gouverné sans figer ces trois valeurs dans l'implémentation.

**Statut : Règle actuelle établie ; extensibilité à instruire ultérieurement**

---

## Q-059 — Critères d'attribution des criticités RGAA

Les niveaux :

```text
🚦 rgaa:bloquante
🚦 rgaa:majeure
🚦 rgaa:mineure
```

sont partagés avec l'auditeur.

Il reste à déterminer la définition précise de chacun de ces niveaux et les critères utilisés par l'auditeur pour attribuer une criticité à une Anomalie.

Aucune définition fonctionnelle de `bloquante`, `majeure` ou `mineure` ne doit être inventée tant que cette information n'a pas été confirmée.

**Statut : À confirmer avec l'auditeur**

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
