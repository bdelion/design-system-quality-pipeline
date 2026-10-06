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

## 2. Gestion des décisions et questions

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

## 3. Décisions et faits déjà établis

### D-001 — Repository et Librairie

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

### D-002 — Librairie et Package

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

### D-003 — Package et Version

Une Application utilise un Package dans une Version donnée.

```text
Application
    └── Package @ Version
```

**Statut : Établi**

---

### D-004 — Version déclarée dans `package.json`

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

### D-005 — Version SNAPSHOT

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

### D-006 — Release Candidate

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

### D-007 — Hotfix Candidate

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

### D-008 — Production PROD depuis une release

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

### D-009 — Production PROD depuis un hotfix

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

### D-010 — Caractéristiques d'une Version PROD

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

### D-011 — Nexus ne contient pas uniquement des Versions PROD

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

### D-012 — Audit cible avant PROD

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

### D-013 — Milestone des Audits pré-PROD

Dans le fonctionnement cible, les Issues d'Audit des Composants évoluent dans la Milestone correspondant à la future Version PROD :

```text
M.m.r
```

**Statut : Établi**

---

### D-014 — Milestone `M.m.r-Audit`

Une Milestone telle que :

```text
1.1.0-Audit
```

ne représente pas une Version supplémentaire.

Elle correspond à un mécanisme de rattrapage utilisé lorsque les Audits n'ont pas été réalisés avant la création de la Version PROD.

**Statut : Établi**

---

### D-015 — Contenu d'une Milestone d'Audit de rattrapage

Une Milestone `M.m.r-Audit` contient uniquement les Issues d'Audit des Composants.

Il existe une Issue d'Audit par Composant à auditer.

Les Anomalies découvertes ne sont pas destinées à être planifiées dans cette Milestone.

**Statut : Établi**

---

### D-016 — Traitement des Anomalies découvertes lors d'un Audit

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

### D-017 — Temporalité des Audits

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

### D-018 — Identification actuelle d'une Issue d'Audit RGAA

Aujourd'hui :

```text
label : Audit RGAA
label : 🧩 Component:xxx
```

**Statut : Établi**

---

### D-019 — Identification cible d'une Issue d'Audit

La cible souhaitée est :

```text
Issue Type = 🔍 Audit
```

La représentation de la famille d'Audit reste à décider.

**Statut : Orientation cible établie**

---

### D-020 — Nature et famille d'Audit

La nature de l'Issue et la famille d'Audit sont deux dimensions distinctes.

```text
Issue
├── Issue Type      : 🔍 Audit
├── Famille d'Audit : Accessibilité
└── Composant       : xxx
```

**Statut : Établi comme principe de modélisation**

---

### D-021 — Composant non audité

Il faut distinguer :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Un Composant non audité n'est pas automatiquement non conforme.

**Statut : Établi**

---

### D-022 — Couverture et conformité

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

### D-023 — Vélocité vide et vélocité zéro

Les valeurs suivantes ont des significations différentes :

```text
velocity = null
velocity = 0
velocity > 0
```

**Statut : Établi**

---

### D-024 — Criticité

La Criticité doit être associée à un domaine :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

**Statut : Établi**

---

### D-025 — Anomalie et Amélioration

Une Anomalie et une proposition d'Amélioration sont deux notions distinctes.

**Statut : Établi**

---

### D-026 — Version déclarée et Version d'artefact

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

### D-027 — Famille actuelle d'Audit

La seule famille d'Audit actuellement pratiquée est l'**Accessibilité**.

RGAA, WCAG et WAI-ARIA sont a priori traités ensemble par l'auditeur dans ce contexte. Leur modélisation détaillée comme référentiels, standards ou critères reste à instruire.

**Statut : Établi pour le fonctionnement actuel**

---

### D-028 — Fin d'un Audit

Une Issue d'Audit est considérée comme terminée lorsque les deux conditions sont réunies :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

**Statut : Établi**

---

### D-029 — Conformité déduite de l'Audit

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

### D-030 — Classification des sub-Issues d'un Audit d'Accessibilité

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

### D-031 — Catégories Accessibilité des Anomalies d'Audit

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

### D-032 — Criticité RGAA d'une Anomalie d'Audit

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

### D-033 — Référentiel de criticité partagé avec l'auditeur

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

### D-034 — Orientation de catégorisation des Améliorations d'Audit

Aucun exemple réel de sub-Issue d'Amélioration issue d'un Audit n'est disponible à ce stade pour établir un référentiel existant.

L'orientation envisagée est d'utiliser un modèle de label de la forme :

```text
[famille d'amélioration]:xxx
```

Cette notation exprime uniquement un principe cible de catégorisation. Le préfixe réel, les familles d'amélioration, les valeurs autorisées et leur cardinalité ne sont pas encore définis.

Les caractéristiques actuellement établies d'une Amélioration d'Audit restent :

- Issue Type `✨ Feature` ;
- label `🧩 Component:xxx` identique à celui de l'Issue d'Audit parente.

**Statut : Orientation cible à instruire**

---

### D-035 — Absence d'impact des Améliorations sur la conformité

Une sub-Issue d'Amélioration issue d'un Audit n'est pas une non-conformité.

Lorsqu'une Issue d'Audit est `Done` et `Closed`, le composant est considéré `AUDITÉ & CONFORME` dès lors qu'aucune sub-Issue classée comme Anomalie n'est liée à l'Audit, même si une ou plusieurs sub-Issues d'Amélioration existent encore et sont ouvertes.

La conformité est donc déterminée par la présence d'Anomalies, et non par la présence de toutes les sub-Issues :

```text
Audit Done + Closed
AND
0 Anomalie
=
AUDITÉ & CONFORME
```

Les Améliorations doivent être suivies séparément et ne doivent pas être comptabilisées comme des Anomalies dans le calcul de conformité.

**Statut : Établi**

---

### D-036 — Revue de l'auditeur dans la Definition of Done d'une Anomalie

Le workflow de correction des Anomalies d'Audit n'est pas encore définitivement acté.

L'orientation métier actuelle est néanmoins que la Definition of Done d'une Anomalie doit inclure une revue par l'auditeur avant que l'Issue puisse passer à `Done` puis être `Closed`.

Cette revue vise à éviter qu'une correction soit considérée terminée sans validation de l'auditeur.

Le mécanisme permettant ensuite de considérer globalement le Composant comme conforme n'est pas encore tranché.

**Statut : Orientation forte à formaliser dans le workflow**

---

### D-037 — Hypothèse de clôture d'une Anomalie après merge de la PR

Le responsable et le moment exacts de la clôture d'une Anomalie d'Audit ne sont pas encore définitivement actés.

L'hypothèse actuelle est la suivante :

1. la correction est portée par une Pull Request ;
2. l'auditeur réalise la revue prévue dans la Definition of Done de l'Anomalie ;
3. après validation de l'auditeur et merge de la Pull Request sur la branche cible, le développeur ou la squad fait passer l'Issue à `Done` puis `Closed`.

Le merge de la Pull Request constitue un événement technique de fin de correction. La validation de l'auditeur constitue une condition métier distincte. Le workflow ne doit pas considérer le seul merge comme suffisant tant que cette hypothèse n'a pas été formellement actée.

**Statut : Hypothèse de workflow à confirmer**

---

### D-038 — Revalidation de conformité par une nouvelle Issue d'Audit

Après correction des Anomalies détectées lors d'un Audit, la conformité globale du Composant doit être réévaluée au moyen d'une nouvelle Issue d'Audit du Composant.

La fermeture des Issues d'Anomalie ne suffit donc pas, à elle seule, à faire passer automatiquement le Composant à l'état `AUDITÉ & CONFORME`.

Le cycle cible est :

```text
Issue d'Audit initiale
        ↓
Anomalie(s) détectée(s)
        ↓
Correction des Anomalies
        ↓
Nouvelle Issue d'Audit du Composant
        ↓
Revalidation du Composant
        ↓
Nouveau verdict de conformité
```

Cette nouvelle Issue d'Audit permet également de matérialiser l'activité de revalidation de l'auditeur dans le suivi opérationnel des Sprints et Milestones.

**Statut : Établi comme modèle cible**

---

### D-039 — Distinction entre correction et conformité

La correction d'une Anomalie et la conformité d'un Composant sont deux notions métier distinctes.

Une Anomalie peut être considérée comme corrigée lorsque son traitement est terminé selon son workflow. Cette information décrit l'état de traitement de l'Anomalie.

La conformité, en revanche, relève du jugement de l'auditeur dans le cadre d'un Audit. Le pipeline et le dashboard ne doivent pas se substituer à ce jugement en déduisant automatiquement qu'un Composant est conforme parce que ses Anomalies ont été corrigées.

```text
Anomalie corrigée
≠
Composant automatiquement conforme
```

Le retour à un verdict de conformité doit être porté par une Issue d'Audit de revalidation.

**Statut : Établi**

---

### D-040 — Déclenchement collectif de l'Audit de revalidation

La création d'une Issue d'Audit de revalidation ne dépend pas nécessairement de la fermeture de toutes les Anomalies issues de l'Audit précédent.

Le moment de la revalidation peut être décidé collectivement par la Squad selon le contexte et les objectifs recherchés.

Des stratégies possibles ont été évoquées à titre d'exemples :

- revalider lorsque toutes les Anomalies `bloquantes` ont été traitées ;
- revalider lorsque toutes les Anomalies sauf les `mineures` ont été traitées ;
- attendre que toutes les Anomalies aient été traitées ;
- appliquer une autre décision collective adaptée au contexte.

Ces exemples ne constituent pas des règles prédéfinies.

**Statut : Principe établi ; modalités de décision à préciser**

---

### D-041 — Nouvelles Anomalies lors d'un Audit de revalidation

Lorsqu'un nouvel Audit de revalidation constate une Anomalie, l'auditeur crée une nouvelle Issue d'Anomalie liée à cette nouvelle Issue d'Audit.

Une Anomalie issue d'un Audit précédent n'est pas rouverte pour porter le constat du nouvel Audit, y compris lorsque le nouveau constat concerne un problème qui avait précédemment été considéré comme corrigé.

```text
Audit initial
  └── Anomalie A
        └── corrigée / Done / Closed

Audit de revalidation
  └── problème constaté
        └── nouvelle Anomalie B
```

Ce principe permet de conserver l'historique des constats et de rattacher chaque Anomalie à l'Audit qui l'a effectivement produite.

**Statut : Établi**

---

### D-042 — Absence de lien direct entre Anomalies successives

Lorsqu'un nouvel Audit détecte un problème identique ou similaire à celui d'une Anomalie issue d'un Audit précédent, aucune relation métier explicite supplémentaire n'est requise entre les deux Anomalies.

Le rattachement de chaque Anomalie à son Issue d'Audit respective est considéré suffisant pour assurer la traçabilité :

```text
Audit A
  └── Anomalie A

Audit B
  └── Anomalie B
```

Le pipeline et le dashboard ne doivent donc pas inventer une relation telle que `récurrence de` entre les Anomalies si cette relation n'existe pas dans les données sources.

Une analyse future de récurrence pourrait être calculée ou proposée comme indicateur distinct, mais elle ne constituerait pas une relation métier source.

**Statut : Établi**

---

### D-043 — Continuité des Audits d'un Composant sans relation directe

Lorsqu'une nouvelle Issue d'Audit est créée pour revalider un Composant, aucune relation explicite avec l'Issue d'Audit précédente n'est requise.

Le label `🧩 Component:xxx` commun aux Issues d'Audit est considéré suffisant pour identifier qu'elles concernent le même Composant.

Les Audits successifs d'un même Composant peuvent porter sur des Versions différentes selon les choix de la Squad. Même si l'objectif souhaité est de conserver une cohérence de Version dans le cycle de correction et de revalidation, cette cohérence ne doit pas être supposée comme une règle absolue par le modèle.

```text
Audit A
├── 🧩 Component:X
└── Version V1

Audit B
├── 🧩 Component:X
└── Version V1 ou V2
```

Le pipeline doit donc conserver séparément l'identité du Composant et la Version effectivement auditée pour chaque Audit.

**Statut : Établi**

---

### D-044 — Conformité historisée par Composant et Version

Le verdict de conformité issu d'un Audit s'applique au Composant dans la Version effectivement auditée. Un Audit ultérieur sur une autre Version ne modifie pas rétroactivement ce verdict.

```text
Button@1.7.1 → NON CONFORME
Button@1.8.0 → CONFORME
```

`Button@1.7.1` conserve donc historiquement son verdict `NON CONFORME`.

**Statut : Établi**

---

### D-045 — Séparer le verdict d'Audit et l'état des corrections

Un verdict `NON CONFORME` ne devient pas `CONFORME` au seul motif que les Anomalies ont été corrigées dans une Version ultérieure.

Une annotation complémentaire pourra indiquer que les Anomalies connues sont corrigées dans une Version ultérieure en attente d'un nouvel Audit. Cette annotation reste distincte du verdict de conformité et son libellé ainsi que ses règles restent à définir.

**Statut : Principe établi ; représentation à instruire**

---

### D-046 — Dernier Audit comme état de conformité courant

Pour un même couple `Composant × Version`, plusieurs Audits peuvent exister successivement.

Tous les résultats d'Audit doivent être conservés dans l'historique, mais le dernier Audit réalisé détermine l'état de conformité courant du couple `Composant × Version`.

Exemple :

```text
Button@1.7.1
├── Audit A → NON CONFORME
└── Audit B → CONFORME
```

Dans cet exemple :

- l'historique conserve `Audit A → NON CONFORME` ;
- l'historique conserve `Audit B → CONFORME` ;
- l'état de conformité courant de `Button@1.7.1` est `CONFORME`.

Le dashboard doit donc distinguer le verdict de chaque Audit du verdict courant calculé pour le couple `Composant × Version`.

**Statut : Supplanté par D-222**

---


> D-222 remplace la sélection du dernier Audit terminé par un verdict calculé sur l’ensemble des Audits terminés applicables.

### D-047 — Date de réalisation d'un Audit

Un Audit est terminé lorsque les deux conditions suivantes sont satisfaites :

- `Project Status = Done` ;
- `GitHub Issue State = Closed`.

La date de réalisation de l'Audit correspond à l'instant où la seconde de ces deux conditions est satisfaite, c'est-à-dire au moment où l'Issue devient effectivement `Done + Closed`.

Cette date permet notamment d'ordonner plusieurs Audits portant sur le même couple `Composant × Version`.

La date reste utile pour l'historique et l'ordonnancement des Audits. Elle ne sert plus à sélectionner à elle seule le verdict courant : D-222 impose désormais un calcul sur l'ensemble des Audits terminés applicables.

**Statut : Établi pour la date de réalisation ; règle de sélection du dernier Audit supplantée par D-222**

---

### D-048 — Un Audit en cours ne remplace pas le dernier verdict acquis

Pour un même couple `Composant × Version`, un nouvel Audit qui n'est pas encore réalisé au sens métier (`Project Status = Done` et `GitHub Issue State = Closed`) ne modifie pas l'état de conformité courant.

Le verdict du dernier Audit terminé reste le verdict courant jusqu'à la réalisation du nouvel Audit.

Exemple :

```text
Button@1.7.1
├── Audit A → terminé → CONFORME
└── Audit B → In progress
```

Dans cette situation :

- la conformité courante de `Button@1.7.1` reste `CONFORME` ;
- le dashboard doit également indiquer qu'un nouvel Audit est en cours ;
- aucun verdict ne doit être anticipé pour l'Audit B.

Lorsque l'Audit B devient `Done + Closed`, son verdict devient alors le nouveau verdict courant.

**Statut : Supplanté par D-223**

---


> D-223 conserve le principe qu’un Audit incomplet ne modifie pas le verdict, mais le verdict acquis est désormais calculé selon D-222.

### D-049 — Séparer conformité courante et activité d'Audit en cours

Pour un couple `Composant × Version`, le dashboard doit pouvoir représenter simultanément :

- le verdict de conformité courant, issu du dernier Audit terminé ;
- l'existence éventuelle d'un nouvel Audit en cours sur ce même couple.

Ces deux informations sont indépendantes.

Exemple :

```text
Button@1.7.1
├── conformité courante : CONFORME
└── nouvel Audit : EN COURS
```

Le démarrage d'un nouvel Audit ne modifie pas le verdict courant. Ce verdict ne change que lorsque le nouvel Audit devient `Done + Closed` et produit à son tour un verdict.

L'information indiquant qu'un Audit est en cours doit être visible quelque part dans le dashboard pour le couple `Composant × Version`.

**Statut : Supplanté par D-222 et D-223**

---


> La distinction entre verdict courant et Audit en cours demeure, mais le verdict courant n’est plus issu du seul dernier Audit terminé.

### D-050 — Unicité de l'Audit non terminé par Composant et Version

Pour un même couple `Composant × Version`, il ne doit exister qu'une seule Issue d'Audit non terminée à la fois.

Un Audit est considéré comme terminé uniquement lorsque :

- `Project Status = Done` ;
- `GitHub Issue State = Closed`.

Par conséquent, la présence simultanée de plusieurs Issues d'Audit non terminées pour le même couple `Composant × Version` constitue une situation anormale à signaler.

La règle porte sur l'ensemble des Audits non terminés et pas uniquement sur ceux dont le statut est `In progress`.

**Statut : Établi**

---

### D-051 — Version auditée obligatoire

Toute Issue d'Audit doit cibler une Version effectivement auditée qui puisse être identifiée sans ambiguïté.

Cette exigence découle du modèle de conformité au niveau du couple `Composant × Version` : sans Version auditée identifiable, le verdict d'un Audit ne peut pas être correctement rattaché.

Une Issue d'Audit `Done + Closed` dont la Version effectivement auditée ne peut pas être déterminée constitue donc une donnée métier incomplète/anormale.

La Version auditée ne doit pas être déduite systématiquement du seul nom de la Milestone. En particulier, dans le fonctionnement pré-PROD déjà établi, la Milestone peut être `M.m.r` alors que la Version réellement auditée est une Release Candidate `M.m.r-rc.n`.

**Statut : Établi**

---

### D-052 — Milestone comme référence de Version et Version auditée dans le template

Pour une Issue d'Audit, la Milestone doit suffire pour identifier la Version de référence et le contexte d'Audit.

Les formes actuellement retenues sont :

- `M.m.r` pour l'Audit rattaché au cycle normal de la Version ;
- `M.m.r-Audit` pour l'Audit de rattrapage d'une Version déjà publiée.

Le suffixe `-Audit` reste configurable comme déjà établi.

L'Issue d'Audit contient également dans son template une information explicite :

```text
Version auditée : <version>
```

Cette information permet de conserver la Version effectivement testée, notamment lorsqu'elle est plus précise que la Milestone.

Exemple pré-PROD :

```text
Milestone       : 1.8.0
Version auditée : 1.8.0-rc.42
```

Exemple de rattrapage :

```text
Milestone       : 1.8.0-Audit
Version auditée : 1.8.0
```

La Milestone constitue donc le pivot de rattachement à la Version de référence, tandis que `Version auditée :` documente l'artefact/version effectivement soumis à l'Audit.

**Statut : Établi**

---

### D-053 — Cohérence entre Milestone et Version auditée

La `Version auditée` renseignée dans l'Issue d'Audit doit être cohérente avec la Version de référence portée par la Milestone.

La Version de référence est obtenue à partir de la Milestone, notamment en normalisant le suffixe de contexte d'Audit lorsqu'il existe.

Exemples cohérents :

```text
Milestone       : 1.8.0
Version auditée : 1.8.0-rc.42
```

```text
Milestone       : 1.8.0-Audit
Version auditée : 1.8.0
```

Exemple incohérent :

```text
Milestone       : 1.8.0
Version auditée : 1.9.0-rc.3
```

Une incohérence de Version entre ces deux informations constitue une anomalie de données à signaler.

La sévérité de cette future règle de qualité reste à définir.

**Statut : Établi**

---

### D-054 — Milestone prioritaire et Version auditée complémentaire

Pour l'analyse d'un Audit, la Milestone constitue la référence principale permettant d'identifier la Version de référence.

Le champ `Version auditée :` du template reste attendu afin de conserver la Version effectivement testée, mais son absence ne doit pas bloquer l'analyse lorsque la Milestone est exploitable.

Une Issue d'Audit `Done + Closed` avec une Milestone valide mais un champ `Version auditée :` vide constitue donc une anomalie de données partielle et non bloquante.

Dans ce cas :

- l'analyse peut continuer à partir de la Version de référence déduite de la Milestone ;
- l'absence du champ doit rester visible comme information manquante ;
- le pipeline ne doit pas prétendre connaître une Version effectivement auditée plus précise que ce que les données permettent d'établir.

Cette distinction est particulièrement importante en pré-PROD : une Milestone `1.8.0` permet de connaître la Version de référence, mais l'absence de `Version auditée :` peut empêcher de savoir quelle Release Candidate `1.8.0-rc.n` a réellement été auditée.

**Statut : Établi**

---

### D-055 — Milestone obligatoire et bloquante pour la conformité

Toute Issue d'Audit doit être rattachée à une Milestone exploitable.

La Milestone constitue la référence principale permettant d'identifier la Version de référence et le contexte de l'Audit. Son absence constitue donc une anomalie bloquante pour l'analyse de conformité, même lorsque le champ `Version auditée :` est renseigné.

Exemple :

```text
Milestone       : <absente>
Version auditée : 1.8.0
```

Dans ce cas, le pipeline ne doit pas utiliser le seul champ `Version auditée :` comme substitut à la Milestone pour produire un verdict de conformité `Composant × Version`.

La règle est asymétrique :

- Milestone valide + `Version auditée :` absente : Audit exploitable avec une donnée partielle non bloquante ;
- Milestone absente + `Version auditée :` renseignée : anomalie bloquante pour l'analyse de conformité.

**Statut : Établi**

---

### D-056 — Audit sans Milestone comptabilisé dans l'activité

Une Issue d'Audit `Done + Closed` sans Milestone reste comptabilisée dans les indicateurs d'activité d'Audit qui ne nécessitent pas de rattachement à une Version.

Elle reste en revanche exclue des calculs qui nécessitent un rattachement fiable au couple `Composant × Version`, notamment les calculs de conformité.

Exemple :

```text
Audit             : Done + Closed
Milestone         : <absente>

Activité d'Audit  : comptabilisée
Conformité        : exclue / bloquée
```

