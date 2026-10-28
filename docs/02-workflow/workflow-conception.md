# Workflow CONCEPTION

## 1. Rôle

Une Issue de Conception suit les travaux de Design liés :

- à un nouveau Composant ;
- à une évolution d'un Composant existant.

La source associe ce travail à la Guilde Design et à la préparation des
éléments nécessaires à la réalisation.

---

## 2. Représentation décrite dans la source

La source propose notamment :

```text
Issue Type : 🧠 Conception
label      : 🔎 Grooming
label      : 🧩 Component:xxx
```

ainsi qu'une description comportant potentiellement :

- liens Figma ;
- liens Zeroheight ;
- autres sources de conception/accessibilité ;
- porteurs Design ;
- Definition of Ready ;
- Definition of Done ;
- DO / DON'T ;
- checklist de contrôles et réunions.

---

## 3. Points explicitement non stabilisés

La source comporte plusieurs questions :

- faut-il dupliquer certaines informations de l'Epic ?
- faut-il des labels `New component` ou `New enhancement` ?
- quel titre normalisé utiliser ?
- l'Audit de maquette est-il une étape ou une Issue distincte ?
- quels éléments appartiennent à la Conception plutôt qu'à l'Epic ?

Ces éléments ne sont pas normatifs.

---

## 4. Relation avec Epic

Dans les scénarios de création ou d'évolution de Composant, la
Conception est décrite comme une sous-Issue ou un travail rattaché à une
Epic.

La source suggère qu'elle peut bloquer les travaux de réalisation tant
que les éléments nécessaires ne sont pas prêts.

La cardinalité et les règles exactes de cette relation n'ont pas été
établies dans le registre au même niveau que les relations d'Audit.

**Statut : À FORMALISER.**

---

## 5. Velocity, Iteration, Milestone

La source ne permet pas de fixer de manière suffisamment sûre une
matrice normative complète pour :

- Velocity ;
- Iteration ;
- Milestone.

Il ne faut donc pas appliquer par défaut les règles STANDARD ni inventer
des exceptions.

---

## 6. Branche et Pull Request

La phase de Conception n'est pas nécessairement une modification du
code.

Aucune règle suffisamment établie ne permet actuellement d'imposer une
branche ou une Pull Request propre à toute Issue de Conception.

**Statut : À FORMALISER.**

---

## 7. Matrice CONCEPTION

Dimension Règle

---

Issue Type `🧠 Conception` proposé dans la source
Component attendu dans les scénarios décrits
Grooming présent à la création dans la source
Epic parent relation envisagée / décrite, à formaliser
Velocity ouvert
Iteration ouvert
Milestone ouvert
Branche ouvert / non nécessairement applicable
Pull Request ouvert / non nécessairement applicable
Ready conditions ouvertes
In progress conditions ouvertes
In review conditions ouvertes
Done Definition of Done à formaliser

---

## 8. Conclusion

Le profil CONCEPTION est utile pour empêcher l'application mécanique du
workflow de développement à une activité Design.

Il reste cependant le profil le moins stabilisé des cinq profils
candidats.

Aucune règle DQ stricte spécifique à CONCEPTION ne doit être ajoutée
avant arbitrage des points réellement nécessaires à la V1.
