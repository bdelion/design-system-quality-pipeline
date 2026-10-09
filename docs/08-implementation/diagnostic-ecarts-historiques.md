# Diagnostic ciblé des écarts d'historiques

## Contexte

L'échantillon V2 du 9 octobre 2026 contient 1 000 comparaisons API réussies, 10 issues divergentes et 13 transitions uniquement présentes côté API. Sept issues ont davantage de transitions `Done`. Aucune transition n'est uniquement présente dans le RAW. Les données ne démontrent pas à elles seules une perte dans le collecteur.

## Vérification de l'antériorité

Exécuter le diagnostic en fournissant **l'instant exact de fin de collecte du RAW**, avec son fuseau horaire :

```powershell
npm.cmd run diagnose:history -- --raw data/raw/my-real-dataset.json --live --sample 1000 --collected-at "2026-10-09T08:00:00+02:00"
```

**Remplacer impérativement l'heure d'exemple par l'heure réelle de fin de collecte.** Si l'heure exacte est inconnue, ne pas utiliser cette option : la classification temporelle serait trompeuse.

La commande produit les rapports habituels. `history-live-sample.csv` comporte alors les colonnes :

- `apiOnlyBeforeOrAtCollection` : événements API absents du RAW et datés au plus tard à la fin de la collecte ; nécessitent une investigation.
- `apiOnlyAfterCollection` : événements postérieurs à la collecte ; écart compatible avec une évolution normale.
- `apiOnlyUnknownTime` : date absente ou invalide.
- `apiOnlyDone` et `apiOnlyOther` : répartition des événements supplémentaires par catégorie.

Les colonnes supplémentaires n'exportent ni dates précises, ni noms de projet, ni statuts libres. Les identifiants d'issues restent pseudonymisés avec un sel différent à chaque exécution. Les résultats doivent être relus avant partage.

## Limites

La comparaison utilise la date d'événement GitHub, pas la date de découverte de l'événement par l'API. Un événement ancien nouvellement visible peut donc être classé comme antérieur à la collecte. Cette méthode isole les cas suspects mais ne prouve pas à elle seule un défaut du collecteur.

Ne pas déduire `correctedAt` de la fusion d'une PR. Le contrat métier I3 reste inchangé.