La validité d'une Issue d'Audit doit donc être appréciée en fonction de la métrique calculée et non comme une validité globale binaire de l'entité.

**Statut : Établi**

---

### D-057 — Un Audit n'est pas nécessairement requis à chaque Version

La publication d'une nouvelle Version de Librairie n'implique pas nécessairement qu'un nouvel Audit soit réalisé pour chacun de ses Composants.

Un Composant peut ne pas nécessiter de nouvel Audit lorsqu'il a déjà été audité sur une Version antérieure et qu'il n'a pas évolué depuis d'une manière nécessitant une nouvelle validation.

Par conséquent, la couverture d'Audit d'une Version ne doit pas être calculée naïvement comme :

```text
nombre de Composants audités directement sur la Version
/
nombre total de Composants de la Version
```

Exemple : si une Version `1.8.0` contient 20 Composants et que seuls 15 sont audités dans le cadre de `1.8.0`, il n'est pas possible de conclure automatiquement à une couverture de 75 %. Les 5 autres peuvent disposer d'un Audit antérieur encore pertinent.

Les règles permettant de déterminer qu'un Audit antérieur reste applicable à une Version ultérieure restent à définir.

**Statut : Établi sur le principe ; règle d'applicabilité à instruire**

---

### D-058 — Héritage d'un Audit lorsque le Composant est inchangé

Lorsqu'un Composant n'a pas changé entre deux Versions de Librairie, son Audit antérieur reste applicable à la Version suivante.

Exemple :

```text
Button@1.7.0
Audit : CONFORME

Button dans la Librairie 1.8.0
Évolution du Composant : aucune
→ l'Audit antérieur reste applicable
```

Cette applicabilité ne modifie pas l'historique du verdict d'Audit : le verdict reste rattaché au `Composant × Version` effectivement audité.

Il faut donc distinguer :

- le verdict historique obtenu lors de l'Audit ;
- la couverture héritée de ce verdict pour une Version ultérieure dans laquelle le Composant est inchangé.

Un nouvel Audit n'est pas requis du seul fait du changement de Version de la Librairie.

La manière de déterminer techniquement et fonctionnellement qu'un Composant est « inchangé » reste à préciser.

**Statut : Établi sur le principe**

---

### D-059 — État des lieux des Composants entre deux Versions

Le projet doit pouvoir produire un état des lieux des Composants entre deux Versions de Librairie.

Cet état des lieux distingue au minimum quatre situations :

- `NOUVEAU` : Composant présent dans la Version cible mais absent de la Version de référence ;
- `ÉVOLUÉ` : Composant présent dans les deux Versions et ayant subi des modifications ;
- `INCHANGÉ` : Composant présent dans les deux Versions sans modification détectée ;
- `DÉCOMMISSIONNÉ` : Composant présent dans la Version de référence mais absent de la Version cible.

La détection des évolutions pourra s'appuyer sur les modifications Git des fichiers appartenant aux Composants.

Cette fonctionnalité existe actuellement dans un script séparé et pourra être intégrée au projet.

**Statut : Établi sur le principe**

---

### D-060 — La décision d'ouvrir un Audit reste à la Squad

L'état des lieux entre deux Versions est une aide à la décision et non un moteur de décision automatique d'Audit.

Il permet notamment à la Squad d'identifier les Composants nouveaux et ceux qui ont évolué afin de décider des Issues d'Audit à créer.

Le pipeline ne doit pas déduire automatiquement qu'une Issue d'Audit doit être ouverte et ne doit pas créer cette Issue sur la seule base d'un état `NOUVEAU` ou `ÉVOLUÉ`.

La responsabilité de décider d'ouvrir ou non une Issue d'Audit reste à la Squad.

**Statut : Établi**

---

### D-061 — Comparaison des Composants reportée à une évolution ultérieure

La fonctionnalité de comparaison des Composants entre deux Versions est conservée dans l'architecture cible mais n'est pas à réaliser dans le périmètre immédiat.

L'architecture des repositories de Librairies n'est actuellement ni suffisamment stable ni suffisamment homogène pour retenir une convention de répertoires comme règle commune d'identification des Composants.

Une approche existante s'appuie sur la notion d'export. Cette approche constitue une piste pour la future fonctionnalité mais n'est pas encore érigée en règle du modèle.

**Statut : Établi**

---

### D-062 — Cible d'automatisation de la comparaison entre tags

À terme, le projet devra proposer un script ou traitement automatisé déclenché lors de la création d'un tag Git correspondant à une publication issue de `master` ou d'une branche `support/xxx`.

Le traitement cible devra :

- identifier le tag nouvellement créé ;
- déterminer le tag précédent pertinent selon les règles SemVer ;
- comparer les deux Versions afin d'établir l'état des lieux des Composants ;
- vérifier que cette comparaison n'a pas déjà été réalisée ;
- éviter de recalculer inutilement une comparaison déjà disponible ;
- permettre de forcer explicitement une nouvelle comparaison.

Les modalités techniques exactes du déclenchement GitHub, du stockage des résultats, de l'idempotence et du forçage restent à définir lors de l'implémentation de cette fonctionnalité.

**Statut : Cible établie ; implémentation ultérieure**

---

### D-063 — Restitution future des évolutions de Composants dans le Dashboard

Lorsque la comparaison entre Versions sera disponible, le Dashboard devra restituer les états des Composants (`NOUVEAU`, `ÉVOLUÉ`, `INCHANGÉ`, `DÉCOMMISSIONNÉ`) et faire ressortir les Composants pour lesquels un Audit devrait être envisagé.

Cette restitution constitue une aide à la décision de la Squad.

Elle ne remet pas en cause D-060 : la décision d'ouvrir effectivement une Issue d'Audit reste de la responsabilité de la Squad.

**Statut : Cible établie ; implémentation ultérieure**

---

### D-064 — Couverture d'Audit calculée sur le Catalogue de Composants

Pour une Version donnée, la couverture d'Audit est calculée par rapport au nombre total de Composants du Catalogue considéré.

La formule retenue est :

```text
Couverture d'Audit
=
nombre de Composants disposant d'un Audit applicable
/
nombre total de Composants du Catalogue
```

Exemple :

```text
Composants au Catalogue : 20
Composants audités       : 17

Couverture d'Audit = 17 / 20 = 85 %
```

À terme, les 17 Composants audités pourront inclure des Composants audités directement sur la Version courante ainsi que des Composants couverts par un Audit antérieur encore applicable.

Dans le fonctionnement actuel, la notion de Composant `NOUVEAU` ou `ÉVOLUÉ` non encore audité n'est pas requise pour calculer la couverture. Cette qualification sera apportée ultérieurement par la fonctionnalité de comparaison entre Versions.

**Statut : Établi**

---

### D-065 — Taux de conformité calculé uniquement sur les Composants audités

Le taux de conformité d'une Version est calculé uniquement parmi les Composants considérés comme audités pour cette Version.

La formule retenue est :

```text
Taux de conformité
=
nombre de Composants audités conformes
/
nombre de Composants audités
```

Exemple :

```text
Composants au Catalogue : 20
Composants audités       : 17
Composants conformes     : 14

Couverture d'Audit = 17 / 20
Taux de conformité = 14 / 17
```

Les Composants non audités ne doivent donc pas être comptabilisés comme non conformes.

**Statut : Établi**

---

### D-066 — Catalogue historique propre à chaque Version

Les indicateurs historiques d'une Version doivent utiliser le Catalogue de Composants applicable à cette Version et non le Catalogue courant.

L'ajout ou le retrait ultérieur d'un Composant ne doit donc pas modifier rétroactivement le dénominateur d'une couverture d'Audit historique.

Exemple :

```text
Version 1.7.0
Catalogue : 20 Composants

Version 1.8.0
+ DatePicker
Catalogue : 21 Composants
```

La couverture d'Audit de `1.7.0` continue d'être calculée sur 20 Composants, tandis que celle de `1.8.0` est calculée sur 21 Composants.

Le modèle doit donc pouvoir disposer conceptuellement d'une photographie du Catalogue applicable à chaque Version.

La manière de construire, stocker ou reconstituer techniquement cette photographie reste à définir.

**Statut : Établi**

---

### D-067 — Décommissionnement logique d'un Composant dans le Catalogue

Un Composant décommissionné ne doit pas être supprimé physiquement du Catalogue.

Le Catalogue conserve le Composant ainsi que l'information permettant d'identifier la Version à partir de laquelle il a été décommissionné.

Exemple :

```text
Composant                  : OldSelect
Version de décommissionnement : 1.8.0
```

Dans cet exemple :

- `OldSelect` reste présent dans le périmètre historique des Versions antérieures où il existait, notamment `1.7.0` ;
- `OldSelect` n'entre plus dans le Catalogue actif de `1.8.0` ;
- il est donc exclu du dénominateur de couverture d'Audit de `1.8.0` et des Versions ultérieures tant qu'il reste décommissionné ;
- son historique, notamment ses Audits et ses anciens états de conformité, reste conservé.

Le décommissionnement est donc une suppression logique et non une suppression de l'historique métier.

**Statut : Établi**

---

### D-068 — Réactivation exceptionnelle d'un Composant explicitée dans le Catalogue

La réapparition d'un Composant précédemment décommissionné est considérée comme un cas exceptionnel qui ne devrait normalement pas se produire.

Si ce cas survient, la réactivation ne doit pas être déduite automatiquement de la seule réapparition d'un nom ou d'un export.

Elle doit être indiquée explicitement dans le Catalogue afin de rendre visible le changement de situation du Composant et de préserver son historique.

Le mécanisme exact de représentation de cette réactivation dans le Catalogue reste à définir.

**Statut : Principe établi ; représentation à instruire**

---

### D-069 — Distinguer Audit réalisé sur une Version et couverture héritée

Un Composant ne doit jamais être présenté comme ayant été audité sur une Version si aucun Audit n'a effectivement été réalisé sur cette Version.

Lorsqu'un Audit antérieur reste applicable à une Version ultérieure parce que le Composant est inchangé, il s'agit d'une **couverture héritée par un Audit applicable**, et non d'un Audit réalisé sur la Version ultérieure.

Exemple :

```text
Button@1.7.0
Audit réalisé → NON CONFORME
        │
        └── Button inchangé en 1.8.0
                    ↓
Button@1.8.0
aucun Audit réalisé en 1.8.0
mais verdict antérieur toujours applicable
→ NON CONFORME
```

Le verdict hérité reste applicable tant qu'aucun nouvel Audit ne produit un nouveau verdict pour le Composant.

Les indicateurs et le Dashboard doivent préserver cette distinction afin de ne pas créer un historique d'Audit fictif.

**Statut : Établi**

---

### D-070 — La couverture peut inclure un verdict antérieur non conforme

Un Composant couvert par un Audit antérieur encore applicable participe à la couverture d'Audit de la Version courante, même si le verdict applicable est `NON CONFORME`.

La couverture mesure donc l'existence d'un verdict d'Audit applicable, et non la conformité du Composant.

La conformité est calculée séparément à partir des verdicts applicables.

Il convient, lorsque le contexte peut être ambigu, de privilégier le libellé **« Composants couverts par un Audit applicable »** plutôt que **« Composants audités dans la Version »**.

**Statut : Établi**

---

### D-071 — Héritage transitif d'un verdict d'Audit applicable

Un verdict d'Audit antérieur peut rester applicable à plusieurs Versions successives sans limite prédéfinie du nombre de Versions traversées.

Cette propagation reste valable tant que :

- le Composant reste inchangé entre les Versions concernées ;
- aucun nouvel Audit terminé ne produit un nouveau verdict applicable au Composant.

Cette règle s'applique notamment à un verdict `NON CONFORME`.

Exemple :

```text
Button@1.7.0
Audit réalisé → NON CONFORME
        │
        ├── inchangé en 1.8.0
        │       → verdict applicable : NON CONFORME
        │
        └── inchangé en 1.9.0
                → verdict applicable : NON CONFORME
```

Aucun Audit ne doit être inventé pour `1.8.0` ou `1.9.0`. Le verdict applicable conserve comme origine l'Audit effectivement réalisé sur `1.7.0`.

Un nouvel Audit terminé remplace ce verdict pour le périmètre auquel son nouveau verdict est applicable.

**Statut : Établi**

---

### D-072 — Une évolution de Composant ne rompt pas automatiquement le verdict applicable

Le fait qu'un Composant ait évolué entre deux Versions ne signifie pas automatiquement qu'un nouvel Audit est nécessaire et ne doit pas, à lui seul, invalider le dernier verdict de conformité applicable.

Une modification peut ne pas affecter le périmètre couvert par l'Audit, notamment le périmètre d'accessibilité concerné.

Exemple :

```text
Button@1.7.0
Audit → CONFORME
        │
        └── Button évolue en 1.8.0
                    ↓
        la modification doit être qualifiée
                    ↓
        elle peut être sans impact sur le périmètre d'Audit
                    ↓
        verdict applicable : CONFORME
```

Le pipeline ne doit donc pas transformer automatiquement un Composant `ÉVOLUÉ` en `NON AUDITÉ`.

**Statut : Établi**

---

### D-073 — Qualification par la Squad de l'impact d'une évolution sur le besoin d'Audit

Le suivi du patrimoine doit permettre à la Squad d'examiner les Composants ayant évolué et d'indiquer explicitement lorsqu'une évolution n'impacte pas le périmètre nécessitant un nouvel Audit.

Dans ce cas, le Composant peut être marqué comme n'étant pas éligible à un nouvel Audit pour cette évolution, sans remettre en cause le verdict de conformité applicable.

Cette qualification reste une décision de la Squad et ne doit pas être déduite automatiquement de la seule analyse Git.

La terminologie exacte et les valeurs du statut de qualification restent à définir.

**Statut : Principe établi ; modèle de qualification à instruire**

---

### D-074 — Page cible de suivi du patrimoine pour la Squad

Le Dashboard devra à terme proposer une page dédiée au suivi du patrimoine des Composants.

Cette page devra notamment permettre de :

- visualiser les Composants `NOUVEAU`, `ÉVOLUÉ`, `INCHANGÉ` et `DÉCOMMISSIONNÉ` lorsque la comparaison entre Versions sera disponible ;
- faire ressortir les Composants dont l'évolution doit être examinée par la Squad ;
- enregistrer ou restituer la qualification indiquant qu'une évolution n'impacte pas le périmètre nécessitant un Audit ;
- distinguer cette information du verdict de conformité du Composant.

Cette page est une aide au pilotage et ne décide pas automatiquement de la création d'une Issue d'Audit.

**Statut : Cible établie ; implémentation ultérieure**

---

### D-075 — États de qualification d'une évolution vis-à-vis d'un Audit

Pour un Composant détecté comme `ÉVOLUÉ`, le suivi du patrimoine utilise trois états de qualification du besoin d'Audit :

- `À ÉVALUER` ;
- `AUDIT À FAIRE` ;
- `AUDIT NON NÉCESSAIRE`.

Lorsqu'une évolution est détectée automatiquement, la qualification initiale est `À ÉVALUER`.

Le passage vers `AUDIT À FAIRE` ou `AUDIT NON NÉCESSAIRE` résulte d'une décision de la Squad.

Ces états sont distincts de l'état patrimonial du Composant (`NOUVEAU`, `ÉVOLUÉ`, `INCHANGÉ`, `DÉCOMMISSIONNÉ`) et du verdict de conformité (`CONFORME`, `NON CONFORME`, etc.).

Exemple :

```text
Button@1.8.0

État patrimoine        : ÉVOLUÉ
Qualification Audit    : À ÉVALUER
Verdict applicable     : CONFORME

Après analyse de la Squad :

État patrimoine        : ÉVOLUÉ
Qualification Audit    : AUDIT NON NÉCESSAIRE
Verdict applicable     : CONFORME
```

Le pipeline ne doit pas décider automatiquement entre `AUDIT À FAIRE` et `AUDIT NON NÉCESSAIRE`.

**Statut : Établi**

---

### D-076 — Un nouveau Composant doit être audité avant sa mise à disposition

En cible métier, un Composant `NOUVEAU` doit être audité avant sa mise à disposition.

L'Audit devrait donc être réalisé pendant la mise au point de la Version dans laquelle le Composant est introduit.

Si la Version de sortie est mise à disposition alors que l'Audit du nouveau Composant n'a pas été réalisé, le suivi du patrimoine doit qualifier ce Composant en `AUDIT À FAIRE`.

Contrairement à un Composant simplement `ÉVOLUÉ`, un Composant `NOUVEAU` sans Audit ne doit donc pas être initialisé à `À ÉVALUER`.

Exemple :

```text
DatePicker
État patrimoine : NOUVEAU
        │
        ├── Audit réalisé pendant la mise au point
        │       → pas d'Audit restant à faire pour sa sortie
        │
        └── Audit non réalisé à la mise à disposition
                → Qualification Audit : AUDIT À FAIRE
```

Cette règle exprime le processus cible. Elle ne doit pas conduire le pipeline à inventer un Audit qui n'aurait pas été réalisé.

**Statut : Établi, avec objectif de processus**

---

### D-077 — État `AUDIT RÉALISÉ` dans le suivi du patrimoine

Le suivi du patrimoine peut utiliser l'état `AUDIT RÉALISÉ` afin d'indiquer explicitement qu'un Audit attendu a effectivement été effectué.

Les qualifications du suivi du besoin d'Audit deviennent ainsi :

- `À ÉVALUER` ;
- `AUDIT À FAIRE` ;
- `AUDIT NON NÉCESSAIRE` ;
- `AUDIT RÉALISÉ`.

`AUDIT RÉALISÉ` décrit la réalisation de l'activité d'Audit. Il ne constitue pas un verdict de conformité.

**Statut : Établi**

---

### D-078 — Le verdict de conformité prime dans la restitution qualité

L'information essentielle pour la qualité d'un Composant reste le verdict de conformité issu de l'Audit applicable.

Il faut donc distinguer :

```text
Qualification / activité : AUDIT RÉALISÉ
Verdict qualité          : CONFORME ou NON CONFORME
```

Un Composant peut notamment être :

```text
AUDIT RÉALISÉ + CONFORME
```

ou :

```text
AUDIT RÉALISÉ + NON CONFORME
```

Le Dashboard ne doit jamais utiliser `AUDIT RÉALISÉ` comme synonyme de `CONFORME`.

Dans les restitutions orientées qualité, le verdict de conformité doit être mis en avant par rapport au simple fait que l'Audit a été réalisé.

**Statut : Établi**

---

### D-079 — Les corrections ne remplacent pas le verdict de conformité

Lorsqu'un Composant a un verdict applicable `NON CONFORME`, la correction de tout ou partie des Anomalies connues ne suffit pas à rendre le Composant `CONFORME`.

Le verdict reste `NON CONFORME` jusqu'à ce qu'un nouvel Audit terminé confirme explicitement la conformité, y compris lorsque toutes les Anomalies connues ont été traitées.

**Statut : Établi**

---

### D-080 — Taux de traitement des Anomalies distinct du verdict

Pour un Composant `NON CONFORME`, le Dashboard doit pouvoir afficher un marqueur indiquant le taux de traitement des Anomalies associées au verdict applicable.

Ce taux décrit l'avancement du traitement et ne constitue pas un taux de conformité.

Même à `100 %` d'Anomalies traitées, le verdict reste `NON CONFORME` tant qu'un nouvel Audit terminé n'a pas conclu `CONFORME`.

Une Anomalie entre dans le numérateur des Anomalies traitées lorsqu'elle satisfait la règle D-081 : `Project Status = Done` et `GitHub Issue State = Closed`.

**Statut : Établi**

---

### D-081 — Une Anomalie est traitée lorsqu'elle est Done et Closed

Pour le calcul du taux de traitement des Anomalies, une Anomalie est considérée comme traitée uniquement lorsque les deux conditions suivantes sont satisfaites :

```text
Project Status = Done
AND
GitHub Issue State = Closed
```

Cette définition consolide un principe déjà abordé dans les questions relatives à la fermeture et au traitement des Anomalies.

Elle permet de disposer d'une règle explicite et homogène pour le calcul du taux de traitement, sans confondre une Anomalie simplement avancée dans le workflow avec une Anomalie effectivement terminée.

**Statut : Établi**

---

### D-082 — Le suivi du traitement porte sur le stock historique d'Anomalies du Composant

Le suivi du traitement d'un Composant doit prendre en compte toutes ses Anomalies historiques tant qu'elles ne satisfont pas la règle D-081 (`Project Status = Done` et `GitHub Issue State = Closed`).

Le périmètre n'est donc pas limité aux Anomalies créées par l'Audit ayant produit le verdict de conformité courant.

Une Anomalie ancienne reste dans le stock restant à traiter jusqu'à son traitement effectif. Lorsqu'elle devient traitée, elle sort du stock restant mais demeure conservée dans l'historique.

Cette règle permet au Dashboard de restituer à la fois l'avancement global du traitement et le stock d'Anomalies historiques encore non traitées.

**Statut : Établi**

---

### D-083 — Taux historique de traitement des Anomalies d'un Composant

Le taux de traitement des Anomalies d'un Composant est calculé sur l'ensemble des Anomalies historiquement détectées pour ce Composant.

```text
Taux de traitement
=
nombre d'Anomalies historiquement détectées et traitées
-------------------------------------------------------
nombre total d'Anomalies historiquement détectées
```

Une Anomalie est traitée selon D-081 :

```text
Project Status = Done
AND
GitHub Issue State = Closed
```

Exemple :

```text
10 Anomalies historiquement détectées
8 traitées
2 non traitées

Taux de traitement = 8 / 10 = 80 %
```

Le taux reste distinct du verdict de conformité.

**Statut : Établi**

---

### D-084 — Affichage du stock restant d'Anomalies

En complément du taux de traitement, le Dashboard doit afficher le nombre absolu d'Anomalies historiques du Composant restant à traiter.

Exemple :

```text
Taux d'Anomalies traitées : 80 %
Stock restant             : 2
```

Le stock restant correspond aux Anomalies qui ne satisfont pas encore la règle D-081.

**Statut : Établi**

---

### D-085 — Répartition du stock restant par criticité RGAA

Pour les Anomalies d'Audit d'accessibilité disposant de la criticité RGAA actuelle, le Dashboard doit pouvoir ventiler le stock restant selon les niveaux :

- `🚦 rgaa:bloquante` ;
- `🚦 rgaa:majeure` ;
- `🚦 rgaa:mineure`.

