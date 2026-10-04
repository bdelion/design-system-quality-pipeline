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

## D-034 — Orientation de catégorisation des Améliorations d'Audit

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

## D-035 — Absence d'impact des Améliorations sur la conformité

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

## D-036 — Revue de l'auditeur dans la Definition of Done d'une Anomalie

Le workflow de correction des Anomalies d'Audit n'est pas encore définitivement acté.

L'orientation métier actuelle est néanmoins que la Definition of Done d'une Anomalie doit inclure une revue par l'auditeur avant que l'Issue puisse passer à `Done` puis être `Closed`.

Cette revue vise à éviter qu'une correction soit considérée terminée sans validation de l'auditeur.

Le mécanisme permettant ensuite de considérer globalement le Composant comme conforme n'est pas encore tranché.

**Statut : Orientation forte à formaliser dans le workflow**

---

## D-037 — Hypothèse de clôture d'une Anomalie après merge de la PR

Le responsable et le moment exacts de la clôture d'une Anomalie d'Audit ne sont pas encore définitivement actés.

L'hypothèse actuelle est la suivante :

1. la correction est portée par une Pull Request ;
2. l'auditeur réalise la revue prévue dans la Definition of Done de l'Anomalie ;
3. après validation de l'auditeur et merge de la Pull Request sur la branche cible, le développeur ou la squad fait passer l'Issue à `Done` puis `Closed`.

Le merge de la Pull Request constitue un événement technique de fin de correction. La validation de l'auditeur constitue une condition métier distincte. Le workflow ne doit pas considérer le seul merge comme suffisant tant que cette hypothèse n'a pas été formellement actée.

**Statut : Hypothèse de workflow à confirmer**

---

## D-038 — Revalidation de conformité par une nouvelle Issue d'Audit

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

## D-039 — Distinction entre correction et conformité

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

## D-040 — Déclenchement collectif de l'Audit de revalidation

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

## D-041 — Nouvelles Anomalies lors d'un Audit de revalidation

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

## D-042 — Absence de lien direct entre Anomalies successives

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

## D-043 — Continuité des Audits d'un Composant sans relation directe

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

## D-044 — Conformité historisée par Composant et Version

Le verdict de conformité issu d'un Audit s'applique au Composant dans la Version effectivement auditée. Un Audit ultérieur sur une autre Version ne modifie pas rétroactivement ce verdict.

```text
Button@1.7.1 → NON CONFORME
Button@1.8.0 → CONFORME
```

`Button@1.7.1` conserve donc historiquement son verdict `NON CONFORME`.

**Statut : Établi**

---

## D-045 — Séparer le verdict d'Audit et l'état des corrections

Un verdict `NON CONFORME` ne devient pas `CONFORME` au seul motif que les Anomalies ont été corrigées dans une Version ultérieure.

Une annotation complémentaire pourra indiquer que les Anomalies connues sont corrigées dans une Version ultérieure en attente d'un nouvel Audit. Cette annotation reste distincte du verdict de conformité et son libellé ainsi que ses règles restent à définir.

**Statut : Principe établi ; représentation à instruire**

---

## D-046 — Dernier Audit comme état de conformité courant

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

**Statut : Établi**

---

## D-047 — Date de réalisation d'un Audit

Un Audit est terminé lorsque les deux conditions suivantes sont satisfaites :

- `Project Status = Done` ;
- `GitHub Issue State = Closed`.

La date de réalisation de l'Audit correspond à l'instant où la seconde de ces deux conditions est satisfaite, c'est-à-dire au moment où l'Issue devient effectivement `Done + Closed`.

Cette date permet notamment d'ordonner plusieurs Audits portant sur le même couple `Composant × Version`.

Pour déterminer l'état de conformité courant, l'Audit ayant la date de réalisation la plus récente est considéré comme le dernier Audit réalisé.

**Statut : Établi**

---

## D-048 — Un Audit en cours ne remplace pas le dernier verdict acquis

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

**Statut : Établi**

---

## D-049 — Séparer conformité courante et activité d'Audit en cours

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

**Statut : Établi**

---

## D-050 — Unicité de l'Audit non terminé par Composant et Version

Pour un même couple `Composant × Version`, il ne doit exister qu'une seule Issue d'Audit non terminée à la fois.

Un Audit est considéré comme terminé uniquement lorsque :

- `Project Status = Done` ;
- `GitHub Issue State = Closed`.

