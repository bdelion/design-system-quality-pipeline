# Audits

## 1. Objectif

Ce document décrit les concepts métier liés aux Audits du Design System.

Les Audits constituent un domaine distinct :

- du cycle de développement ;
- du cycle de publication ;
- du traitement des Anomalies et Améliorations résultant éventuellement de l'Audit.

La seule famille d'Audit actuellement pratiquée et identifiée est l'**Accessibilité**.

---

## 2. Audit

Un **Audit** est une opération structurée d'évaluation d'un périmètre du Design System.

Un Audit peut notamment porter sur :

- une Librairie ;
- une Version ou une Release Candidate ;
- un ou plusieurs Composants.

Dans le fonctionnement actuel, une Issue d'Audit est créée pour chaque Composant à auditer.

Un Audit peut produire :

- aucune Anomalie ;
- une ou plusieurs Anomalies ;
- une ou plusieurs propositions d'Amélioration.

---

## 3. Nature de l'Issue et famille d'Audit

Deux notions doivent être distinguées.

### Nature de l'Issue

La nature indique que l'Issue représente un travail d'Audit.

La cible souhaitée est :

```text
Issue Type = 🔍 Audit
```

### Famille d'Audit

La famille indique le domaine évalué par l'Audit.

La seule famille actuellement pratiquée est :

```text
Accessibilité
```

Le modèle cible est donc conceptuellement :

```text
Issue
├── nature          : Audit
├── famille d'Audit : Accessibilité
└── Composant       : xxx
```

---

## 4. RGAA, WCAG et WAI-ARIA

Lors des Audits d'Accessibilité actuels, l'auditeur traite a priori ensemble les problématiques relatives :

- au RGAA ;
- aux WCAG ;
- à WAI-ARIA.

Il n'est pas établi aujourd'hui que ces trois notions doivent constituer des familles d'Audit distinctes.

Le fonctionnement observé conduit pour l'instant à les regrouper sous la famille métier :

```text
Accessibilité
```

Le détail exact :

- des référentiels utilisés ;
- des versions de ces référentiels ;
- des critères contrôlés ;
- de la méthode de contrôle ;

reste à confirmer avec l'auditeur.

---

## 5. Identification actuelle d'une Issue d'Audit

Aujourd'hui, une Issue d'Audit d'Accessibilité est identifiée par le label :

```text
Audit RGAA
```

Le Composant concerné est identifié par :

```text
🧩 Component:xxx
```

Exemple :

```text
Issue
├── label : Audit RGAA
└── label : 🧩 Component:Button
```

Le nom actuel du label ne signifie pas que l'Audit se limite nécessairement au seul RGAA.

---

## 6. Identification cible d'une Issue d'Audit

La cible souhaitée est d'utiliser :

```text
Issue Type = 🔍 Audit
```

Conceptuellement :

```text
Issue
├── Issue Type : 🔍 Audit
├── famille    : Accessibilité
└── Composant  : 🧩 Component:xxx
```

Le mécanisme technique permettant de représenter la famille d'Audit n'est pas encore décidé.

---

## 7. Grille d'Audit

L'auditeur dispose probablement d'une grille ou checklist de critères à contrôler.

Cette grille n'est actuellement :

- pas connue précisément ;
- pas documentée dans le présent modèle ;
- pas identifiée comme source du pipeline.

Il reste notamment à déterminer :

- son format ;
- son emplacement ;
- son contenu ;
- les référentiels qu'elle couvre ;
- les informations qui doivent éventuellement être remontées dans GitHub.

---

## 8. Template d'Issue d'Audit

À terme, il est souhaité de mettre en place un template d'Issue pour les Audits.

L'objectif est de fournir le minimum vital nécessaire :

- au pilotage ;
- à la traçabilité ;
- à la compréhension de l'Audit ;
- à l'exploitation des données par le dashboard.

Le template n'a pas nécessairement vocation à remplacer la grille complète utilisée par l'auditeur.

---

## 9. Issue d'Audit et Composant

Le fonctionnement souhaité repose sur une Issue d'Audit par Composant à auditer.

```text
Composant
    │
    └── Issue d'Audit
```

Aujourd'hui, le Composant est identifié par :

```text
🧩 Component:xxx
```

La règle exacte concernant le nombre de labels Component autorisés reste à formaliser.

---

## 10. Fin d'un Audit

Dans le fonctionnement actuel, l'Audit d'un Composant est considéré comme réalisé lorsque les deux conditions suivantes sont satisfaites :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Le seul statut `Done` n'est donc pas suffisant.

Le seul état GitHub `Closed` n'est pas suffisant non plus.

---

## 11. Sub-Issues produites par un Audit

Les sub-Issues d'une Issue d'Audit d'Accessibilité peuvent représenter deux natures métier distinctes :

```text
Issue d'Audit
├── Anomalie
└── Amélioration
```

La présence d'une sub-Issue ne signifie donc pas automatiquement que le Composant est non conforme.

Le moteur métier doit distinguer les Anomalies des Améliorations.

---

## 12. Identification d'une Anomalie issue d'un Audit

Dans le fonctionnement actuel, une sub-Issue d'Anomalie issue d'un Audit d'Accessibilité possède :

- l'Issue Type `🐛 Bug` ;
- un des labels de criticité RGAA :
  - `🚦 rgaa:bloquante` ;
  - `🚦 rgaa:majeure` ;
  - `🚦 rgaa:mineure` ;
- un label `♿ a11y:xxx` ;
- un label `🧩 Component:xxx` identique au label Component de l'Issue d'Audit parente.

Conceptuellement :

```text
Issue d'Audit
└── 🧩 Component:Button
      │
      └── Sub-Issue Anomalie
            ├── Issue Type : 🐛 Bug
            ├── 🚦 rgaa:bloquante | majeure | mineure
            ├── ♿ a11y:xxx
            └── 🧩 Component:Button
```

Cette règle est établie pour les Anomalies issues d'un Audit d'Accessibilité.

Elle ne doit pas être généralisée automatiquement à toutes les Anomalies du Design System, dont la définition doit rester configurable.

### Cardinalité de la catégorie Accessibilité

L’hypothèse métier actuelle est qu’une Anomalie ne porte qu’un seul label `♿ a11y:xxx`.

