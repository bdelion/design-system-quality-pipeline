# Objets métier

## Statut

**BASE DE TRAVAIL**

Ce document décrit les objets métier identifiés à partir du projet actuel et des besoins exprimés.

Il distingue les réalités actuelles des évolutions futures.

---

## 1. Organisation

Une organisation représente le périmètre auquel appartiennent les librairies du Design System.

Le besoin d'un objet Organisation est identifié dans le modèle cible.

**Implémentation actuelle :** le projet utilise notamment un owner GitHub.

**À instruire :** définition métier exacte d'une Organisation et éventuel besoin de gérer plusieurs organisations.

---

## 2. Librairie

Une librairie représente une librairie du Design System suivie par le dashboard.

### Situation actuelle

Le projet fonctionne actuellement selon une correspondance :

```text
1 repository = 1 librairie
```

### Évolution cible

Le modèle doit permettre :

```text
1 repository = plusieurs librairies
```

La librairie doit donc être identifiée indépendamment du repository.

**À instruire :** comment identifier plusieurs librairies lorsqu'elles sont présentes dans un même repository.

---

## 3. Repository

Le repository est l'objet technique GitHub contenant les données exploitées.

Aujourd'hui, un repository correspond au périmètre d'une librairie dans le modèle opérationnel.

Cette correspondance ne doit pas être considérée comme une règle métier définitive.

---

## 4. Component

Le composant représente un composant du Design System.

Le modèle normalisé possède notamment des informations d'identité, de bibliothèque, de statut, d'alias, de source de découverte, de tags, de propriétaire/Squad et de provenance.

Le catalogue constitue une référence permettant d'enrichir et de classer les composants.

Un composant doit être rattachable à une librairie indépendamment du repository technique.

---

## 5. Issue

L'Issue est un objet provenant de GitHub.

Le RAW conserve actuellement notamment :

* identifiant ;
* numéro ;
* titre ;
* état ;
* Issue Type ;
* labels ;
* composant éventuel ;
* criticités ;
* parents ;
* dates ;
* liens vers les Pull Requests ;
* statuts Project ;
* milestone.

L'Issue est une représentation technique.

Elle ne doit pas être automatiquement assimilée à un objet métier unique.

---

## 6. Anomaly

L'anomalie représente un problème identifié dans le périmètre du Design System.

La relation entre anomalie et Issue GitHub doit permettre de conserver la traçabilité.

La définition précise d'une anomalie est encore à instruire.

Notamment :

* une anomalie est-elle toujours une Issue ?
* une anomalie est-elle toujours de type `BUG` ?
* comment distinguer une anomalie ordinaire d'une anomalie issue d'un audit ?
* quelles autres caractéristiques permettent de la qualifier ?

Voir `docs/00-cadrage/questions-ouvertes.md`.

---

## 7. Audit

L'audit représente une évaluation réalisée sur un périmètre donné.

Le modèle normalisé actuel possède notamment :

* `auditId` ;
* `libraryId` ;
* `componentId` ;
* version ;
* statut ;
* issue source ;
* résultat ;
* provenance.

La notion de campagne d'audit et la taxonomie des types d'audit ne sont pas encore suffisamment définies.

---

## 8. Pull Request

La Pull Request est un objet GitHub représentant une réalisation technique.

Le RAW conserve notamment :

* identifiant ;
* numéro ;
* état ;
* date de merge ;
* relations avec les Issues.

Une Pull Request peut constituer une preuve de réalisation lorsqu'elle est attendue par le workflow.

Elle n'est pas nécessairement applicable à tous les types de travaux.

---

## 9. Version

Une version représente une version d'une librairie du Design System.

Les sources disponibles indiquent notamment que les Milestones peuvent représenter des versions et que des suffixes comme `-Audit` peuvent être utilisés.

La normalisation exacte des versions reste à formaliser.

---

## 10. Iteration

L'Iteration représente une période de travail planifiée.

Les spécifications identifient notamment les besoins de suivi de sprints/itérations.

Le RAW actuel ne possède pas encore un objet Iteration complet.

La structure métier et les règles de calcul associées restent à préciser.

---

## 11. Milestone

La Milestone est un objet GitHub pouvant représenter différents concepts métier.

Les besoins identifiés montrent notamment des usages liés :

* aux versions ;
* aux audits ;
* aux horizons de planification ;
* à d'autres lots de travail.

Il ne faut donc pas assimiler systématiquement une Milestone à une Version.

---

## 12. Catalogue

Le catalogue constitue une référence des composants du Design System.

Il est actuellement séparé des données GitHub.

Il permet notamment de déterminer les composants connus et de les utiliser lors de la normalisation.

---

## 13. Principe général

Les objets métier ne doivent pas être confondus avec leurs représentations GitHub.

Par exemple :

```text
Anomalie
   ↓ représentation éventuelle
Issue GitHub
```

ou :

```text
Audit
   ↓ représentation éventuelle
Issue GitHub
```

Le modèle doit conserver la possibilité qu'un même objet métier puisse être alimenté par différentes sources à l'avenir.