Par conséquent, la présence simultanée de plusieurs Issues d'Audit non terminées pour le même couple `Composant × Version` constitue une situation anormale à signaler.

La règle porte sur l'ensemble des Audits non terminés et pas uniquement sur ceux dont le statut est `In progress`.

**Statut : Établi**

---

## D-051 — Version auditée obligatoire

Toute Issue d'Audit doit cibler une Version effectivement auditée qui puisse être identifiée sans ambiguïté.

Cette exigence découle du modèle de conformité au niveau du couple `Composant × Version` : sans Version auditée identifiable, le verdict d'un Audit ne peut pas être correctement rattaché.

Une Issue d'Audit `Done + Closed` dont la Version effectivement auditée ne peut pas être déterminée constitue donc une donnée métier incomplète/anormale.

La Version auditée ne doit pas être déduite systématiquement du seul nom de la Milestone. En particulier, dans le fonctionnement pré-PROD déjà établi, la Milestone peut être `M.m.r` alors que la Version réellement auditée est une Release Candidate `M.m.r-rc.n`.

**Statut : Établi**

---

## D-052 — Milestone comme référence de Version et Version auditée dans le template

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

## D-053 — Cohérence entre Milestone et Version auditée

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

## D-054 — Milestone prioritaire et Version auditée complémentaire

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

## D-055 — Milestone obligatoire et bloquante pour la conformité

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

Une ou plusieurs sub-Issues d'Amélioration, y compris encore ouvertes, n'empêchent pas le composant d'être `AUDITÉ & CONFORME` si aucune Anomalie n'est présente.

Les Améliorations sont donc exclues du calcul du verdict de conformité.

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

## Q-056 — Catégorisation des Améliorations d'Audit

Aucun exemple réel de sub-Issue d'Amélioration n'est disponible pour le moment.

L'orientation envisagée est un label de la forme :

```text
[famille d'amélioration]:xxx
```

Restent à déterminer :

- le préfixe ou nom réel du label ;
- les familles d'amélioration ;
- les valeurs associées ;
- la cardinalité de cette catégorisation ;
- sa gouvernance et son extensibilité.

Il ne faut pas inventer de référentiel avant de disposer d'exemples ou d'une décision métier.

**Statut : À instruire — orientation cible identifiée**

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

## Q-060 — Revalidation d'un Composant après correction des Anomalies

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

## Q-061 — Responsable et déclencheur de la clôture d'une Anomalie

Le workflow n'est pas encore définitivement défini.

L'hypothèse actuelle est que le développeur ou la squad met l'Anomalie à `Done` puis `Closed` lorsque la Pull Request de correction est mergée sur la branche cible, sous réserve que la revue attendue de l'auditeur ait été réalisée positivement.

Il reste à confirmer :

- que le développeur ou la squad est bien responsable de cette transition ;
- que le merge sur la branche cible constitue bien le déclencheur opérationnel ;
- comment la validation de l'auditeur est matérialisée et contrôlée avant la clôture.


La clôture de l'Anomalie ne rétablit pas automatiquement la conformité du Composant. Celle-ci sera réévaluée dans une nouvelle Issue d'Audit.

**Statut : À confirmer**

---

## Q-062 — Déclenchement de l'Audit de revalidation

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

## Q-063 — Matérialisation de la décision de revalidation

Le déclenchement d'un nouvel Audit de revalidation relève d'un choix collectif de la Squad.

Il reste à déterminer comment cette décision est matérialisée dans GitHub et dans le workflow : création manuelle de l'Issue d'Audit, action ou champ du Project, label, automatisation déclenchée explicitement, ou autre mécanisme.

Il reste également à préciser qui est responsable de créer l'Issue d'Audit de revalidation après cette décision collective.

**Statut : À instruire**

---

## Q-064 — Lien entre Anomalies successives portant sur un même problème

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

## Q-065 — Changement de Version entre deux Audits successifs

Deux Audits successifs d'un même Composant peuvent porter sur des Versions différentes selon les choix de la Squad.

Cette possibilité est établie, même si elle peut être contraire au fonctionnement idéal recherché.

Il reste à préciser ultérieurement si le dashboard doit :

- simplement exposer la Version effectivement auditée à chaque Audit ;
- signaler un changement de Version entre un Audit ayant détecté des Anomalies et l'Audit de revalidation ;
- ou appliquer une autre règle de pilotage sans bloquer le workflow.