Cette hypothèse n’est pas encore suffisamment confirmée par l’expérience des Audits réalisés. Elle ne doit donc pas devenir, à ce stade, une règle de validation bloquante.

Le modèle doit temporairement tolérer plusieurs catégories `♿ a11y:xxx` jusqu’à confirmation de la cardinalité métier attendue.

---

## 13. Identification d'une Amélioration issue d'un Audit

Dans le fonctionnement actuel, une sub-Issue d'Amélioration issue d'un Audit d'Accessibilité possède :

- l'Issue Type `✨ Feature` ;
- un label `🧩 Component:xxx` identique au label Component de l'Issue d'Audit parente.

Aucun exemple réel d'Amélioration d'Audit n'est disponible à ce stade. L'orientation envisagée pour sa catégorisation est un label de la forme `[famille d'amélioration]:xxx`. Le préfixe, les familles, les valeurs et la cardinalité restent à définir.

Un label, champ ou autre mécanisme permettant de préciser le type d'Amélioration est souhaité, mais n'est pas encore défini.

Il ne faut donc inventer aucune valeur pour cette catégorisation à ce stade.

Conceptuellement :

```text
Issue d'Audit
└── 🧩 Component:Button
      │
      └── Sub-Issue Amélioration
            ├── Issue Type : ✨ Feature
            ├── catégorie  : À définir
            └── 🧩 Component:Button
```

---

## 14. Criticité RGAA des Anomalies d'Audit

Une Anomalie issue d'un Audit d'Accessibilité doit actuellement porter exactement un label de criticité RGAA parmi :

```text
🚦 rgaa:bloquante
🚦 rgaa:majeure
🚦 rgaa:mineure
```

La cardinalité métier actuelle est :

```text
1 Anomalie d'Audit = exactement 1 criticité RGAA
```

Cette cardinalité est établie pour le fonctionnement actuel. En revanche, ces trois valeurs ne constituent pas une enum technique définitive : le modèle doit permettre l'évolution du référentiel de criticité.

Ces trois niveaux sont partagés avec l'auditeur. Ils appartiennent donc au référentiel effectivement utilisé dans le processus d'Audit.

En revanche, la définition précise de `bloquante`, `majeure` et `mineure`, ainsi que les critères d'attribution utilisés par l'auditeur, ne sont pas encore connus. Le modèle et les indicateurs ne doivent pas leur attribuer une sémantique supplémentaire tant que celle-ci n'a pas été confirmée.

La configuration et la gouvernance futures de ce référentiel restent à définir.

---

## 15. Résultat de conformité

Le résultat de conformité n'est actuellement pas déclaré explicitement par l'auditeur dans un champ dédié.

Il est calculé à partir de l'état de l'Issue d'Audit et de ses sub-Issues classées comme Anomalies.

Lorsque l'Audit est réalisé :

```text
Issue d'Audit
├── Done
├── Closed
└── 0 sub-Issue classée comme Anomalie
        │
        ▼
AUDITÉ & CONFORME
```

Les sub-Issues d'Amélioration, y compris ouvertes, n'affectent pas ce verdict : elles sont suivies séparément des Anomalies.

Lorsque l'Audit est réalisé et qu'au moins une sub-Issue est classée comme Anomalie :

```text
Issue d'Audit
├── Done
├── Closed
└── ≥ 1 sub-Issue classée comme Anomalie
        │
        ▼
AUDITÉ & NON CONFORME
```

Une ou plusieurs sub-Issues d'Amélioration ne rendent donc pas, à elles seules, le Composant non conforme.

---

## 16. États de conformité

Les états minimaux sont :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

La règle actuelle peut être représentée ainsi :

| Audit Done | Issue Closed | Nombre d'Anomalies | État |
|---|---|---:|---|
| non | peu importe | peu importe | NON AUDITÉ |
| oui | non | peu importe | NON AUDITÉ |
| oui | oui | 0 | AUDITÉ & CONFORME |
| oui | oui | >= 1 | AUDITÉ & NON CONFORME |

Les Améliorations ne sont pas comptabilisées comme Anomalies pour déterminer cet état.

Des états incohérents pourront ultérieurement être signalés par le moteur de qualité des données.

---

## 17. Cohérence du Composant entre parent et sub-Issues

Une Anomalie ou une Amélioration issue d'un Audit doit porter le même label :

```text
🧩 Component:xxx
```

que l'Issue d'Audit parente.

Exemple valide :

```text
Issue d'Audit
└── 🧩 Component:Button
      │
      ├── Anomalie
      │     └── 🧩 Component:Button
      │
      └── Amélioration
            └── 🧩 Component:Button
```

Une différence entre le Composant du parent et celui d'une sub-Issue constitue une incohérence potentielle à formaliser ultérieurement dans les règles de qualité des données.

---

## 18. Fonctionnement cible des Audits

Le comportement cible est de réaliser les Audits avant la création de la Version PROD finale.

Les Issues d'Audit des Composants évoluent dans la Milestone correspondant à la future Version PROD.

```text
Milestone 1.1.0
    ├── Issue Audit composant A
    ├── Issue Audit composant B
    └── Issue Audit composant C
```

L'Audit est réalisé sur une Release Candidate :

```text
Release Candidate 1.1.0-rc.n
        ↓
Audits
        ↓
Version PROD 1.1.0
```

---

## 19. Audit pré-PROD

Un Audit pré-PROD est réalisé sur une Release Candidate avant la publication de la Version PROD finale.

```text
Version auditée : M.m.r-rc.n
Version cible   : M.m.r
Milestone       : M.m.r
```

---

## 20. Audit de rattrapage

Une Milestone :

```text
M.m.r-Audit
```

correspond à un mécanisme de rattrapage lorsque les Audits n'ont pas été réalisés avant la publication de la Version PROD.

`M.m.r-Audit` ne représente pas une nouvelle Version.

---

## 21. Traitement des Anomalies découvertes pendant un Audit

Les Anomalies découvertes sont des sub-Issues de l'Issue d'Audit puis suivent leur propre cycle :

```text
Issue d'Audit
    ↓
Sub-Issue Anomalie
    ↓
Grooming
    ↓
Pesée
    ↓
Planification
    ├── Milestone
    └── Sprint / Iteration
```

