# Analyse du démarrage local et de la gestion des datasets

## Périmètre et arbitrages

Analyse préalable du code et des tests au 12 octobre 2026. Ce document conserve l’état initial observé et les arbitrages de la refonte. Le parcours désormais implémenté est décrit dans [Datasets autonomes](datasets.md).

Objectif utilisateur : partir d’une liste de repositories, collecter GitHub, préparer un jeu rejouable hors réseau et vérifier le projet sans assembler manuellement une série de profils interdépendants.

Arbitrages confirmés dans la session :

- Appliquer les conventions DSQ existantes dès le démarrage, à partir d’un profil livré avec le projet.
- Distinguer les scénarios de non-régression, les données de démonstration et les collectes personnelles.
- Supprimer les anciennes commandes remplacées, sans conserver d’alias de compatibilité.

Un token reste nécessaire à la collecte. Les règles DSQ ne fournissent pas automatiquement les métadonnées de tous les composants ; ces informations doivent conserver leur caractère inconnu lorsqu’aucune preuve ne les établit.

## Dépendances observées

| Usage actuel                             | Entrées et dépendances                                                                                                      | Effets                                                                                                        |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `collect --source github`                | `system.yaml`, environnement, règles injectées dans le collecteur ; catalogue requis lorsque la paire explicite est fournie | Écrit le RAW ; la liste de repositories seule n’est pas une entrée CLI                                        |
| `fixture:anonymize` / `fixture:prepare`  | RAW et configurations GitHub par défaut, sans options de sélection des profils sources                                      | Écrit la fixture, deux profils, un manifeste et une trace ; valide finalement après plusieurs écritures       |
| `reference:prepare`                      | RAW, configuration et catalogue sources complets, graine, puis référence V1 du dépôt                                        | Écrit huit artefacts dispersés entre trois répertoires                                                        |
| `catalogue:generate` / `system:generate` | RAW local                                                                                                                   | Produit des brouillons refusés par le pipeline ; leur existence ne résout pas le démarrage autonome           |
| `pipeline --source fixture`              | RAW local et paire sélectionnée par convention de nom, ou par chemins explicites                                            | Réécrit le catalogue déclaré du RAW, puis produit historique, snapshot et dashboard dans les sorties globales |
| `analyze`, `snapshot`, `dashboard`       | Même orchestration que `pipeline`                                                                                           | Rejouent les mêmes étapes et écrivent les mêmes sorties                                                       |
| `validate`                               | Fixture et paire système/catalogue                                                                                          | Contrôle les configurations et le périmètre                                                                   |
| `fixture:validate`                       | Fixture, trace éventuellement fournie                                                                                       | Contrôle anonymisation et relations ; écrit un rapport                                                        |
| `npm test`                               | Scénarios et fixtures versionnés, dont démonstration, V1 et jeux anonymisés nommés                                          | Assertions métier prédéfinies ; aucune collecte GitHub nécessaire                                             |
| Tests navigateur                         | Snapshot synthétique de consolidation et serveur de tests                                                                   | Pages générées dans un dossier dédié, distinct du dashboard opérationnel                                      |

Sources principales : [CLI](../../src/cli.ts), [préparation des références](../_historique/parcours-local-20261012/preparation-references.md), [résolution des chemins](../../src/lib/paths.ts), [pipeline](../../src/pipeline.ts), [tests navigateur](../../tests/browser/dashboard.spec.ts).

## Écarts et actions

