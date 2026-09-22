# Snapshots et dashboard

## Snapshot

`buildSnapshot` regroupe le RAW, les données normalisées, les alertes, leur synthèse, les KPI, le périmètre et les versions du modèle et des règles. Les structures sont clonées pour éviter qu'une modification ultérieure ne change le résultat enregistré.

Le snapshot est écrit dans `data/current/snapshot.json` et dans `data/runs/` avec un identifiant horodaté.

## Dashboard

Le générateur produit :

- `index.html` pour les KPI et les comparaisons ;
- `anomalies.html` pour les anomalies et alertes ;
- `audits.html` pour les composants et audits ;
- `assets/style.css` et `assets/app.js`.

Les liens GitHub sont construits uniquement si `GITHUB_URL` est défini. Les valeurs injectées dans le HTML sont échappées afin de limiter les risques d'injection.

Le dashboard est statique : il se consulte directement sans serveur applicatif ni base de données.
