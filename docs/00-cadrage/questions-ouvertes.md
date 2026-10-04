# Questions ouvertes

## 1. Objectif

Ce document recense les décisions métier et d'architecture qui doivent encore être prises pour stabiliser le modèle du Design System Quality Pipeline.

L'objectif est d'éviter :

- d'introduire des hypothèses implicites ;
- de transformer une situation actuelle en contrainte définitive ;
- de coder des règles métier qui n'ont pas encore été validées.

Les questions doivent être traitées progressivement.

Lorsqu'une réponse est établie, elle doit être reportée dans les documents de référence concernés.

---

# 2. Décisions et faits déjà établis

## D-001 — Repository et Librairie

### Décision actuelle

Aujourd'hui :

```text
1 Repository = 1 Librairie
```

### Cible

Le modèle doit permettre à terme :

```text
1 Repository = 1..n Librairies
```

afin de supporter notamment les monorepos.

---

## D-002 — Librairie et Package

### Fait actuel établi

Une Librairie est aujourd'hui distribuée sous la forme d'un Package pouvant être directement utilisé par les Applications.

Le Package possède :

- un nom ;
- plusieurs Versions au cours de son cycle de vie.

La relation actuelle est :

```text
Librairie
    │
    └── Package
```

Dans la situation actuelle :

```text
1 Librairie = 1 Package
```

### Cible

Le modèle doit conserver la possibilité :

```text
1 Librairie = 1..n Packages
```

Cette cardinalité est une capacité cible et non une situation actuelle observée.

---

## D-003 — Package et Version

### Fait actuel établi

Une Application utilise un Package dans une Version donnée.

```text
Application
    │
    └── utilise
          ├── Package
          └── Version du Package
```

La Version est donc rattachée au Package.

---

## D-004 — Versions PROD et SNAPSHOT

### Fait actuel établi

Pour Design System React, plusieurs Versions d'un même Package peuvent être disponibles simultanément dans Nexus avec des finalités différentes.

Exemple :

```text
@my-enterprise/design-system-react
    │
    ├── 1.7.1
    │     └── PROD
    │
    └── 1.8.0-SNAPSHOT
          └── tests d'intégration
```

`1.7.1` est actuellement la dernière Version PROD déclarée :

- publiée dans Nexus ;
- disponible pour les clients ;
- destinée à la production.

`1.8.0-SNAPSHOT` est actuellement la Version présente dans le `package.json` de `develop` :

- publiée dans Nexus ;
- destinée aux tests d'intégration ;
- non destinée à être déployée en production.

### Conséquence

```text
Version publiée dans Nexus ≠ nécessairement Version PROD
```

---

## D-005 — Composant non audité

Un Composant non audité ne doit pas être automatiquement considéré comme non conforme.

Il faut distinguer :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

Cela permet notamment de séparer :

```text
Couverture d'audit
= audités / périmètre
```

de :

```text
Taux de conformité
= conformes / audités
```

---

## D-006 — Vélocité vide et vélocité zéro

Les valeurs suivantes sont sémantiquement différentes :

```text
velocity = null
velocity = 0
velocity > 0
```

Elles ne doivent pas être normalisées comme une même situation.

---

## D-007 — Criticité

La criticité doit être associée à un domaine.

Il faut notamment pouvoir distinguer :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

Une criticité générique telle que `major` ne suffit pas à elle seule.

---

## D-008 — Anomalie et amélioration

Une anomalie et une proposition d'amélioration sont deux notions différentes.

Un audit peut produire :

```text
Audit
    ├── Anomalies / non-conformités
    └── Propositions d'amélioration
```

Ces objets ne doivent pas être automatiquement agrégés dans les mêmes indicateurs.

---

# 3. Questions ouvertes — Librairies, Packages et Repositories

## Q-001 — Propriétés du Package

Quelles propriétés doivent définir un Package dans le modèle métier ?

Éléments déjà établis :

- il possède un nom ;
- il possède des Versions ;
- il est publié dans Nexus.

Autres propriétés éventuelles à instruire :

- identifiant ;
- repository source ;
- librairie associée ;
- autres métadonnées de publication.

**Statut : À instruire**

---

## Q-002 — Plusieurs Packages pour une Librairie

Dans quels cas une Librairie pourrait-elle être distribuée par plusieurs Packages ?

Cette possibilité est une cible du modèle mais aucun cas actuel n'est encore établi.

**Statut : À instruire**

---

## Q-003 — Plusieurs Librairies dans un Repository

Comment les Librairies devront-elles être identifiées dans un futur monorepo ?

Exemples de possibilités à étudier ultérieurement :

- configuration explicite ;
- répertoires ;
- Packages ;
- métadonnées de publication.

**Statut : À instruire**

---

## Q-004 — Composants et Packages

Dans le cas futur où une Librairie possède plusieurs Packages, un Composant appartient-il :

