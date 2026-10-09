# Diagnostic local des historiques GitHub

La commande `diagnose:history` effectue un diagnostic en lecture seule. Elle ne modifie ni le collecteur, ni la normalisation, ni le contrat I3, ni les KPI, ni le dashboard.

## Prérequis

Exécuter les commandes depuis la racine du repository avec Node.js compatible et les dépendances installées (`npm.cmd ci` sous PowerShell).

## 1. Analyse locale du RAW (aucun appel GitHub)

```powershell
npm.cmd run diagnose:history -- --raw data/raw/my-real-dataset.json
```

Optionnellement, comparer les agrégats du RAW et de la fixture anonymisée :

```powershell
npm.cmd run diagnose:history -- --raw data/raw/my-real-dataset.json --fixture fixtures/full-dataset-anonymized.json
```

## 2. Échantillon API GitHub (facultatif, uniquement sur ton PC)

Configurer `GITHUB_TOKEN` et, si nécessaire, `GITHUB_GRAPHQL_URL` dans `.env` (ne jamais partager ce fichier). Utiliser un RAW **non anonymisé**, dont les noms de repository, propriétaires et numéros d'issues sont réels :

```powershell
npm.cmd run diagnose:history -- --raw data/raw/my-real-dataset.json --live --sample 20
```

La commande fait uniquement des requêtes GraphQL de lecture. Le mode `--live` compare le nombre d'événements retournés par GitHub avec ceux présents dans le RAW pour un échantillon de cas sans historique ou sans Done, et des témoins. Une différence peut aussi être due au temps écoulé entre les deux collectes.

## 3. Fichiers à partager

Sous `data/diagnostics/` :

- `history-summary.json` : compteurs globaux et résultats agrégés du contrôle API.
- `history-cases.csv` : classification de chaque issue avec identifiant pseudonymisé aléatoirement à chaque exécution.
- `history-live-sample.csv` : comparaisons individuelles pseudonymisées (uniquement avec `--live`).
- `history-report.md` : synthèse et limites.

**Ne pas partager** le RAW, les tokens, les fichiers `.env`, ni les traces d'anonymisation. Relire les rapports avant transmission : même anonymisés, les volumes peuvent être sensibles. Ne pas fusionner les rapports de deux exécutions : les pseudonymes changent à chaque lancement.

## Limites

- `projectItems` est limité à 100 éléments dans la collecte actuelle. Le diagnostic API signale `PROJECT_ITEMS_PAGINATION_REQUIRED` si la limite est atteinte.
- L'outil compare les agrégats RAW / fixture, pas les identifiants transformés par l'anonymiseur.
- Les événements appartenant à un projet historique qui n'est plus courant peuvent être visibles côté API mais absents du RAW.
- Le diagnostic ne prouve pas qu'une donnée historique n'a jamais existé chez GitHub.
- La date de fusion d'une PR n'est pas substituée à la transition `Done`.

## Diagnostic V2 : événements et périodes

- `history-periods.csv` : année de création des issues et volumes par année (aucune date complète).
- `history-live-sample.csv` : `apiOnlyTransitions`, `rawOnlyTransitions` et `exactTransitionMatch` comparent les transitions individuellement, avec multiplicité. Les empreintes HMAC et leur clé restent en mémoire ; seules les **quantités** de divergences sont exportées.
- L'échantillonnage alterne issues sans historique, historiques sans Done et témoins ayant un Done. `--sample` reste plafonné à 1 000.
- La comparaison utilise `(projectId, status, timestamp)` : une différence de précision de date, une transition absente ou une évolution GitHub peut produire un écart. **Ce diagnostic n'attribue pas automatiquement la cause au collecteur.**
- Les années de création et les petits groupes peuvent présenter un risque de réidentification ; relire les exports avant tout partage.

## Scripts maintenus

- `scripts/diagnose-history.mjs` : outil officiel de diagnostic, couvert par `tests/diagnose-history.test.ts`.
- `scripts/clean.mjs` : nettoyage des seuls répertoires générés `dist` et `data/runs` (commande `npm.cmd run clean`).
