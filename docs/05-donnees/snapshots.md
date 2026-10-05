# Snapshots

Le pipeline produit un snapshot immuable contenant :

- identifiant ;
- date de capture ;
- scope ;
- RAW ;
- normalisé ;
- qualité ;
- analytics ;
- `ruleVersion` ;
- `modelVersion` ;
- fiabilité.

Le pipeline écrit également un snapshot courant et un fichier par exécution dans le répertoire de runs.

## Pourquoi le snapshot est important

Il fournit un format de données exploitable indépendamment de l'HTML. Il permet également de comparer deux états sans avoir besoin de conserver toute l'historique GitHub dans une base.
