# GitHub Worflow et autres éléments de repo et project

## Taxonomie

| Mécanisme            | Responsabilité                              |
| -------------------- | ------------------------------------------- |
| Issue Type           | Nature de l'objet                           |
| Label                | Classification / contexte                   |
| GitHub Project       | Workflow, sprint, estimation, planification |
| Catalogue            | Référentiel des composants                  |
| GitHub Release / Tag | Publication technique                       |

## Issue type - Définition

**Issue Type GH** = nature de l'issue traitée

Voici la liste des issue type :

- 🔧Task : Travail unitaire à réaliser ne correspondant pas à une anomalie, une évolution fonctionnelle ou un audit.
- 🐛Bug : Dysfonctionnement, comportement inattendu ou non-conformité constatée nécessitant une correction.
- ✨Feature : Nouvelle capacité, nouveau besoin métier ou évolution significative apportant de la valeur aux utilisateurs.
- 🚀Epic : Initiative de grande ampleur regroupant plusieurs travaux, audits, anomalies ou évolutions liés à un objectif commun.
- 🔍Audit : Analyse structurée d'un composant, d'une fonctionnalité ou d'un périmètre visant à évaluer sa conformité ou sa qualité selon des critères définis.
- 🔖Release : Préparation, validation, publication et communication d'une version du produit ou d'une librairie.
- ❓Question : Demande d'information, clarification ou arbitrage ne nécessitant pas immédiatement un développement.
- 📝Documentation : Création ou mise à jour de contenu documentaire destiné aux développeurs ou utilisateurs **--> à séparer de la réalisation systématiquement ? afin que le maker du code ne soit pas celui qui fasse la doc et donc qu'un autre embarque ?**
- 🧠Conception : Étude, cadrage ou conception préalable permettant de définir une solution avant sa mise en œuvre.

## Label - Définition

**Label GH** = classification, contexte ou caractéristique.

Liste complète à venir mais voici déjà des éléments :

- pour une issue qui vient d'être créée et qui n'a pas encore été raffinée : `📌 Grooming` ou `🔎 Grooming`
- pour une issue trop grosse et/ou à transformer en Epic : `✂️ action:split`
- pour une issue de support : `🤝 support` et à associer à l'issue type `🔧Task`
- pour une issue rapportée par un utilisateur (Dev, Design, ...) : `👤 reported:user`
- pour un composant `xxx` et avec le prefix `🧩 Component:` : `🧩 Component:xxx`
- pour un hook `titi` et avec le prefix `🪝 hook:` : `🪝 hook:titi`
- pour les retours sur les audits d'accessibilité, la criticité peut avoir 3 valeurs `bloquante: "blocking"`, `majeure: "major"` et `mineure: "minor"` avec le prefix `🚦 rgaa:` ce qui nous donne 3 labels :
  - `🚦 rgaa:bloquante`
  - `🚦 rgaa:majeure`
  - `🚦 rgaa:mineure`
- pour les retours sur les audits d'accessibilité, la catégorisation peut avoir différente valeuravec le prefix `♿ a11y:` ce qui nous donne pour une catégorie `toto` le label `♿ a11y:toto`
- pour des attendus sur les souhaits et l'expérience de dev, un préfixe `🧑‍💻 dx:`, avec par exemple `🧑‍💻 dx:developer-experience`
- pour des attendus et des priorités designer, un prefixe `🎨 ux:`, notamment par exemple `🎨 ux:designer-priority` ou `🎨 ux:need-identified` ou `🎨 ux:design`
- pour la gestion des priorités dans la backlog et en plus de mettre en place des milestones qui ne suivraient pas les versions mais des priorités par trimestre, des labels :
  - `🔥 priority:P1`
  - `🔥 priority:P2`
  - `🔥 priority:P3`
  - `🧊 priority:P99999` pour les issues non prioritaires
- pour des sujets techniques, un prefix `🛠️ tech:` comme par exemple `🛠️ tech:ci` ?
- pour des sujets autours de la qualité, un prefix `🧪 quality:` comme par exemple `🧪 quality:sonar`, `🧪 quality:tests`, ...
- pour traiter dependabot et les dépendances en général, un label (voir un prefixe) `🔗 dependency`
- pour les issues en doublon, non valide, qu'on ne veut pas traiter et donc qui aurait un status `Cancelled` :
  - `🚫 resolution:wontfix`
  - `🚫 resolution:duplicate`
  - `🚫 resolution:invalid`