Exemple :

```text
Stock restant : 5
├── bloquantes : 1
├── majeures   : 3
└── mineures   : 1
```

Cette ventilation porte sur les Anomalies non traitées et complète le taux global de traitement.

Elle ne change pas le verdict de conformité.

**Statut : Établi**

---

### D-086 — Taux de traitement par criticité RGAA

Pour les Anomalies d'accessibilité disposant d'une criticité RGAA, le Dashboard doit calculer et afficher un taux de traitement propre à chaque niveau de criticité.

Pour une criticité donnée :

```text
Taux de traitement de la criticité
=
nombre d'Anomalies historiques de cette criticité traitées
-----------------------------------------------------------
nombre total d'Anomalies historiques de cette criticité
```

Exemple :

```text
🚦 rgaa:bloquante : 100 % (3/3) — stock restant : 0
🚦 rgaa:majeure   :  75 % (6/8) — stock restant : 2
🚦 rgaa:mineure   :  40 % (2/5) — stock restant : 3
```

Cette lecture complète le taux global du Composant et la répartition du stock restant.

Un taux de `100 %` pour une criticité signifie que toutes les Anomalies historiquement détectées à ce niveau sont traitées selon D-081. Il ne constitue pas un verdict de conformité.

**Statut : Établi**

---

### D-087 — Agrégation du suivi des Anomalies au niveau de la Librairie

Les indicateurs de traitement définis au niveau du Composant doivent également être calculés au niveau de la Librairie, en agrégeant les Anomalies historiques des Composants appartenant à cette Librairie.

La restitution au niveau Librairie doit inclure :

- le nombre total d'Anomalies historiquement détectées ;
- le nombre d'Anomalies traitées selon D-081 ;
- le stock restant ;
- le taux global de traitement ;
- la répartition du stock restant par criticité RGAA ;
- le taux de traitement propre à chaque criticité RGAA.

Exemple :

```text
Design System React

Anomalies historiques : 250
Anomalies traitées     : 220
Stock restant          : 30
Taux de traitement     : 88 %
```

La restitution doit permettre de descendre vers les Composants contribuant au stock restant.

Cette agrégation d'Anomalies ne crée pas à elle seule un verdict unique de conformité de la Librairie : les verdicts de conformité restent attachés aux Composants et aux Versions selon les règles établies.

**Statut : Établi**

---

### D-088 — Vue latest : stock historique pertinent du patrimoine actif

Dans la vue `latest` d'une Librairie, les indicateurs de traitement doivent tenir compte des Anomalies historiques encore non traitées des Composants appartenant au patrimoine actif de la dernière Version.

Les Composants décommissionnés dans la Version `latest` sont exclus du stock courant de cette vue.

Une Anomalie détectée sur une Version antérieure peut donc continuer à contribuer au stock `latest` si :

- elle n'est pas traitée selon D-081 ;
- le Composant concerné appartient toujours au patrimoine actif de la Version `latest`.

Cette règle évite de faire disparaître une dette historique toujours pertinente tout en évitant de polluer le pilotage courant avec la dette de Composants désormais décommissionnés.

**Statut : Établi**

---

### D-089 — Consultation des indicateurs par Version de Librairie

Le Dashboard doit permettre de consulter les indicateurs de traitement pour une Version donnée de la Librairie, en plus de la vue `latest`.

La vue d'une Version doit s'appuyer sur le Catalogue historique propre à cette Version conformément à D-066 et D-067.

Un Composant aujourd'hui décommissionné peut donc rester visible dans une ancienne Version lorsqu'il appartenait au Catalogue actif de cette Version.

Exemple :

```text
Design System React 1.7.0
└── OldSelect : présent dans le patrimoine de 1.7.0

Design System React 1.8.0 / latest
└── OldSelect : décommissionné, exclu du patrimoine actif courant
```

La vue par Version doit préserver la lecture historique sans réécrire le passé à partir de l'état actuel du Catalogue.

**Statut : Établi**

---

### D-090 — Une vue historique de Version restitue l'état à sa date de sortie

Lorsqu'une ancienne Version de Librairie est consultée, les indicateurs doivent restituer l'état historique des Anomalies au moment de la sortie de cette Version.

Une évolution ultérieure de l'Anomalie ne doit pas réécrire les indicateurs historiques de cette Version.

Exemple :

```text
Sortie de 1.7.0
Anomalie A : non traitée

Quelques mois plus tard
Anomalie A : traitée

Consultation actuelle de la vue 1.7.0
Anomalie A : non traitée
```

La vue historique doit donc utiliser les informations telles qu'elles étaient connues à la date de mise à disposition de la Version.

La vue `latest`, à l'inverse, sert au pilotage de l'état courant du patrimoine actif.

**Statut : Établi**

---

### D-091 — La photographie d'une Version PROD reste immuable après sa sortie

Une fois une Version PROD sortie, sa photographie historique ne doit plus évoluer.

Une Anomalie non traitée au moment de la sortie reste donc `NON TRAITÉE` dans la vue historique de cette Version, même si elle est corrigée ultérieurement sans nouvelle publication PROD.

Cette immutabilité concerne les indicateurs historiques de la Version et évite de réécrire a posteriori son niveau de qualité observé à sa sortie.

**Statut : Établi**

---

### D-092 — Une Milestone de Version PROD close ne reçoit pas rétroactivement de nouvelles Anomalies

Lorsqu'une Version PROD est sortie et que sa Milestone correspondante est figée et close, une Anomalie découverte ou créée ultérieurement ne doit pas être rattachée rétroactivement à cette Milestone.

Exemple :

```text
Milestone 1.7.0
→ Version publiée
→ Milestone close

Puis découverte d'une nouvelle Anomalie
→ ne pas rattacher cette Anomalie à la Milestone 1.7.0
```

Le fait qu'une Anomalie puisse concerner fonctionnellement du code déjà présent dans une ancienne Version ne signifie donc pas qu'elle appartient à la Milestone historique de cette Version.

Il faut distinguer :

- le rattachement de planification/livraison matérialisé par la Milestone ;
- l'éventuelle connaissance des Versions affectées par une Anomalie.

La manière de déterminer et de représenter les Versions affectées reste à instruire.

**Statut : Établi**

---

### D-093 — Une Milestone d'Audit post-PROD porte le contexte de la Version affectée

Lorsqu'un Audit est réalisé après la publication d'une Version PROD, la Milestone d'Audit de la forme `M.m.r-Audit` porte le contexte de la Version PROD auditée.

Exemple :

```text
Milestone PROD
1.7.0
→ close et figée

Audit post-PROD
1.7.0-Audit
→ version de référence normalisée : 1.7.0
```

Les Anomalies découvertes dans cet Audit concernent donc la Version `1.7.0`, sans qu'il soit nécessaire ni souhaitable de les rattacher rétroactivement à la Milestone PROD `1.7.0`.

Cette règle complète la distinction déjà établie entre :

- la Milestone PROD, qui reste figée ;
- la Milestone d'Audit post-PROD, qui fournit le contexte de la Version auditée ;
- la Milestone ultérieure utilisée pour planifier la correction de l'Anomalie.

Elle s'applique aux Anomalies issues d'un Audit post-PROD. Le mécanisme permettant d'identifier les Versions affectées pour une Anomalie découverte hors Audit reste à instruire.

**Statut : Établi**

---

### D-094 — Un Bug hors périmètre accessibilité renseigne obligatoirement sa Version affectée dans sa description

Pour un Bug découvert en dehors du périmètre des Audits d'accessibilité, l'information permettant d'identifier la Version affectée doit obligatoirement être renseignée dans la description de l'Issue.

Cette information est distincte de la Milestone de l'Issue.

La description permet d'exprimer la Version dans laquelle le défaut est constaté, tandis que la Milestone peut être utilisée pour le contexte de planification ou de livraison de sa correction.

Le format exact de l'information dans la description n'est pas encore défini et ne doit pas être supposé.

**Statut : Établi**

---

### D-095 — Un Bug hors accessibilité peut affecter plusieurs Versions

Pour un Bug hors périmètre des Audits d'accessibilité, le modèle doit permettre d'identifier une ou plusieurs Versions affectées.

Le cas attendu le plus fréquent reste toutefois une seule Version, car la remontée est généralement faite dans un contexte d'usage précis et indique la Version utilisée par le client au moment où le défaut est constaté.

Exemple courant :

```text
Bug remonté par un client
└── Version utilisée : 1.7.1
    └── Version affectée connue : 1.7.1
```

Cas possible mais plus rare :

```text
Bug
└── Versions affectées explicitement identifiées
    ├── 1.6.0
    ├── 1.7.0
    └── 1.7.1
```

Le pipeline ne doit pas déduire automatiquement qu'une Version antérieure est affectée au seul motif qu'un défaut est constaté sur une Version plus récente.

Seules les Versions effectivement identifiées comme affectées doivent être enregistrées.

**Statut : Établi**

---

### D-096 — Distinguer Version observée et Version affectée pour une remontée client

Lorsqu'un client remonte un Bug hors périmètre des Audits d'accessibilité, la Version qu'il utilise au moment du constat est d'abord une **Version observée**.

Elle ne doit pas être considérée immédiatement comme une **Version affectée**.

La Squad doit analyser la remontée afin de déterminer si le défaut provient réellement du Design System ou de son utilisation par l'application consommatrice.

```text
Remontée client sur 1.7.1
        │
        ▼
Version observée : 1.7.1
        │
        ▼
Analyse par la Squad
        │
        ├── défaut du Design System
        │       └── 1.7.1 peut être qualifiée comme Version affectée
        │
        └── erreur d'implémentation côté client
                └── ne pas qualifier 1.7.1 comme Version affectée
```

Cette distinction évite d'attribuer au Design System une anomalie provenant en réalité de l'intégration du Composant par le client.

**Statut : Établi**

---

### D-097 — Une erreur d'implémentation client impose l'état Cancelled

Après analyse d'une remontée, si la Squad conclut que le problème provient uniquement d'une erreur d'implémentation du Composant par le client et non d'un défaut du Design System, l'Issue doit obligatoirement passer au statut `Cancelled`.

Dans ce cas :

- la Version utilisée par le client reste une `Version observée` ;
- elle ne doit pas être qualifiée comme `Version affectée` sur la seule base de cette remontée ;
- l'Issue reste dans l'historique de la remontée et de sa qualification ;
- elle ne représente pas une Anomalie confirmée du Design System.

Cette règle est une règle de workflow obligatoire.

**Statut : Établi**

---

### D-098 — Suivre séparément les erreurs d'intégration client dans la vue Squad

Les Issues passées à `Cancelled` parce que la Squad a confirmé une erreur d'implémentation côté client doivent être suivies dans les éléments de pilotage destinés à la Squad.

Elles ne doivent pas être comptabilisées comme des Anomalies confirmées du Design System et ne doivent donc pas dégrader les indicateurs de qualité intrinsèque du Design System.

Elles constituent en revanche un signal sur l'expérience d'intégration des consommateurs et peuvent conduire la Squad à mener des actions telles que :

- améliorer la documentation ;
- renforcer la formation ;
- améliorer l'accompagnement des consommateurs ;
- identifier plus largement des difficultés récurrentes d'utilisation ou d'intégration.

Le Dashboard doit donc conserver une lecture distincte entre :

```text
Qualité du Design System
└── Anomalies confirmées du Design System

Pilotage Squad / expérience d'intégration
└── remontées Cancelled pour erreur d'implémentation client
```

**Statut : Établi**

---

### D-099 — Ventiler les erreurs d'intégration client par Composant

Dans la vue de pilotage destinée à la Squad, les Issues `Cancelled` parce qu'elles correspondent à une erreur d'implémentation côté client doivent pouvoir être regroupées et comptabilisées par Composant.

Exemple :

```text
Erreurs d'intégration client par Composant

DatePicker : 12
Select     : 8
Modal      : 2
```

Cette ventilation doit permettre d'identifier les Composants qui génèrent le plus de difficultés d'intégration chez les consommateurs et d'orienter les actions de la Squad, notamment sur :

- la documentation ;
- la formation ;
- l'accompagnement ;
- la facilité d'utilisation et d'intégration.

Cet indicateur reste distinct des indicateurs d'Anomalies confirmées et ne constitue pas, à lui seul, une mesure de défaut ou de non-conformité du Composant.

**Statut : Établi**

---

### D-100 — Mettre en perspective les Issues d'un Composant avec son niveau d'usage

Le modèle analytique cible doit permettre de mettre en perspective les volumes d'Issues et de remontées d'un Composant avec son niveau réel d'utilisation dans les applications consommatrices.

Cette mise en perspective doit notamment éviter de considérer qu'un Composant est plus problématique uniquement parce qu'il génère davantage d'Issues alors qu'il est aussi beaucoup plus utilisé.

Les ratios exacts restent à définir.

**Statut : Établi pour le besoin analytique cible ; implémentation différée**

---

### D-101 — Mesurer le nombre total d'Issues par Composant

Le Dashboard cible doit permettre de connaître, pour chaque Composant, le nombre total d'Issues qui lui sont rattachées, tous types d'Issue confondus.

Cette mesure est distincte des indicateurs spécialisés sur les Anomalies, Audits, Improvements ou erreurs d'intégration client.

**Statut : Établi**

---

### D-102 — Mesurer le nombre d'applications utilisatrices d'un Composant

Pour chaque Composant, le Dashboard cible doit permettre de connaître le nombre d'applications consommatrices qui déclarent ou utilisent ce Composant au moins une fois.

Une application ne compte qu'une fois dans cet indicateur, quel que soit le nombre d'occurrences du Composant dans cette application.

**Statut : Établi pour le besoin cible ; détection des usages différée**

---

### D-103 — Mesurer les occurrences d'un Composant par application et globalement

Le Dashboard cible doit distinguer :

- le nombre d'occurrences/déclarations d'un Composant dans chaque application utilisatrice ;
- la somme de ces occurrences sur l'ensemble des applications utilisatrices.

Exemple :

```text
Button
├── Application A : 3 occurrences
├── Application B : 10 occurrences
└── Total          : 13 occurrences

Applications utilisatrices : 2
```

Le dénombrement exact et sa méthode de détection seront traités ultérieurement.

**Statut : Établi pour le besoin cible ; implémentation différée**

---

### D-104 — Ne pas figer immédiatement les ratios d'usage comme KPI définitifs

Les ratios construits à partir des Issues et des données d'usage des Composants doivent d'abord être considérés comme des **indicateurs candidats à instruire**.

Aucun de ces ratios ne doit être retenu à ce stade comme KPI définitif de qualité ou de comparaison entre Composants.

Leur définition, leur interprétation, leurs biais éventuels et leur utilité pour les différents usages du Dashboard devront être instruits avant validation.

**Statut : Établi**

---

### D-105 — Instruire en priorité le ratio Issues / occurrences globales

Parmi les ratios candidats, le ratio suivant est considéré comme particulièrement intéressant à instruire en premier :

```text
nombre total d'Issues du Composant
----------------------------------
nombre total d'occurrences du Composant
dans l'ensemble des applications utilisatrices
```

Ce ratio vise à mettre le volume d'Issues en perspective avec l'intensité globale d'utilisation du Composant.

Il est considéré, à ce stade, comme potentiellement plus pertinent que le seul ratio `Issues / applications utilisatrices`, sans pour autant être encore validé comme KPI définitif.

**Statut : Orientation établie — ratio à instruire**

---

### D-106 — Conserver Issues / applications utilisatrices comme ratio candidat

Le ratio suivant reste également pertinent à instruire :

```text
nombre total d'Issues du Composant
----------------------------------
nombre d'applications utilisatrices du Composant
```

Il apporte une lecture différente du ratio par occurrences : il rapporte les Issues au nombre de consommateurs distincts plutôt qu'au volume total d'utilisation.

Il reste un ratio candidat et n'est pas encore validé comme KPI définitif.

**Statut : Ratio candidat à instruire**

---

### D-107 — Le label Composant est obligatoire pour toute Issue concernant un Composant

Toute Issue qui concerne effectivement un Composant doit obligatoirement porter le label correspondant `🧩 Component:xxx`, quel que soit son Issue Type.

Cette règle s'applique donc notamment aux `Bug`, `Feature`, `Task` et aux autres types d'Issue dès lors qu'ils concernent un Composant.

Le label Composant constitue le mécanisme métier commun permettant de rattacher l'Issue au Composant et d'alimenter les indicateurs par Composant, notamment le nombre total d'Issues tous types confondus.

Cette règle ne signifie pas que toute Issue du Repository doit obligatoirement être rattachée à un Composant : certaines Issues peuvent être transverses. La qualification des cas où l'absence de label Composant est légitime reste à instruire.

**Statut : Établi**

---

### D-108 — Une Issue multi-Composants porte tous les labels Composant concernés

Lorsqu'une même Issue concerne effectivement plusieurs Composants, elle doit porter un label `🧩 Component:xxx` pour chacun des Composants concernés.

Exemple :

```text
Issue transverse à Button et Modal
├── 🧩 Component:Button
└── 🧩 Component:Modal
```

L'Issue doit alors être rattachée à chacun de ces Composants dans les analyses par Composant.

**Statut : Établi**

---

### D-109 — Privilégier une Issue distincte par Composant

Même si une Issue multi-Composants est autorisée, la pratique à privilégier est de créer une Issue distincte pour chaque Composant lorsque le travail peut être séparé.

Cette préférence vise notamment à permettre :

- un traitement indépendant de chaque Composant ;
- une PR distincte pour chaque Composant ;
- une traçabilité plus précise entre Issue, Composant et PR ;
- un suivi plus fin de l'avancement et de la résolution.

Cette pratique est une orientation de gouvernance et n'est pas, à ce stade, une règle obligatoire.

**Statut : Orientation établie — non obligatoire**

---

### D-110 — Une Issue multi-Composants compte une fois pour chaque Composant concerné

Lorsqu'une Issue porte plusieurs labels `🧩 Component:xxx`, elle doit être comptabilisée une fois dans les indicateurs de chacun des Composants auxquels elle est rattachée.

Exemple :

```text
Issue #123
├── 🧩 Component:Button
└── 🧩 Component:Modal

Indicateurs par Composant :
Button : +1 Issue
Modal  : +1 Issue
```

Cette règle concerne les agrégations par Composant.

L'Issue reste néanmoins une seule Issue GitHub. Les totaux par Composant ne doivent donc pas être additionnés naïvement pour calculer un total global au niveau Repository ou Bibliothèque, car une Issue multi-Composants serait alors comptée plusieurs fois.

**Statut : Établi**

---

### D-111 — Distinguer les différents comptages d'Issues au niveau Bibliothèque

Au niveau d'une Bibliothèque, le Dashboard doit fournir plusieurs lectures complémentaires des Issues.

#### Total global

Le nombre total d'Issues de la Bibliothèque correspond au nombre d'Issues GitHub distinctes, tous types confondus, qu'elles soient rattachées ou non à un Composant.

Une Issue multi-Composants ne compte donc qu'une seule fois dans ce total.

#### Issues rattachées aux Composants

Le Dashboard doit également permettre de distinguer les Issues selon les Composants auxquels elles sont rattachées.

Une Issue multi-Composants est alors comptabilisée une fois pour chacun de ses Composants conformément à D-110.

La somme des compteurs par Composant peut donc être supérieure au nombre d'Issues GitHub distinctes rattachées à au moins un Composant.

#### Issues sans Composant

Le Dashboard doit également rendre visible le nombre d'Issues qui ne portent aucun label `🧩 Component:xxx`.

Cette mesure est distincte du total global et de la ventilation par Composant. L'absence de Composant ne constitue pas automatiquement une erreur de données tant que les cas d'Issues légitimement transverses ne sont pas entièrement définis.

Exemple :

```text
Bibliothèque
├── Issues totales distinctes : 100
├── Issues avec au moins un Composant : 85
├── Issues sans Composant : 15
└── Ventilation par Composant
    ├── Button : 30
    ├── Modal  : 20
    └── ...
```

La somme de la ventilation par Composant n'est pas destinée à reconstituer le total global.

**Statut : Établi**

---

### D-112 — Une Issue sans Composant peut être légitimement transverse

Une Issue peut légitimement ne porter aucun label `🧩 Component:xxx` lorsqu'elle est transverse et ne concerne effectivement aucun Composant.

L'absence de label Composant ne constitue donc pas, à elle seule, une erreur de qualité des données.

Le Dashboard doit permettre de rendre visibles les Issues sans Composant sans les qualifier automatiquement comme invalides.

**Statut : Établi**

---

### D-113 — Ne pas déduire automatiquement qu'un label Composant est manquant

À partir de la seule absence de label `🧩 Component:xxx`, le pipeline ne peut pas déterminer de manière fiable si une Issue est légitimement transverse ou si son rattachement à un Composant a été oublié.

Une éventuelle détection de `Composant manquant suspecté` pourra être instruite ultérieurement à partir de signaux complémentaires, par exemple :

- mention explicite d'un Composant dans le titre ou la description ;
- relation avec un Audit portant un Composant ;
- relation avec une PR dont les changements concernent un Composant ;
- autres informations structurées permettant de rapprocher l'Issue d'un Composant.

Ces mécanismes seraient des aides à la qualification et ne doivent pas, sans règle fiable, transformer automatiquement une Issue sans Composant en erreur.

**Statut : Principe établi — mécanisme de détection à instruire**

---

### D-114 — Ne pas imposer de label dédié aux Issues sans Composant

Une Issue sans label `🧩 Component:xxx` n'a pas besoin d'un label spécifique permettant de la qualifier comme `transverse`.

Elle conserve son Issue Type ainsi qu'un ou plusieurs autres labels, qui constituent des dimensions d'analyse exploitables.

L'absence de label Composant est donc elle-même une caractéristique observable de l'Issue, sans qu'il soit nécessaire d'introduire un nouveau vocabulaire de label uniquement pour ce cas.

**Statut : Établi**

---

### D-115 — Prévoir une page d'analyse dynamique des Issues

Le Dashboard doit prévoir une page permettant d'analyser les Issues de manière dynamique en sélectionnant les critères utilisés pour les filtrer ou les agréger.

Cette capacité doit notamment permettre d'exploiter les dimensions disponibles sur une Issue, par exemple :

- présence ou absence d'un rattachement à un Composant ;
- Composant lorsqu'il existe ;
- Issue Type ;
- labels ;
- autres dimensions métier disponibles dans le modèle et pertinentes pour l'analyse.