| Contrat ou responsabilité                                         | Comportement observable                                                                                                          | Écart                                                                                  | Action proposée                                                                                                                   | Validation                                                                                   |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Collecter des faits depuis un périmètre explicite                 | Le collecteur exige des règles déjà chargées ; owner/repositories proviennent du YAML                                            | La première étape dépend d’une configuration opérationnelle préalable                  | Accepter une liste explicite de repositories et injecter le profil DSQ livré                                                      | Collecte simulée depuis une liste seule ; aucun catalogue local requis                       |
| D-151 : recalcul du type canonique avec la configuration courante | Le RAW conserve aussi un `issueType` legacy, parfois inféré durant la collecte                                                   | Couplage entre capture et interprétation, avec compatibilité historique                | Préserver la valeur brute ; garder la reconnaissance canonique au traitement et tracer le profil appliqué                         | Non-reconnaissance, ambiguïtés et changement de profil restent couverts                      |
| D-176 : recalcul du statut Project canonique depuis le brut       | Les valeurs brutes sont disponibles, mais chaque usage recharge une configuration sélectionnée différemment                      | Le même RAW peut être rejoué involontairement avec un autre contexte                   | Fig­er le profil utilisé dans le dataset et permettre un changement explicite                                                     | Rejeu déterministe, changement de profil explicite                                           |
| Référence V1 réservée aux scénarios métier                        | `prepareReferences` appelle `validateV1Reference` avant publication                                                              | Une fixture personnelle dépend d’un autre dataset sans rapport avec elle               | Retirer cette vérification du parcours utilisateur ; la garder dans la suite de tests                                             | Préparation possible sans fichiers V1 dans l’espace de travail local                         |
| Une fixture doit avoir un contexte de traitement connu            | La paire est devinée depuis le nom ; absence complète entraîne un repli vers le profil de démonstration                          | Renommer un fichier peut changer son contexte de traitement                            | Dataset autonome avec manifeste explicite et chemins relatifs, sans repli silencieux                                              | Renommage/déplacement ; fichier manquant ; profil incompatible                               |
| Contrôler avant publication                                       | L’ancienne anonymisation écrit plusieurs fichiers avant de remonter certains échecs                                              | Sorties partiellement publiées après échec                                             | Une seule préparation, validation préalable et publication atomique                                                               | Aucun nouveau dataset utilisable après échec ; entrées intactes                              |
| Catalogue de référence distinct des faits observés                | Le pipeline remplace `raw.catalogueComponents` par les noms du catalogue chargé                                                  | La capture originale n’est pas conservée telle quelle dans le traitement               | Éviter la mutation du RAW ; conserver séparément faits et enrichissements                                                         | RAW inchangé et provenance des ajouts                                                        |
| Métadonnées inconnues conservées                                  | Le catalogue exige des champs renseignés ; les composants hors catalogue sont suggérés, avec un cycle de vie `active` par défaut | Fabriquer un catalogue complet depuis les labels ferait inventer des informations      | Le démarrage ne doit pas exiger de métadonnées non disponibles ; adapter le contrat de catalogue et les réserves DQ si nécessaire | Valeurs absentes visibles ; aucun statut de conformité ou cycle de vie inventé               |
| Tests de non-régression indépendants des collectes                | Des tests importent `my-real-dataset-anonymized.json`, `full-dataset-anonymized.json` et plusieurs profils nommés                | Fixtures de réalisme et usages locaux se ressemblent et partagent l’espace utilisateur | Déplacer/renommer les sources de tests dans un espace exclusivement versionné pour les tests                                      | Suite complète hors réseau et sans données locales                                           |
| Démonstration indépendante des tests                              | `fixtures/github.json` et ses profils sont aussi chargés par de nombreux tests                                                   | Modifier la démonstration peut modifier les attentes de tests                          | Un dataset de démonstration autonome ; scénarios de tests séparés                                                                 | Changer le dataset de démonstration ne change pas les assertions métier                      |
| Sorties attribuées au dataset courant                             | Snapshot courant, historique et dashboard ont des chemins globaux                                                                | Mélange possible de runs de plusieurs jeux et intervention sur les fichiers locaux     | Répertoire de sortie explicite, historique limité au dataset compatible                                                           | Deux datasets successifs sans contamination ; tests sans écrasement des sorties personnelles |
| Commandes correspondant à des responsabilités distinctes          | Plusieurs commandes rejouent le pipeline complet                                                                                 | Nombre de scripts élevé sans séparation effective des étapes                           | Un seul point d’entrée de traitement ; retirer les doublons                                                                       | Tests CLI et documentation entièrement migrés                                                |
| Documentation décrivant les dépendances réelles                   | Une page indique que les jeux anonymisés ne sont pas requis pour `npm test`                                                      | Contradiction avec les imports et chargements actuels                                  | Corriger l’état implémenté, puis documenter un unique parcours                                                                    | Liens, scripts, tâches VS Code et instructions IA cohérents                                  |

D-151 et D-176 sont des décisions établies dans le [registre](../00-cadrage/questions-ouvertes.md). La refonte ne modifie ni les règles de terminaison des audits ni les règles de conformité.

## Parcours cible proposé

Les conventions DSQ sont un profil versionné interne : elles sont disponibles après installation, sans création manuelle de `system.yaml`. Le périmètre utilisateur remplace uniquement owner/repositories ; les métadonnées non démontrées restent absentes et signalées.

Quatre responsabilités CLI principales suffisent :