- à la Librairie ;
- à un Package ;
- potentiellement à plusieurs Packages ?

**Statut : À instruire**

---

# 4. Questions ouvertes — Versions et Releases

## Q-005 — Classification des Versions

Quelle règle générique permet de déterminer le contexte d'une Version ?

Pour Design System React, deux contextes sont établis :

- PROD ;
- SNAPSHOT pour tests d'intégration.

Il reste à déterminer si cette convention s'applique de la même manière aux autres Librairies et si d'autres contextes existent.

**Statut : À instruire**

---

## Q-006 — Source de référence d'une Version PROD

Quelle information doit être utilisée comme source de référence pour déterminer la dernière Version PROD d'un Package ?

L'exemple de Design System React établit que `1.7.1` est publiée dans Nexus et disponible pour les clients.

Il reste à déterminer la règle permettant au pipeline de l'identifier automatiquement comme dernière Version PROD.

**Statut : À instruire**

---

## Q-007 — Branche et Version

Quelle est la relation exacte entre les branches Git et les Versions ?

Pour Design System React, il est établi que :

```text
develop
    └── package.json
          └── 1.8.0-SNAPSHOT
```

Il reste à déterminer les conventions appliquées aux Versions PROD et aux autres Librairies.

**Statut : À instruire**

---

## Q-008 — Version et Release

Quelle est la relation exacte entre :

```text
Version
Release
```

Une Release représente-t-elle systématiquement la publication d'une Version ?

**Statut : À instruire**

---

## Q-009 — Version et Milestone

Quelle relation doit être établie entre :

```text
Version du Package
Milestone GitHub
```

Un Milestone peut actuellement représenter plusieurs notions et ne peut donc pas être assimilé automatiquement à une Version.

**Statut : À instruire**

---

## Q-010 — Version d'audit

La convention :

```text
1.1.0
1.1.0-Audit
```

doit-elle toujours être interprétée comme une même Version de référence avec deux contextes différents ?

Le suffixe doit être configurable.

**Statut : À confirmer**

---

# 5. Questions ouvertes — Anomalies

## Q-011 — Définition d'une anomalie

Quelle règle doit déterminer qu'une Issue représente une anomalie ?

Le modèle doit pouvoir supporter :

- Issue Type ;
- label ;
- combinaison de critères ;
- configuration spécifique par Repository ou organisation.

**Statut : À instruire**

---

## Q-012 — Origine d'une anomalie

Quelles origines doivent être distinguées ?

Exemples déjà identifiés :

- audit ;
- utilisateur ;
- équipe ;
- autre processus.

**Statut : À instruire**

---

## Q-013 — Date de détection

Quelle date représente la détection d'une anomalie ?

Exemples possibles :

- création de l'Issue ;
- date d'un audit ;
- autre événement.

**Statut : À instruire**

---

## Q-014 — Date de correction

Quelle date représente la correction effective d'une anomalie ?

Exemples possibles :

- fermeture de l'Issue ;
- merge de la Pull Request ;
- publication d'une Version ;
- autre événement.

**Statut : À instruire**

---

# 6. Questions ouvertes — Audits

## Q-015 — Objet Audit

L'Audit doit-il devenir un objet métier explicite indépendant de l'Issue GitHub qui peut actuellement le représenter ?

**Statut : À instruire**

---

## Q-016 — Campagne d'audit

Comment une campagne d'audit est-elle identifiée ?

**Statut : À instruire**

---

## Q-017 — Résultat d'un audit

Quelles informations déterminent qu'un Composant audité est :

```text
CONFORME
NON CONFORME
```

**Statut : À instruire**

---

## Q-018 — Version auditée

Comment déterminer précisément la Version du Composant ou de la Librairie faisant l'objet d'un Audit ?

**Statut : À instruire**

---

# 7. Questions ouvertes — Workflow

## Q-019 — Profils de workflow

Les profils suivants doivent-ils être formalisés comme des profils métier distincts ?

- STANDARD ;
- EPIC ;
- AUDIT ;
- RELEASE ;
- CONCEPTION.

**Statut : À confirmer**

---

## Q-020 — Exceptions aux règles de Pull Request

Pour quels profils une Pull Request n'est-elle pas obligatoire avant le statut Done ?

Les Audits et Epics constituent des cas déjà identifiés à étudier.

**Statut : À formaliser**

---

## Q-021 — Statut Cancelled

Quelles propriétés ou relations sont interdites lorsqu'une Issue est Cancelled ?

Les règles actuelles concernant les Pull Requests et Milestones devront être réévaluées dans le modèle de workflow complet.

**Statut : À formaliser**

---

# 8. Questions ouvertes — Applications consommatrices

## Q-022 — Identification des Applications

Quelle source permet de connaître la liste des Applications qui utilisent ou devraient utiliser le Design System ?