La relation de sub-Issue permet de conserver l'origine de l'Anomalie même lorsqu'elle est ensuite planifiée dans une autre Milestone.

---

## 22. Version auditée et Version cible

Dans un Audit pré-PROD :

```text
Version effectivement auditée : M.m.r-rc.n
Version PROD cible             : M.m.r
```

Dans un Audit de rattrapage :

```text
Version effectivement auditée : M.m.r
Version PROD concernée         : M.m.r
```

---

## 23. Couverture d'Audit

```text
Couverture d'Audit
=
nombre de Composants audités
/
nombre total de Composants du périmètre
```

Un Composant est considéré comme audité lorsque son Issue d'Audit est à la fois `Done` et `Closed`.

Le périmètre exact du dénominateur reste à définir.

---

## 24. Taux de conformité

```text
Taux de conformité
=
nombre de Composants conformes
/
nombre de Composants audités
```

Un Composant audité est considéré comme conforme lorsqu'aucune sub-Issue classée comme Anomalie n'est liée à son Issue d'Audit.

Un Composant non audité ne doit pas être comptabilisé comme non conforme.

---

## 25. Revalidation après correction des Anomalies

La correction d'une Anomalie et la conformité d'un Composant sont deux notions distinctes.

Une Anomalie peut être déclarée corrigée selon son workflow de traitement. Cette information ne permet pas au pipeline ou au dashboard de conclure que le Composant est conforme : le verdict de conformité relève du jugement de l'auditeur.

```text
Anomalie corrigée
≠
Composant automatiquement conforme
```

Après correction d'Anomalies, le modèle cible prévoit donc une nouvelle Issue d'Audit du Composant afin de porter explicitement la revalidation et le nouveau verdict de conformité.

Le déclenchement de cette revalidation n'est toutefois pas une conséquence automatique de la fermeture de toutes les Anomalies. Il relève d'un choix collectif de la Squad.

Selon le contexte, la Squad peut par exemple décider de demander une revalidation :

- lorsque toutes les Anomalies `bloquantes` sont traitées ;
- lorsque toutes les Anomalies sauf les `mineures` sont traitées ;
- lorsque toutes les Anomalies sont traitées ;
- selon un autre seuil décidé collectivement.

Ces seuils sont des exemples et ne constituent pas un référentiel de règles prédéfini.

Le dashboard peut exposer les Anomalies restantes par criticité et aider la Squad à prendre cette décision. Il ne doit ni déclencher implicitement un verdict de conformité, ni se substituer à l'auditeur.

La manière de matérialiser la décision collective et la responsabilité de création de la nouvelle Issue d'Audit restent à préciser.

### Résultat d'un Audit de revalidation

Chaque Audit constitue un nouveau constat de l'état du Composant.

Si l'Audit de revalidation détecte une Anomalie, l'auditeur crée une nouvelle Issue d'Anomalie liée à cette nouvelle Issue d'Audit. Une Anomalie provenant d'un Audit précédent n'est pas rouverte pour porter ce nouveau constat.

```text
Audit initial
  └── Anomalie A
        └── corrigée / Done / Closed

Audit de revalidation
  └── nouvelle Anomalie B
```

Cette règle préserve la temporalité et la traçabilité : chaque Anomalie reste rattachée à l'Audit qui l'a produite et les constats historiques ne sont pas réécrits.

Lorsqu'une nouvelle Anomalie correspond à un problème identique ou similaire à celui d'une Anomalie issue d'un Audit précédent, aucune relation explicite supplémentaire n'est nécessaire entre les deux Anomalies.

Le rattachement de chacune à son Issue d'Audit respective est suffisant pour la traçabilité. Le pipeline et le dashboard ne doivent pas créer artificiellement une relation `récurrence de`.

Une éventuelle analyse de récurrence pourra être étudiée ultérieurement comme un indicateur calculé, sans modifier les relations métier sources.

### Continuité entre Audits successifs

Une Issue d'Audit de revalidation n'a pas besoin d'être explicitement reliée à l'Issue d'Audit précédente.

Le label `🧩 Component:xxx` commun aux Audits est suffisant pour identifier qu'ils concernent le même Composant.

La Version ne doit pas être utilisée comme condition d'identité ou de chaînage entre deux Audits : selon les choix de la Squad, un Audit de revalidation peut être réalisé sur une Version différente de celle de l'Audit précédent.

Même si ce changement de Version peut être contraire au fonctionnement idéal recherché, le modèle doit représenter la réalité observée et conserver la Version effectivement auditée pour chaque Audit.

```text
Audit A : Component X + Version V1
Audit B : Component X + Version V1 ou V2
```

Une éventuelle alerte ou règle de pilotage sur le changement de Version reste à définir séparément.


### Conformité par Version

Le verdict de conformité est conservé pour le couple `Composant × Version` effectivement audité. Un Audit ultérieur sur une autre Version ne réécrit pas le verdict historique précédent.

```text
Button@1.7.1 → NON CONFORME
Button@1.8.0 → CONFORME
```

Il faut distinguer ce verdict de l'état des corrections. Des Anomalies peuvent être corrigées dans une Version ultérieure sans que le dashboard puisse déclarer cette Version conforme avant un nouveau jugement de l'auditeur.

Une annotation complémentaire pourra être étudiée pour signaler que les Anomalies connues sont corrigées dans une Version ultérieure en attente d'un Audit conforme. Son nom et ses règles ne sont pas encore définis.


### Plusieurs Audits pour un même Composant et une même Version

Plusieurs Audits peuvent porter successivement sur le même couple `Composant × Version`.

Tous les Audits et leurs verdicts restent conservés dans l'historique. En revanche, le dernier Audit réalisé donne l'état de conformité courant de ce couple.

```text
Button@1.7.1
├── Audit A → NON CONFORME
└── Audit B → CONFORME
```

L'état courant de `Button@1.7.1` est alors `CONFORME`, sans supprimer ni modifier le verdict historique de l'Audit A.

Le modèle doit donc permettre de distinguer :

- le verdict propre à chaque Audit ;
- l'historique des Audits ;
- le verdict de conformité courant du couple `Composant × Version`.

