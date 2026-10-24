# Transport GitHub avec Octokit — #72

**IMPLÉMENTÉ.** Les appels GitHub du collecteur, du diagnostic d’historique et du script de release utilisent `@octokit/request`. Cette évolution technique ne modifie aucune décision métier D-xxx ni les contrats RAW, datasets ou snapshots.

## Intérêt et choix de périmètre

Le module officiel [Octokit Request](https://github.com/octokit/request.js) apporte une construction standard des requêtes GitHub et une dépendance maintenue dans l’écosystème GitHub. Il couvre REST et GraphQL, accepte un `fetch` injectable et fonctionne avec les URL complètes GitHub Enterprise. Le coût est une dépendance de production supplémentaire et ses dépendances transitives à maintenir.

Le paquet complet `octokit`, ses plugins de pagination, de retry et de throttling ne sont pas ajoutés : le collecteur possède déjà une pagination spécifique aux relations et une coordination des quotas. Superposer deux politiques de reprise pourrait multiplier les appels. Le choix réalisé ici est une intégration du transport ; ce n’est pas une réécriture du collecteur avec les méthodes REST générées.

## Performance et économie

**Aucun gain de vitesse ou de quota n’est établi par cette migration.** Octokit utilise lui-même `fetch`. Pour les scénarios couverts, chaque tentative produit un seul appel HTTP ; les pages, requêtes GraphQL, réserves et parallélismes restent identiques. L’adaptateur ajoute un traitement local ; les réponses HTTP en erreur sont clonées pour conserver leur corps brut pendant leur lecture par Octokit. Ce coût ne constitue pas une optimisation de débit.

La consommation dépend des endpoints, de la pagination et du coût des requêtes GraphQL, selon les règles [REST](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) et [GraphQL](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api). Adopter le SDK ne modifie pas ces règles. Aucun cache, requête conditionnelle, regroupement de requêtes ou réduction de champs n’est introduit ; ces optimisations nécessiteraient une mesure séparée et une vérification de complétude des données.

**À MESURER en usage réel**, sur un périmètre comparable : durée de collecte, nombre de pages et tentatives HTTP, coût GraphQL observé, points REST consommés et temps passé en pause. Les tests simulés prouvent des comportements et des comptes d’appels déterministes, pas une économie sur GitHub ni un benchmark réseau.

## Contrat et responsabilités

- `src/lib/github-transport.js` : module ESM typé par JSDoc et vérifié par TypeScript (`@ts-check`), utilisable directement par le diagnostic Node.js et les modules TypeScript. Un appel Octokit par tentative, transmission des URL, corps, en-têtes et signal d’annulation ; réponse `Response` brute rendue même en HTTP 304/4xx/5xx. Les erreurs réseau sont remplacées par un message générique, sans contexte SDK ni corps de requête. Les avertissements de dépréciation sont également génériques.
- `GithubRequests` : conserve l’authentification unique, le pré-check, les réserves, la concurrence, les pauses, les retries bornés, les erreurs GraphQL HTTP 200 et l’arrêt global documentés dans [Quotas GitHub](quotas-github.md).
- Diagnostic d’historique : conserve sa pagination et ses codes d’erreur ; aucun retry ni pré-check de quota ajouté.
- Release : conserve sa garde CI, ses permissions et ses reprises ciblées de collisions. Le changement de transport n’exécute aucune publication ; les tests utilisent exclusivement des réponses simulées.

Le transport conserve l’original des réponses ; Octokit ne décode pas les succès. Pour les erreurs HTTP, il reçoit un clone afin que le contrôleur puisse encore examiner les preuves de quota et les corps invalides sans reconstruction JSON. Les exceptions HTTP du SDK ne remplacent donc pas les décisions du contrôleur.

## Validation

Les tests du transport vérifient les URL Enterprise, les paramètres de pagination, les corps GraphQL, les en-têtes, le signal d’annulation, les réponses HTTP et l’absence de retry caché ou de fuite d’erreur réseau. Les tests du collecteur et des quotas vérifient les reprises et leurs nombres d’appels ; les scripts ont des scénarios d’intégration simulés. Aucun appel à un dépôt source ni publication réelle n’est nécessaire à ces validations.