L'objectif est de ne pas limiter l'analyse aux seuls KPI ou regroupements prédéfinis : la Squad doit pouvoir construire des lectures adaptées à ses besoins à partir des données disponibles.

Les critères exacts proposés par la page, les combinaisons autorisées et son ergonomie restent à définir.

**Statut : Besoin fonctionnel établi — conception à instruire**

---

### D-116 — Permettre le croisement de plusieurs critères dans l'analyse dynamique

La page d'analyse dynamique doit permettre de combiner plusieurs critères de filtrage simultanément, puis d'agréger le résultat selon une dimension choisie.

Exemple conceptuel :

```text
Filtres
├── Issue Type = Bug
├── label = accessibilité
└── Composant = Button

Agrégation
└── Status
```

Ce besoin fonctionnel est établi.

La conception détaillée de cette capacité est volontairement différée : liste complète des dimensions, opérateurs de combinaison, ergonomie, visualisations, sauvegarde éventuelle des analyses et autres comportements seront instruits ultérieurement.

**Statut : Besoin fonctionnel établi — conception différée**

---

### D-117 — Une Issue d'Audit concerne exactement un Composant

Une Issue d'Audit doit obligatoirement porter **un et un seul** label `🧩 Component:xxx`.

Sa cardinalité de rattachement au Catalogue est donc :

```text
Issue d'Audit
    │
    └── exactement 1 Composant
```

Les situations suivantes sont invalides pour une Issue d'Audit :

- aucun label `🧩 Component:xxx` ;
- plusieurs labels `🧩 Component:xxx`.

Cette règle est spécifique aux Issues d'Audit. Les Issues classiques peuvent exceptionnellement concerner plusieurs Composants conformément aux décisions D-108 à D-110.

**Statut : Établi**

---

### D-118 — Contrôler la cohérence du Composant des Anomalies d'Audit

Une Anomalie issue d'un Audit doit obligatoirement porter **un et un seul** label `🧩 Component:xxx`.

Ce Composant doit être **identique au Composant de l'Issue d'Audit parente**.

Le pipeline doit donc pouvoir détecter au minimum les incohérences suivantes :

- aucun label `🧩 Component:xxx` sur l'Anomalie ;
- plusieurs labels `🧩 Component:xxx` sur l'Anomalie ;
- un unique Composant sur l'Anomalie, mais différent de celui de l'Audit parent.

Exemple :

```text
Audit Button
└── 🧩 Component:Button

Anomalie
└── 🧩 Component:Button
    → cohérent
```

```text
Audit Button
└── 🧩 Component:Button

Anomalie
└── 🧩 Component:Modal
    → incohérent
```

Ce contrôle sert explicitement à détecter les erreurs de rattachement dans les données.

**Statut : Établi**

---

### D-119 — Contrôler la cohérence du Composant des Improvements d'Audit

Une Improvement issue d'un Audit doit obligatoirement porter **un et un seul** label `🧩 Component:xxx`.

Ce Composant doit être **identique au Composant de l'Issue d'Audit parente**.

Le pipeline doit donc détecter au minimum les incohérences suivantes :

- aucun label `🧩 Component:xxx` sur l'Improvement ;
- plusieurs labels `🧩 Component:xxx` sur l'Improvement ;
- un unique Composant sur l'Improvement, mais différent de celui de l'Audit parent.

Cette règle de rattachement est identique à celle des Anomalies d'Audit.

Elle ne modifie toutefois pas la sémantique de conformité : contrairement à une Anomalie, une Improvement ne rend pas l'Audit non conforme et n'entre pas dans le calcul du verdict de conformité.

**Statut : Établi**

---

### D-120 — Une Improvement d'Audit doit être une sous-Issue de l'Audit

Une Improvement issue d'un Audit doit obligatoirement être créée comme **sous-Issue de l'Issue d'Audit** qui l'a fait émerger.

La relation entre l'Audit et l'Improvement doit donc être explicite dans GitHub et ne doit pas être déduite uniquement :

- du label `🧩 Component:xxx` ;
- du titre ou de la description ;
- d'un autre rapprochement implicite.

La traçabilité attendue est :

```text
Issue d'Audit
└── sous-Issue Improvement
```

Cette relation permet notamment de contrôler conjointement :

1. que l'Improvement est bien rattachée à son Audit d'origine ;
2. qu'elle possède exactement un label `🧩 Component:xxx` ;
3. que ce Composant est identique à celui de l'Audit parent.

Une Improvement identifiée comme issue d'un Audit mais qui n'est pas une sous-Issue de cet Audit constitue une incohérence à détecter.

Cette règle ne modifie pas la conformité : une Improvement reste distincte d'une Anomalie et n'entre pas dans la détermination du verdict de conformité.

**Statut : Établi**

---

### D-121 — Une Anomalie d'Audit doit être une sous-Issue de l'Audit

Une Anomalie issue d'un Audit doit obligatoirement être créée comme **sous-Issue de l'Issue d'Audit** qui l'a fait émerger.

La relation Audit → Anomalie doit être explicite dans GitHub. L'Anomalie doit également porter exactement un label `🧩 Component:xxx`, identique à celui de l'Audit parent.

Une Anomalie identifiée comme issue d'un Audit mais qui n'est pas une sous-Issue de cet Audit constitue une incohérence à détecter.

**Statut : Établi**

---

### D-122 — Règle commune de traçabilité des résultats d'Audit

Les Anomalies et Improvements issues d'un Audit suivent la même règle structurelle :

```text
Issue d'Audit
├── sous-Issue Anomalie
│   └── exactement 1 Component, identique à l'Audit
└── sous-Issue Improvement
    └── exactement 1 Component, identique à l'Audit
```

Leur rôle métier reste différent : l'Anomalie intervient dans le verdict de conformité ; l'Improvement n'y intervient pas.

**Statut : Établi**

---

### D-123 — Les types connus de sous-Issues d'Audit ne constituent pas une liste fermée

À ce jour, les deux seuls types métier identifiés comme sous-Issues d'une Issue d'Audit sont :

- les **Anomalies** ;
- les **Improvements**.

Il n'est cependant pas établi que cette liste restera exhaustive à l'avenir.

Le modèle ne doit donc pas considérer par principe que toute autre sous-Issue d'un Audit est impossible.

Si un nouveau type de sous-Issue d'Audit apparaît ultérieurement, ses règles métier devront être définies explicitement avant de l'intégrer aux analyses, notamment :

- son rôle dans l'Audit ;
- son rattachement au Composant ;
- son éventuel effet sur le verdict de conformité ;
- sa prise en compte dans les indicateurs.

En particulier, une sous-Issue d'un type inconnu ne doit pas être assimilée automatiquement à une Anomalie et ne doit pas modifier automatiquement le verdict de conformité.

**Statut : Établi pour le périmètre actuel — extensible**

---

### D-124 — Une Anomalie d'Audit doit avoir l'Issue Type Bug

Toute Anomalie créée à partir d'un Audit doit obligatoirement avoir l'Issue Type `🐛 Bug`.

Son identification structurelle repose donc notamment sur les règles cumulatives suivantes :

```text
Anomalie d'Audit
├── sous-Issue de l'Issue d'Audit
├── Issue Type = 🐛 Bug
└── exactement 1 🧩 Component:xxx
    └── identique au Composant de l'Audit parent
```

Une sous-Issue identifiée comme Anomalie d'Audit mais dont l'Issue Type n'est pas `🐛 Bug` constitue une incohérence à détecter par le pipeline.

Cette règle concerne spécifiquement les Anomalies issues d'un Audit. Elle ne suffit pas, à elle seule, à conclure que toute Issue de type `🐛 Bug` est une Anomalie d'Audit.

**Statut : Établi**

---

### D-125 — Une Improvement d'Audit doit avoir l'Issue Type Feature

Toute Improvement créée à partir d'un Audit doit obligatoirement avoir l'Issue Type `✨ Feature`.

Son identification structurelle repose donc notamment sur les règles cumulatives suivantes :

```text
Improvement d'Audit
├── sous-Issue de l'Issue d'Audit
├── Issue Type = ✨ Feature
└── exactement 1 🧩 Component:xxx
    └── identique au Composant de l'Audit parent
```

Une sous-Issue identifiée comme Improvement d'Audit mais dont l'Issue Type n'est pas `✨ Feature` constitue une incohérence à détecter par le pipeline.

Cette règle concerne spécifiquement les Improvements issues d'un Audit. Elle ne suffit pas, à elle seule, à conclure que toute Issue de type `✨ Feature` est une Improvement d'Audit.

Les deux catégories actuellement connues sont ainsi distinguées structurellement :

```text
Audit
├── Anomalie    → Issue Type = 🐛 Bug
└── Improvement → Issue Type = ✨ Feature
```

Cette classification reste extensible conformément à D-123.

**Statut : Établi**

---

### D-126 — Les criticités RGAA sont réservées aux Anomalies d'Audit

Les labels de criticité RGAA actuellement définis sont réservés aux **Anomalies d'Audit** :

- `🚦 rgaa:bloquante` ;
- `🚦 rgaa:majeure` ;
- `🚦 rgaa:mineure`.

Une Improvement issue d'un Audit ne doit porter **aucun** de ces labels.

Le pipeline doit donc contrôler les règles complémentaires suivantes :

```text
Anomalie d'Audit
└── exactement 1 criticité RGAA
    ├── bloquante
    ├── majeure
    └── mineure

Improvement d'Audit
└── 0 criticité RGAA
```

La présence d'une criticité RGAA sur une Improvement d'Audit constitue une incohérence à détecter.

Cette règle concerne le schéma actuel de criticité RGAA associé aux Audits Accessibilité. Elle ne préjuge pas d'un éventuel futur système de qualification propre aux Improvements.

**Statut : Établi**

---

### D-127 — Les labels a11y sont transverses à la nature et à l'origine des Issues

Les labels `♿ a11y:xxx` décrivent une **thématique ou un domaine d'accessibilité** concerné par une Issue.

Ils ne sont pas réservés aux Anomalies d'Audit et peuvent notamment être utilisés sur :

- une Anomalie issue d'un Audit ;
- une Improvement issue d'un Audit ;
- une Issue qui n'est pas issue d'un Audit, par exemple lors de la mise au point d'un nouveau Composant.

Le modèle doit donc distinguer explicitement plusieurs dimensions :

```text
Issue
├── nature
│   └── Issue Type
├── origine / contexte
│   └── Audit ou hors Audit
├── rattachement
│   └── 🧩 Component:xxx
└── thématique accessibilité
    └── ♿ a11y:xxx
```

La présence d'un label `♿ a11y:xxx` ne permet donc pas, à elle seule, de conclure qu'une Issue est une Anomalie, une Improvement ou qu'elle provient d'un Audit.

**Statut : Établi**

---

### D-128 — Un seul label a11y par Issue est l'hypothèse métier actuelle

L'hypothèse métier actuelle est qu'une Issue porte normalement **au plus un** label `♿ a11y:xxx`.

Cette cardinalité n'est toutefois pas suffisamment confirmée pour devenir une règle métier stricte ou un contrôle de qualité bloquant.

En conséquence :

- le modèle doit continuer à tolérer techniquement plusieurs labels `♿ a11y:xxx` tant que la règle n'est pas confirmée ;
- la présence de plusieurs labels `♿ a11y:xxx` ne doit pas être déclarée automatiquement comme une erreur certaine ;
- la cardinalité devra être confirmée à partir du processus réel, de l'historique des Issues ou avec l'auditeur.

**Statut : Hypothèse métier à confirmer**

---

### D-129 — Une Anomalie d'Audit Accessibilité doit avoir exactement un label a11y

Toute **Anomalie issue d'un Audit Accessibilité** doit obligatoirement porter **exactement un** label `♿ a11y:xxx`.

La cardinalité est donc stricte pour ce sous-ensemble :

```text
Anomalie d'Audit Accessibilité
└── ♿ a11y:xxx : exactement 1
```

Le pipeline doit détecter comme incohérentes les situations suivantes :

- aucun label `♿ a11y:xxx` ;
- plusieurs labels `♿ a11y:xxx`.

Cette règle précise D-128 : l'hypothèse générale sur la cardinalité des labels a11y reste à confirmer pour les autres catégories d'Issues, mais elle est désormais établie pour les Anomalies d'Audit Accessibilité.

**Statut : Établi**

---

### D-130 — La catégorie a11y est facultative pour une Improvement d'Audit Accessibilité

Une **Improvement issue d'un Audit Accessibilité** n'est pas obligée de porter un label `♿ a11y:xxx`.

L'absence de catégorie a11y sur une Improvement d'Audit Accessibilité est donc une situation valide et ne constitue pas une incohérence.

La cardinalité minimale est ainsi établie à zéro :

```text
Improvement d'Audit Accessibilité
└── ♿ a11y:xxx : facultatif
```

En revanche, il n'est pas encore établi si une Improvement qui possède une catégorisation a11y doit être limitée à un seul label ou peut en porter plusieurs.

Cette règle se distingue explicitement de celle des Anomalies d'Audit Accessibilité, pour lesquelles exactement un label `♿ a11y:xxx` est obligatoire.

**Statut : Établi pour le caractère facultatif — cardinalité maximale à confirmer**

---

### D-131 — La cardinalité maximale a11y d'une Improvement d'Audit reste ouverte

Pour une **Improvement issue d'un Audit Accessibilité**, il est établi que la catégorisation `♿ a11y:xxx` est facultative.

En revanche, il n'est pas possible à ce stade de déterminer si une Improvement catégorisée doit porter :

- au maximum un label `♿ a11y:xxx` ;
- ou plusieurs labels `♿ a11y:xxx`.

Aucune contrainte maximale ne doit donc être imposée pour le moment.

Le modèle doit pouvoir représenter plusieurs catégories et le pipeline ne doit pas considérer leur présence comme une incohérence tant que cette cardinalité n'a pas été confirmée.

**Statut : À confirmer**

---

### D-132 — Les criticités RGAA sont strictement réservées aux Anomalies provenant d'un Audit

Les trois labels de criticité RGAA actuellement définis :

- `🚦 rgaa:bloquante` ;
- `🚦 rgaa:majeure` ;
- `🚦 rgaa:mineure` ;

sont strictement réservés aux **Anomalies provenant d'un Audit Accessibilité**.

Ils ne doivent donc pas être utilisés :

- sur une Improvement issue d'un Audit ;
- sur une Issue hors Audit, même si cette Issue concerne l'accessibilité ;
- sur une autre catégorie d'Issue ne correspondant pas à une Anomalie d'Audit Accessibilité.

Le pipeline doit considérer la présence de l'un de ces labels hors de ce contexte comme une incohérence.

Cette règle confirme la distinction entre :

```text
🚦 rgaa:xxx
└── criticité d'une Anomalie d'Audit Accessibilité uniquement

♿ a11y:xxx
└── thématique accessibilité transverse
    ├── Anomalie d'Audit
    ├── Improvement d'Audit
    └── Issue hors Audit
```

**Statut : Établi**

---

### D-133 — Un même problème peut être regroupé dans une ou plusieurs Anomalies d'Audit

Lors d'un même Audit d'un Composant, si un même problème d'accessibilité est constaté à plusieurs endroits, l'auditeur peut :

- créer une seule Anomalie regroupant plusieurs occurrences du problème ;
- ou créer plusieurs Anomalies distinctes.

Il n'existe donc pas de cardinalité métier imposée entre un problème constaté et le nombre d'Issues Anomalie créées.

Conséquence pour les indicateurs :

- une Issue Anomalie représente une Anomalie comptabilisée dans les indicateurs fondés sur les Issues ;
- le nombre d'Issues Anomalie ne doit pas être interprété comme le nombre exact d'occurrences techniques ou visuelles d'un défaut dans le Composant ;
- aucune déduplication ou fusion automatique d'Anomalies ne doit être effectuée au motif qu'elles semblent décrire le même problème.

**Statut : Établi**

---

### D-134 — L'unité de comptage d'une Anomalie est l'Issue GitHub

Pour les indicateurs du dashboard, une **Issue GitHub qualifiée comme Anomalie** compte pour **une Anomalie**.

Cette règle s'applique même si l'Issue regroupe plusieurs occurrences d'un même défaut dans le Composant.

```text
1 Issue Anomalie GitHub = 1 Anomalie comptabilisée
```

Le dashboard ne cherche pas à compter, extraire ou estimer les occurrences internes décrites dans une Issue.

En conséquence :

- une Issue regroupant plusieurs occurrences compte pour 1 Anomalie ;
- plusieurs Issues distinctes comptent chacune pour 1 Anomalie ;
- aucun décompte d'occurrences n'est dérivé du titre, de la description, des commentaires ou d'autres contenus textuels de l'Issue ;
- les indicateurs doivent être nommés et expliqués de façon à ne pas présenter le nombre d'Issues Anomalie comme un nombre d'occurrences techniques de défauts.

**Statut : Établi**

---

### D-135 — Une Anomalie d'Audit appartient à un seul Audit parent

La relation entre une **Anomalie provenant d'un Audit** et son **Issue d'Audit parent** est stricte du côté de l'Anomalie :

```text
Audit 1 ── 0..n Anomalies
Anomalie ── exactement 1 Audit parent
```

Une même Issue Anomalie ne doit donc jamais être rattachée comme sous-Issue à plusieurs Audits.

Cette règle est cohérente avec le modèle de revalidation déjà établi : si un problème est de nouveau constaté lors d'un nouvel Audit, une **nouvelle Issue Anomalie** est créée et rattachée à ce nouvel Audit. L'ancienne Anomalie n'est pas réutilisée comme enfant du nouvel Audit.

Le pipeline doit considérer comme incohérente toute Anomalie d'Audit ayant zéro parent Audit ou plusieurs parents Audit.

**Statut : Établi**

---

### D-136 — Une Improvement d'Audit appartient à un seul Audit parent

La relation entre une **Improvement provenant d'un Audit** et son **Issue d'Audit parent** est stricte du côté de l'Improvement :

```text
Audit 1 ── 0..n Improvements
Improvement ── exactement 1 Audit parent
```

Une même Issue Improvement ne doit donc jamais être rattachée comme sous-Issue à plusieurs Audits.

Cette règle complète la cardinalité déjà établie pour les Anomalies d'Audit. Les deux catégories actuellement connues de sous-Issues d'Audit ont ainsi la même cardinalité vers leur parent :

```text
Anomalie d'Audit    ── exactement 1 Audit parent
Improvement d'Audit ── exactement 1 Audit parent
```

Le pipeline doit considérer comme incohérente toute Improvement d'Audit ayant zéro parent Audit ou plusieurs parents Audit.

**Statut : Établi**

---

### D-137 --- Identification générale d'une Anomalie

Une Issue GitHub de type `🐛 Bug` est une **Anomalie hors Audit**.

Lorsqu'une Issue de type `🐛 Bug` est une sub-Issue d'un Audit, elle est
une **Anomalie issue de cet Audit**.

La relation à l'Audit qualifie l'origine de l'Anomalie ; elle ne change
pas sa nature.

**Statut : Établi**

---

### D-138 --- Origine d'une Anomalie en V1

Pour la V1, le modèle distingue deux origines d'Anomalie :

```text
AUDIT
HORS_AUDIT
```

Une Anomalie `HORS_AUDIT` n'est pas subdivisée davantage en V1.

Pour une V2, la provenance des Anomalies hors Audit devra être
réexaminée. Une dimension déjà identifiée est la distinction entre une
remontée provenant de la Squad et une remontée provenant de l'extérieur
de la Squad. D'autres dimensions et indicateurs restent à challenger.

**Statut : Établi pour la V1**

---


> **Extension :** D-237 ajoute `UNDETERMINED` aux valeurs canoniques de `Anomaly.origin` pour les relations vers un Audit suggérées mais non validables.

### D-139 --- Date de détection d'une Anomalie

La date métier de détection d'une Anomalie est la date de création de
l'Issue `🐛 Bug` dans GitHub.

```text
Anomalie.detectedAt = GitHub Issue.createdAt
```

Cette règle s'applique aux Anomalies issues d'un Audit comme aux
Anomalies hors Audit. Aucune date antérieure de constatation n'est
reconstruite ou inférée.

**Statut : Établi**

---

### D-140 --- Date de correction d'une Anomalie

La date métier de correction d'une Anomalie est la date à laquelle
l'Issue `🐛 Bug` passe au statut Project `Done`.

```text
Anomalie.correctedAt = date du passage à Done
```

Dans le fonctionnement nominal, cette date doit être cohérente avec la
date de fermeture (`Closed`) de l'Issue et la date de merge de la Pull
Request de correction lorsqu'une Pull Request est requise.

`Done` reste l'événement métier de référence. Un écart avec `Closed` ou
avec le merge de la Pull Request constitue une incohérence de données à
signaler.

**Statut : Établi**

---

### D-141 --- Date de fin d'un Audit

Un Audit est considéré comme réalisé lorsque son Issue est simultanément
`Project Status = Done` et `GitHub Issue State = Closed`.

La date métier de fin est :

```text
Audit.completedAt = date du passage à Done
```

Dans le fonctionnement nominal, `Closed` doit être cohérent avec cet
événement. À `completedAt`, le Component concerné est considéré comme
audité pour les calculs historiques.

Cette décision ne définit pas la date de début de l'Audit.

**Statut : Établi**

---

### D-142 --- Identification de la Release Candidate auditée

Pour un Audit pré-PROD, la Milestone de l'Issue d'Audit identifie la
Version PROD cible `M.m.r`.

La Release Candidate réellement auditée est enregistrée dans un champ
explicite porté par l'Issue d'Audit :

```text
Milestone = M.m.r
RC auditée = M.m.r-rc.n
```

La Milestone doit être prise en compte dans l'interprétation de l'Audit,
mais elle ne permet pas à elle seule d'identifier l'artefact réellement
audité.

La RC auditée ne doit pas être déduite implicitement de la dernière RC
Jenkins disponible.

Pour un Audit de rattrapage post-PROD, la Version auditée reste la
Version PROD `M.m.r`.

**Statut : Établi**

---

### D-143 --- Reconstruction du Catalogue historique

Pour une Version PROD `M.m.r`, le Catalogue historique applicable est
reconstruit à partir du contenu du Repository au Git tag `M.m.r`
correspondant.

