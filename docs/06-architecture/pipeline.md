# Pipeline

**IMPLÉMENTÉ.** Le pipeline rejoue un dataset autonome hors réseau. La collecte est une commande séparée, appliquant les conventions DSQ livrées et produisant les faits RAW avec leur contexte.

```text
Dataset et manifeste
  → validation du schéma, du périmètre et des relations
  → normalisation (faits + conventions + enrichissements facultatifs)
  → Data Quality
  → indicateurs
  → comparaison avec les runs compatibles du dossier choisi
  → snapshot
  → dashboard
```

`runPipeline(datasetPath, outputPath)` charge uniquement le dataset demandé et écrit dans `outputPath/current`, `outputPath/runs` et `outputPath/dashboard`. Le RAW n’est pas muté pour incorporer le catalogue. Aucun profil n’est deviné depuis le nom du fichier ; aucune nouvelle requête GitHub n’est effectuée au rejeu.

Un dataset structurellement valide peut produire des réserves Data Quality et un résultat partiel. La préparation contrôle l’anonymisation et les relations avant publication ; le contrôle `fixture:validate` complète ces vérifications par un rejeu temporaire. Les règles métier restent dans le pipeline, le dashboard restitue leurs résultats.

Voir [le contrat des datasets](../08-implementation/datasets.md) et [le guide d’utilisation](../08-implementation/guide-utilisation.md).
