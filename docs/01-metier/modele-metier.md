# Modèle métier de référence

## Statut

**BASE DE TRAVAIL — ENRICHIE PAR LES DÉCISIONS DU 04/10/2026**

Ce document décrit le modèle métier actuellement observé, les orientations validées et les éléments qui restent à instruire.

Il ne doit pas transformer une hypothèse future en réalité actuelle.

---

## 1. Organisation générale

Le modèle métier doit distinguer plusieurs niveaux :

```text
Organisation
    │
    └── Librairie
            │
            └── Repository
                    │
                    ├── Issues
                    ├── Pull Requests
                    └── autres objets GitHub
```

Cependant, cette représentation ne correspond pas encore au fonctionnement cible.

### Situation actuelle

Dans le périmètre actuel :

```text
1 repository = 1 librairie
```

Cette correspondance est une simplification correspondant à l'organisation actuelle du projet.

### Évolution souhaitée

Le modèle doit permettre à terme :

```text
1 repository = 1..n librairies
```

Une librairie doit donc posséder une identité métier indépendante de celle du repository.

Cette distinction est importante pour permettre l'évolution vers des repositories de type monorepo.

---

## 2. Modèle cible de référence

L'organisation cible discutée est :

```text
Organisation
    │
    └── Librairie
          │
          ├── Repository
          │
          ├── Components
          │
          ├── Versions
          │
          ├── Audits
          │
          └── Anomalies
```

Les Issues et Pull Requests restent des objets provenant de GitHub et doivent être rattachés au contexte métier approprié.

Le modèle exact des relations sera précisé dans `docs/01-metier/relations.md`.

---

## 3. Objets actuellement identifiés

Le code actuel expose notamment :

```text
NormalizedData
├── libraries[]
├── components[]
├── audits[]
├── anomalies[]
└── pullRequests[]
```

Le snapshot conserve également le `RawDataset` et les décisions de qualité des données.

---

## 4. Objets métier identifiés

Les principaux objets métier identifiés dans les échanges sont :

* Organisation ;
* Librairie ;
* Repository ;
* Composant ;
* Issue ;
* Anomalie ;
* Audit ;
* Pull Request ;
* Version ;
* Iteration ;
* Milestone ;
* Catalogue.

Tous ces objets ne sont pas encore implémentés comme objets indépendants dans le code actuel.

---

## 5. Principes de séparation

Les concepts suivants doivent rester distincts :

| Concept          | Question à laquelle il répond                                           |
| ---------------- | ----------------------------------------------------------------------- |
| Issue Type       | Qu'est-ce que l'issue ?                                                 |
| Label            | Qu'est-ce qui caractérise l'issue ?                                     |
| Project / Status | Où se trouve l'issue dans le workflow ?                                 |
| Iteration        | Quand le travail est-il planifié ?                                      |
| Milestone        | À quel lot, horizon ou version l'issue est-elle rattachée ?             |
| Librairie        | Quelle librairie métier est concernée ?                                 |
| Repository       | Dans quel repository GitHub se trouvent les données ?                   |
| Component        | Quel composant est concerné ?                                           |
| Audit            | Dans quel contexte d'évaluation intervient le composant ou l'anomalie ? |
| Version          | Quelle version du produit/librairie est concernée ?                     |
| Pull Request     | Quelle réalisation technique est associée au travail ?                  |

---

## 6. Repository et librairie

Le repository est actuellement utilisé comme représentation technique de la librairie.

Cette relation ne doit toutefois pas devenir une contrainte du modèle métier.

La relation cible est :

```text
Library 1 ─────── 1..n Repository
```

ou, selon les besoins qui seront précisés ultérieurement, une relation permettant également de représenter plusieurs librairies dans un même repository.

**À instruire :** la cardinalité exacte et le sens de la relation entre librairie et repository dans les cas de monorepo.

---

## 7. Composant

Un composant appartient à une librairie métier.

Le repository constitue actuellement un moyen technique de retrouver cette librairie, mais il ne doit pas devenir la seule identité du composant.

Cette distinction est nécessaire pour préparer le support futur des monorepos.

---

## 8. Versions

Une librairie peut être associée à plusieurs versions.

Les règles permettant de déterminer une version à partir des données GitHub, notamment des Milestones, restent à préciser.

Le traitement de suffixes tels que `-Audit` est identifié dans les spécifications mais fera l'objet d'une définition dédiée.

---

## 9. Audit

Un audit est un objet métier distinct d'une Issue GitHub.

Une Issue peut constituer la représentation technique d'un audit dans GitHub, mais le modèle métier doit permettre de distinguer :

* l'objet audit ;
* son support GitHub éventuel ;
* le composant concerné ;
* la version ;
* les anomalies éventuellement découvertes.

La taxonomie complète des audits reste à formaliser.

---

## 10. Anomalie

Une anomalie est un objet métier distinct de l'Issue GitHub qui la représente éventuellement.

La définition exacte d'une anomalie reste à instruire.

En particulier, il n'est pas encore décidé que toutes les anomalies sont nécessairement des `BUG` au sens de l'Issue Type GitHub.

Voir `docs/00-cadrage/questions-ouvertes.md`.

---

## 11. Pull Request

La Pull Request constitue une donnée technique GitHub permettant notamment de relier un travail à sa réalisation.

La présence ou l'absence d'une Pull Request dépend du workflow de l'objet concerné.

Elle ne doit donc pas être considérée comme une propriété universelle de tous les objets métier.

---

## 12. Principe d'évolution

Le modèle doit permettre de passer progressivement de :

```text
GitHub
  ↓
Repository
  ↓
Issues / PR
```

à un modèle métier plus explicite :

```text
Organisation
  ↓
Librairie
  ↓
Repository
  ↓
Composants / Versions / Audits / Anomalies
```

sans devoir réécrire les définitions métier lorsque le support des monorepos sera introduit.
