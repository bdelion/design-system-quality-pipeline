# Configurations et tests

**IMPLÉMENTÉ.** Les conventions DSQ sont livrées dans `config/profiles/dsq.json`. Le périmètre vient d’une liste explicite de repositories ; un utilisateur n’a pas à créer un couple `system.yaml`/`catalogue.yaml` avant de collecter.

| Usage                          | Sources                                                                                   |
| ------------------------------ | ----------------------------------------------------------------------------------------- |
| Collecte personnelle           | Liste JSON, token, profil DSQ livré ; RAW et contexte dans `data/local`                   |
| Fixture personnelle            | Dossier autonome préparé contenant données, règles et manifeste                           |
| Démonstration                  | `examples/demo/dataset.json`                                                              |
| Tests unitaires et intégration | `tests/fixtures`, `tests/support`, configurations des scénarios versionnées               |
| Tests navigateur               | Snapshot de consolidation synthétique ; sorties dédiées dans `data/browser-consolidation` |

Les tests ne nécessitent pas de collecte préalable. Les références de tests ne sont pas remplacées par vos jeux personnels ; une collecte réelle ne contient pas forcément les scénarios exigés par des assertions métier. La référence V1 et les jeux de réalisme font partie des sources versionnées de tests, indépendantes de la démonstration.

`tests/fixtures/` conserve uniquement dix fichiers effectivement utilisés : les trois couples RAW/configuration/catalogue des scénarios principal (`github.json`), V1 et catalogue complet, ainsi que `my-real-dataset-anonymized.json` pour les tests d’anonymisation. Les anciens profils génériques, catalogues sans consommateur et la collecte datée inutilisée ont été supprimés. Le contrôle du profil livré porte désormais directement sur `config/profiles/dsq.json`.

`fixture:validate --dataset <dossier>` vérifie votre jeu et exécute le pipeline dans un dossier temporaire. Un résultat DQ partiel n’équivaut pas à une incohérence du format. Les tests du logiciel restent exécutés avec `npm test`, `npm run check` et `npm run check:dashboard`.

Aucun profil n’est choisi selon le nom du fichier de votre fixture. Le manifeste et le dataset voyagent ensemble ; une entrée absente ou incompatible est refusée sans repli vers la démonstration. Les helpers de tests chargent exclusivement leurs scénarios versionnés, sans accéder aux configurations personnelles ni aux variables de token.

Voir [le guide débutant](guide-utilisation.md), [le contrat des datasets et la migration](datasets.md), [l’analyse préalable](analyse-parcours-local.md) et [les quotas GitHub](quotas-github.md).
