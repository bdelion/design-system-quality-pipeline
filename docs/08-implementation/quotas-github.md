# Quotas GitHub et reprise de collecte

**IMPLÉMENTÉ — #51.** Les commandes `collect`, `analyze`, `snapshot`, `dashboard` et `pipeline`, avec `--source github`, partagent la même gestion des requêtes. Elles restent en lecture seule.

## Comportement par défaut

Avant de lire les repositories, le collecteur vérifie les quotas REST et GraphQL avec `GET /rate_limit`. Les en-têtes des réponses et le champ GraphQL `rateLimit` mettent ensuite à jour les faits connus. Les deux quotas primaires restent distincts.

Une réserve de **100 points REST et 100 points GraphQL** est conservée par défaut. Si la prochaine requête connue ferait franchir une réserve, la collecte s’arrête. La console affiche le motif, l’heure UTC de reset et son équivalent Europe/Paris. Une heure indisponible est explicitement inconnue. Le seuil est une marge de sécurité ; il ne prouve pas que la collecte complète tiendra dans le quota, notamment si le coût GraphQL change ou si le token est utilisé ailleurs.

Un quota épuisé en GraphQL, même avec HTTP 200, est une erreur de collecte : les relations ne sont pas remplacées par des tableaux vides. L’arrêt interdit les nouvelles requêtes en file et annule une requête en vol. Aucun nouveau RAW, snapshot ou dashboard n’est écrit par la commande interrompue ; les sorties précédentes restent intactes. La commande quitte avec un code non nul.

## Attendre automatiquement

```powershell
npm.cmd run collect -- --source github --output data/raw/collecte.json --wait-for-quota
```

Les repositories, pages et relations déjà collectés restent **en mémoire**. Le programme reprend sa requête après attente et vérification du quota. Il n’y a pas de cache persistant : fermer le programme ou utiliser `Ctrl+C` impose de recommencer la collecte.

| Option                             | Défaut     | Rôle                                                           |
| ---------------------------------- | ---------- | -------------------------------------------------------------- |
| `--wait-for-quota`                 | désactivée | Autoriser l’attente au lieu d’un arrêt immédiat                |
| `--rest-quota-reserve <points>`    | `100`      | Points REST à conserver ; entier positif ou nul                |
| `--graphql-quota-reserve <points>` | `100`      | Points GraphQL à conserver ; entier positif ou nul             |
| `--quota-max-wait <seconds>`       | `7200`     | Attente de quota cumulée maximale ; entier strictement positif |

Un terminal interactif affiche le décompte chaque seconde. Les logs non interactifs affichent le début, puis le temps restant chaque minute, et la reprise. Cette attente ne bloque pas la boucle d’événements Node.js.

## Priorité des délais et erreurs transitoires

1. `Retry-After`, en secondes ou date HTTP, s’il est présent.
2. Reset du quota primaire (`x-ratelimit-reset` ou `rateLimit.resetAt`) lorsqu’il est connu.
3. Pour une limite secondaire sans instruction exploitable, au moins une minute, puis une attente exponentielle bornée par la durée cumulée autorisée.

Les erreurs réseau et HTTP 502/503/504 ont des retries limités (3 par défaut), avec backoff exponentiel et jitter. Un refus de permission HTTP 403 avec quota restant n’est pas assimilé à une limite sur la seule présence de `x-ratelimit-reset`. Les requêtes de toute la collecte sont sérialisées pour éviter que plusieurs tâches consomment le quota simultanément ; la durée de collecte peut augmenter.

Ces règles suivent les documentations GitHub sur les [quotas REST](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), les [quotas GraphQL](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api) et les [bonnes pratiques REST](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api).

Les tests utilisent des API simulées et une horloge contrôlée ; ils ne consomment aucun quota réel. Les cas REST, GraphQL HTTP 200, limites secondaires, réserves, décompte, erreurs transitoires et absence d’écriture en cas d’arrêt sont couverts.
