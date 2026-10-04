# Modèle métier de référence

## Statut

**BASE DE TRAVAIL — ENRICHIE PAR LES DÉCISIONS DU 04/10/2026**

Ce document décrit le modèle métier actuellement identifié pour le suivi des Design Systems et de leurs librairies.

Il distingue volontairement :

* ce qui correspond au fonctionnement actuel ;
* les orientations futures explicitement souhaitées ;
* les sujets qui restent à instruire.

Une hypothèse future ne doit pas être considérée comme une réalité actuelle.

---

## 1. Finalité du modèle métier

Le modèle métier doit permettre de représenter les éléments nécessaires au suivi :

* des librairies du Design System ;
* de leurs composants ;
* des travaux réalisés autour de ces composants ;
* des anomalies ;
* des audits ;
* des versions ;
* des relations entre ces objets ;
* à terme, des applications qui consomment les librairies.

Le modèle ne doit pas être construit exclusivement autour des objets GitHub.

GitHub constitue actuellement une source majeure de données, mais les concepts métier doivent pouvoir être conservés si d'autres sources sont ajoutées ultérieurement.

---

## 2. Organisation générale

Le modèle cible doit distinguer plusieurs niveaux.

```text
Organisation
    │
    └── Librairie
            │
            ├── Package(s)
            │
            ├── Repository(s)
            │
            ├── Version(s)
            │
            └── Composant(s)
```

Cette représentation est une **orientation cible**.

Elle ne signifie pas que toutes ces relations sont actuellement présentes dans le code.

---

## 3. Situation actuelle concernant les repositories

Dans le périmètre actuel du projet, la situation de travail est :

```text
1 repository = 1 librairie
```

Cette correspondance est compatible avec l'organisation actuelle observée dans le projet.

Elle ne doit toutefois pas devenir une contrainte du modèle métier.

---

## 4. Évolution souhaitée concernant les repositories

Le modèle doit pouvoir évoluer pour représenter un repository contenant plusieurs librairies.

La cible minimale identifiée est donc :

```text
1 repository = 1..n librairies
```

Cette évolution correspond notamment au besoin futur de gérer des repositories de type monorepo.

La manière d'identifier et de délimiter les différentes librairies dans un même repository n'est pas encore définie.

**À instruire.**

---

## 5. Librairie

Une librairie représente une unité métier du Design System suivie par le dashboard.

Aujourd'hui, elle correspond principalement à un package distribuable.

Cependant, le modèle doit permettre à terme qu'une librairie fonctionnelle puisse être distribuée par plusieurs packages.

La relation cible envisagée est donc :

```text
Librairie
    │
    ├── Package
    ├── Package
    └── ...
```

La définition exacte d'une librairie indépendante de ses packages reste à préciser.

**À instruire.**

---

## 6. Repository et librairie

Le repository est une entité technique GitHub.

La librairie est une entité métier.

Aujourd'hui, elles sont pratiquement confondues dans le périmètre du projet.

À terme, elles doivent être distinguées.

```text
Repository
     │
     ├── Librairie A
     ├── Librairie B
     └── ...
```

La cardinalité exacte et les règles d'identification restent à définir.

---

## 7. Package

Le package représente le mode de distribution d'une librairie.

Aujourd'hui, le modèle de travail considère principalement :

```text
1 librairie = 1 package principal
```

Cette relation pourra évoluer vers :

```text
1 librairie = 1..n packages
```

La définition précise du package, notamment son identifiant, son registre, son lien avec une version et sa relation avec un repository, reste à instruire.

---

## 8. Composant

Un composant est une unité fonctionnelle du Design System fournie par une librairie.

Il doit être identifié indépendamment du repository technique.

Le catalogue constitue actuellement une référence permettant d'identifier les composants connus.

À terme, un composant pourra également être rapproché des applications consommatrices.

---

## 9. Issue

L'Issue est un objet provenant de GitHub.

Elle constitue une donnée technique permettant notamment de représenter :

* un travail ;
* une anomalie ;
* un audit ;
* une tâche ;
* une fonctionnalité ;
* un autre objet selon l'Issue Type.

Une Issue GitHub ne doit donc pas être automatiquement assimilée à un objet métier unique.

---

## 10. Anomalie

Une anomalie représente un problème identifié dans le périmètre du Design System.

La représentation technique actuelle repose principalement sur les Issues GitHub.

Cependant, la définition métier exacte d'une anomalie n'est pas encore totalement arrêtée.

En particulier, il reste à déterminer :

* si toute anomalie correspond à une Issue ;
* si toute anomalie possède l'Issue Type `BUG` ;
* comment distinguer une anomalie ordinaire d'une anomalie issue d'un audit ;
* comment distinguer une anomalie d'une amélioration proposée.

**À instruire.**

---

## 11. Audit

Un audit représente une évaluation réalisée sur un périmètre donné.

Le projet identifie notamment les audits de composants et les audits d'accessibilité.

