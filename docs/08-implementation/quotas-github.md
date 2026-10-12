# Quotas GitHub et reprise de collecte

**IMPLÉMENTÉ — #51.** La commande `collect` applique le pré-check et la coordination des quotas. La préparation et le rejeu des datasets ne font aucun appel GitHub.

## Comportement par défaut

Avant de lire les repositories, le collecteur vérifie les quotas REST et GraphQL avec `GET /rate_limit`. Les en-têtes des réponses et le champ GraphQL `rateLimit` mettent ensuite à jour les faits connus. Les deux quotas primaires restent distincts.

Une réserve de **100 points REST et 100 points GraphQL** est conservée par défaut. Si la prochaine requête connue ferait franchir une réserve, la collecte s’arrête. La console affiche le motif, l’heure UTC de reset et son équivalent Europe/Paris. Une heure indisponible est explicitement inconnue. Le seuil est une marge de sécurité ; il ne prouve pas que la collecte complète tiendra dans le quota, notamment si le coût GraphQL change ou si le token est utilisé ailleurs.

Un quota épuisé en GraphQL, même avec HTTP 200, est une erreur de collecte : les relations ne sont pas remplacées par des tableaux vides. L’arrêt interdit les nouvelles requêtes en file et annule une requête en vol. Aucun nouveau RAW, snapshot ou dashboard n’est écrit par la commande interrompue ; les sorties précédentes restent intactes. La commande quitte avec un code non nul.

## Attendre automatiquement

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/mon-jeu/raw.json --wait-for-quota
```

Les repositories, pages et relations déjà collectés restent **en mémoire**. Le programme reprend sa requête après attente et vérification du quota. Il n’y a pas de cache persistant : fermer le programme ou utiliser `Ctrl+C` impose de recommencer la collecte.

| Option                             | Défaut     | Rôle                                                           |
| ---------------------------------- | ---------- | -------------------------------------------------------------- |
| `--wait-for-quota`                 | désactivée | Autoriser l’attente au lieu d’un arrêt immédiat                |
| `--rest-quota-reserve <points>`    | `100`      | Points REST à conserver ; entier positif ou nul                |
| `--graphql-quota-reserve <points>` | `100`      | Points GraphQL à conserver ; entier positif ou nul             |
| `--quota-max-wait <seconds>`       | `7200`     | Attente de quota cumulée maximale ; entier strictement positif |

Un terminal interactif affiche le décompte chaque seconde. Les logs non interactifs affichent le début, puis le temps restant chaque minute, et la reprise. Cette attente ne bloque pas la boucle d’événements Node.js.

`--quota-max-wait 14400` autorise **quatre heures d’attente cumulée**. Le programme convertit ces secondes en millisecondes pour les temporisations : une attente de 2 349 secondes reste donc inférieure à ce plafond. Pendant la pause, aucune nouvelle requête n’est envoyée ; le quota est relu avant la reprise, avec le même token.

**CORRIGÉ — #55.** Certains appels GraphQL et de catalogues fournissaient déjà `Authorization` ; le contrôleur ajoutait le même en-tête sous une autre casse. `fetch` fusionnait les deux valeurs, produisant une authentification invalide, même avec un token valide. Le contrôleur utilise désormais `Headers.set` pour envoyer une seule valeur d’authentification et préserver les formats `Accept` et `Content-Type` demandés.

Un HTTP **401** signale un [refus d’authentification](https://docs.github.com/en/rest/authentication/authenticating-to-the-rest-api), pas un quota épuisé. Si ce refus persiste après correction, vérifier localement que `GITHUB_TOKEN` est valide, non expiré et non révoqué, sans le copier dans les logs ou une issue. Attendre le reset ne renouvelle pas le token ; un 401 interrompt la collecte sans retry, avec un message explicite. La pause seule ne fait aucune requête HTTP.

## Priorité des délais et erreurs transitoires

1. `Retry-After`, en secondes ou date HTTP, s’il est présent.
2. Reset du quota primaire (`x-ratelimit-reset` ou `rateLimit.resetAt`) lorsqu’il est connu.
3. Pour une limite secondaire sans instruction exploitable, au moins une minute, puis une attente exponentielle bornée par la durée cumulée autorisée.

Les erreurs réseau et HTTP 502/503/504 ont des retries limités (3 par défaut), avec backoff exponentiel et jitter. Un refus de permission HTTP 403 avec quota restant n’est pas assimilé à une limite sur la seule présence de `x-ratelimit-reset`.

Les lectures utilisent désormais **cinq requêtes REST et cinq requêtes GraphQL simultanées au maximum**, partagées entre tous les repositories. Seule la réservation des points est sérialisée par famille ; les appels réseau restent concurrents. Le coût connu est débité avant chaque tentative. Les compteurs restent conservateurs face aux requêtes en vol et aux réponses reçues hors ordre ; une réponse tardive ne recrédite pas le budget. Le coût GraphQL le plus élevé observé est conservé pour les réservations suivantes ; un coût futur plus élevé ou d’autres consommateurs du token peuvent encore épuiser le quota.

Après le pré-check initial des deux quotas, les pauses sont mutualisées par famille : un refus REST suspend les nouveaux appels REST, tandis que GraphQL peut avancer, et réciproquement. Les appels déjà en vol peuvent terminer. Une limite secondaire reste susceptible de concerner plusieurs familles ; si GitHub refuse aussi l’autre famille, celle-ci entre à son tour en pause. Une erreur fatale arrête toute la collecte. `--quota-max-wait` borne la somme des pauses de quota : les pauses REST et GraphQL simultanées sont comptées séparément, mais les tâches partageant une même pause ne la comptent qu’une fois.

## Estimation du temps restant

La progression affiche `reste ≈ … (issues)` lorsque tous les repositories ont communiqué leur nombre d’issues et qu’au moins trois issues ont été entièrement traitées dans l’échantillon courant. Le calcul utilise le débit observé et le nombre d’issues encore à traiter. Avant cela, l’estimation est **indisponible**. Lorsque toutes les issues sont traitées, la console indique la finalisation plutôt qu’un temps total nul.

Une pause de quota masque cette estimation et conserve le décompte avant reprise. À la reprise, un nouvel échantillon évite d’intégrer l’attente passée au débit. Les pauses futures et la finalisation ne sont pas prédites ; la durée varie selon le nombre de pages et de relations de chaque issue. L’estimation est indicative, pas une heure de fin garantie. En terminal, elle est actualisée avec les compteurs ; dans les logs non interactifs, un point de progression est écrit au plus une fois par minute, lorsqu’un événement de collecte arrive.

Ces règles suivent les documentations GitHub sur les [quotas REST](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), les [quotas GraphQL](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api) et les [bonnes pratiques REST](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api).

Les tests utilisent des API simulées et une horloge contrôlée ; ils ne consomment aucun quota réel. Les cas REST, GraphQL HTTP 200, limites secondaires, réserves, décompte, erreurs transitoires et absence d’écriture en cas d’arrêt sont couverts.