Liste des labels à challenger :

- `New component` : est ce qu'il faut un label si l'issue type `✨Feature` ne suffit pas ?
- `New enhancement` : est ce qu'il faut un label si l'issue type `✨Feature` ne suffit pas ?
- `📚 documentation` abandonné au profit de l'issue type `📝Documentation`
- `👥 event:coding-days` : une catégorie comme celle-ci a-t-elle toujours un intérêt ? on la crée pour la reprise sur le patrimoine existant ?
- `🌍 scope:open-source` : pour des issues qui adresseraient ce point
- `🚀 release:breaking` : pour des issues où l'on identifie l'arrivée d'un breaking change et donc une montée de version majeure nécessaire

### Palette de couleur associée

| Famille         | Emoji | HEX     |
| --------------- | ----- | ------- |
| Component       | 🧩    | #0969DA |
| a11y            | ♿    | #8250DF |
| RGAA bloquante  | 🚦    | #CF222E |
| RGAA majeure    | 🚦    | #BC4C00 |
| RGAA mineure    | 🚦    | #9A6700 |
| Priority        | 🔥    | #D97706 |
| Priority frozen | 🧊    | #57606A |
| Tech            | 🛠️    | #6E7781 |
| Quality         | 🧪    | #1A7F37 |
| DX              | 🧑‍💻    | #BF3989 |
| UX              | 🎨    | #C18401 |
| Action          | ✂️    | #A40E26 |
| Workflow        | 🔎    | #0891B2 |
| Documentation   | 📚    | #1E3A8A |
| Support         | 🤝    | #0F766E |
| Reported        | 👤    | #64748B |
| Dependency      | 🔗    | #4F46E5 |
| Resolution      | 🚫    | #8C959F |
| Release         | 🚀    | #0D9488 |
| Hook            | 🪝    | #475569 |
| Event           | 👥    | #92400E |
| Scope           | 🌍    | #15803D |

## Projects

### Velocity

La vélocité d'une issue peut prendre les valeurs : 0.5, 1, 2, 3, 5, 8.
Au delà de 8, l'issue doit être découper et donc avoir automatiquement le label `✂️ action:split`.

### Itération/Sprint

Une issue doit être dans une itération pour pouvoir est prise en charge.
Les itérations se font sur 3 semaines du lundi au vendredi.
Les itérations sont incrémentées. Nous sommes à la 54 qui se termine le 02/10/2026.
Une issue qui n'est pas close (`Done` ou `Cancelled`) peut :

- passer à l'itération suivante
- passer dans une autre itération plus éloignée
- se voir retirer l'itération sans en avoir d'autre mais dans ce cas et si elle n'est pas abandonnée (`Cancelled` et `🚫 resolution::xxx`), il faudrait changer son status (passer à `Backlog`) et mettre un label `🔎 Grooming` ? ou alors mettre un label dédié ?

### Status

Les status actuels :

- Backlog
- Ready
- In progress
- In review
- Done
- Blocked
- Cancelled

#### Une issues avec le status `Backlog` :

- doit avoir un label `🔎 Grooming`
- doit avoir une Velocity vide
- ne peut pas être dans une itération/sprint
- ne peut pas être dans une Milestone/Version/Release
- ne peut pas avoir de branche rattachée
- ne peut pas avoir de PR rattachée
- ne doit pas être close

#### Une issue avec le status `Ready` :

- ne peut pas avoir de Velocity vide ou <= à 0 sauf si il s'agit d'une issue parent qui a une issue type `🚀Epic` ... à voir pour le "0" si on l'accepte quand il s'agit de ticket d'audit, de R&D, de POC, ...
- ne peut plus avoir de label `🔎 Grooming`
- doit avoir une issue type et au moins un label
- peut-être dans une itération/sprint
- peut-être dans une milestone/version
- ne peut pas avoir de branche rattachée
- ne peut pas avoir de PR rattachée
- ne doit pas être close

#### Une issue avec le status `In progress` :