La donnée permettant de déterminer sans ambiguïté quel Audit est le dernier reste à préciser.


### Date de réalisation et ordonnancement des Audits

Un Audit est réalisé lorsque son Issue satisfait simultanément :

- `Project Status = Done` ;
- `GitHub Issue State = Closed`.

La date de réalisation correspond à l'instant où la seconde de ces deux conditions est satisfaite. `Done` et `Closed` ne sont donc pas supposés intervenir simultanément.

Cette date est utilisée pour ordonner plusieurs Audits d'un même couple `Composant × Version`. L'Audit ayant la date de réalisation la plus récente détermine le verdict de conformité courant.

La disponibilité technique de la date de transition du Project vers `Done` dans les données collectées reste à vérifier.


### Audit en cours et verdict courant

Un nouvel Audit en cours ne remplace pas le verdict du dernier Audit terminé.

Tant que le nouvel Audit ne satisfait pas simultanément `Project Status = Done` et `GitHub Issue State = Closed`, le dernier verdict acquis reste le verdict de conformité courant du couple `Composant × Version`.

```text
Button@1.7.1
├── Audit A → terminé → CONFORME
└── Audit B → In progress
```

Le dashboard doit alors distinguer deux informations :

- la conformité courante : `CONFORME`, issue de l'Audit A ;
- l'activité d'Audit : un nouvel Audit B est en cours.

Aucun verdict ne doit être anticipé pour l'Audit en cours. Lorsqu'il devient `Done + Closed`, son verdict remplace le précédent comme verdict courant, sans supprimer l'historique.


Ces deux dimensions doivent pouvoir être représentées simultanément pour le couple `Composant × Version` :

```text
conformité courante = verdict du dernier Audit terminé
audit en cours       = existence d'un nouvel Audit non terminé
```

L'information `audit en cours` doit être visible dans le dashboard sans être interprétée comme un nouveau verdict de conformité. La représentation UX exacte reste à définir.


### Unicité de l'Audit non terminé

Pour un même couple `Composant × Version`, une seule Issue d'Audit non terminée doit exister à la fois.

La notion d'Audit non terminé suit la définition métier générale : tant que l'Issue ne satisfait pas simultanément `Project Status = Done` et `GitHub Issue State = Closed`, elle reste un Audit non terminé.

Ainsi, deux Audits simultanément ouverts, `Ready`, `In progress`, ou plus généralement non `Done + Closed`, pour le même couple `Composant × Version`, constituent une situation anormale à signaler.

La sévérité de cette future règle de qualité reste à définir.


### Milestone et Version effectivement auditée

Toute Issue d'Audit doit être rattachée à une Milestone permettant d'identifier la Version de référence et le contexte de l'Audit.

Les formes actuellement retenues sont :

- `M.m.r` pour le cycle normal ;
- `M.m.r-Audit` pour le rattrapage d'une Version déjà publiée.

L'Issue d'Audit contient également dans son template :

```text
Version auditée : <version>
```

Cette information conserve la Version effectivement testée.

En pré-PROD :

```text
Milestone       : 1.8.0
Version auditée : 1.8.0-rc.42
```

En rattrapage :

```text
Milestone       : 1.8.0-Audit
Version auditée : 1.8.0
```

La Milestone sert donc de pivot vers la Version de référence, tandis que le champ `Version auditée :` conserve la précision sur l'artefact réellement audité.

La `Version auditée` doit rester cohérente avec la Version de référence portée par la Milestone.

Ainsi, `1.8.0-rc.42` est cohérent avec une Milestone `1.8.0`, alors que `1.9.0-rc.3` ne l'est pas. Pour `1.8.0-Audit`, la Version de référence normalisée reste `1.8.0`.

Une incohérence constitue une anomalie de données à signaler. Sa sévérité et son impact éventuel sur les calculs restent à définir.


### Priorité de la Milestone en cas de Version auditée manquante

La Milestone est la référence principale utilisée pour identifier la Version de référence d'un Audit.

Le champ `Version auditée :` reste attendu dans le template, mais son absence ne bloque pas l'analyse lorsque la Milestone est valide et exploitable.

Dans cette situation, l'Audit est considéré comme exploitable avec une donnée partielle :

```text
Milestone       : 1.8.0-Audit
Version auditée : <vide>

Version de référence exploitable : 1.8.0
Version effectivement testée     : non renseignée
```

Le pipeline ne doit pas inventer la Version effectivement testée. En particulier, pour une Milestone pré-PROD `1.8.0`, l'absence du champ peut empêcher de déterminer quelle RC `1.8.0-rc.n` a réellement été auditée.

Cette absence doit être signalée comme information manquante non bloquante. Sa représentation exacte dans le dashboard et dans les métadonnées de fiabilité reste à définir.


### Milestone absente : anomalie bloquante

La Milestone est obligatoire pour qu'une Issue d'Audit puisse contribuer à l'analyse de conformité.

Même si le template contient une `Version auditée :`, cette valeur ne remplace pas la Milestone :

```text
Milestone       : <absente>
Version auditée : 1.8.0

Analyse de conformité : BLOQUÉE
```

La règle est donc volontairement asymétrique :

| Milestone | `Version auditée :` | Analyse de conformité |
| --- | --- | --- |
| présente et valide | présente | exploitable |
| présente et valide | absente | exploitable avec donnée partielle |
| absente | présente | bloquée |
| absente | absente | bloquée |

Un Audit bloqué par l'absence de Milestone ne doit pas produire de verdict de conformité `Composant × Version`.

Son éventuelle prise en compte dans les indicateurs d'activité d'Audit qui ne calculent pas la conformité reste à définir.


### Audit sans Milestone et indicateurs d'activité

Une Issue d'Audit `Done + Closed` sans Milestone reste un Audit réalisé et doit être comptabilisée dans les indicateurs d'activité qui ne nécessitent pas de rattachement à une Version.

Elle ne peut en revanche pas contribuer aux calculs qui nécessitent un rattachement fiable à `Composant × Version`, notamment au verdict et au taux de conformité.

```text
Audit             : Done + Closed
Milestone         : <absente>

Nombre d'Audits réalisés : comptabilisé
Conformité               : exclue / bloquée
```