```text
Git tag M.m.r
      ↓
état du Repository à ce tag
      ↓
Catalogue historique de M.m.r
```

Ce Catalogue constitue le périmètre historique de référence de la
Version, notamment pour le dénominateur de la couverture d'Audit.

Le Catalogue courant ne doit pas être appliqué rétroactivement à une
ancienne Version.

**Statut : Établi**

---

### D-144 --- Date métier de Release

Pour une Version PROD `M.m.r`, la date métier de Release est la date de
création du Git tag `M.m.r`.

```text
Version.releasedAt = GitTag(M.m.r).createdAt
```

Cette date constitue l'instant de référence pour reconstruire l'état
connu au moment de la Release.

Les informations ou événements postérieurs à `releasedAt` peuvent
enrichir la connaissance actuelle de la Version, mais ne doivent pas
être projetés rétroactivement dans l'état à la Release.

**Statut : Établi**

---

### D-145 --- Conservation exhaustive des Issues dans le modèle normalisé

Le modèle normalisé conserve toutes les Issues GitHub collectées, y compris lorsqu'elles ne correspondent ni à un Audit, ni à une Anomalie, ni à une Improvement d'Audit.

Une entité générique `Issue` représente ce patrimoine GitHub dans le modèle normalisé.

Les objets métier spécialisés sont dérivés des Issues qui satisfont leurs règles respectives sans remplacer l'Issue source :

```text
GitHub Issue
      ↓
Issue normalisée
      ├── peut matérialiser un Audit
      ├── peut matérialiser une Anomalie
      ├── peut matérialiser une Improvement d'Audit
      └── peut ne produire aucun objet métier spécialisé
```

Ainsi, une Issue qui ne produit aucun objet spécialisé reste disponible dans `NormalizedData` et conserve sa valeur pour l'analyse du patrimoine GitHub, la traçabilité et les évolutions futures.

La représentation exacte de l'identité et du type d'une `Issue` normalisée reste à préciser dans les décisions suivantes.

**Statut : Établi**

---

### D-146 --- Conservation du type d’Issue dans le modèle normalisé

L’entité normalisée générique `Issue` conserve le type d’Issue GitHub/métier collecté dans un champ `issueType`.

Ce type constitue une propriété de l’Issue normalisée et participe, avec les relations de l’Issue et les autres règles métier applicables, à la dérivation éventuelle des objets spécialisés.

```text
RawIssue
   ↓
Issue.issueType
   ├── peut contribuer à dériver un Audit
   ├── peut contribuer à dériver une Anomalie
   ├── peut contribuer à dériver une Improvement d’Audit
   └── peut ne conduire à aucune spécialisation
```

La normalisation ne doit donc pas perdre le type collecté, y compris lorsqu’une Issue ne produit aucun objet métier spécialisé.

La liste définitive des valeurs autorisées de `issueType` et leur sémantique détaillée ne sont pas fixées par D-146 et doivent être instruites séparément.

**Statut : Établi**

---

### D-147 --- Vocabulaire global des Issue Types et reconnaissance configurable

Les Issue Types constituent un vocabulaire commun au système et ne sont pas configurés repository par repository. À terme, les repositories suivis doivent converger vers les mêmes notions d’Issue Type.

La liste des types effectivement rencontrés peut être déduite de l’ensemble des Issues collectées. Cette découverte des valeurs observées ne remplace toutefois pas la configuration nécessaire à leur interprétation métier.

La configuration système porte une couche de reconnaissance globale qui associe une notion canonique à une ou plusieurs valeurs ou mots-clés acceptés. Le mécanisme déjà présent dans `system.yaml` sous `github.issueTypes.keywords` constitue la base de ce contrat.

```yaml
github:
  issueTypes:
    keywords:
      AUDIT:
        - "audit"
      BUG:
        - "bug"
        - "rgaa"
        - "a11y"
```

Ainsi :

- les valeurs observées dans les données GitHub peuvent être inventoriées sans être pré-déclarées repository par repository ;
- les notions métier reconnues par le pipeline sont configurées globalement ;
- une notion canonique peut accepter plusieurs mots-clés ou variantes ;
- la configuration n’a pas vocation à recopier exhaustivement toutes les valeurs observées ;
- la liste définitive des notions canoniques et le comportement à appliquer à une valeur observée non reconnue restent à instruire séparément.

**Statut : Établi**

---

### D-148 --- Conservation et signalement des Issue Types non déclarés

Lorsqu’une Issue GitHub porte une valeur d’Issue Type qui ne correspond à aucune notion reconnue par la configuration globale `github.issueTypes.keywords`, l’Issue reste conservée dans le modèle normalisé et sa valeur brute d’Issue Type est préservée.

L’absence de reconnaissance ne doit donc ni supprimer l’Issue, ni remplacer silencieusement la valeur collectée, ni bloquer le pipeline.

La Data Quality doit produire un élément explicite **« issueType à déclarer »** permettant d’identifier et de corriger la configuration. Cet élément doit contenir au minimum :

- la valeur brute de l’Issue Type non reconnue ;
- un lien vers l’Issue GitHub concernée.

Si plusieurs Issues portent la même valeur non déclarée, chacune reste traçable jusqu’à son Issue source. Les modalités de regroupement ou de présentation de ces éléments dans le dashboard pourront être précisées lors du lot Data Quality.

L’identifiant `DQ-xxx` de cette règle n’est pas attribué à ce stade. Il sera fixé au lot I5 après vérification du registre DQ canonique.

**Statut : Établi**

---

### D-149 --- Séparation de la valeur brute et de la notion canonique d’Issue Type

L’Issue normalisée conserve séparément :

- la valeur brute de l’Issue Type telle qu’elle est remontée par GitHub ;
- la notion canonique reconnue par le pipeline à partir de la configuration globale `github.issueTypes.keywords`.

La canonicalisation ne doit jamais écraser ni remplacer la valeur brute GitHub. Plusieurs valeurs brutes peuvent ainsi être reconnues comme une même notion canonique.

Lorsqu’aucune notion canonique n’est reconnue, la valeur brute reste disponible et le comportement Data Quality défini par D-148 s’applique.

Le type TypeScript exact représentant l’absence de notion canonique n’est pas fixé par cette décision.

**Statut : Établi**

---

### D-150 --- Absence de notion canonique pour un Issue Type non reconnu

Lorsqu’une valeur brute d’Issue Type ne correspond à aucune notion canonique reconnue par la configuration, l’Issue normalisée ne reçoit aucune valeur canonique de repli.

Le contrat cible est conceptuellement :

```ts
interface Issue {
  rawIssueType: string;
  issueType?: CanonicalIssueType;
}
```

Ainsi, une valeur brute telle que `Task` non déclarée reste portée par `rawIssueType`, tandis que `issueType` est absent.

La valeur canonique `UNKNOWN` ne doit pas être utilisée pour masquer l’absence de reconnaissance. Le signalement Data Quality défini par D-148 reste applicable.

**Statut : Établi**

---

### D-151 --- Recalcul de la notion canonique avec la configuration courante

La notion canonique d’Issue Type est une interprétation dérivée et recalculable. À chaque exécution du pipeline, elle est recalculée à partir de la valeur brute conservée sur l’Issue et de la configuration courante `github.issueTypes.keywords`.

Une évolution de cette configuration peut donc modifier la notion canonique d’une Issue existante sans que l’Issue GitHub elle-même ait changé.

Par exemple, si `Accessibility bug` n’était initialement associé à aucune notion, puis est ajouté aux mots-clés de `BUG`, l’exécution suivante conserve `rawIssueType = "Accessibility bug"` et produit `issueType = BUG`. Les objets métier dérivés doivent alors être recalculés en cohérence avec cette nouvelle classification ; l’Issue peut notamment devenir une `Anomaly`.

La notion canonique ne constitue donc pas une donnée historique figée et ne doit pas être persistée comme une vérité indépendante de la configuration qui a servi à la calculer.

**Statut : Établi**

---

### D-152 --- Absence de priorité implicite en cas de correspondance ambiguë d’Issue Type

Lorsqu’une valeur brute d’Issue Type correspond à plusieurs notions canoniques au regard de la configuration `github.issueTypes.keywords`, le pipeline ne choisit aucune notion automatiquement.

Dans ce cas :

- la valeur brute reste conservée ;
- `issueType` reste absent ;
- aucune règle de priorité implicite entre les notions canoniques n’est appliquée ;
- la Data Quality produit une réserve non bloquante signalant une configuration ambiguë ;
- cette réserve contient au minimum la valeur brute, l’ensemble des notions canoniques candidates et un lien vers l’Issue GitHub concernée.

La correction attendue porte sur la configuration de reconnaissance afin de rendre la correspondance non ambiguë.

**Statut : Établi**

---

### D-153 --- Correspondance stricte des variantes d’Issue Type

Les valeurs configurées dans `github.issueTypes.keywords` sont des variantes complètes explicitement autorisées, et non des fragments à rechercher dans la valeur brute remontée par GitHub.

La reconnaissance d’une notion canonique nécessite donc une correspondance avec une variante explicitement déclarée dans `system.yaml`. Déclarer `bug` ne doit pas reconnaître implicitement `🐛 Bug`, `Bug report` ou `Accessibility bug`. Ces variantes doivent être déclarées séparément si elles sont acceptées.

Une valeur brute qui ne correspond à aucune variante explicitement déclarée suit le comportement défini par D-148 et D-150. Une valeur correspondant à plusieurs notions suit D-152.

La normalisation technique éventuellement appliquée avant comparaison (par exemple la casse ou les espaces) n’est pas définie par cette décision et doit être instruite séparément.

**Statut : Établi**
---

### D-154 --- Normalisation de casse et d’espaces pour la correspondance des Issue Types

La correspondance stricte définie par D-153 porte sur la valeur complète, après une normalisation technique limitée :

- suppression des espaces en début et en fin de valeur (`trim`) ;
- comparaison insensible à la casse.

Ainsi, une variante configurée `Bug` reconnaît `Bug`, `bug` et `  Bug  `.

Cette normalisation ne transforme pas la correspondance stricte en recherche partielle : `🐛 Bug`, `Bug report` ou `Accessibility bug` restent des variantes différentes qui doivent être déclarées explicitement dans `system.yaml`.

La valeur brute remontée par GitHub reste conservée sans être remplacée par sa forme normalisée, conformément à D-149.

**Statut : Établi**

---

### D-155 --- Conservation et signalement d’une Issue sans Issue Type

Lorsqu’une Issue GitHub ne possède aucun Issue Type, elle reste conservée dans le modèle normalisé.

Dans ce cas :

- `rawIssueType` est absent ;
- `issueType` est absent ;
- aucune valeur artificielle, notamment `UNKNOWN`, n’est injectée ;
- le pipeline reste non bloquant.

La Data Quality doit produire un élément explicite **« issueType manquant »** contenant au minimum un lien vers l’Issue GitHub concernée.

Ce cas est distinct d’un Issue Type présent mais non reconnu par la configuration :

- Issue Type absent → **« issueType manquant »** ;
- Issue Type présent mais non déclaré → **« issueType à déclarer »**, conformément à D-148.

L’identifiant `DQ-xxx` définitif de cette règle sera attribué lors du lot I5 après vérification du registre Data Quality canonique.

**Statut : Établi**


### D-156 — Conservation du titre dans l’Issue normalisée

Toute `Issue` normalisée conserve le titre de l’Issue GitHub dans une propriété `title`.

Le titre fait partie des données génériques de l’Issue, indépendamment de l’existence d’une spécialisation métier telle que `Audit`, `Anomaly` ou `AuditImprovement`. Il reste ainsi disponible pour les couches aval, notamment le dashboard et la Data Quality, sans nécessiter un retour au `RawDataset`.

Cette décision ne préjuge pas encore des autres propriétés minimales de l’entité `Issue`, qui sont instruites séparément.

**Statut : Établi**


### D-157 — Conservation de l’état GitHub dans l’Issue normalisée

Toute `Issue` normalisée conserve son état GitHub dans une propriété `state`, avec les valeurs `OPEN` ou `CLOSED`.

Cet état représente exclusivement l’état natif de l’Issue GitHub. Il est distinct du statut porté par GitHub Projects, par exemple `Backlog`, `Ready`, `In progress`, `In review` ou `Done`.

La propriété `state` appartient au socle générique de l’Issue et reste disponible indépendamment de l’existence d’une spécialisation métier telle que `Audit`, `Anomaly` ou `AuditImprovement`.

**Statut : Établi**


### D-158 — Conservation des dates GitHub natives de l’Issue normalisée

Toute `Issue` normalisée conserve les dates GitHub natives suivantes :

- `createdAt` : date de création de l’Issue ;
- `closedAt` : date de fermeture de l’Issue lorsqu’elle est fermée, propriété absente sinon.

Ces dates appartiennent au socle générique de l’Issue et restent disponibles indépendamment de l’existence d’une spécialisation métier.

Elles constituent des faits GitHub et ne doivent pas être confondues avec les dates métier dérivées telles que `detectedAt` pour une anomalie, `correctedAt` pour sa correction ou `completedAt` pour un audit.

**Statut : Établi**


### D-159 — Conservation exhaustive des labels GitHub de l’Issue normalisée

Toute `Issue` normalisée conserve l’ensemble de ses labels GitHub dans une propriété `labels: string[]`.

Cette conservation ne se limite pas aux labels actuellement interprétés par le pipeline pour dériver une notion métier, par exemple un composant, une criticité ou une catégorie. Les labels non interprétés sont également conservés afin de préserver l’information GitHub source et de permettre de futurs usages sans revenir au `RawDataset`.

Les notions métier dérivées à partir de labels restent séparées de la collection brute `labels` et ne la remplacent pas.

**Statut : Établi**


### D-160 — Rattachement explicite de l’Issue normalisée au repository

Toute `Issue` normalisée conserve explicitement l’identifiant du repository GitHub dont elle provient dans une propriété `repositoryId`.

Ce rattachement est conservé en plus de `libraryId`. Il ne doit pas être déduit uniquement de la relation actuelle entre une `Library` et un repository, afin de ne pas figer dans le contrat de l’Issue l’hypothèse actuelle « une Library = un repository ».

Cette décision prépare notamment l’évolution cible dans laquelle une même `Library` pourra être associée à plusieurs repositories ou packages.

**Statut : Établi**


### D-161 — Conservation de l’URL GitHub de l’Issue normalisée

Toute `Issue` normalisée conserve explicitement son URL GitHub dans une propriété `url: string`.

Cette URL est une donnée source de l’Issue. Elle permet aux couches aval, notamment au dashboard et à la Data Quality, de fournir un lien direct vers l’Issue concernée sans reconstruire l’URL à partir du repository et du numéro d’Issue.

La propriété `url` appartient au socle générique de l’Issue et reste disponible indépendamment de l’existence d’une spécialisation métier.

**Statut : Établi**


### D-162 — Conservation du rattachement à la Milestone dans l’Issue normalisée

Toute `Issue` normalisée conserve son rattachement éventuel à une Milestone GitHub dans une propriété `milestoneId?: string`.

La `Milestone` reste un objet normalisé distinct. L’Issue ne duplique pas ses propriétés et conserve uniquement sa référence lorsqu’un rattachement existe.

Cette information appartient au socle générique de l’Issue, indépendamment de l’usage métier qui pourra ensuite en être fait pour un Audit, une Version ou un autre type d’Issue.

**Statut : Établi**


### D-163 — Conservation des statuts GitHub Projects de l’Issue normalisée

Toute `Issue` normalisée conserve ses rattachements et statuts GitHub Projects dans une propriété `projectStatuses`.

Cette information appartient au socle générique de l’Issue et reste conservée même lorsqu’elle n’est pas immédiatement utilisée pour dériver une spécialisation métier telle que `Audit` ou `Anomaly`.

Les statuts GitHub Projects, par exemple `Backlog`, `Ready`, `In progress`, `In review` ou `Done`, restent distincts de `state: 'OPEN' | 'CLOSED'`, qui représente l’état natif GitHub de l’Issue.

**Statut : Établi**


### D-164 — Conservation des relations parent / sous-Issues

Toute `Issue` normalisée conserve ses relations GitHub de parenté.

Le contrat cible porte l’éventuelle Issue parente via `parentIssueId?: string` et les sous-Issues via `subIssueIds: string[]`.

Ces relations appartiennent au socle générique de l’Issue et sont conservées indépendamment de leur utilisation pour reconnaître une anomalie d’Audit, une amélioration d’Audit ou une autre spécialisation métier.

**Statut : Établi**


### D-165 — Conservation des Pull Requests liés à l’Issue

Toute `Issue` normalisée conserve les références aux Pull Requests qui lui sont liés dans `linkedPullRequestIds: string[]`.

Cette information appartient au socle générique de l’Issue et reste disponible même lorsqu’elle n’est pas immédiatement utilisée par une spécialisation métier.

**Statut : Établi**


### D-166 — Conservation de l’Iteration GitHub Projects

Lorsqu’une `Issue` possède une Iteration dans GitHub Projects, cette information est conservée dans l’Issue normalisée.

L’Iteration est une donnée générique de pilotage de l’Issue. Sa représentation normalisée détaillée sera alignée avec le contrat GitHub Projects ; la présente décision impose sa conservation sans préjuger d’un typage non encore établi.

**Statut : Établi**


### D-167 — Conservation du champ Velocity GitHub Projects

Lorsqu’une `Issue` possède une valeur pour le champ GitHub Projects `Velocity`, cette information est conservée dans l’Issue normalisée.

`Velocity` est une donnée générique de pilotage de l’Issue et n’est pas limitée aux Audits ou aux Anomalies. Sa représentation normalisée détaillée sera alignée avec le contrat GitHub Projects.

**Statut : Établi**


### D-168 — Conservation du champ Scheduling GitHub Projects

Lorsqu’une `Issue` possède une valeur pour le champ GitHub Projects `Scheduling`, cette information est conservée dans l’Issue normalisée.

`Scheduling` est une donnée générique de pilotage de l’Issue et n’est pas limitée aux Audits ou aux Anomalies. Sa représentation normalisée détaillée sera alignée avec le contrat GitHub Projects.

**Statut : Établi**


### D-169 — Conservation des Components dérivés dans l’Issue normalisée

Toute `Issue` normalisée conserve les références vers les Components reconnus à partir de ses labels dans `componentIds: string[]`.

Cette propriété dérivée complète, sans les remplacer, les `labels` GitHub conservés conformément à D-159. Une Issue générique peut référencer zéro, un ou plusieurs Components.

La dérivation des `componentIds` doit rester traçable vers les labels source et ne doit pas supprimer les labels non interprétés.

**Statut : Établi**


### D-170 — Conservation des criticités reconnues dans l’Issue normalisée

Toute `Issue` normalisée conserve les informations de criticité reconnues à partir de ses labels, même lorsque l’Issue n’est pas ensuite spécialisée en anomalie d’Audit Accessibility.

Cette conservation au niveau générique ne donne pas automatiquement une sémantique métier RGAA à la criticité. Les règles de validité et de cardinalité propres aux anomalies d’Audit Accessibility restent appliquées dans la spécialisation métier.

Les labels GitHub source restent conservés conformément à D-159.

**Statut : Établi**


### D-171 — Conservation des catégories Accessibility reconnues dans l’Issue normalisée

Toute `Issue` normalisée conserve les catégories Accessibility reconnues à partir de ses labels, même lorsque l’Issue n’est pas ensuite spécialisée en anomalie d’Audit Accessibility.

Cette conservation générique ne préjuge ni du vocabulaire définitif des catégories Accessibility ni des règles de cardinalité applicables à une spécialisation métier. Le vocabulaire reste configurable ou à définir selon les décisions dédiées.

Les labels GitHub source restent conservés conformément à D-159.

**Statut : Établi**


### D-172 — Structuration des données GitHub Projects par Project d’origine

Lorsqu’une `Issue` appartient à plusieurs GitHub Projects, ses informations Project sont conservées dans le contexte du Project dont elles proviennent.

Les données telles que le statut, l’Iteration, `Velocity` et `Scheduling` ne sont donc pas fusionnées en valeurs uniques au niveau de l’Issue lorsqu’elles proviennent de Projects différents.

Le modèle normalisé doit permettre d’identifier le Project source de chaque ensemble de valeurs Project.

**Statut : Établi**


### D-173 — Conservation et signalement des valeurs GitHub Projects non reconnues

Lorsqu’une valeur GitHub Projects collectée n’est pas reconnue par la configuration du pipeline, sa valeur brute est conservée.

Aucune valeur canonique artificielle n’est créée pour masquer l’absence de reconnaissance. Le pipeline continue son exécution et une Data Quality non bloquante signale la valeur à déclarer ou à traiter.

Cette règle s’applique aux valeurs Project soumises à reconnaissance ou canonicalisation. Le numéro de règle `DQ-xxx` correspondant sera attribué lors du lot I5 après vérification du registre Data Quality canonique.

**Statut : Établi**


### D-174 — Conservation de l’identité du GitHub Project

Chaque rattachement d’une `Issue` à un GitHub Project conserve explicitement `projectId` et `projectName`.

`projectId` constitue la référence stable du Project. `projectName` est également conservé afin de permettre l’affichage, le diagnostic et la compréhension des données ou fixtures sans résolution supplémentaire.

Ces deux informations appartiennent au contexte Project associé à l’Issue.

**Statut : Établi**


### D-175 — Séparation du statut Project brut et du statut canonique

Pour chaque rattachement GitHub Project d’une `Issue`, le statut Project brut collecté est conservé séparément de sa notion canonique éventuelle.

Le modèle applique ainsi au statut Project le même principe de traçabilité que pour les Issue Types : la valeur source n’est jamais écrasée par son interprétation.

Si aucune notion canonique n’est reconnue, la valeur brute reste conservée et le statut canonique est absent.

**Statut : Établi**


### D-176 — Recalcul du statut Project canonique avec la configuration courante

À chaque exécution du pipeline, le statut Project canonique est recalculé à partir du statut Project brut et de la configuration courante.

La notion canonique est une interprétation dérivée et non une vérité historique immuable. Une évolution de la configuration peut donc reclasser une valeur brute existante sans modification de l’Issue GitHub source.

Les traitements métier qui dépendent du statut canonique utilisent le résultat de cette canonicalisation courante.

**Statut : Établi**


### D-177 — Correspondance stricte des variantes de statut Project