- ne peut pas avoir de Velocity vide ou <= à 0 sauf si il s'agit d'une issue parent qui a une issue type `🚀Epic` ... à voir pour le "0" si on l'accepte quand il s'agit de ticket d'audit, de R&D, de POC, ...
- ne peut plus avoir de label `🔎 Grooming`
- doit avoir une issue type et au moins un label
- doit être dans une itération/sprint
- doit être dans une milestone/version
- doit avoir une branche rattachée
- ne peut pas avoir de PR rattachée sauf il est en "Draft"
- ne doit pas être close
- doit avoir au moins un assignee de la Squad et peut avoir un assignee en dehors de la Squad pour identifier les contributeurs

#### Une issue avec le status `In review` :

- ne peut pas avoir de Velocity vide ou <= à 0 sauf si il s'agit d'une issue parent qui a une issue type `🚀Epic` ... à voir pour le "0" si on l'accepte quand il s'agit de ticket d'audit, de R&D, de POC, ...
- ne peut plus avoir de label `🔎 Grooming`
- doit avoir une issue type et au moins un label
- doit être dans une itération/sprint
- doit être dans une milestone/version
- doit avoir une branche rattachée
- doit avoir de PR rattachée
- ne doit pas être close
- doit avoir au moins un assignee de la Squad et peut avoir un assignee en dehors de la Squad pour identifier les contributeurs

#### Une issue avec le status `Done` :

- ne peut pas avoir de Velocity vide ou <= à 0 sauf si il s'agit d'une issue parent qui a une issue type `🚀Epic` ... à voir pour le "0" si on l'accepte quand il s'agit de ticket d'audit, de R&D, de POC, ...
- ne peut plus avoir de label `🔎 Grooming`
- doit avoir une issue type et au moins un label
- doit être dans une itération/sprint
- doit être dans une milestone/version
- doit avoir une branche rattachée
- doit avoir de PR rattachée
- doit être close
- doit avoir au moins un assignee de la Squad et peut avoir un assignee en dehors de la Squad pour identifier les contributeurs

#### Une issue avec le status `Blocked` :

- ne peut pas avoir de Velocity vide ou <= à 0 sauf si il s'agit d'une issue parent qui a une issue type `🚀Epic` ... à voir pour le "0" si on l'accepte quand il s'agit de ticket d'audit, de R&D, de POC, ...
- ne peut plus avoir de label `🔎 Grooming`
- doit avoir une issue type et au moins un label
- doit être dans une itération/sprint
- doit être dans une milestone/version
- peut avoir une branche rattachée
- ne peut pas avoir de PR rattachée sauf il est en "Draft"
- ne doit pas être close
- doit avoir au moins un assignee de la Squad et peut avoir un assignee en dehors de la Squad pour identifier les contributeurs

#### Une issue avec le status `Cancelled` :

- doit avoir un label `🚫 resolution:xxx`
- doit avoir une Velocity vide ?
- ne peut pas être dans une Milestone/Version/Release
- ne peut pas avoir de branche rattachée ?
- ne peut pas avoir de PR rattachée ou alors une PR non mergée et close ?
- doit être close
- doit avoir au moins un assignee de la Squad et peut avoir un assignee en dehors de la Squad pour identifier les contributeurs

## Milestone

Les milestones peuvent être de différentes forme :

- une milestone qui identifie et regroupes les issues d'une version/release aura un titre qui respecte le SemVer `M.m.r` pour regrouper toutes les issues associées à la version
- une milestone qui identifie et regroupes les issues d'audit d'accessibilité d'une version `M.m.r` déjà en "PROD" pourrait avoir un titre de la forme `M.m.r-Audit`
- une milestone n'a pas nécessairement de "Due date", à voir si cela a un intérêt
- une milestone n'a pas eu dans le passé de description mais nous essayons maintenant d'y mettre les objectifs afin d'éviter trop de déviation dans son contenu

## Relationships GH

- la notion de "parent" permet de faire par exemple une relation entre une issue et son issue "EPIC" parent qui permet de voir un tout cohérent souhaité
- les notions "Blocked by" et "Blocking" permettent de voir les dépendances entre issues et de faire en sorte de traiter les points dans le bonne ordre

## Development GH

Cela permete de lier une issue à une branche ou une PR.
Un lien vers la PR est essentiel lors du traitement de l'issue.
Le lien vers la branche n'est pas obligatoire.
