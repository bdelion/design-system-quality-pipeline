# Configurations, sources et données de test

## État implémenté et fichiers nécessaires

Les commandes se lancent depuis la racine du repository, après `npm ci`.
Sous PowerShell, utiliser `npm.cmd` à la place de `npm` si nécessaire.

| Usage                             | Fichiers effectivement chargés                                                                                             | Commande                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| GitHub                            | `config/system.yaml`, `config/catalogue.yaml`, token dans l'environnement                                                  | `npm run pipeline -- --source github`                                       |
| Démonstration hors réseau         | `fixtures/github.json`, paire `config/system.fixture.yaml` et `config/catalogue.fixture.yaml`                              | `npm run pipeline -- --source fixture`                                      |
| Référence métier synthétique      | `fixtures/v1-reference.json`, paire `config/system.v1-reference.yaml` et `config/catalogue.v1-reference.yaml`              | `npm run pipeline -- --source fixture --fixture fixtures/v1-reference.json` |
| Autre dataset local               | `fixtures/<nom>.json`, paire `config/system.<nom>.yaml` et `config/catalogue.<nom>.yaml`                                   | `npm run pipeline -- --source fixture --fixture fixtures/<nom>.json`        |
| Tests unitaires et intégration    | `vitest.config.ts`, scénarios `tests/**/*.test.ts`, helpers `tests/support`, fixtures synthétiques et profils fixture      | `npm test`                                                                  |
| Tests navigateur et accessibilité | `playwright.config.ts`, `tests/browser`, serveur `scripts/serve-dashboard-tests.ts`, snapshot synthétique de consolidation | `npm run test:browser`                                                      |

`system` déclare le périmètre, les versions des règles et les conventions GitHub
(labels, types, statuts, milestones). `catalogue` décrit les composants et leurs
métadonnées. Ces responsabilités sont distinctes : deux fichiers ne constituent
pas en soi une duplication.

Le fichier `.env` est facultatif si les variables sont déjà fournies par le shell.
Copier `.env.example` vers `.env` pour le travail local, puis renseigner
`GITHUB_TOKEN`. Les URLs REST, GraphQL et Web sont des paramètres optionnels.
Ne pas versionner le token, la graine privée ni les correspondances de noms réels.
La source fixture n'a pas besoin de token ; le chargement dotenv demeure présent,
mais aucune collecte GitHub n'est effectuée.

Le nom `github.json` désigne une fixture locale et ne déclenche pas la source GitHub.
Les commandes `analyze`, `snapshot`, `dashboard` et `pipeline` exécutent actuellement
le pipeline avec production de sorties dans `data/` ; elles ne sont pas toutes des
étapes isolées. `validate` vérifie le périmètre d'une fixture ; `fixture:validate`
vérifie anonymisation et relations. Aucun de ces contrôles ne garantit à lui seul
la conformité métier complète.

## Sélection des profils et fichiers supplémentaires

Pour une fixture explicite, les deux profils spécifiques sont sélectionnés ensemble.
Si un seul existe, le chargement échoue avec une erreur de configuration incomplète.
Si aucun n'existe, les deux fichiers historiques `*.fixture.yaml` sont utilisés,
pour préserver la compatibilité. Ce fallback ne prouve pas que leurs identités
correspondent au dataset : préparer une paire spécifique pour chaque nouveau jeu.
Deux fixtures de même nom dans des dossiers différents ciblent la même paire ;
utiliser des noms distincts.

Le pipeline GitHub charge **`system.yaml` et `catalogue.yaml`**, pas les fichiers
`system.github.yaml` et `catalogue.github.yaml`. Ces derniers sont des profils
supplémentaires non sélectionnés automatiquement. De même, `quality-rules.yaml`
n'est pas lu par le moteur : les contrôles exécutables résident dans
`src/quality/rules.ts`. Modifier ce YAML seul ne modifie pas les contrôles.
Ces fichiers sont conservés pour ne pas supprimer des configurations existantes ;
ils ne doivent pas être présentés comme nécessaires au lancement.

Les trois datasets anonymisés actuellement présents ont chacun leur paire dédiée.
Ils ne sont pas requis pour `npm test`. Leur suppression ne serait justifiée
qu'après identification des usages de démonstration ou de diagnostic à conserver.

## Positionnement

L'organisation actuelle est conservée : `config/` pour les profils YAML,
`fixtures/` pour les datasets partageables, `tests/` pour les assertions et les
constructeurs synthétiques, `scripts/` pour les outils et `data/` pour les sorties
locales. Les configurations Vitest et Playwright restent à la racine, où les outils
les découvrent. `package.json` expose les commandes et `package-lock.json` fixe les
dépendances ; ils ne sont pas des profils métier.