1. **Collecter** : liste explicite `owner/repository`, token et dossier local de destination. Capturer le RAW et la provenance du profil DSQ.
2. **Préparer le dataset** : depuis la capture, produire en une opération la fixture anonymisée, son contexte complet et son manifeste. Aucun catalogue V1 ni autre collecte nécessaire.
3. **Exécuter le pipeline** : fournir uniquement le dataset et la destination du dashboard. Le manifeste contient les données et règles à charger ; aucune convention de nom inter-répertoires.
4. **Contrôler le dataset** : intégrité du manifeste, relations, anonymisation, compatibilité du schéma et exécution du pipeline dans un espace temporaire.

Les commandes de développement (`test`, `check`, build, lint, documentation) restent distinctes des étapes utilisateur. La consultation du dashboard reste un serveur local ; elle n’entraîne pas une nouvelle collecte. Les outils de diagnostic spécialisés peuvent rester des outils de développement, sans apparaître dans le démarrage rapide.

Contrat CLI proposé, à implémenter :

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/mon-jeu/raw.json
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu
npm.cmd run pipeline -- --dataset datasets/mon-jeu --output data/output/mon-jeu
npm.cmd test
```

`repositories.json` serait une simple liste de noms complets ; les URLs et le token restent des paramètres d’environnement. La préparation demande une graine privée pour obtenir des correspondances reproductibles. Cette graine n’est ni un fichier métier à fabriquer ni une métadonnée déductible du RAW ; elle peut être gérée dans l’environnement local. Les options nouvelles ci-dessus ne doivent pas être utilisées avec la CLI actuelle.

À supprimer/remplacer dans le parcours : `reference:prepare`, `fixture:anonymize`, `analyze`, `snapshot`, `dashboard`, `validate` et les générateurs de brouillons séparés devenus internes à la préparation. `fixture:prepare` deviendrait une commande principale autonome, et `fixture:validate` réunirait les contrôles du dataset. Aucun alias ancien ne serait conservé.

## Organisation cible

```text
config/profiles/       conventions DSQ versionnées, sans périmètre personnel
examples/demo/        un dataset de démonstration autonome
tests/fixtures/       références stables exclusivement destinées aux tests
tests/support/        constructeurs de cas minimaux et sorties temporaires
data/local/<jeu>/     capture et correspondances privées
datasets/<jeu>/       fixture et manifeste autonome à revoir avant partage
data/output/<jeu>/    snapshot, historique et dashboard de ce dataset
```

Un manifeste peut rassembler les règles et les enrichissements ou référencer des fichiers relatifs au dossier du dataset. Le critère est l’autonomie : copier le dossier doit suffire au rejeu sans rechercher un fichier ailleurs dans le dépôt. Réduire les scripts ne signifie pas cacher plusieurs configurations obligatoires derrière des chemins implicites.

Un jeu dérivé d’une collecte ne remplace pas automatiquement V1 : les assertions V1 vérifient des événements et résultats précis. Le contrôle de la collecte doit accepter une absence de scénario métier, tout en refusant une incohérence structurelle. Les tests unitaires et de non-régression doivent fonctionner depuis un checkout complet du projet sans collecte préalable, token ou données personnelles.

## Migration et critères de fin

1. Inventorier les appels CLI dans tests, documentation, tâches VS Code et CI, ainsi que les sources de chaque fixture.
2. Isoler les conventions DSQ et ajouter le modèle de dataset autonome avec validation stricte du manifeste.
3. Découpler la collecte de la préparation manuelle de profils ; préserver les faits bruts et les quotas existants.
4. Unifier la préparation, les contrôles et la publication ; retirer le couplage V1 et l’ancienne anonymisation à écritures partielles.
5. Adapter le pipeline aux sorties explicitement associées au dataset et aux enrichissements inconnus.
6. Séparer démonstration et références de tests ; conserver les scénarios et assertions métier utiles.
7. Supprimer les commandes remplacées et leurs références, puis réécrire le démarrage rapide autour d’un seul exemple.
8. Valider depuis des espaces temporaires vierges : collecte simulée depuis la liste seule, préparation et rejeu hors réseau, contrôle du dataset, suite de tests complète et navigateur. Vérifier absence de modification des fichiers personnels et absence de secret dans les artefacts partageables.

La migration doit conserver les protections sur les quotas, les relations GitHub, la provenance, les inconnues DQ et les règles métier établies. Aucun nettoyage destructif des collectes existantes n’est nécessaire pour la mettre en œuvre.
