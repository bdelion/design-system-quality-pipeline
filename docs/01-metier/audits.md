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