Déplacer tous les profils dans des sous-dossiers casserait la convention de
`fixture:prepare` et les chemins existants sans réduire le nombre de responsabilités.
La simplification apportée porte donc sur la sélection cohérente et sur des tests
qui ne dépendent plus des profils GitHub opérationnels.

## Isolation et renouvellement des tests

Les tests fonctionnels doivent rester exécutables hors réseau et sans secret.
Les tests qui chargent les configurations de démonstration demandent explicitement
la source fixture. Les tests du collecteur GitHub simulent les réponses HTTP.
Les cas ciblés utilisent des données minimales ; les références transversales
`github.json`, `v1-reference.json` et `tests/support` restent synthétiques et stables.
Les tests de sélection des profils utilisent des dossiers temporaires uniques,
nettoyés après exécution. Le navigateur génère ses pages dans
`data/browser-consolidation`, séparément du dashboard opérationnel ; les rapports
et traces sont des artefacts locaux/CI.

**Il ne faut pas régénérer automatiquement les références de non-régression à
chaque collecte.** Une référence stable détecte une évolution inattendue. La mettre
à jour exige une raison documentée, la revue des assertions et des résultats.

Pour les tests de réalisme, renouveler un jeu anonymisé lorsqu'une structure
GitHub nouvelle, un défaut non couvert ou une évolution de schéma le justifie.
Une revue périodique est possible ; aucun calendrier ni accès GitHub automatique
n'est ajouté. Le renouvellement suit ce processus :

1. Collecter explicitement un RAW local : `npm run collect -- --source github --output data/raw/refresh.json`. `--output` est obligatoire pour toutes les sources ; son dossier parent, ici `data/raw/` (ignoré par Git), est créé automatiquement. Le chemin du fichier enregistré est affiché après l’écriture réussie.
2. Préparer le dataset et ses deux profils avec la même graine locale : `npm run fixture:prepare -- --input data/raw/refresh.json --output fixtures/refresh-anonymized.json --anonymize-components`.
3. Vérifier : `npm run fixture:validate -- --input fixtures/refresh-anonymized.json` puis `npm run validate -- --fixture fixtures/refresh-anonymized.json`.
4. Examiner le JSON, les deux YAML et le manifeste généré ; valider les relations,
   les identités, les URLs et les textes avant tout partage. Un contrôle automatisé
   d'anonymisation reste à compléter par une revue humaine.
5. Rejouer le pipeline explicitement sur ce jeu, examiner les réserves Data Quality,
   puis exécuter `npm run check:dashboard` avant remplacement d'une référence.
6. Documenter origine, date, options non sensibles, empreintes et motivation du
   renouvellement. Conserver les cas synthétiques qui reproduisent les défauts.

Le manifeste d'empreintes n'est pas le manifeste `*.trace.json` : ce dernier
contient la traçabilité sensible et doit rester local. Une préparation qui échoue
peut déjà avoir écrit ses fichiers ; ne pas partager ses sorties avant validation.
Voir [les fixtures](fixtures.md) et [l'anonymisation](anonymisation.md).

## Vérification des améliorations

`tests/fixture-config-pair.test.ts` couvre la paire historique, la paire dédiée et
les deux profils partiels refusés. Les tests de pipeline, dashboard, snapshots,
analytics et collecteur demandent désormais leurs règles synthétiques via
`loadConfig('fixture')` ; le catalogue des tests suit la même isolation.
Aucune règle métier ni donnée de référence n'est modifiée par cette évolution.

Validation locale de ce lot : `npm run check` réussit (169 tests dans 35 fichiers,
typage, lint, TSDoc et compilation), ainsi que `npm run format:check`,
`npm run test:browser` (10 tests, contrôles axe desktop et mobile), `npm run docs:api`
et `git diff --check`. Le périmètre V1 est validé par
`npm run validate -- --fixture fixtures/v1-reference.json` (3 repositories).
Cette dernière commande a nécessité une exécution hors sandbox après une erreur
système `uv_os_get_passwd / ENOMEM` au démarrage de tsx dans le sandbox.
Aucune collecte GitHub ni régénération des datasets anonymisés n'a été effectuée.

## Profils de référence explicites

Les commandes acceptent maintenant une paire `--system-config` / `--catalogue-config`
pour sélectionner des profils nommés. Les profils GitHub générés restent locaux
sous `config/local/`, ignoré par Git. `reference:prepare` automatise la préparation
et les contrôles ; voir [Préparation des références](preparation-references.md).
Cette sélection complète les chemins par défaut décrits ci-dessus.