La reconnaissance d’un statut Project repose uniquement sur les variantes explicitement déclarées dans la configuration.

La comparaison porte sur la valeur complète après suppression des espaces en début et fin de chaîne et sans distinction de casse. Aucune recherche par sous-chaîne n’est autorisée.

Une variante configurée doit donc représenter une valeur complète acceptable du statut Project.

**Statut : Établi**


### D-178 — Gestion d’une correspondance ambiguë de statut Project

Si une valeur brute de statut Project correspond à plusieurs notions canoniques configurées, aucune notion canonique n’est sélectionnée automatiquement.

La valeur brute est conservée, le statut canonique reste absent, les notions canoniques candidates sont signalées et le pipeline continue son exécution avec une Data Quality non bloquante.

Aucune priorité implicite entre notions canoniques n’est autorisée. Le numéro de règle `DQ-xxx` sera attribué lors du lot I5 après vérification du registre Data Quality canonique.

**Statut : Établi**


### D-179 — Conservation des données source de l’Iteration GitHub Projects

Lorsqu’une `Issue` possède une Iteration GitHub Projects, le modèle normalisé conserve au minimum son identifiant, son titre, sa date de début et sa durée ou sa date de fin lorsque ces informations sont fournies par GitHub.

Ces propriétés sont des faits source de l’Iteration et ne doivent pas être réduites au seul titre affiché.

Le contrat d’Iteration doit permettre de représenter l’absence d’une information que GitHub ne fournit pas, sans inventer de valeur.

**Statut : Établi**


### D-180 — Rattachement de l’Iteration au contexte GitHub Project

L’Iteration d’une `Issue` est conservée dans le contexte du GitHub Project qui la porte et non comme une propriété globale unique de l’Issue.

Cette règle prolonge D-172 : si une même Issue appartient à plusieurs Projects, chacun peut porter une Iteration différente sans ambiguïté ni fusion implicite.

**Statut : Établi**


### D-181 — Séparation de la Velocity brute et de la valeur numérique normalisée

Lorsqu’une valeur `Velocity` est présente dans GitHub Projects, le modèle normalisé conserve sa valeur brute et, lorsqu’elle est interprétable comme un nombre valide, une valeur numérique normalisée distincte.

La valeur numérique ne remplace jamais la valeur brute. Cette séparation permet de préserver la donnée source tout en fournissant une représentation directement exploitable par les règles métier et les analyses.

**Statut : Établi**


### D-182 — Traitement d’une Velocity non interprétable

Lorsqu’une valeur brute `Velocity` est renseignée mais ne peut pas être interprétée comme un nombre valide, la valeur brute est conservée et aucune valeur numérique normalisée n’est produite.

Le pipeline poursuit son exécution et une Data Quality non bloquante signale l’anomalie de donnée.

Le numéro de règle `DQ-xxx` correspondant sera attribué lors du lot I5 après vérification du registre Data Quality canonique.

**Statut : Établi**


### D-183 — Conservation systématique de la valeur brute Scheduling

Lorsqu’une valeur `Scheduling` est présente dans GitHub Projects, sa valeur brute telle que collectée est systématiquement conservée dans le contexte du Project qui la porte.

Toute interprétation, validation ou canonicalisation actuelle ou future de `Scheduling` reste distincte de cette valeur source et ne doit jamais l’écraser.

**Statut : Établi**


### D-184 — Conservation de l’historique des statuts GitHub Projects

Le modèle normalisé conserve l’historique des changements de statut GitHub Projects d’une `Issue`, et pas uniquement son statut courant.

Cet historique appartient au contexte du Project concerné. Il fournit notamment les faits nécessaires au calcul de dates métier telles que `correctedAt` et `completedAt` sans les déduire du seul état courant.

**Statut : Établi**


### D-185 — Contenu minimal d’une transition de statut Project

Chaque transition de statut GitHub Projects conserve au minimum le Project concerné, le statut brut précédent, le nouveau statut brut et la date/heure de transition.

Lorsqu’une information précédente n’est pas fournie par la source, elle reste absente et aucune valeur n’est inventée.

Ces données constituent les faits source de la transition et restent distinctes des interprétations canoniques.

**Statut : Établi**


### D-186 — Canonicalisation des statuts dans l’historique Project

Les statuts présents dans l’historique GitHub Projects sont canonicalisés selon les mêmes règles que le statut Project courant définies par D-175 à D-178.

Les valeurs brutes historiques restent toujours conservées. La canonicalisation est recalculée avec la configuration courante, utilise une correspondance stricte et ne choisit aucune notion canonique en cas d’ambiguïté.

**Statut : Établi**


### D-187 — Conservation exhaustive des transitions Project

Toutes les transitions de statut GitHub Projects disponibles sont conservées dans l’historique normalisé.

En particulier, plusieurs passages à `Done`, ainsi que les sorties ultérieures de `Done`, ne sont pas réduits au premier ou au dernier événement. Les règles métier sélectionnent ensuite la ou les transitions pertinentes selon leur besoin.

**Statut : Établi**


### D-188 — Gestion d’un historique Project incomplet ou indisponible

Lorsque l’historique GitHub Projects disponible est insuffisant pour déterminer une date métier requise, le pipeline conserve toutes les données effectivement disponibles et n’invente aucune date.

La date métier concernée reste absente lorsqu’elle ne peut pas être établie de manière fiable. Le pipeline poursuit son exécution et une Data Quality non bloquante signale l’insuffisance de l’historique.

Le numéro de règle `DQ-xxx` correspondant sera attribué lors du lot I5 après vérification du registre Data Quality canonique.

**Statut : Établi**


### D-189 — Audit comme spécialisation référencée de l’Issue

Un `Audit` normalisé référence son `Issue` générique via `issueId`.

Les données GitHub communes telles que le titre, l’état, les labels, l’URL, les dates natives et les données Projects restent portées par `Issue` et ne sont pas recopiées dans `Audit`.

`Audit` porte uniquement son identité et ses propriétés ou relations métier spécifiques.

**Statut : Établi**


### D-190 — Anomaly comme spécialisation référencée de l’Issue

Une `Anomaly` normalisée référence son `Issue` générique via `issueId`.

Les faits GitHub communs restent portés par `Issue` et ne sont pas dupliqués dans `Anomaly`.

`Anomaly` porte uniquement son identité et les propriétés ou relations nécessaires à son interprétation métier.

**Statut : Établi**


### D-191 — AuditImprovement comme spécialisation référencée de l’Issue

Une `AuditImprovement` normalisée référence son `Issue` générique via `issueId`.

Les faits GitHub communs restent portés par `Issue`. `AuditImprovement` ne duplique pas le titre, l’état, les labels, l’URL ou les autres propriétés génériques déjà conservées par l’Issue.

**Statut : Établi**


### D-192 — Identifiants métier propres aux spécialisations

`Audit`, `Anomaly` et `AuditImprovement` disposent chacun d’un identifiant métier propre et stable, respectivement `auditId`, `anomalyId` et `auditImprovementId`.

Ces identifiants sont distincts de `issueId`, qui reste la référence vers l’Issue GitHub normalisée sous-jacente.

La stratégie concrète de génération de ces identifiants doit être déterministe et ne doit pas rompre leur stabilité entre exécutions pour une même entité source.

**Statut : Établi**


### D-193 — Relation optionnelle Anomaly vers Audit selon son origine

Une `Anomaly` d’origine `AUDIT` porte explicitement l’`auditId` de l’Audit auquel elle est rattachée lorsque cette relation est valide.

Une `Anomaly` d’origine `HORS_AUDIT` ne porte pas d’`auditId`.

L’absence d’`auditId` peut également représenter une anomalie dont la relation attendue vers un Audit n’a pas pu être validée ; cette situation est distinguée par la Data Quality et ne doit pas être confondue avec une origine `HORS_AUDIT` valide.

**Statut : Établi**


### D-194 — Relation obligatoire AuditImprovement vers Audit

Une `AuditImprovement` est une amélioration rattachée à un Audit et porte obligatoirement l’`auditId` de son Audit parent.

Une Issue Feature qui ne permet pas d’établir une relation valide avec un Audit ne doit pas être artificiellement rattachée à un Audit. Son traitement spécialisé éventuel doit respecter les règles de qualification et de Data Quality applicables.

**Statut : Établi**


### D-195 — Component explicite sur Audit

Un `Audit` porte explicitement `componentId`.

Cette propriété est cohérente avec la règle métier selon laquelle un Audit concerne exactement un Component. Elle reste directement exploitable sans devoir recalculer le Component depuis les labels de l’Issue générique.

La valeur doit être validée à partir des faits source et des règles de reconnaissance des Components.

**Statut : Établi**


### D-196 — Component explicite sur une Anomaly d’Audit

Une `Anomaly` d’origine `AUDIT` porte explicitement le `componentId` associé à son Audit lorsque la relation est valide.

Cette propriété rend la spécialisation directement exploitable tout en restant validée par rapport à l’Audit parent et aux faits source de l’Issue.

Elle ne doit pas masquer une éventuelle incohérence entre le Component porté par l’Issue enfant et celui de l’Audit.

**Statut : Établi**


### D-197 — Gestion d’une incohérence de Component entre Audit et anomalie

Si les faits source de l’Issue enfant indiquent un Component différent de celui de l’Audit parent, le pipeline conserve les faits source et ne corrige pas automatiquement le Component.

L’incohérence est signalée par une Data Quality non bloquante. Les données dérivées ne doivent pas masquer le conflit.

Le numéro de règle `DQ-xxx` correspondant sera attribué lors du lot I5 après vérification du registre Data Quality canonique.

**Statut : Établi**


### D-198 — Conservation d’une Anomaly malgré un parent Audit absent ou invalide

Une Issue reconnue comme `Bug` reste matérialisée en `Anomaly` même lorsqu’une relation attendue vers un Audit est absente ou invalide.

Dans ce cas, aucun `auditId` invalide ou artificiel n’est produit. Les faits source et l’Anomaly sont conservés, et une Data Quality non bloquante signale l’impossibilité d’établir la relation attendue.

Cette situation ne doit pas entraîner la disparition de l’anomalie du modèle normalisé. Elle doit également rester distinguable d’une anomalie `HORS_AUDIT` correctement qualifiée.

Le numéro de règle `DQ-xxx` correspondant sera attribué lors du lot I5.

**Statut : Établi**


### D-199 — Identifiant métier stable de Version

Une `Version` normalisée dispose d’un `versionId` métier stable, distinct des identifiants GitHub des Tags, Milestones ou autres objets techniques associés.

Cet identifiant permet de référencer la Version de manière stable dans le modèle normalisé indépendamment des représentations GitHub qui contribuent à son établissement.

**Statut : Établi**


### D-200 — Numéro PROD canonique de Version

La propriété de version principale d’une `Version` normalisée est son numéro PROD canonique au format `M.m.r`, par exemple `4.2.1`.

Ce numéro reste distinct de la Release Candidate éventuellement auditée avant publication. Une RC ne remplace pas l’identité de la Version PROD cible.

**Statut : Établi**


### D-201 — Git tag PROD requis pour considérer une Version publiée

Une Version PROD n’est considérée comme effectivement publiée que si le Git tag correspondant exactement à son numéro canonique `M.m.r` existe.

Une Milestone, un Audit ou une autre donnée faisant référence à `M.m.r` peut permettre d’identifier une Version attendue, mais ne suffit pas à établir sa publication effective.

**Statut : Établi**


### D-202 — Git tag PROD comme source de vérité de releasedAt

`Version.releasedAt` est déterminé par la date du Git tag PROD `M.m.r`, conformément à D-144.

La date d’une Milestone, d’une GitHub Release ou d’un autre objet ne se substitue pas silencieusement à cette date source.

Si la date du tag ne peut pas être établie, `releasedAt` reste absent.

**Statut : Établi**


### D-203 — Conservation d’une Version identifiable sans tag PROD

Lorsqu’une Version PROD `M.m.r` est identifiable à partir d’une Milestone, d’un Audit ou d’un autre fait métier mais que le Git tag PROD correspondant est absent, la Version reste conservée dans le modèle normalisé.

Elle n’est pas considérée comme publiée, `releasedAt` reste absent et une Data Quality non bloquante signale l’absence du tag attendu.

Le numéro de règle `DQ-xxx` correspondant sera attribué lors du lot I5.

**Statut : Établi**


### D-204 — Rattachement de la Milestone PROD à la Version

Lorsqu’une Milestone correspondant à la Version PROD `M.m.r` existe, la `Version` conserve explicitement sa référence via `milestoneId`.

Cette relation ne fait pas de la Milestone la source de vérité de `releasedAt`, qui reste déterminé par le Git tag PROD conformément à D-202.

**Statut : Établi**


### D-205 — Séparation entre Version PROD cible et RC auditée

Pour un Audit pré-PROD, le modèle conserve explicitement la Release Candidate réellement auditée, par exemple `4.2.1-rc.3`, séparément de la Version PROD cible `4.2.1`.

La RC auditée est une propriété du contexte d’Audit et ne remplace pas l’identité canonique de la Version PROD cible.

**Statut : Établi**


### D-206 — Conservation du Git tag de la RC auditée

Lorsque la Release Candidate auditée possède un Git tag, le modèle conserve explicitement la référence à ce tag ainsi que sa date disponible.

Ces informations restent distinctes du Git tag PROD et de `Version.releasedAt`.

**Statut : Établi**


### D-207 — Gestion d’une RC auditée indéterminable

Pour un Audit pré-PROD dont la Version PROD cible est connue mais dont la Release Candidate réellement auditée ne peut pas être déterminée, l’Audit est conservé et aucune RC n’est inventée, conformément à D-142.

La donnée RC reste absente et une Data Quality non bloquante signale l’information manquante.

Le numéro de règle `DQ-xxx` correspondant sera attribué lors du lot I5.

**Statut : Établi**


### D-208 — Version cible d’un Audit de rattrapage

Un Audit de rattrapage réalisé après publication référence directement la Version PROD canonique `M.m.r`.

Aucune Release Candidate artificielle n’est requise ou créée pour un Audit de rattrapage. Cette règle prolonge D-142 et distingue explicitement le scénario pré-PROD du scénario de rattrapage.

**Statut : Établi**


### D-209 — Catalogue historique propre à chaque Version PROD

Chaque Version PROD possède son propre Catalogue historique, représentant les Components présents dans le repository pour cette Version.

**Statut : Établi**


### D-210 — Catalogue historique lu dans le Git tree du tag PROD

Le Catalogue historique d’une Version est reconstruit à partir du fichier de catalogue présent dans le Git tree du tag PROD exact `M.m.r`. Le catalogue courant ne sert jamais de substitut rétroactif.

**Statut : Établi**


### D-211 — Catalogue indéterminable lorsqu’un tag PROD manque

Si une Version est identifiable mais que son tag PROD est absent, son Catalogue historique est indéterminable. Le catalogue courant n’est pas utilisé comme fallback.

**Statut : Établi**


### D-212 — Catalogue absent ou illisible au tag PROD

Si le tag PROD existe mais que le fichier Catalogue attendu est absent ou illisible dans ce tag, la Version est conservée, son Catalogue historique reste indéterminable et une Data Quality non bloquante est produite. Son identifiant `DQ-xxx` sera attribué en I5.

**Statut : Établi**


### D-213 — Conservation historique d’un Component supprimé

Un Component présent dans le Catalogue d’une ancienne Version reste membre du Catalogue historique de cette Version même s’il a ensuite été supprimé du catalogue courant.

**Statut : Établi**


### D-214 — Absence historique d’un Component ajouté ultérieurement

Un Component ajouté après une Version `M.m.r` est absent du Catalogue historique de cette Version. Sa présence actuelle ne doit jamais être rétroprojetée.

**Statut : Établi**


### D-215 — Identifiant métier stable de Component

Chaque `Component` possède un `componentId` métier stable, distinct de son nom ou libellé affiché.

**Statut : Établi**


### D-216 — Identité d’un Component conservée entre Versions continues

Lorsqu’un même Component métier est présent dans plusieurs Versions continues, il conserve le même `componentId` afin de permettre son suivi longitudinal.

**Statut : Établi**


### D-217 — Renommage explicite d’un Component

Un renommage peut conserver le `componentId` lorsqu’il est explicitement établi que le Component métier reste le même. Cette continuité doit être déclarée par configuration ou règle explicite et ne doit jamais être devinée automatiquement.

**Statut : Établi**


### D-218 — Nouvelle identité après disparition puis réapparition

Lorsqu’un Component disparaît du Catalogue pendant une ou plusieurs Versions puis réapparaît, sa réapparition ne réutilise pas le `componentId` historique précédent. Elle constitue une nouvelle identité métier.

**Statut : Établi**


### D-219 — Matérialisation de la relation Component × Version

Le modèle normalisé matérialise explicitement la présence d’un Component dans une Version. Les KPI et verdicts ne doivent pas reconstruire implicitement cette relation à partir du catalogue courant.

**Statut : Établi**


### D-220 — Couverture fondée sur au moins un Audit terminé applicable

Un couple `Component × Version` est couvert dès lors qu’au moins un Audit applicable à ce couple est terminé au sens métier défini par D-141.

**Statut : Établi**


### D-221 — Audit incomplet insuffisant pour la couverture

Un Audit commencé mais non terminé ne rend jamais un couple `Component × Version` couvert à lui seul.

**Statut : Établi**


### D-222 — Verdict courant agrégé sur l’ensemble des Audits terminés applicables

Le verdict courant d’un couple `Component × Version` est calculé à partir de l’ensemble des Audits terminés applicables à ce couple, et non à partir du seul Audit terminé le plus récent. Tous les Audits terminés applicables contribuent à l’état courant selon les règles de conformité. Cette décision remplace la règle antérieure de sélection du dernier Audit terminé portée notamment par D-046.

**Statut : Établi**


### D-223 — Un Audit incomplet ne modifie pas le verdict acquis

Un Audit plus récent mais incomplet ne contribue pas au verdict courant et ne remplace pas l’état acquis à partir des Audits terminés applicables.

**Statut : Établi**


### D-224 — Conformité conditionnée à l’absence d’anomalie d’Audit ouverte pertinente

Un couple `Component × Version` couvert ne peut être conforme que si l’ensemble des Audits terminés applicables pris en compte pour son verdict ne laisse aucune anomalie d’Audit ouverte affectant la conformité.

**Statut : Établi**


### D-225 — AuditImprovement sans effet sur le verdict de conformité

Une `AuditImprovement`, ouverte ou fermée, n’intervient jamais dans le calcul du verdict de conformité d’un couple `Component × Version`.

**Statut : Établi**


### D-226 — Correction d’une anomalie insuffisante pour rétablir la conformité

La correction ou la fermeture d’une anomalie issue d’un Audit ne rétablit pas à elle seule la conformité du Component. Le Component reste non conforme jusqu’à ce qu’un nouvel Audit terminé applicable valide la conformité. L’anomalie corrigée reste conservée dans l’historique.

**Statut : Établi**


### D-227 — Anomalie HORS_AUDIT sans effet direct sur la conformité d’Audit

Une anomalie d’origine `HORS_AUDIT` ne modifie pas directement le verdict de conformité calculé à partir des Audits applicables au couple `Component × Version`.

**Statut : Établi**


### D-228 — État NON_COUVERT en absence d’Audit terminé applicable

Si un Component appartient au Catalogue historique d’une Version mais ne possède aucun Audit terminé applicable, son état est `NON_COUVERT` / non évalué. Il ne doit jamais être assimilé à `NON_CONFORME`.

**Statut : Établi**


### D-229 — Issue Audit sans Component reconnu

Si une Issue reconnue comme Audit ne possède aucun Component reconnu, l’Issue générique est conservée mais aucun `Audit` métier valide n’est matérialisé. Aucun Component n’est inventé. Une Data Quality non bloquante signale l’absence du Component requis. Son identifiant `DQ-xxx` sera attribué en I5.

**Statut : Établi**


### D-230 — Issue Audit avec plusieurs Components reconnus

Si une Issue reconnue comme Audit possède plusieurs Components reconnus, l’Issue générique est conservée mais aucun `Audit` métier valide n’est matérialisé. Le pipeline ne sélectionne jamais arbitrairement un Component. Une Data Quality non bloquante signale la violation de cardinalité. Son identifiant `DQ-xxx` sera attribué en I5.

**Statut : Établi**


### D-231 — Issue Audit sans Version PROD cible déterminable

Si la Version PROD cible d’une Issue Audit ne peut pas être déterminée, l’Issue générique est conservée mais aucun `Audit` métier complet et valide n’est matérialisé. Aucune Version cible n’est inventée. Une Data Quality non bloquante signale l’information manquante. Son identifiant `DQ-xxx` sera attribué en I5.

**Statut : Établi**


### D-232 — Conservation des anomalies enfants d’un Audit invalide

Lorsqu’une Issue Audit parente existe mais ne peut pas être matérialisée comme `Audit` valide, ses Issues `Bug` enfants restent conservées et sont matérialisées comme `Anomaly`. Aucun `auditId` invalide ou artificiel n’est produit. Les Data Quality correspondant à l’Audit invalide et à la relation d’anomalie non validable sont conservées.

**Statut : Établi**


### D-233 — Feature enfant sans Audit parent valide

Une Issue `Feature` dont l’Audit parent est absent ou invalide reste conservée comme `Issue` générique mais n’est pas matérialisée en `AuditImprovement`. Un `AuditImprovement` exige un Audit parent valide conformément à D-194. Une Data Quality non bloquante peut signaler la relation attendue non validable.

**Statut : Établi**


### D-234 — Bug rattaché à plusieurs Audits valides

Si une Issue `Bug` est sous-Issue de plusieurs Audits valides, l’`Anomaly` est conservée mais la relation vers l’Audit est considérée ambiguë. Aucun `auditId` n’est sélectionné automatiquement. Une Data Quality non bloquante expose l’ambiguïté et les Audits candidats.

**Statut : Établi**


### D-235 — Feature rattachée à plusieurs Audits valides

Si une Issue `Feature` est sous-Issue de plusieurs Audits valides, aucune `AuditImprovement` n’est matérialisée tant que la relation vers l’Audit n’est pas univoque. L’Issue générique reste conservée et une Data Quality non bloquante expose l’ambiguïté et les Audits candidats.

**Statut : Établi**


### D-236 — Origine indéterminée d’une anomalie à relation Audit non validable