La qualité des données doit donc être évaluée au regard des besoins de chaque métrique. Une donnée incomplète pour un calcul peut rester exploitable pour un autre.

---

## 26. Historisation

L'historisation doit permettre de distinguer :

- Audit réalisé avant la PROD ;
- Audit de rattrapage ;
- Version ou Release Candidate effectivement auditée ;
- famille d'Audit ;
- Composant audité ;
- date à laquelle l'Audit est devenu `Done` et `Closed` ;
- résultat de conformité calculé ;
- Anomalies découvertes ;
- Améliorations proposées ;
- évolution ultérieure de ces Issues.

Le résultat connu à un instant donné ne doit pas être réécrit rétroactivement à partir d'informations apparues plus tard.

---

## 27. Principes retenus

1. Une Issue d'Audit correspond à un Composant à auditer.
2. Aujourd'hui, une Issue d'Audit d'Accessibilité est identifiée par `Audit RGAA`.
3. Le Composant est identifié par `🧩 Component:xxx`.
4. La cible souhaitée est `Issue Type = 🔍 Audit`.
5. L'Accessibilité est la seule famille d'Audit actuellement pratiquée.
6. RGAA, WCAG et WAI-ARIA sont actuellement traités ensemble par l'auditeur.
7. Un Audit est considéré comme réalisé lorsque l'Issue d'Audit est `Done` et `Closed`.
8. Les sub-Issues d'un Audit peuvent être des Anomalies ou des Améliorations.
9. Une Anomalie d'Audit utilise `🐛 Bug`, une criticité RGAA, un label `♿ a11y:xxx` et le même Component que son parent.
10. Une Amélioration d'Audit utilise `✨ Feature` et le même Component que son parent ; sa catégorisation complémentaire reste à définir.
11. La conformité n'est actuellement pas explicitement déclarée.
12. Un Composant audité sans sub-Issue classée comme Anomalie est considéré comme conforme.
13. Un Composant audité avec au moins une sub-Issue classée comme Anomalie est considéré comme non conforme.
14. Les Améliorations ne rendent pas, à elles seules, le Composant non conforme.
15. Les Anomalies suivent ensuite leur propre workflow de Grooming, pesée et planification.
16. Un template GitHub minimal d'Issue d'Audit est souhaité à terme.
17. Le fonctionnement cible est l'Audit pré-PROD sur une Release Candidate.
18. `M.m.r-Audit` constitue un mécanisme de rattrapage.

---

## 28. Points restant à préciser

Les points suivants restent à instruire :

- le contenu réel de la grille utilisée par l'auditeur ;
- le minimum d'informations du futur template ;
- le mécanisme de représentation de la famille d'Audit ;
- la gouvernance et la liste complète des catégories `♿ a11y:xxx` ;
- la cardinalité des catégories `♿ a11y:xxx` : l’hypothèse actuelle est une seule catégorie par Anomalie, mais elle doit être confirmée sur les Audits réels ;
- le label, champ ou autre mécanisme permettant de catégoriser une Amélioration ;
- si une Issue d'Audit doit obligatoirement avoir exactement un Composant ;
- comment identifier la Release Candidate auditée ;
- quelle date exacte représente la fin de l'Audit ;
- comment traiter les incohérences entre `Done` et `Closed` ;
- comment gérer plusieurs Audits successifs du même Composant ;
- comment la correction ultérieure des Anomalies influence l'état de conformité historique ou courant du Composant.


### Audit nécessaire selon l'évolution du Composant

Une nouvelle Version de Librairie n'impose pas automatiquement un nouvel Audit de tous ses Composants.

Un Composant peut avoir été audité sur une Version antérieure et ne pas nécessiter de nouvel Audit s'il n'a pas évolué depuis d'une manière nécessitant une nouvelle validation.

Ainsi, pour une Version `1.8.0` contenant 20 Composants, le fait que 15 Composants seulement disposent d'un Audit réalisé dans le cadre de `1.8.0` ne permet pas de conclure automatiquement que la couverture d'Audit est de 75 %.

Les 5 autres Composants peuvent éventuellement être couverts par un Audit antérieur encore applicable.

Il faut donc distinguer au minimum :

- Audit réalisé dans le cadre de la Version courante ;
- Audit antérieur potentiellement encore applicable ;
- Composant nécessitant un nouvel Audit ;
- Composant dont la situation ne peut pas être déterminée.

La règle permettant de décider si l'Audit antérieur reste applicable après le passage à une nouvelle Version n'est pas encore définie.


### Héritage de l'Audit pour un Composant inchangé

Lorsqu'un Composant n'a pas changé entre deux Versions de Librairie, son Audit antérieur reste applicable à la Version suivante.

```text
Button audité en 1.7.0 → CONFORME
              │
              └── Button inchangé en 1.8.0
                         ↓
              Audit antérieur encore applicable
```

Cela ne signifie pas qu'un nouvel Audit `Button@1.8.0` a été réalisé. Le verdict historique reste rattaché à la Version effectivement auditée.

Le modèle doit donc distinguer :

- **verdict d'Audit historique** : résultat acquis sur le `Composant × Version` effectivement audité ;
- **couverture héritée** : applicabilité de ce résultat à une Version ultérieure lorsque le Composant est inchangé.

Un changement de Version de la Librairie ne suffit pas, à lui seul, à imposer un nouvel Audit.

La définition précise permettant de déterminer qu'un Composant est « inchangé » reste à établir.


### État des lieux des Composants entre deux Versions

Le projet doit pouvoir comparer deux Versions de Librairie afin de produire un état des lieux des Composants.

Les états minimums retenus sont :

| État | Signification |
| --- | --- |
| `NOUVEAU` | Composant présent dans la Version cible mais absent de la Version de référence |
| `ÉVOLUÉ` | Composant présent dans les deux Versions avec des modifications détectées |
| `INCHANGÉ` | Composant présent dans les deux Versions sans modification détectée |
| `DÉCOMMISSIONNÉ` | Composant présent dans la Version de référence mais absent de la Version cible |

La comparaison pourra s'appuyer sur les modifications Git des fichiers appartenant à chaque Composant.

Cette capacité existe actuellement dans un script séparé et pourra être intégrée à ce projet.

### Responsabilité de la décision d'Audit