Un audit peut être représenté techniquement par une Issue GitHub, mais l'objet métier doit rester distinct de cette représentation.

Le modèle doit pouvoir associer un audit à :

* une librairie ;
* un composant ;
* une version ;
* un statut ;
* un résultat ;
* éventuellement un ou plusieurs objets produits par l'audit.

La notion de campagne d'audit et la taxonomie complète des types d'audit restent à définir.

**À instruire.**

---

## 12. Version

Une version représente un état versionné d'une librairie ou d'un package.

Les données GitHub peuvent notamment utiliser les Milestones pour représenter des versions.

Une Milestone ne doit toutefois pas être automatiquement considérée comme une Version, car les spécifications actuelles identifient plusieurs usages des Milestones.

La relation exacte entre Version, Package, Release et Milestone reste à formaliser.

**À instruire.**

---

## 13. Pull Request

La Pull Request est un objet technique GitHub représentant une réalisation ou une modification proposée.

Elle peut servir à établir la traçabilité entre une Issue et sa réalisation technique.

La présence d'une Pull Request n'est toutefois pas nécessairement obligatoire pour tous les types de travaux.

Cette règle dépend du workflow applicable à l'objet concerné.

---

## 14. Iteration

Une Iteration représente une période de travail planifiée.

Les spécifications métier identifient notamment les besoins de suivi des sprints et de leur activité.

Les notions de sprint, iteration, capacité, engagement et vélocité doivent être précisées dans les documents de workflow et d'indicateurs.

---

## 15. Milestone

Une Milestone est un objet GitHub pouvant être utilisé pour différents besoins métier.

Les usages identifiés comprennent notamment :

* version ;
* audit ;
* horizon de planification ;
* lot de travail.

Elle ne doit donc pas être assimilée systématiquement à une version.

La règle de classification d'une Milestone devra être précisée.

---

## 16. Catalogue

Le catalogue constitue le référentiel des composants connus.

Il est actuellement séparé des données GitHub.

Il permet notamment de distinguer les composants connus du catalogue des composants rencontrés dans les données sources.

La gouvernance et les règles complètes du catalogue restent à préciser.

---

## 17. Applications consommatrices

À terme, le modèle devra pouvoir représenter les applications utilisant les librairies du Design System.

Le besoin identifié comprend notamment :

```text
Application
    │
    ├── utilise une librairie
    │       └── dans une version donnée
    │
    └── utilise des composants
```

Les informations attendues comprennent notamment :

* librairies utilisées ;
* versions utilisées ;
* composants utilisés ;
* fréquence d'utilisation des composants ;
* dette éventuelle de version.

La méthode d'acquisition de ces données n'est pas encore définie.

**À instruire.**

---

## 18. Principes de séparation

Les concepts suivants doivent rester distincts :

| Concept          | Question à laquelle il répond                                      |
| ---------------- | ------------------------------------------------------------------ |
| Organisation     | Dans quel périmètre organisationnel ?                              |
| Librairie        | Quelle unité métier du Design System ?                             |
| Package          | Comment la librairie est-elle distribuée ?                         |
| Repository       | Où se trouvent techniquement les sources ?                         |
| Composant        | Quel élément du Design System est concerné ?                       |
| Issue Type       | De quel type est le travail GitHub ?                               |
| Label            | Quelles caractéristiques sont associées à l'Issue ?                |
| Project / Status | Où se trouve le travail dans le workflow ?                         |
| Iteration        | Quand le travail est-il planifié ?                                 |
| Milestone        | À quel lot, horizon, audit ou version le travail est-il rattaché ? |
| Audit            | Quelle évaluation est réalisée ?                                   |
| Anomalie         | Quel problème a été identifié ?                                    |
| Pull Request     | Quelle réalisation technique est associée ?                        |
| Version          | Quel état versionné est concerné ?                                 |

---

## 19. Principe d'évolution

Le modèle doit permettre une évolution progressive :

```text
Situation actuelle

GitHub
  ↓
Repository
  ↓
Issues / Pull Requests
  ↓
Librairie / Composants
```

vers :

```text
Modèle cible

Organisation
    ↓
Librairie
    ├── Package(s)
    ├── Repository(s)
    ├── Version(s)
    └── Composant(s)
            ↑
            │
      Application(s)
      consommatrice(s)
```

Cette évolution doit pouvoir être réalisée sans remettre en cause les définitions métier fondamentales.

---

## 20. Décisions restant à prendre

Les sujets suivants restent à instruire :

* définition exacte d'une librairie indépendante d'un package ;
* relation librairie/package ;
* relation librairie/repository ;
* identification de plusieurs librairies dans un monorepo ;
* identification d'un composant dans un monorepo ;
* définition précise d'une anomalie ;
* définition complète d'un audit ;
* relation Version / Package / Release / Milestone ;
* identification des applications consommatrices ;
* méthode d'analyse du code des consommateurs.