Lorsqu’une Issue `Bug` présente une relation qui suggère une origine Audit mais que cette relation ne peut pas être validée, son origine n’est pas artificiellement classée `HORS_AUDIT`. L’anomalie est conservée avec une origine indéterminée et la Data Quality appropriée.

**Statut : Établi**


### D-237 — Trois valeurs canoniques pour Anomaly.origin

Le contrat normalisé de `Anomaly.origin` accepte trois valeurs canoniques : `AUDIT`, `HORS_AUDIT` et `UNDETERMINED`. `UNDETERMINED` représente les situations où les faits source suggèrent une relation d’Audit mais ne permettent pas de la valider. Cette décision étend D-138.

**Statut : Établi**


### D-238 — Cardinalité Component des anomalies HORS_AUDIT

Une `Anomaly` d’origine `HORS_AUDIT` n’impose pas exactement un Component. Elle conserve le rattachement 0..n Components dérivé de son Issue générique.

**Statut : Établi**


### D-239 — Cardinalité Component des anomalies UNDETERMINED

Une `Anomaly` d’origine `UNDETERMINED` conserve également les 0..n Components dérivés de son Issue générique. Le pipeline ne sélectionne pas artificiellement un Component.

**Statut : Établi**


### D-240 — Unicité des spécialisations par Issue

Une Issue GitHub donnée peut produire au maximum une instance de chaque spécialisation métier qui lui est applicable. Une ambiguïté ou une cardinalité source invalide ne doit jamais être résolue en dupliquant `Audit`, `Anomaly` ou `AuditImprovement`.

**Statut : Établi**


### D-241 — Intégrité référentielle du modèle normalisé

Toute référence normalisée telle que `issueId`, `auditId`, `componentId`, `versionId` ou `milestoneId` doit pointer vers une entité réellement présente dans le dataset normalisé lorsque la relation est matérialisée. Si une relation attendue ne peut pas être résolue, aucune référence orpheline n’est créée : la référence reste absente et une Data Quality non bloquante signale l’incohérence.

**Statut : Établi**


### D-242 — Déterminisme de la normalisation

À dataset brut et configuration identiques, la normalisation produit les mêmes identifiants métier, classifications et relations, indépendamment de l’ordre des objets collectés. La génération des identifiants et les règles de résolution ne dépendent ni de l’ordre d’itération ni d’un état d’exécution non déterministe.

**Statut : Établi**


### D-243 — Clôture conditionnelle du lot I1 avant implémentation

I1 est fonctionnellement spécifié lorsque ses décisions permettent de définir les contrats TypeScript sans ambiguïté métier bloquante. Avant de déclarer I1 `GREEN` et de modifier le code, un checkpoint final est réalisé sur un ZIP complet et à jour du repository contenant les décisions appliquées jusqu’à D-243. Il vérifie au minimum décisions actives/supplantées, documentation, configuration, contrats TypeScript existants, tests et fixtures. Les questions non bloquantes restantes sont reportées aux lots I2 à I9.

**Statut : Établi**


















---

## 4. Questions ouvertes — Librairies, Packages et Repositories

### Q-001 — Propriétés du Package

Quelles propriétés doivent définir un Package dans le modèle métier ?

**Statut : À instruire**

---

### Q-002 — Plusieurs Packages pour une Librairie

Dans quels cas une Librairie pourrait-elle être distribuée par plusieurs Packages ?

**Statut : À instruire**

---

### Q-003 — Plusieurs Librairies dans un Repository

Comment les Librairies devront-elles être identifiées dans un futur monorepo ?

**Statut : À instruire**

---

### Q-004 — Composants et Packages

Dans le cas futur où une Librairie possède plusieurs Packages, un Composant appartient-il à la Librairie, à un Package ou potentiellement à plusieurs Packages ?

**Statut : À instruire**

---

## 5. Questions ouvertes — Versions et Releases

### Q-005 — Cycle Release Candidate vers PROD

Le cycle release vers PROD est établi.

Le fonctionnement cible prévoit en complément la réalisation des Audits sur une Release Candidate avant la PROD.

**Statut : Établi**

---

### Q-006 — Cycle Hotfix Candidate vers PROD

Le cycle hotfix vers PROD est établi.

**Statut : Établi**

---

### Q-007 — Release GitHub

Une Release GitHub doit-elle systématiquement exister pour toute Version PROD et comment est-elle créée ?

**Statut : À confirmer**

---

### Q-008 — Milestone PROD manquante

Comment traiter une Version PROD pour laquelle la Milestone `M.m.r` serait absente ?

**Statut : À instruire ultérieurement dans les règles**

---

### Q-009 — Tag Git manquant

Comment traiter une Version publiée dans Nexus PROD lorsque le Tag attendu est absent ?

**Statut : À instruire ultérieurement dans les règles**

---

### Q-010 — Version d'Audit

`M.m.r-Audit` représente un Audit de rattrapage de `M.m.r`, et non une Version distincte.

Le fonctionnement cible réalise l'Audit sur `M.m.r-rc.n` avant la PROD.

**Statut : Établi**

---

## 6. Questions ouvertes — Anomalies

### Q-011 --- Définition d'une Anomalie

Une Issue GitHub de type `🐛 Bug` est une **Anomalie hors Audit**.

Lorsqu'une Issue `🐛 Bug` est reliée comme sub-Issue à un Audit, elle
est une **Anomalie issue de cet Audit**.

La relation d'Audit distingue l'origine de l'Anomalie.

**Statut : Établi**

---

### Q-012 --- Origine d'une Anomalie

Pour la V1, deux origines sont distinguées :

```text
AUDIT
HORS_AUDIT
```

Aucune taxonomie plus détaillée de `HORS_AUDIT` n'est nécessaire en V1.

Pour une V2, il faudra challenger une qualification plus fine de la
provenance, notamment interne ou externe à la Squad, ainsi que les
indicateurs associés.

**Statut : Établi pour la V1 --- évolution V2 à instruire**

---

### Q-013 --- Date de détection

La date de détection d'une Anomalie est la date de création de l'Issue
`🐛 Bug` dans GitHub.

```text
detectedAt = GitHub Issue.createdAt
```

**Statut : Établi**

---

### Q-014 --- Date de correction

La date de correction d'une Anomalie est la date à laquelle l'Issue
`🐛 Bug` passe au statut Project `Done`.

```text
correctedAt = date du passage à Done
```

Dans le fonctionnement nominal, cette date doit également correspondre à
la fermeture de l'Issue et au merge de la Pull Request de correction
lorsqu'une Pull Request est requise.

**Statut : Établi**

---

## 7. Questions ouvertes — Audits

### Q-015 — Objet Audit

L'Audit doit-il devenir un objet métier explicite indépendant de l'Issue GitHub représentant le travail d'Audit ?

**Statut : À instruire**

---

### Q-016 — Campagne d'Audit

Comment une Campagne d'Audit est-elle identifiée ?

**Statut : À instruire**

---

### Q-017 — Résultat d'un Audit

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

Une ou plusieurs sub-Issues d'Amélioration, y compris encore ouvertes, n'empêchent pas le composant d'être `AUDITÉ & CONFORME` si aucune Anomalie n'est présente.

Les Améliorations sont donc exclues du calcul du verdict de conformité.

**Statut : Établi pour le fonctionnement actuel**

---

### Q-018 — Version auditée

Pour un Audit pré-PROD, la Version auditée est une Release Candidate `M.m.r-rc.n`.

Pour un Audit de rattrapage, la Version auditée est la PROD `M.m.r`.

Il reste à déterminer comment identifier précisément la Release Candidate effectivement auditée.

**Statut : Partiellement établi**

---

### Q-019 --- Temporalité exacte de l'Audit

Un Audit est réalisé lorsque son Issue est simultanément `Done` et
`Closed`.

Sa date métier de fin est :

```text
Audit.completedAt = date du passage au statut Project Done
```

À cette date, le Component concerné est considéré comme audité pour les
calculs historiques.

La date de début de l'Audit reste à définir si un besoin métier ou un
indicateur la nécessite.

**Statut : Partiellement établi --- fin d'Audit établie**

---

## 8. Questions ouvertes — Workflow

### Q-020 — Profils de workflow

Les profils STANDARD, EPIC, AUDIT, RELEASE et CONCEPTION doivent-ils être formalisés comme des profils métier distincts ?

**Statut : À confirmer**

---

### Q-021 — Exceptions aux règles de Pull Request

Pour quels profils une Pull Request n'est-elle pas obligatoire avant Done ?

**Statut : À formaliser**

---

### Q-022 — Statut Cancelled

Quelles propriétés ou relations sont interdites lorsqu'une Issue est Cancelled ?

**Statut : À formaliser**

---

## 9. Questions ouvertes — Applications consommatrices

### Q-023 — Identification des Applications

Quelle source permet de connaître les Applications qui utilisent ou devraient utiliser le Design System ?

**Statut : Futur**

---

### Q-024 — Détection des Packages utilisés

Comment déterminer qu'une Application utilise un Package donné ?

**Statut : Futur**

---

### Q-025 — Détection de la Version utilisée

Comment déterminer la Version effectivement utilisée par une Application ?

**Statut : Futur**

---

### Q-026 — Versions non-PROD utilisées par les consommateurs

Comment traiter une Application utilisant une Version SNAPSHOT, RC ou HC ?

**Statut : Futur**

---

### Q-027 — Détection des Composants utilisés

Comment identifier les Composants utilisés et leur nombre d'utilisations ?

**Statut : Futur**

---

### Q-028 — Dette de montée de Version

Comment définir la dette liée à l'utilisation d'une ancienne Version PROD ?

**Statut : Futur**

---

### Q-029 — Alertes aux Squads

Quelles situations doivent provoquer une alerte à destination d'une Squad responsable ?

**Statut : Futur**

---

## 10. Questions ouvertes — Qualité

### Q-030 — Qualité d'une Version

Comment calculer la qualité d'une Version en distinguant Audit pré-PROD et Audit de rattrapage ?

**Statut : À instruire**

---

### Q-031 — Qualité d'un Composant

Comment calculer la qualité d'un Composant pour une Version donnée ?

**Statut : À instruire**

---

### Q-032 — Badge ou note d'une Application

Comment construire une information synthétique de qualité pour une Application à partir des Packages, Versions et Composants utilisés ?

**Statut : Futur**

---

### Q-033 — RGAA / WAI-ARIA d'une Application

Quelle signification précise doit avoir une note ou un badge RGAA / WAI-ARIA d'une Application ?

**Statut : Futur**

---

## 11. Questions ouvertes — Historisation

### Q-034 — Granularité historique

Quels événements doivent provoquer la création d'un Snapshot ?

**Statut : À instruire**

---

### Q-035 — Historisation de la connaissance de la qualité

Comment distinguer la qualité connue à la publication de celle découverte ultérieurement ?

**Statut : À instruire**

---

### Q-036 — Conservation

Quelle durée d'historique doit être conservée ?

**Statut : À instruire**

---

## 12. Questions ouvertes — Sources externes

### Q-037 — Nexus

Quelles informations Nexus sont nécessaires au pipeline ?

**Statut : À instruire techniquement**

---

### Q-038 — Jenkins

Le pipeline doit-il interroger directement Jenkins ou GitHub et Nexus fournissent-ils suffisamment d'informations ?

**Statut : À instruire techniquement**

---

### Q-039 — Applications consommatrices

Quelle source permettra d'identifier les Applications et leurs dépendances ?

**Statut : Futur**

---

### Q-040 — Usage des Composants

Quelle source permettra de mesurer l'utilisation réelle des Composants ?

**Statut : Futur**

---

## 13. Questions ouvertes — Architecture

### Q-041 — Backend

À quel moment le dashboard statique devra-t-il évoluer vers une architecture avec backend ?

**Statut : À instruire ultérieurement**

---

### Q-042 — Stockage historique

Quel système doit conserver les Snapshots à terme ?

**Statut : À instruire ultérieurement**

---

### Q-043 — Multi-source

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

## 14. Nouvelles questions issues de la modélisation des Audits

### Q-044 — Familles d'Audit

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

### Q-045 — Représentation de la famille d'Audit

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

### Q-046 — Cardinalité de la famille d'Audit

Une Issue d'Audit possède-t-elle exactement une famille ou peut-elle appartenir à plusieurs familles ?

**Statut : À instruire**

---

### Q-047 — Cardinalité du Composant

Une Issue d'Audit doit obligatoirement être rattachée à **un et un seul Composant** au moyen d'un label `🧩 Component:xxx`.

Une Issue d'Audit sans Composant ou avec plusieurs Composants est invalide.

**Statut : Établi**

---

### Q-048 --- Release Candidate réellement auditée

Pour un Audit pré-PROD :

- la Milestone de l'Issue d'Audit porte la Version cible `M.m.r` ;
- un champ explicite de l'Issue d'Audit porte la RC réellement auditée
    `M.m.r-rc.n`.

La Milestone et le champ de RC auditée sont complémentaires.

**Statut : Établi**

---

### Q-049 — Fin d'une Issue d'Audit

Une Issue d'Audit est considérée comme terminée lorsque :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Le seul statut Done ou le seul état Closed n'est pas suffisant.

**Statut : Établi**

---

### Q-050 — Relation Issue d'Audit / Anomalie

La relation Audit → Anomalie est désormais établie :

- une Anomalie provenant d'un Audit doit obligatoirement être une sous-Issue de cet Audit ;
- elle doit porter exactement un `🧩 Component:xxx`, identique à celui de l'Audit parent ;
- chaque Anomalie d'Audit appartient à **un seul et unique Audit parent** ;
- un Audit peut avoir zéro, une ou plusieurs Anomalies.

Lors d'une revalidation, une nouvelle Anomalie est créée si le problème est de nouveau constaté ; l'ancienne Anomalie n'est pas rattachée au nouvel Audit.

**Statut : Établi**

---

### Q-051 — Passage en PROD et couverture des Audits

Toutes les Issues d'Audit prévues doivent-elles être terminées avant le passage en PROD ?

**Statut : À instruire**

---

### Q-052 — Passage en PROD et Anomalies détectées

Quelles Anomalies détectées pendant les Audits empêchent la publication de la Version PROD ?

**Statut : À instruire**

---

### Q-053 — Migration vers l'Issue Type `🔍 Audit`

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

### Q-054 — Valeur de Version dans `package.json`

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

### Q-055 — Template d'Issue d'Audit

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

### Q-056 — Catégorisation des Améliorations d'Audit

Pour une Improvement issue d'un Audit, plusieurs éléments sont désormais établis :

- elle est obligatoirement une sous-Issue de l'Issue d'Audit ;
- elle appartient à un seul et unique Audit parent ;
- son Issue Type est obligatoirement `✨ Feature` ;
- elle porte exactement un label `🧩 Component:xxx`, identique à celui de l'Audit parent ;
- elle ne porte aucune criticité `🚦 rgaa:bloquante`, `🚦 rgaa:majeure` ou `🚦 rgaa:mineure` ;
- sa catégorie `♿ a11y:xxx` est facultative ;
- elle n'intervient pas dans le verdict de conformité.

La catégorisation complémentaire envisagée pour les Improvements, ainsi que la cardinalité maximale des labels `♿ a11y:xxx` lorsqu'ils sont présents, restent à instruire.

**Statut : Partiellement établi**

---

### Q-057 — Cardinalité des catégories Accessibilité d’une Anomalie

Les labels `♿ a11y:xxx` constituent une catégorisation accessibilité transverse et peuvent être utilisés sur des Anomalies d'Audit, des Improvements d'Audit et des Issues hors Audit.

Les cardinalités suivantes sont établies :

- **Anomalie d'Audit Accessibilité** : exactement un label `♿ a11y:xxx` ;
- **Improvement d'Audit Accessibilité** : le label `♿ a11y:xxx` est facultatif ; zéro est autorisé.

Pour une Improvement d'Audit Accessibilité, la cardinalité maximale n'est pas connue : il n'est pas établi si elle doit être limitée à un label ou peut en porter plusieurs. Tant que ce point n'est pas confirmé, plusieurs catégories doivent être représentables et ne doivent pas être signalées comme une incohérence.

Les règles de cardinalité applicables aux Issues hors Audit restent également à confirmer.

**Statut : Partiellement établi — cardinalité maximale des Improvements et règles hors Audit à confirmer**

---

### Q-058 — Évolution du référentiel de criticité RGAA

Le périmètre d'utilisation des criticités RGAA est désormais établi.

Les labels `🚦 rgaa:bloquante`, `🚦 rgaa:majeure` et `🚦 rgaa:mineure` sont strictement réservés aux Anomalies provenant d'un Audit Accessibilité. Ils sont interdits sur les Improvements d'Audit et sur les Issues hors Audit.

Le schéma actuel comporte exactement ces trois valeurs. Son éventuelle évolution future reste à traiter comme une évolution explicite du référentiel et ne doit pas être déduite automatiquement.

**Statut : Partiellement établi — périmètre actuel établi, évolution future du référentiel à instruire**

---

### Q-059 — Critères d'attribution des criticités RGAA

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

### Q-060 — Revalidation d'un Composant après correction des Anomalies

Le modèle cible retenu est la création d'une nouvelle Issue d'Audit du Composant après correction des Anomalies.

La fermeture de toutes les Anomalies ne suffit pas à rétablir automatiquement l'état `AUDITÉ & CONFORME`.

La nouvelle Issue d'Audit :

- matérialise la revalidation du Composant ;
- permet à l'auditeur de produire un nouveau verdict de conformité ;
- permet de suivre explicitement l'activité de revalidation dans les Sprints et Milestones ;
- conserve une trace distincte entre l'Audit initial et la revalidation après correction.

Il reste à préciser le déclenchement exact de cette nouvelle Issue d'Audit et son rattachement aux Iterations/Milestones.

**Statut : Modèle cible établi ; modalités opérationnelles à préciser**

---

### Q-061 — Responsable et déclencheur de la clôture d'une Anomalie

Le workflow n'est pas encore définitivement défini.

L'hypothèse actuelle est que le développeur ou la squad met l'Anomalie à `Done` puis `Closed` lorsque la Pull Request de correction est mergée sur la branche cible, sous réserve que la revue attendue de l'auditeur ait été réalisée positivement.

Il reste à confirmer :

- que le développeur ou la squad est bien responsable de cette transition ;
- que le merge sur la branche cible constitue bien le déclencheur opérationnel ;
- comment la validation de l'auditeur est matérialisée et contrôlée avant la clôture.

La clôture de l'Anomalie ne rétablit pas automatiquement la conformité du Composant. Celle-ci sera réévaluée dans une nouvelle Issue d'Audit.

**Statut : À confirmer**

---

### Q-062 — Déclenchement de l'Audit de revalidation

La nouvelle Issue d'Audit de revalidation n'est pas déclenchée automatiquement par la fermeture de toutes les Anomalies.

Son déclenchement relève d'un choix collectif de la Squad, en fonction du contexte et du niveau de correction jugé suffisant pour demander une nouvelle évaluation à l'auditeur.

Exemples évoqués, sans valeur de règle :

- toutes les Anomalies `bloquantes` sont traitées ;
- toutes les Anomalies sauf les `mineures` sont traitées ;
- toutes les Anomalies sont traitées ;
- autre seuil décidé collectivement.

Le dashboard peut suivre l'état des corrections et fournir les informations nécessaires à cette décision, mais il ne doit pas déduire lui-même que le Composant est conforme.

Il reste à préciser comment cette décision collective est matérialisée dans GitHub et qui crée l'Issue d'Audit de revalidation.

**Statut : Principe établi ; mécanisme opérationnel à instruire**

---

### Q-063 — Matérialisation de la décision de revalidation

Le déclenchement d'un nouvel Audit de revalidation relève d'un choix collectif de la Squad.

Il reste à déterminer comment cette décision est matérialisée dans GitHub et dans le workflow : création manuelle de l'Issue d'Audit, action ou champ du Project, label, automatisation déclenchée explicitement, ou autre mécanisme.

Il reste également à préciser qui est responsable de créer l'Issue d'Audit de revalidation après cette décision collective.

**Statut : À instruire**

---

### Q-064 — Lien entre Anomalies successives portant sur un même problème

Lorsqu'une nouvelle Anomalie correspond au même problème qu'une Anomalie issue d'un Audit précédent, aucune relation explicite entre les deux Issues n'est requise.

Le rattachement de chacune à son Issue d'Audit respective est suffisant :

```text
Audit A → Anomalie A
Audit B → Anomalie B
```

Le dashboard ne doit pas fabriquer une relation métier de type `récurrence de`.

Une éventuelle analyse de récurrence pourra être étudiée ultérieurement comme un indicateur calculé, indépendamment des relations métier sources.

**Statut : Établi**

---

### Q-065 — Changement de Version entre deux Audits successifs

Deux Audits successifs d'un même Composant peuvent porter sur des Versions différentes selon les choix de la Squad.

Cette possibilité est établie, même si elle peut être contraire au fonctionnement idéal recherché.

Il reste à préciser ultérieurement si le dashboard doit :

- simplement exposer la Version effectivement auditée à chaque Audit ;
- signaler un changement de Version entre un Audit ayant détecté des Anomalies et l'Audit de revalidation ;
- ou appliquer une autre règle de pilotage sans bloquer le workflow.

**Statut : Fait établi ; règle de pilotage à instruire**

---

### Q-066 — Annotation d'une Version non conforme dont les Anomalies sont corrigées

Une Version peut conserver un verdict historique `NON CONFORME` alors que ses Anomalies ont été corrigées dans une Version ultérieure qui n'a pas encore obtenu de verdict `CONFORME`.

Une annotation distincte du verdict pourrait permettre de représenter cette situation.

Il reste à définir son nom, ses états, ses conditions de calcul, le rattachement des corrections à la Version qui les contient et sa représentation dans le dashboard.

**Statut : À instruire**

---

### Q-067 — Traitement de plusieurs Audits d'un même Composant et d'une même Version

La règle historique qui sélectionnait le dernier Audit réalisé a été
supplantée par D-222.

Le verdict courant du couple `Component × Version` est désormais calculé
à partir de **l'ensemble des Audits terminés applicables**. La date de
réalisation définie par D-047 reste utile pour l'historique et
l'ordonnancement, mais elle ne sert plus à sélectionner un unique Audit
comme source du verdict courant.

**Statut : Supplanté par D-222**

---

### Q-068 — Disponibilité de la date de passage au statut Done

