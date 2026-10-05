# Collecteur GitHub

Le collecteur utilise les API REST et GraphQL GitHub en lecture seule.

## Données récupérées

Pour chaque repository configuré :

1. métadonnées du repository ;
2. issues paginées ;
3. pull requests paginées ;
4. timeline des issues ;
5. relations Development via GraphQL si `GITHUB_GRAPHQL_URL` est défini.

Les statuts Project sont conservés pour chaque issue. Les Projects v2 sont lus via GraphQL ; les cartes des Projects classiques sont lues via REST lorsque l'API les expose. Une issue est considérée comme annulée dès qu'un de ses Projects porte une valeur configurée dans `github.cancelledProjectStatuses`.

Les PR présentes dans l'endpoint des issues sont écartées pour éviter les doublons.

## Relations issue/PR

Les liens sont cherchés dans les mots-clés configurés (`Closes`, `Fixes`, `Resolves`), le titre, la timeline et GraphQL. Les numéros sont ensuite résolus contre les PR effectivement collectées.

## Retries

Les statuts 429, 502, 503, 504 et certains 403 liés à la limite de taux sont réessayés. Les erreurs réseau transitoires utilisent un backoff exponentiel. Une erreur permanente est remontée immédiatement.

Le token vient uniquement de `GITHUB_TOKEN` et n'est jamais copié dans les snapshots.
