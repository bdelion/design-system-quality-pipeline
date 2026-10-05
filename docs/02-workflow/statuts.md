# Statuts GitHub Project

Statuts actuellement décrits dans les sources :

- Backlog
- Ready
- In progress
- In review
- Done
- Blocked
- Cancelled

## Règles explicitement documentées

### Backlog

Le workflow source indique notamment : Grooming présent, velocity vide, pas d'iteration, pas de milestone, pas de branche, pas de PR, issue non close et pas d'assignee.

### Ready

Le workflow source indique notamment : Grooming retiré, velocity non vide ou exception, pas de branche/PR, issue non close ; assignee possible si dans une iteration.

### In progress

Le workflow source prévoit notamment une velocity renseignée, une iteration/milestone et, pour les travaux standards, une branche et un assignee.

### In review

Pour les travaux standards, une PR est attendue.

### Done

Pour les travaux standards, une PR/branche est attendue. Des exceptions existent notamment pour Epic et Audit.

### Blocked

Statut transversal dans le workflow décrit.

### Cancelled

Statut terminal alternatif.

**Important :** les règles détaillées par statut sont actuellement dans `specifications/gh-workflow.md`; leur transformation en règles formelles versionnées reste à faire.