La date de réalisation d'un Audit nécessite de connaître l'instant où l'Issue est devenue `Done` ainsi que sa date de fermeture, afin de retenir l'instant où la seconde condition `Done + Closed` a été satisfaite.

Il reste à vérifier que la source GitHub collectée permet d'obtenir de manière fiable l'historique ou la date de transition du Project vers `Done`.

**Statut : À vérifier techniquement**

---

### Q-069 — Présentation d'un Audit en cours à côté du verdict courant

Pour un même couple `Component × Version`, le dashboard doit pouvoir
afficher simultanément :

- le verdict courant calculé à partir de l'ensemble des Audits terminés
  applicables conformément à D-222 ;
- l'existence éventuelle d'un nouvel Audit en cours.

Un Audit incomplet ne contribue pas au verdict courant conformément à
D-223.

Le principe métier est établi. La représentation UX exacte reste à
instruire : badge séparé, statut secondaire, lien vers l'Issue d'Audit,
date d'activité ou combinaison de ces éléments.

**Statut : Principe établi par D-222 et D-223 ; représentation UX à instruire**

---

### Q-070 — Sévérité de plusieurs Audits non terminés pour un même Composant et une même Version

La présence de plusieurs Issues d'Audit non terminées pour le même couple `Composant × Version` est désormais considérée comme une situation anormale.

Il reste à déterminer comment cette anomalie de données/workflow devra être classée dans le futur moteur de règles : information, avertissement, erreur bloquante, ou autre niveau de sévérité.

**Statut : À instruire lors de la définition des règles de qualité**

---

### Q-071 — Source de la Version effectivement auditée

La Milestone constitue la référence structurante permettant d'identifier la Version de référence et le contexte de l'Audit :

- `M.m.r` pour le cycle normal ;
- `M.m.r-Audit` pour le rattrapage.

L'Issue d'Audit contient également dans son template le champ :

```text
Version auditée : <version>
```

Ce champ conserve la Version effectivement testée et peut être plus précis que la Milestone, notamment pour un Audit pré-PROD effectué sur une Release Candidate.

Exemple :

```text
Milestone       : 1.8.0
Version auditée : 1.8.0-rc.42
```

**Statut : Établi**

---

### Q-072 — Cohérence entre Milestone et champ Version auditée

La `Version auditée` doit appartenir à la Version de référence portée par la Milestone.

Exemples :

```text
Milestone       : 1.8.0
Version auditée : 1.8.0-rc.42
→ cohérent
```

```text
Milestone       : 1.8.0
Version auditée : 1.9.0-rc.3
→ incohérent
```

Pour une Milestone de rattrapage telle que `1.8.0-Audit`, la Version de référence normalisée est `1.8.0`.

Une incohérence constitue une anomalie de données à signaler.

**Statut : Établi**

---

### Q-073 — Sévérité d'une incohérence de Version d'Audit

Une incohérence entre la Version de référence portée par la Milestone et le champ `Version auditée :` constitue une anomalie de données.

Il reste à déterminer la sévérité de cette anomalie dans le futur moteur de qualité et son impact éventuel sur le calcul de conformité.

**Statut : À instruire lors de la définition des règles de qualité**

---

### Q-074 — Représentation d'une Version auditée manquante

Lorsqu'une Milestone valide permet de poursuivre l'analyse mais que le champ `Version auditée :` est absent, l'Audit reste exploitable avec une donnée partielle.

Il reste à définir comment cette information manquante sera représentée dans le dashboard et dans les métadonnées de fiabilité : avertissement, indicateur de complétude, annotation sur l'Audit, ou autre représentation.

**Statut : À instruire lors de la définition de la qualité des données et de l'UX**

---

### Q-075 — Traitement d'un Audit bloqué par l'absence de Milestone

Une Issue d'Audit `Done + Closed` sans Milestone reste comptabilisée dans l'activité d'Audit.

Elle est en revanche exclue des calculs nécessitant un rattachement fiable à `Composant × Version`, notamment la conformité.

Cette décision implique une appréciation de la qualité des données spécifique à chaque métrique.

**Statut : Établi**

---

### Q-076 — Dénominateur et héritage de la couverture d'Audit

La couverture d'Audit est calculée sur le nombre total de Composants du Catalogue.

```text
Couverture d'Audit
=
Composants disposant d'un Audit applicable
/
Composants du Catalogue
```

Exemple : 17 Composants audités sur 20 Composants au Catalogue donnent une couverture de 85 %.

Le taux de conformité est ensuite calculé uniquement parmi les Composants audités.

À terme, la couverture pourra prendre en compte explicitement l'héritage d'un Audit antérieur pour un Composant inchangé. La comparaison automatique permettant de qualifier les Composants `NOUVEAU`, `ÉVOLUÉ`, `INCHANGÉ` ou `DÉCOMMISSIONNÉ` est reportée à une évolution ultérieure et n'est pas un prérequis au calcul actuel.

**Statut : Établi pour le calcul actuel ; enrichissement cible déjà identifié**

---

### Q-077 — Détermination d'un Composant inchangé entre deux Versions

L'état des lieux entre deux Versions pourra s'appuyer sur les modifications Git des fichiers appartenant aux Composants afin de distinguer les Composants `NOUVEAU`, `ÉVOLUÉ`, `INCHANGÉ` et `DÉCOMMISSIONNÉ`.

Cet état des lieux sert d'aide à la décision. La décision d'ouvrir une Issue d'Audit reste sous la responsabilité de la Squad.

La manière exacte d'associer les fichiers du repository aux Composants reste à préciser.

**Statut : Partiellement établi**

---

### Q-078 — Référentiel permettant d'identifier les Composants entre deux Versions

Les repositories de Librairies n'ont pas actuellement une architecture suffisamment stable et homogène pour utiliser une convention commune de répertoires.

Une analyse existante s'appuie sur la notion d'export pour identifier les Composants et leurs évolutions.

Cette piste devra être réétudiée lors de l'intégration future de la fonctionnalité de comparaison entre Versions. La règle exacte d'identification des Composants et de leurs fichiers ou exports n'est donc pas figée à ce stade.

**Statut : Reporté à l'évolution de comparaison entre Versions**

---

### Q-079 — Règle SemVer de sélection du tag précédent

Le traitement cible doit comparer le tag nouvellement créé au tag précédent pertinent selon les règles SemVer.

Il reste à préciser la règle exacte de sélection lorsque plusieurs lignes de Versions coexistent, notamment avec `master` et plusieurs branches `support/xxx`.

**Statut : À instruire lors de la conception de la comparaison entre Versions**

---

### Q-080 — Version du Catalogue utilisée comme dénominateur

Le Catalogue utilisé comme dénominateur doit correspondre à la Version analysée.

Ainsi, une Version historique conserve le nombre de Composants qui lui était applicable et les évolutions ultérieures du Catalogue ne modifient pas rétroactivement ses indicateurs.

**Statut : Établi**

---

### Q-081 --- Construction du Catalogue historique

Le Catalogue historique d'une Version PROD `M.m.r` est reconstruit à
partir du contenu du Repository au Git tag `M.m.r`.

Ce Catalogue est utilisé comme périmètre historique de référence pour
les indicateurs de la Version.

**Statut : Établi**

---

### Q-082 — Réactivation d'un Composant décommissionné

La réapparition d'un Composant décommissionné est considérée comme exceptionnelle.

Si elle survient, elle doit être indiquée explicitement dans le Catalogue et ne doit pas être déduite automatiquement de la seule réapparition du nom ou de l'export du Composant.

Le mécanisme exact permettant de représenter cette réactivation reste à définir.

**Statut : Principe établi ; représentation à instruire**

---

### Q-083 — Représentation d'une réactivation dans le Catalogue

Lorsqu'un Composant décommissionné est exceptionnellement réactivé, il faut rendre cette réactivation explicite dans le Catalogue.

Il reste à déterminer quelles informations doivent être portées par le Catalogue, par exemple la Version de réactivation ou un historique des périodes d'activité, sans préjuger à ce stade de la solution retenue.

**Statut : À instruire**

---

### Q-084 — Restitution de l'origine du verdict applicable

Lorsqu'un verdict de conformité applicable à une Version provient d'un Audit réalisé sur une Version antérieure, il reste à préciser comment le Dashboard doit rendre cette origine visible.

Par exemple, il pourrait distinguer un Audit réalisé directement sur la Version d'une couverture héritée depuis une Version antérieure, sans préjuger à ce stade de la représentation UX retenue.

**Statut : À instruire**

---

### Q-085 — Rupture de l'héritage lorsqu'un Composant évolue

Une évolution du Composant ne rompt pas automatiquement l'héritage du dernier verdict applicable.

Le Composant peut conserver son verdict, par exemple `CONFORME`, lorsque la Squad qualifie la modification comme n'impactant pas le périmètre nécessitant un nouvel Audit.

Le pipeline ne doit donc pas déduire `NON AUDITÉ` de la seule présence d'une évolution.

**Statut : Établi**

---

### Q-086 — États de qualification d'une évolution vis-à-vis d'un Audit

Pour un Composant `ÉVOLUÉ`, trois états sont retenus :

- `À ÉVALUER` ;
- `AUDIT À FAIRE` ;
- `AUDIT NON NÉCESSAIRE`.

La détection automatique d'une évolution initialise la qualification à `À ÉVALUER`.

La Squad décide ensuite explicitement si un nouvel Audit est à faire ou s'il n'est pas nécessaire.

**Statut : Établi**

---

### Q-087 — Qualification initiale d'un nouveau Composant

Un Composant `NOUVEAU` doit en théorie être audité avant sa mise à disposition.

L'Audit devrait être réalisé pendant la mise au point de sa Version de sortie.

Si cet Audit n'a pas été réalisé au moment de la mise à disposition, le Composant est qualifié `AUDIT À FAIRE`.

Il n'est donc pas initialisé à `À ÉVALUER` comme un Composant `ÉVOLUÉ`.

**Statut : Établi**

---

### Q-088 — Traitement d'un nouveau Composant audité avant sa mise à disposition

Lorsqu'un Composant `NOUVEAU` a été audité pendant la mise au point de sa Version de sortie, le suivi du patrimoine peut afficher `AUDIT RÉALISÉ`.

Cet état ne remplace pas le verdict : l'information qualité principale reste `CONFORME` ou `NON CONFORME`.

**Statut : Établi**

---

### Q-089 — Priorité visuelle entre conformité et suivi d'Audit

Le verdict de conformité est l'information qualité principale et `AUDIT RÉALISÉ` une information de suivi d'activité.

Il reste à préciser, lors de la conception du Dashboard, comment présenter visuellement ces deux dimensions sans les confondre, notamment dans la future page de suivi du patrimoine.

**Statut : À instruire lors de la conception UX du Dashboard**

---

### Q-090 — Définition d'une Anomalie traitée

Pour le calcul du taux de traitement, une Anomalie est considérée comme traitée uniquement lorsque :

```text
Project Status = Done
AND
GitHub Issue State = Closed
```

Cette question recoupait un principe déjà abordé antérieurement sur la fermeture et le traitement des Anomalies. La règle est désormais consolidée explicitement pour le calcul de l'indicateur.

**Statut : Établi**

---

### Q-091 — Dénominateur temporel du taux de traitement des Anomalies

Le dénominateur du taux de traitement correspond à toutes les Anomalies historiquement détectées sur le Composant.

Le numérateur correspond aux Anomalies de ce même historique qui sont traitées selon D-081.

Exemple : 8 Anomalies traitées parmi 10 historiquement détectées donnent un taux de `80 %`.

Le Dashboard doit également afficher le stock restant en valeur absolue et, pour les Anomalies d'accessibilité concernées, sa répartition par niveau `🚦 rgaa:xxx`.

**Statut : Établi**

---

### Q-092 — Périmètre de la ventilation par criticité RGAA

Pour les Anomalies issues des Audits d'accessibilité, le Dashboard doit afficher, pour chaque niveau `🚦 rgaa:xxx` :

- le nombre historique d'Anomalies ;
- le nombre d'Anomalies traitées ;
- le stock restant ;
- le taux de traitement propre à cette criticité.

Le taux est calculé sur l'historique des Anomalies de la criticité concernée.

**Statut : Établi**

---

### Q-093 — Agrégation du suivi des Anomalies au niveau supérieur

Les indicateurs de traitement définis au niveau du Composant doivent être agrégés au niveau de la Librairie.

La Librairie doit disposer du taux global de traitement, du stock restant et de la ventilation par criticité RGAA, avec les taux propres à chaque criticité.

La restitution doit permettre de retrouver les Composants contribuant aux indicateurs agrégés.

**Statut : Établi**

---

### Q-094 — Périmètre versionné de l'agrégation au niveau Librairie

Deux lectures sont nécessaires :

- une vue `latest`, qui reprend les Anomalies historiques encore non traitées des Composants actifs dans la dernière Version et exclut les Composants décommissionnés dans cette Version ;
- une vue par Version, fondée sur le Catalogue historique propre à la Version consultée.

Un Composant décommissionné aujourd'hui peut donc rester visible dans les indicateurs d'une ancienne Version où il était encore actif.

**Statut : Établi**

---

### Q-095 — Date de référence des indicateurs d'une ancienne Version

La vue d'une ancienne Version doit afficher l'état des Anomalies tel qu'il était au moment de la sortie de cette Version.

Une Anomalie non traitée lors de la sortie reste donc non traitée dans cette vue historique, même si elle a été corrigée ultérieurement.

La vue historique ne doit pas être recalculée à partir de l'état actuel des Issues.

**Statut : Établi**

---

### Q-096 --- Date exacte de Release

La date métier de Release d'une Version PROD `M.m.r` est la date de
création du Git tag `M.m.r`.

```text
releasedAt = GitTag(M.m.r).createdAt
```

**Statut : Établi**

---

### Q-097 — Versions affectées par une Anomalie découverte après une release

Pour une Anomalie issue d'un Audit post-PROD, la Version affectée peut être déterminée à partir du contexte de l'Audit et de sa Milestone `M.m.r-Audit`, normalisée vers `M.m.r`.

Exemple : une Anomalie issue de l'Audit `1.7.0-Audit` concerne la Version `1.7.0`, sans être rattachée à la Milestone PROD close `1.7.0`.

Le cas des Anomalies découvertes hors Audit reste à instruire séparément.

**Statut : Partiellement établi**

---

### Q-098 — Version affectée pour une Anomalie découverte hors Audit

Pour un Bug hors périmètre des Audits d'accessibilité, la Version affectée doit obligatoirement être renseignée dans la description de l'Issue.

Cette information ne doit pas être déduite de la Milestone.

Le format exact utilisé dans la description reste à définir.

**Statut : Partiellement établi**

---

### Q-099 — Format de la Version affectée dans la description d'un Bug hors accessibilité

La présence obligatoire de la Version affectée dans la description de l'Issue est établie pour les Bugs hors périmètre des Audits d'accessibilité.

Il reste à définir le format structuré attendu afin que le pipeline puisse extraire cette information de manière fiable.

**Statut : À instruire**

---

### Q-100 — Sémantique de la Version renseignée lors d'une remontée client

La Version utilisée par le client au moment de la remontée doit d'abord être considérée comme une `Version observée`.

Elle ne devient une `Version affectée` qu'après analyse et confirmation par la Squad que le défaut provient bien du Design System.

Une erreur d'implémentation du Composant côté client ne doit pas conduire à qualifier la Version du Design System comme affectée.

**Statut : Établi**

---

### Q-101 — Caractère systématique de Cancelled pour une erreur d'implémentation client

Lorsqu'une analyse conclut que le problème provient uniquement d'une erreur d'implémentation côté client et non d'un défaut du Design System, l'Issue doit obligatoirement passer au statut `Cancelled`.

Ce comportement constitue une règle de workflow.

**Statut : Établi**

---

### Q-102 — Traitement des remontées Cancelled dans les indicateurs

Les Issues `Cancelled` parce qu'elles correspondent à une erreur d'implémentation côté client doivent être suivies séparément dans les éléments de pilotage destinés à la Squad.

Elles ne constituent pas des Anomalies confirmées du Design System et ne doivent pas dégrader ses indicateurs de qualité.

Elles servent notamment à identifier des besoins d'amélioration de la documentation, de formation et d'accompagnement des consommateurs.

**Statut : Établi**

---

### Q-103 — Ventilation des erreurs d'intégration client pour la Squad

La vue Squad doit permettre de ventiler par Composant les remontées `Cancelled` parce qu'elles correspondent à une erreur d'implémentation côté client.

Cette ventilation sert à identifier les Composants qui génèrent le plus de difficultés d'intégration et à orienter les actions de documentation, formation et accompagnement.

Elle reste séparée des indicateurs de qualité intrinsèque du Design System.

**Statut : Établi**

---

### Q-104 — Normalisation par le niveau d'usage du Composant

Les volumes d'Issues et de remontées par Composant doivent pouvoir être mis en perspective avec le niveau d'usage du Composant dans les applications consommatrices.

Le besoin est établi. Les ratios exacts, les sources, la méthode de détection et le dénombrement des usages seront définis et implémentés ultérieurement.

**Statut : Partiellement établi — implémentation différée**

---

### Q-105 — Ratios d'usage et d'Issues à retenir

Les ratios ne sont pas encore figés et doivent faire l'objet d'une instruction.

Deux premiers candidats sont identifiés :

1. `nombre total d'Issues / nombre total d'occurrences globales du Composant` ;
2. `nombre total d'Issues / nombre d'applications utilisatrices du Composant`.

Le premier est considéré à ce stade comme potentiellement plus pertinent et doit être instruit en priorité.

D'autres ratios pertinents peuvent être proposés et ajoutés au catalogue des indicateurs candidats.

**Statut : À instruire — premiers candidats identifiés**

---

### Q-106 — Autres ratios candidats autour des Issues et de l'usage

Au-delà des ratios `Issues / occurrences globales` et `Issues / applications utilisatrices`, il reste à instruire d'autres ratios potentiellement utiles.

Premières propositions à étudier, sans les considérer comme des KPI validés :

- `Anomalies confirmées / occurrences globales` ;
- `Anomalies confirmées / applications utilisatrices` ;
- `erreurs d'intégration client / occurrences globales` ;
- `erreurs d'intégration client / applications utilisatrices` ;
- `applications ayant remonté au moins une erreur d'intégration / applications utilisatrices` ;
- déclinaisons éventuelles par type d'Issue ou par criticité lorsque cela a un sens métier.

Pour chaque candidat, il faudra préciser son objectif, son interprétation, son périmètre, son unité de restitution et ses biais éventuels.

**Statut : À instruire**

---

### Q-107 — Cas où une Issue peut légitimement ne concerner aucun Composant

Il est établi que toute Issue concernant effectivement un Composant doit porter un label `🧩 Component:xxx`.

Il reste à définir les cas métier dans lesquels une Issue peut légitimement être transverse et ne porter aucun label Composant, afin de distinguer ces cas d'une donnée incomplète ou incorrecte.

**Statut : À instruire**

---

### Q-108 — Comptabilisation d'une Issue multi-Composants dans les indicateurs

Une Issue portant plusieurs labels `🧩 Component:xxx` doit compter une fois dans les indicateurs de chacun des Composants concernés.

Elle reste toutefois une seule Issue GitHub au niveau global.

**Statut : Établi**

---

### Q-109 — Comptage global des Issues au niveau Bibliothèque

Le nombre total d'Issues au niveau Bibliothèque correspond au nombre d'Issues GitHub distinctes, tous types confondus et avec ou sans rattachement à un Composant.

En complément, le Dashboard doit présenter :

- les Issues rattachées aux Composants et leur ventilation par Composant ;
- le nombre d'Issues sans Composant.

Une Issue multi-Composants reste unique dans le total Bibliothèque mais contribue à chacun des Composants concernés dans la ventilation.

**Statut : Établi**

---

### Q-110 — Nature des Issues sans Composant

Il est établi qu'une Issue peut légitimement être transverse et ne porter aucun label `🧩 Component:xxx`.

L'absence du label ne permet pas, à elle seule, d'identifier les Issues qui concernent réellement un Composant mais dont le rattachement a été oublié.

La distinction entre `Issue transverse` et `Composant manquant suspecté` devra donc reposer sur une qualification ou sur des signaux complémentaires à instruire.

**Statut : Partiellement établi**

---

### Q-111 — Mécanisme d'identification d'un Composant manquant suspecté

Il reste à définir comment identifier une Issue sans label `🧩 Component:xxx` qui concerne probablement un Composant.

Des pistes pourront être instruites ultérieurement : informations structurées dans l'Issue, relation avec un Audit, analyse d'une PR liée, mention d'un Composant ou autres signaux.

Le mécanisme devra éviter de transformer une simple heuristique en erreur de qualité des données certaine.

**Statut : À instruire**

---

### Q-112 — Dimensions disponibles dans la page d'analyse dynamique

Le besoin d'une page permettant de sélectionner dynamiquement des critères de filtre et d'agrégation est établi.

Il est également établi que plusieurs critères pourront être croisés simultanément avant d'agréger les résultats selon une dimension choisie.

Il reste à définir ultérieurement :

- la liste complète des dimensions disponibles ;
- les opérateurs de combinaison des critères ;
- les types d'agrégation ;
- l'ergonomie et les visualisations ;
- les éventuelles fonctions de sauvegarde ou de réutilisation d'une analyse.

Les premières dimensions identifiées restent notamment : Composant, présence/absence de Composant, Issue Type et labels.

**Statut : À instruire ultérieurement**

---

### Q-113 — Futurs types de sous-Issues d'Audit

À ce jour, seuls les types métier Anomalie et Improvement sont identifiés comme sous-Issues d'une Issue d'Audit.

D'autres types pourront éventuellement apparaître à l'avenir. Ils devront alors être instruits explicitement avant d'être intégrés aux règles de conformité et aux indicateurs.

**Statut : À instruire si le besoin apparaît**

---

### Q-114 — Nombre d'occurrences regroupées dans une Anomalie d'Audit

Lorsqu'une seule Issue Anomalie regroupe plusieurs occurrences d'un même problème dans un Composant, le dashboard ne cherche pas à compter ces occurrences.

L'unité de comptage retenue est l'Issue GitHub :

```text
1 Issue Anomalie = 1 Anomalie comptabilisée
```

Le nombre d'occurrences internes n'est ni extrait ni estimé.

**Statut : Établi**

---

## 15. Méthode de traitement des questions

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
