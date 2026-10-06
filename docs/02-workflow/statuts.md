# Statuts GitHub Project

## 1. Statuts connus

```text
Backlog
Ready
In progress
In review
Done
Blocked
Cancelled
```

Le chemin nominal du profil STANDARD est :

```text
Backlog → Ready → In progress → In review → Done
```

`Blocked` est transversal et `Cancelled` constitue une sortie terminale
alternative.

Les contraintes exactes dépendent du profil de workflow.

---

## 2. Backlog

### Nominal STANDARD

La source décrit une Issue `Backlog` avec :

- label `🔎 Grooming` ;
- Velocity vide ;
- aucune Iteration ;
- aucune Milestone ;
- aucune branche ;
- aucune Pull Request ;
- Issue non close ;
- aucun assignee.

Ce statut correspond à une Issue qui doit encore être qualifiée et
pesée.

### Limite

Ces propriétés ne doivent pas être appliquées aveuglément aux profils
spéciaux sans règle dédiée.

---

## 3. Ready

### Nominal STANDARD

Une Issue `Ready` :

- n'a plus le label `🔎 Grooming` ;
- est pesée dans le workflow standard ;
- possède une Velocity `> 0` dans le nominal ;
- reste ouverte ;
- n'a pas encore de branche ;
- n'a pas encore de Pull Request.

La source autorise qu'elle soit déjà positionnée dans une Iteration ou
une Milestone.

### Exception de profil

Les Epics ne sont pas pesées selon la source.

Les Audits utilisent actuellement une Velocity `0` dans la source.

La distinction :

```text
velocity = null
velocity = 0
velocity > 0
```

est une décision métier établie et ces valeurs ne doivent pas être
assimilées.

---

## 4. In progress

### Nominal STANDARD

Une Issue `In progress` représente un travail effectivement pris en
charge.

La source associe le nominal STANDARD à :

- Velocity renseignée ;
- Iteration ;
- Milestone ;
- assignee ;
- branche pour les travaux de code.

La présence d'une branche n'est pas une règle générique pour Epic ou
Audit.

---

## 5. In review

### STANDARD

Pour une Issue de réalisation STANDARD, `In review` correspond à la
phase de revue de la Pull Request.

La source décrit également des règles de revue de PR, mais le modèle RAW
actuel ne contient pas toutes les informations nécessaires pour les
contrôler.

### Profils spéciaux

`In review` ne doit pas être défini uniquement par l'existence d'une
Pull Request pour tous les profils.

Les transitions Epic, Audit, Release et Conception doivent être traitées
par leurs règles propres.

---

## 6. Done

`Done` signifie que le travail a atteint son état de fin dans le
Project.

Cette signification n'est pas suffisante à elle seule pour tous les
objets métier.

### STANDARD

Pour un travail de code STANDARD, la finalisation est liée à la Pull
Request et à son merge.

### AUDIT

Un Audit n'est réalisé au sens métier que lorsque les deux conditions
sont satisfaites :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Le seul `Done` ne suffit pas.

### Anomalie

Une Anomalie est considérée traitée lorsque :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

La correction d'une Anomalie d'Audit comporte en outre une attente
métier de revue par l'auditeur avant clôture, mais les détails
opérationnels restent à formaliser complètement.

---

## 7. Blocked

`Blocked` est un état transversal.

La source indique notamment qu'une Issue A liée par `Blocked by` à une
Issue B non terminée peut être `Blocked`.

Les transitions possibles dépendent du statut précédent et du profil.

Il ne faut pas déduire une machine à états universelle plus précise que
les décisions disponibles.

---

## 8. Cancelled

`Cancelled` est un état terminal alternatif.

Un cas est explicitement établi :

```text
remontée client
    ↓
analyse Squad
    ↓
erreur exclusivement dans l'intégration cliente
    ↓
Cancelled
```

Cette Issue ne devient pas une Anomalie intrinsèque du Design System.

Les règles génériques sur les propriétés interdites d'une Issue
`Cancelled` restent à formaliser dans `Q-022`.

---

## 9. Issue State GitHub et Project Status

Le modèle doit conserver séparément :

```text
GitHub Issue State
```

et :

```text
Project Status
```

Ils ne sont pas interchangeables.

Les règles `Audit réalisé` et `Anomalie traitée` démontrent
explicitement la nécessité de combiner les deux dimensions.

---

## 10. Règle de prudence

Les règles de statut ne doivent jamais être évaluées sans connaître le
profil de workflow lorsque celui-ci modifie la signification de :

- Velocity ;
- Iteration ;
- Milestone ;
- branche ;
- Pull Request ;
- `In review` ;
- `Done`.
