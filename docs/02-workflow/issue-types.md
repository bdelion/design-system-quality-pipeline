# Issue Types

## 1. Objectif

Les Issue Types décrivent la nature métier principale d'une Issue.

Ils répondent à la question :

> Quel type de travail cette Issue représente-t-elle ?

Les Issue Types ne doivent pas être utilisés pour représenter toutes les caractéristiques d'une Issue.

---

## 2. Principe

Le modèle distingue :

```text
Issue Type
    ↓
nature du travail
```

des :

```text
Labels / champs / relations
    ↓
caractéristiques du travail
```

Exemples :

```text
Issue Type : Bug
Criticité  : ...
Composant  : ...
```

ou :

```text
Issue Type     : 🔍 Audit
Famille d'Audit: RGAA
Composant      : ...
```

---

## 3. Types identifiés

Les types métier déjà identifiés dans le projet comprennent notamment :

- BUG ;
- FEATURE ;
- TASK ;
- EPIC ;
- AUDIT ;
- NEW_COMPONENT ;
- OTHER.

La taxonomie définitive et les libellés GitHub exacts restent à stabiliser.

---

## 4. Type Audit

La cible souhaitée est de disposer d'un Issue Type :

```text
🔍 Audit
```

Ce type indique uniquement que l'Issue représente un travail d'Audit.

Il ne doit pas nécessairement identifier la famille de cet Audit.

---

## 5. Situation actuelle

Aujourd'hui, les Issues d'Audit RGAA sont identifiées par un label :

```text
Audit RGAA
```

Elles possèdent également un label de Composant :

```text
🧩 Component:xxx
```

L'Issue Type `🔍 Audit` représente donc une évolution souhaitée du modèle GitHub et non une règle applicable immédiatement à toutes les données existantes.

---

## 6. Famille d'Audit

La famille d'Audit constitue une dimension distincte de l'Issue Type.

Exemple :

```text
Issue Type      : 🔍 Audit
Famille d'Audit : RGAA
```

Cette distinction permettra potentiellement de supporter plusieurs familles :

```text
🔍 Audit
    ├── RGAA
    ├── WAI-ARIA
    └── autres familles à définir
```

La liste ci-dessus n'est pas une taxonomie définitive.

Seule la famille RGAA est actuellement établie dans le fonctionnement décrit.

---

## 7. Pourquoi ne pas créer immédiatement un Issue Type par famille

Une approche telle que :

```text
Audit RGAA
Audit WAI-ARIA
Audit ...
```

mélangerait deux dimensions :

- la nature du travail ;
- la famille de l'Audit.

La séparation envisagée :

```text
Issue Type = 🔍 Audit
+
Famille d'Audit = ...
```

permet de faire évoluer les familles sans nécessairement modifier les Issue Types.

Cette orientation reste à confirmer après identification des différentes familles d'Audit réellement nécessaires.

---

## 8. Issue Type et workflow

L'Issue Type peut participer à la sélection du profil de workflow.

Conceptuellement :

```text
Issue Type
    │
    └── 🔍 Audit
          │
          └── profil AUDIT
```

Le profil AUDIT peut avoir des règles différentes du workflow STANDARD, notamment concernant :

- la branche ;
- la Pull Request ;
- la notion de réalisation ;
- la conformité ;
- les relations avec les Anomalies détectées.

Ces règles sont documentées séparément.

---

## 9. Issue Type et Composant

Le fait qu'une Issue soit de type Audit ne permet pas à lui seul de déterminer le Composant audité.

Aujourd'hui, le Composant est identifié par :

```text
🧩 Component:xxx
```

Les dimensions sont donc distinctes :

```text
Issue
├── nature     : Audit
├── famille    : RGAA
└── composant  : xxx
```

---

## 10. Migration

Le passage de :

```text
label = Audit RGAA
```

vers :

```text
Issue Type = 🔍 Audit
```

doit être traité comme une évolution de la modélisation.

Pendant une éventuelle période de transition, le pipeline pourra avoir à reconnaître plusieurs représentations d'une même nature métier.

Les règles précises de migration ne sont pas encore définies.

---

## 11. Principes retenus

1. L'Issue Type représente la nature principale du travail.
2. La cible souhaitée comporte un Issue Type `🔍 Audit`.
3. `Audit` et `RGAA` ne représentent pas la même dimension.
4. `RGAA` constitue actuellement une famille d'Audit.
5. Le mécanisme cible de représentation de la famille reste à décider.
6. Le Composant reste une dimension distincte.
7. Le modèle doit pouvoir accompagner une transition depuis le label actuel `Audit RGAA`.

---

## 12. Points ouverts

Restent à déterminer :

- la liste exacte des Issue Types ;
- la liste des familles d'Audit ;
- le mécanisme GitHub utilisé pour représenter la famille d'Audit ;
- si une Issue peut appartenir à plusieurs familles d'Audit ;
- les règles de migration du label `Audit RGAA` vers `🔍 Audit`;
- les règles de compatibilité avec les données historiques.