L'état des lieux est une aide au pilotage de la campagne d'Audit.

Il permet notamment de faire apparaître les Composants `NOUVEAU` et `ÉVOLUÉ`, qui peuvent conduire la Squad à créer des Issues d'Audit.

Cependant :

```text
Comparaison des Versions
        ↓
État du Composant
        ↓
Information fournie à la Squad
        ↓
Décision humaine
        ↓
Création éventuelle d'une Issue d'Audit
```

Le pipeline ne décide pas automatiquement qu'un nouvel Audit est nécessaire et ne crée pas automatiquement une Issue d'Audit sur la seule base de l'évolution détectée.

La décision reste de la responsabilité de la Squad.

La source permettant d'associer précisément les fichiers Git aux Composants reste à définir.


### Fonctionnalité reportée et architecture cible

La comparaison automatique des Composants entre deux Versions doit être conservée dans la cible du projet, mais sa réalisation est reportée.

Les repositories de Librairies n'ont pas aujourd'hui une architecture suffisamment stable et homogène pour utiliser une convention de répertoires comme règle commune. Une analyse existante s'appuie sur la notion d'export ; cette approche devra être réétudiée au moment de concevoir la fonctionnalité.

La cible fonctionnelle est la suivante :

```text
Création d'un tag Git
        │
        ├── publication issue de master
        │
        └── publication issue de support/xxx
        ↓
Identification du tag précédent pertinent
selon les règles SemVer
        ↓
Vérification qu'une comparaison
n'existe pas déjà
        ↓
Comparaison des deux Versions
        ↓
NOUVEAU / ÉVOLUÉ / INCHANGÉ / DÉCOMMISSIONNÉ
        ↓
Résultat exploitable par le Dashboard
```

Le traitement doit être idempotent : une comparaison déjà réalisée ne doit pas être recalculée inutilement.

Un mécanisme explicite doit néanmoins permettre de forcer une nouvelle comparaison.

La règle exacte de sélection du tag précédent, en particulier lorsque plusieurs lignes de Versions coexistent, reste à définir.

### Restitution future dans le Dashboard

Lorsque cette capacité sera disponible, le Dashboard devra afficher les résultats de comparaison et faire ressortir les Composants pour lesquels un Audit devrait être envisagé.

Cette information reste une aide à la décision :

```text
Composant NOUVEAU ou ÉVOLUÉ
        ↓
Signal dans le Dashboard
        ↓
Analyse par la Squad
        ↓
Décision éventuelle d'ouvrir un Audit
```

Le Dashboard ne doit pas transformer automatiquement ce signal en obligation d'Audit et le pipeline ne doit pas créer automatiquement l'Issue correspondante.


### Couverture d'Audit et taux de conformité

La couverture d'Audit et le taux de conformité sont deux indicateurs distincts avec des dénominateurs différents.

Pour une Version donnée :

```text
Couverture d'Audit
=
Composants disposant d'un Audit applicable
/
Composants du Catalogue
```

Puis :

```text
Taux de conformité
=
Composants audités conformes
/
Composants audités
```

Exemple :

```text
Composants au Catalogue : 20
Composants audités       : 17
Composants conformes     : 14

Couverture d'Audit = 17 / 20 = 85 %
Taux de conformité = 14 / 17 ≈ 82,4 %
```

Les 3 Composants non audités ne sont pas considérés comme non conformes.

Dans le fonctionnement actuel, il n'est pas nécessaire de savoir si ces 3 Composants sont `NOUVEAU`, `ÉVOLUÉ` ou dans une autre situation pour calculer ces deux indicateurs.

À terme, la comparaison entre Versions enrichira l'explication de la couverture en qualifiant les Composants et en faisant ressortir ceux pour lesquels un nouvel Audit devrait être envisagé.

La décision d'ouvrir effectivement une Issue d'Audit reste à la Squad.


### Catalogue historique par Version

La couverture d'Audit d'une Version doit utiliser le Catalogue de Composants applicable à cette Version.

Une évolution ultérieure du Catalogue ne modifie pas rétroactivement les indicateurs historiques.

```text
1.7.0
Catalogue : 20 Composants
Couverture : Audits applicables / 20

1.8.0
+ DatePicker
Catalogue : 21 Composants
Couverture : Audits applicables / 21
```

Le modèle doit donc pouvoir représenter une photographie du Catalogue par Version.

Cette photographie permet notamment de préserver la cohérence historique :

- un Composant ajouté en `1.8.0` n'entre pas dans le dénominateur de `1.7.0` ;
- un Composant décommissionné dans une Version ultérieure reste présent dans le Catalogue des Versions où il existait ;
- les indicateurs historiques ne sont pas recalculés avec la composition actuelle du Catalogue.

Le mécanisme technique permettant de construire ou de reconstituer cette photographie reste à définir.


### Décommissionnement logique d'un Composant

Lorsqu'un Composant disparaît du Catalogue actif à partir d'une Version, il n'est pas supprimé physiquement du référentiel.

Son décommissionnement est enregistré avec la Version concernée.

```text
OldSelect

présent en 1.7.0
        ↓
décommissionné en 1.8.0
        ↓
conservé dans l'historique
```

Pour `OldSelect` décommissionné en `1.8.0` :

- il appartient toujours au Catalogue historique de `1.7.0` ;
- il n'appartient plus au Catalogue actif de `1.8.0` ;
- il n'entre plus dans le dénominateur de couverture d'Audit de `1.8.0` ;
- ses Audits et verdicts historiques restent consultables.

Le modèle du Catalogue doit donc porter une information de décommissionnement associée à une Version.

Le comportement en cas de réapparition ultérieure d'un Composant décommissionné reste à définir.


### Réactivation exceptionnelle d'un Composant

La réapparition d'un Composant précédemment décommissionné est considérée comme un cas exceptionnel.

Si elle survient, elle ne doit pas être interprétée automatiquement comme une réactivation sur la seule base d'un nom, d'un export ou d'une détection technique.

La réactivation doit être explicitement matérialisée dans le Catalogue.

```text
OldSelect
│
├── actif
├── décommissionné en 1.8.0
│
└── réapparition ultérieure
        ↓
   pas de réactivation implicite
        ↓
   information explicite dans le Catalogue
```

