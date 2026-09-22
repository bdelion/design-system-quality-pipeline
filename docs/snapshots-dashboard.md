# Snapshots et dashboard

## Snapshot

`buildSnapshot` regroupe le RAW, les données normalisées, les alertes, leur synthèse, les KPI, le périmètre et les versions du modèle et des règles. Les structures sont clonées pour éviter qu'une modification ultérieure ne change le résultat enregistré.

Le snapshot est écrit dans `data/current/snapshot.json` et dans `data/runs/` avec un identifiant horodaté.

## Dashboard

Le générateur produit :

- `index.html` pour les KPI et les comparaisons ;
- `anomalies.html` pour les anomalies et alertes ;
- `graph.html` pour la cartographie composant → issue → pull request, avec badges d'état et recherche ;
- `audits.html` pour les composants et audits ;
- `assets/style.css`, `assets/app.js`, `assets/graph.js` et `assets/logo.svg`.

Les assets sont maintenus séparément dans `src/dashboard/assets/`, puis copiés lors de la génération. Les pages HTML ne portent que leur structure et les données du snapshot.

Les liens GitHub sont construits uniquement si `GITHUB_URL` est défini. Les valeurs injectées dans le HTML sont échappées afin de limiter les risques d'injection.

Le dashboard est statique : il se consulte directement sans serveur applicatif ni base de données.