**Statut : Futur**

---

## Q-023 — Détection des Packages utilisés

Comment déterminer qu'une Application utilise un Package donné ?

**Statut : Futur**

---

## Q-024 — Détection de la Version utilisée

Comment déterminer la Version du Package effectivement utilisée par une Application ?

Le fait qu'une Application utilise un Package dans une Version donnée est établi.

La source permettant de récupérer cette information reste à déterminer.

**Statut : Futur**

---

## Q-025 — Versions autorisées pour les consommateurs

Comment le système doit-il traiter une Application utilisant une Version qui n'est pas destinée à la production, par exemple une Version SNAPSHOT ?

Faut-il :

- l'identifier comme contexte de test attendu ;
- la signaler si elle apparaît dans un contexte de production ;
- appliquer d'autres règles ?

**Statut : Futur**

---

## Q-026 — Détection des Composants utilisés

Comment analyser le code d'une Application afin d'identifier :

- les Composants utilisés ;
- leur nombre d'utilisations ?

**Statut : Futur**

---

## Q-027 — Dette de montée de Version

Comment définir la dette liée à l'utilisation d'une ancienne Version PROD du Design System ?

Il faudra notamment définir :

- dernière Version PROD ;
- Version utilisée ;
- Version attendue ;
- délai acceptable ;
- niveau de dette ;
- équipe responsable.

**Statut : Futur**

---

## Q-028 — Alertes aux Squads

Quelles situations doivent provoquer une alerte à destination d'une Squad responsable d'une Application ?

**Statut : Futur**

---

# 9. Questions ouvertes — Qualité des Applications consommatrices

## Q-029 — Qualité d'une Version

Comment calculer la qualité d'une Version d'une Librairie ?

**Statut : À instruire**

---

## Q-030 — Qualité d'un Composant

Comment calculer la qualité d'un Composant pour une Version donnée ?

**Statut : À instruire**

---

## Q-031 — Badge ou note d'une Application

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

Le besoin est identifié mais le modèle de scoring n'est pas défini.

Aucune formule ne doit être introduite avant validation de ce modèle.

**Statut : Futur**

---

## Q-032 — RGAA / WAI-ARIA d'une Application

Quelle signification précise doit avoir une note ou un badge RGAA / WAI-ARIA calculé à partir des Composants du Design System utilisés par une Application ?

Il faudra notamment déterminer :

- le périmètre évalué ;
- les limites de responsabilité du Design System ;
- la prise en compte des Composants utilisés ;
- la Version utilisée ;
- les Composants non audités ;
- les anomalies ouvertes.

**Statut : Futur**

---

# 10. Questions ouvertes — Historisation

## Q-033 — Granularité historique

Quels événements doivent provoquer la création d'un Snapshot ?

Exemples à étudier :

- exécution périodique ;
- Release ;
- fin de sprint ;
- Audit ;
- exécution manuelle.

**Statut : À instruire**

---

## Q-034 — Conservation

Quelle durée d'historique doit être conservée ?

**Statut : À instruire**

---

# 11. Questions ouvertes — Sources externes

## Q-035 — Publication des Packages

Nexus est identifié comme source de publication des Packages.

Il reste à déterminer comment le pipeline doit l'interroger et quelles métadonnées permettent de distinguer notamment :

- Versions PROD ;
- Versions SNAPSHOT ;
- autres contextes éventuels.

**Statut : À instruire**

---

## Q-036 — Applications consommatrices

Quelle source permettra d'identifier les Applications et leurs dépendances ?

**Statut : Futur**

---

## Q-037 — Usage des Composants

Quelle source ou quel mécanisme permettra de mesurer l'utilisation réelle des Composants dans les Applications ?

**Statut : Futur**

---

# 12. Questions ouvertes — Architecture

## Q-038 — Backend

À quel moment le dashboard statique actuel devra-t-il évoluer vers une architecture avec backend ?

**Statut : À instruire ultérieurement**

---

## Q-039 — Stockage historique

Quel système doit conserver les Snapshots à terme ?

**Statut : À instruire ultérieurement**

---

## Q-040 — Multi-source

Comment orchestrer à terme les différentes sources nécessaires ?

```text
GitHub
Catalogue
Nexus
Applications consommatrices
Analyse du code
Autres sources
```

**Statut : À instruire ultérieurement**

---

# 13. Méthode de traitement des questions

Les questions ne doivent pas être résolues toutes en même temps.

Pour chaque question :

1. observer le fonctionnement réel ;
2. établir le fait métier ;
3. distinguer situation actuelle et cible ;
4. mettre à jour le modèle métier ;
5. définir ensuite les règles ;
6. définir les impacts sur les indicateurs ;
7. seulement ensuite modifier l'implémentation.

Cette approche doit éviter que le code ou les contraintes actuelles de GitHub deviennent implicitement la définition du métier.