Cette règle permet de préserver l'historique et d'éviter qu'un nouveau Composant portant le même nom soit assimilé silencieusement à l'ancien.

La représentation exacte de cette réactivation dans le Catalogue reste à définir.


### Audit réalisé et couverture héritée

Il faut distinguer deux notions :

- **Audit réalisé sur la Version** : un Audit a effectivement été effectué pour le Composant sur cette Version ;
- **couverture par un Audit applicable** : aucun nouvel Audit n'a nécessairement été réalisé sur la Version, mais un verdict antérieur reste applicable parce que le Composant est inchangé.

Exemple :

```text
Button@1.7.0
Audit réalisé
Verdict : NON CONFORME
        │
        └── Button inchangé
                    ↓
Button@1.8.0
Audit réalisé en 1.8.0 : NON
Couverture héritée      : OUI
Verdict applicable      : NON CONFORME
```

`Button@1.8.0` ne doit donc jamais être présenté comme « audité en 1.8.0 ».

Il est néanmoins couvert par un Audit applicable et son verdict courant reste `NON CONFORME`.

Cette distinction précise également le sens de la couverture :

```text
Couverture d'Audit
=
Composants couverts par un Audit applicable
/
Composants du Catalogue de la Version
```

La couverture n'est pas un indicateur de conformité. Un Composant `NON CONFORME` peut parfaitement être couvert.

Le Dashboard devra à terme permettre de comprendre si le verdict applicable provient d'un Audit réalisé sur la Version elle-même ou d'un Audit antérieur encore applicable.


### Héritage transitif d'un verdict applicable

Un verdict d'Audit applicable peut être propagé à plusieurs Versions successives lorsque le Composant reste inchangé.

Il n'existe pas de limite exprimée en nombre de Versions.

```text
Button@1.7.0
Audit réalisé
Verdict : NON CONFORME
        │
        ├── Button inchangé en 1.8.0
        │       ├── Audit 1.8.0 : NON
        │       └── verdict applicable : NON CONFORME
        │
        └── Button inchangé en 1.9.0
                ├── Audit 1.9.0 : NON
                └── verdict applicable : NON CONFORME
```

Le verdict conserve toujours son origine réelle : dans cet exemple, l'Audit de `1.7.0`.

Le Dashboard et les indicateurs ne doivent donc jamais transformer cette propagation en Audits fictifs sur `1.8.0` ou `1.9.0`.

L'héritage continue tant que le Composant reste inchangé et qu'aucun nouvel Audit terminé ne fournit un nouveau verdict applicable.

Le comportement à adopter lorsque le Composant évolue et qu'aucun nouvel Audit n'est encore disponible reste à préciser.


### Évolution d'un Composant et maintien du verdict

Une évolution technique d'un Composant ne suffit pas à conclure qu'un nouvel Audit est nécessaire.

La modification peut ne pas affecter le périmètre couvert par l'Audit.

```text
Button@1.7.0
Audit : CONFORME
        │
        └── évolution en 1.8.0
                    ↓
             signal patrimoine
                    ↓
          examen par la Squad
              /           \
             /             \
   impact Audit         pas d'impact Audit
       à traiter             ↓
                        verdict CONFORME
                        toujours applicable
```

Le pipeline ne doit donc pas transformer automatiquement un Composant `ÉVOLUÉ` en `NON AUDITÉ`.

La qualification de l'impact appartient à la Squad.

### Page cible de suivi du patrimoine

Le Dashboard devra proposer à terme une page dédiée au suivi du patrimoine des Composants.

Cette page est distincte de la restitution du verdict de conformité.

Elle devra permettre de visualiser les évolutions entre Versions et d'aider la Squad à décider si elles nécessitent ou non un nouvel Audit.

Pour un cas tel que `Button@1.8.0`, la Squad devra pouvoir matérialiser qu'une évolution détectée n'impacte pas le périmètre d'Audit et que le Composant n'est donc pas à auditer pour cette évolution.

La terminologie exacte et les états de cette qualification restent à définir.


### États de qualification du besoin d'Audit

Pour un Composant `ÉVOLUÉ`, la page de suivi du patrimoine utilise trois états :

| Qualification | Signification |
| --- | --- |
| `À ÉVALUER` | L'évolution a été détectée mais la Squad n'a pas encore statué sur le besoin d'un nouvel Audit. |
| `AUDIT À FAIRE` | La Squad considère que l'évolution nécessite un nouvel Audit. |
| `AUDIT NON NÉCESSAIRE` | La Squad considère que l'évolution n'impacte pas le périmètre nécessitant un nouvel Audit. |

La détection automatique d'une évolution initialise la qualification à `À ÉVALUER`.

```text
Détection Git
    ↓
ÉVOLUÉ
    ↓
À ÉVALUER
    ↓
Décision Squad
   /       \
  /         \
AUDIT      AUDIT
À FAIRE    NON NÉCESSAIRE
```

Trois dimensions doivent rester séparées :

```text
État patrimoine
NOUVEAU / ÉVOLUÉ / INCHANGÉ / DÉCOMMISSIONNÉ

Qualification du besoin d'Audit
À ÉVALUER / AUDIT À FAIRE / AUDIT NON NÉCESSAIRE

Verdict de conformité
CONFORME / NON CONFORME / ...
```

Le pipeline peut détecter l'évolution et initialiser `À ÉVALUER`, mais seule la Squad décide entre `AUDIT À FAIRE` et `AUDIT NON NÉCESSAIRE`.


### Nouveau Composant et obligation d'Audit

Un Composant `NOUVEAU` se distingue d'un Composant `ÉVOLUÉ`.

En cible métier, un nouveau Composant doit être audité avant sa mise à disposition. L'Audit devrait donc intervenir pendant la mise au point de la Version dans laquelle il est introduit.

```text
NOUVEAU Composant
        ↓
Audit attendu pendant la mise au point
       / \
      /   \
 réalisé   non réalisé à la mise à disposition
   ↓                    ↓
verdict            AUDIT À FAIRE
d'Audit
```

Si la Version est mise à disposition sans que cet Audit ait été réalisé, le suivi du patrimoine doit directement faire ressortir `AUDIT À FAIRE`.