**Statut : Fait établi ; règle de pilotage à instruire**

---

## Q-066 — Annotation d'une Version non conforme dont les Anomalies sont corrigées

Une Version peut conserver un verdict historique `NON CONFORME` alors que ses Anomalies ont été corrigées dans une Version ultérieure qui n'a pas encore obtenu de verdict `CONFORME`.

Une annotation distincte du verdict pourrait permettre de représenter cette situation.

Il reste à définir son nom, ses états, ses conditions de calcul, le rattachement des corrections à la Version qui les contient et sa représentation dans le dashboard.

**Statut : À instruire**

---

## Q-067 — Ordonnancement de plusieurs Audits d'un même Composant et d'une même Version

Le dernier Audit réalisé détermine l'état de conformité courant du couple `Composant × Version`.

Un Audit étant considéré comme terminé uniquement lorsque `Project Status = Done` et `GitHub Issue State = Closed`, sa date de réalisation correspond à l'instant où la seconde de ces deux conditions est satisfaite.

Plusieurs Audits portant sur le même couple sont donc ordonnés selon cette date de réalisation. Celui dont la date de réalisation est la plus récente porte le verdict de conformité courant.

**Statut : Établi**

---

## Q-068 — Disponibilité de la date de passage au statut Done

La date de réalisation d'un Audit nécessite de connaître l'instant où l'Issue est devenue `Done` ainsi que sa date de fermeture, afin de retenir l'instant où la seconde condition `Done + Closed` a été satisfaite.

Il reste à vérifier que la source GitHub collectée permet d'obtenir de manière fiable l'historique ou la date de transition du Project vers `Done`.

**Statut : À vérifier techniquement**

---

## Q-069 — Présentation d'un Audit en cours à côté du verdict courant

Pour un même couple `Composant × Version`, le dashboard doit afficher simultanément :

- la conformité courante issue du dernier Audit terminé ;
- l'existence d'un nouvel Audit en cours, lorsqu'il existe.

Exemple :

```text
Conformité courante : CONFORME
Nouvel Audit : EN COURS
```

Le principe métier est établi : ces deux informations sont distinctes et doivent pouvoir coexister.

Il reste uniquement à définir leur représentation UX exacte dans le dashboard : badge séparé, statut secondaire, lien vers l'Issue d'Audit, date du dernier verdict, ou combinaison de ces éléments.

**Statut : Principe établi ; représentation UX à instruire**

---

## Q-070 — Sévérité de plusieurs Audits non terminés pour un même Composant et une même Version

La présence de plusieurs Issues d'Audit non terminées pour le même couple `Composant × Version` est désormais considérée comme une situation anormale.

Il reste à déterminer comment cette anomalie de données/workflow devra être classée dans le futur moteur de règles : information, avertissement, erreur bloquante, ou autre niveau de sévérité.

**Statut : À instruire lors de la définition des règles de qualité**

---

## Q-071 — Source de la Version effectivement auditée

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

## Q-072 — Cohérence entre Milestone et champ Version auditée

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

## Q-073 — Sévérité d'une incohérence de Version d'Audit

Une incohérence entre la Version de référence portée par la Milestone et le champ `Version auditée :` constitue une anomalie de données.

Il reste à déterminer la sévérité de cette anomalie dans le futur moteur de qualité et son impact éventuel sur le calcul de conformité.

**Statut : À instruire lors de la définition des règles de qualité**

---

## Q-074 — Représentation d'une Version auditée manquante

Lorsqu'une Milestone valide permet de poursuivre l'analyse mais que le champ `Version auditée :` est absent, l'Audit reste exploitable avec une donnée partielle.

Il reste à définir comment cette information manquante sera représentée dans le dashboard et dans les métadonnées de fiabilité : avertissement, indicateur de complétude, annotation sur l'Audit, ou autre représentation.

**Statut : À instruire lors de la définition de la qualité des données et de l'UX**

---

## Q-075 — Traitement d'un Audit bloqué par l'absence de Milestone

Une Issue d'Audit sans Milestone ne peut pas contribuer au calcul de conformité, même si `Version auditée :` est renseignée.

Il reste à définir comment cet Audit doit apparaître dans les autres indicateurs et écrans qui ne calculent pas directement la conformité : activité d'Audit, volumes, listes d'Issues, pilotage opérationnel, etc.

**Statut : À instruire**

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
