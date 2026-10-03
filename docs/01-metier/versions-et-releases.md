# Versions, milestones et releases

Les spécifications utilisent les milestones pour plusieurs usages : versions, lots d'audit, horizons de planification et autres regroupements.

Une règle métier demandée est :

```text
1.1.0
1.1.0-Audit
```

doivent pouvoir être considérées comme la même version normalisée, avec un suffixe `-Audit` configurable.

Le code actuel conserve le `milestone.title` dans le RAW et produit une version d'audit dans le modèle normalisé.

## Release

Le workflow décrit une issue de type Release avec :

- titre `Release M.m.r` ;
- milestone/version ;
- branche source et branche cible ;
- checklist ;
- comportement spécifique avant publication.

Le statut initial/transition exact avant release est explicitement encore discuté dans la source.

**À confirmer :** aucune définition complète de Release n'est actuellement présente dans le modèle normalisé.