Il n'y a pas, dans ce cas, de passage préalable par `À ÉVALUER` : le besoin d'Audit est déjà établi par la nature `NOUVEAU` du Composant.

Cette règle décrit le processus cible sans supposer que le processus est toujours respecté dans les données historiques.

La qualification à afficher lorsque l'Audit du nouveau Composant a bien été réalisé avant sa mise à disposition reste à préciser afin de distinguer clairement « Audit réalisé » de « Audit non nécessaire ».


### Audit réalisé et verdict de conformité

Le suivi du patrimoine dispose désormais de quatre qualifications du besoin ou de l'activité d'Audit :

| Qualification | Signification |
| --- | --- |
| `À ÉVALUER` | La Squad doit encore statuer sur le besoin d'un nouvel Audit. |
| `AUDIT À FAIRE` | Un nouvel Audit est nécessaire mais n'est pas encore réalisé. |
| `AUDIT NON NÉCESSAIRE` | La Squad a conclu qu'un nouvel Audit n'est pas nécessaire pour l'évolution considérée. |
| `AUDIT RÉALISÉ` | L'Audit attendu a effectivement été réalisé. |

Cette qualification doit rester distincte du verdict de conformité.

```text
Suivi d'activité
AUDIT RÉALISÉ
      │
      └── Résultat de l'Audit
              ├── CONFORME
              └── NON CONFORME
```

Ainsi, `AUDIT RÉALISÉ` n'est jamais synonyme de `CONFORME`.

Pour le pilotage de la qualité, le verdict `CONFORME` ou `NON CONFORME` constitue l'information principale. L'état `AUDIT RÉALISÉ` apporte une information complémentaire de suivi du patrimoine et de l'activité d'Audit.

La représentation UX exacte de ces deux dimensions sera définie lors de la conception du Dashboard.


### Non-conformité et taux de traitement des Anomalies

La correction des Anomalies et le verdict de conformité sont deux dimensions différentes.

Un Composant dont le dernier verdict applicable est `NON CONFORME` reste `NON CONFORME` jusqu'à ce qu'un nouvel Audit terminé produise un verdict `CONFORME`.

Le Dashboard doit néanmoins rendre visible l'avancement du traitement des Anomalies ayant conduit à cette non-conformité.

```text
Verdict applicable : NON CONFORME
Anomalies traitées : 75 %
```

Lorsque toutes les Anomalies connues ont été traitées :

```text
Verdict applicable : NON CONFORME
Anomalies traitées : 100 %
Revalidation attendue
```

Le `100 %` ne doit jamais être interprété comme un verdict `CONFORME`. Le taux mesure uniquement l'avancement du traitement des Anomalies ; la conformité reste déterminée par un nouvel Audit.

Une Anomalie est considérée comme traitée uniquement lorsque :

```text
Project Status = Done
AND
GitHub Issue State = Closed
```

Cette règle sert au calcul du taux de traitement des Anomalies.


### Règle de comptabilisation d'une Anomalie traitée

Pour le calcul du taux de traitement, une Anomalie est comptabilisée comme traitée uniquement lorsque :

```text
Project Status = Done
AND
GitHub Issue State = Closed
```

Le taux de traitement peut donc être exprimé conceptuellement ainsi :

```text
nombre d'Anomalies Done ET Closed
---------------------------------
nombre total d'Anomalies concernées
```

Cette mesure décrit l'avancement du traitement. Elle ne modifie jamais directement le verdict de conformité du Composant.


### Périmètre historique des Anomalies à traiter

Le suivi du traitement d'un Composant ne se limite pas aux Anomalies rattachées à l'Audit ayant produit son verdict courant.

Toutes les Anomalies historiques du Composant restent pertinentes tant qu'elles ne sont pas traitées.

```text
Audit A
├── Anomalie 1 → traitée
└── Anomalie 2 → non traitée ─┐

Audit B                         ├── stock restant du Composant
├── Anomalie 3 → traitée       │
└── Anomalie 4 → non traitée ─┘
```

Une Anomalie est traitée selon la règle :

```text
Project Status = Done
AND
GitHub Issue State = Closed
```

Une Anomalie traitée n'appartient plus au stock restant, mais son existence et son rattachement à l'Audit d'origine restent conservés dans l'historique.

Le périmètre exact du dénominateur utilisé pour afficher un pourcentage de traitement reste à préciser.


### Taux historique et stock restant

Le taux de traitement d'un Composant est cumulatif sur son historique :

```text
Anomalies historiquement traitées
---------------------------------
Anomalies historiquement détectées
```

Exemple :

```text
Button
Anomalies historiquement détectées : 10
Anomalies traitées                  : 8
Stock restant                       : 2
Taux de traitement                  : 80 %
```

Le Dashboard doit restituer à la fois le pourcentage et le stock restant en valeur absolue.

Pour les Anomalies d'accessibilité portant la criticité RGAA actuelle, le stock restant doit également pouvoir être ventilé par niveau :

```text
Stock restant : 5
├── 🚦 rgaa:bloquante : 1
├── 🚦 rgaa:majeure   : 3
└── 🚦 rgaa:mineure   : 1
```

Cette ventilation permet de distinguer la quantité de dette restante de sa criticité.

Ni le taux de traitement, ni la diminution du stock, ni sa ventilation ne remplacent le verdict de conformité issu d'un Audit.


### Taux de traitement par criticité RGAA

Le suivi du stock restant est complété par un taux de traitement historique propre à chaque criticité RGAA.

```text
🚦 rgaa:bloquante : 100 % (3/3) — 0 restante
🚦 rgaa:majeure   :  75 % (6/8) — 2 restantes
🚦 rgaa:mineure   :  40 % (2/5) — 3 restantes
```

Pour chaque criticité :

```text
Anomalies historiques traitées de la criticité
-----------------------------------------------
Total des Anomalies historiques de la criticité
```

Le Dashboard peut ainsi restituer conjointement :

- le taux global de traitement du Composant ;
- le stock global restant ;
- le stock restant par criticité ;
- le taux de traitement par criticité.

Ces indicateurs décrivent le traitement des Anomalies. Même lorsqu'un niveau atteint `100 %`, ils ne remplacent pas le verdict de conformité issu de l'Audit.
