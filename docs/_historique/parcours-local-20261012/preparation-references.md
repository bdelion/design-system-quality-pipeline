> HISTORIQUE : parcours remplace le 12 octobre 2026. Voir [le parcours courant](../../08-implementation/datasets.md).

﻿# Préparer les références depuis un RAW collecté

## Commande implémentée

Sur la branche de travail, `npm run reference:prepare` prépare une paire GitHub
locale et une référence fixture anonymisée, vérifie les relations et contrôle la
référence synthétique V1 existante. Aucun accès réseau n'est effectué.

Depuis la racine du projet, après installation des dépendances :

```powershell
npm.cmd run reference:prepare -- --input data/raw/collecte.json --name octobre --system-config config/system.yaml --catalogue-config config/catalogue.yaml --anonymize-components
```

Renseigner `ANONYMIZATION_SEED` dans l'environnement ou `.env` avant l'exécution.
La graine est obligatoire et n'est jamais enregistrée dans le manifeste public.
`--seed` permet aussi une valeur explicite, mais peut laisser celle-ci dans
l'historique du shell. Les deux configurations sources sont facultatives ensemble :
en leur absence, `config/system.yaml` et `config/catalogue.yaml` sont chargés.
`--date-offset-days` accepte un entier, par défaut la variable
`ANON_DATE_OFFSET_DAYS` ou `-365`.

Le RAW doit contenir un unique owner, au moins un repository, une date de collecte
valide et les tableaux conformes au contrat RAW. Le catalogue source doit fournir
les composants présents : leurs métadonnées ne sont pas déduites arbitrairement.
Les noms de référence contiennent uniquement des minuscules, chiffres et tirets.
Si le catalogue source n’existe pas encore, [générer un brouillon depuis le RAW](../../08-implementation/generation-catalogue.md), puis compléter et vérifier ses métadonnées métier avant de préparer les références.
Le nom `v1` est réservé ; même `--force` ne permet pas d'écraser la référence V1.

## Fichiers produits

Pour `--name octobre`, huit fichiers sont publiés :

| Fichier                                                | Usage et confidentialité                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `config/local/system.octobre-github-reference.yaml`    | Profil GitHub réel ; local et ignoré par Git                                         |
| `config/local/catalogue.octobre-github-reference.yaml` | Catalogue réel ; local et ignoré par Git                                             |
| `fixtures/octobre-reference.json`                      | Dataset anonymisé à revoir avant partage                                             |
| `config/system.octobre-reference.yaml`                 | Périmètre anonymisé correspondant                                                    |
| `config/catalogue.octobre-reference.yaml`              | Catalogue anonymisé correspondant                                                    |
| `fixtures/octobre-reference.json.manifest.json`        | Empreintes SHA-256 des trois artefacts partageables et du RAW, options non sensibles |
| `fixtures/octobre-reference.json.validation.md`        | Rapport des contrôles et commandes d'utilisation                                     |
| `data/raw/octobre.trace.json`                          | Correspondances sensibles ; local et ignoré par Git                                  |

Le RAW d'entrée reste intact. Le token GitHub reste dans l'environnement et n'est
pas nécessaire à la préparation. Les URLs GitHub du profil réel proviennent des
configurations sources et de l'environnement. L'environnement a priorité lors du
chargement ; une URL explicitement enregistrée dans un profil est conservée en
l'absence de variable correspondante.

Les profils GitHub sont placés dans `config/local/`, plutôt que directement dans
`config/`, pour éviter de versionner involontairement des identités réelles.

## Exécutions GitHub et fixture

Les options `--system-config` et `--catalogue-config` sont désormais disponibles
ensemble sur `collect`, `validate`, `analyze`, `snapshot`, `dashboard` et `pipeline`.
Une paire partielle est refusée ; les chemins explicites n'ont aucun fallback.
Les anciens chemins par défaut et les anciennes commandes `fixture:prepare`,
`fixture:anonymize` et `fixture:validate` restent compatibles.
`validate` reste une commande de vérification de fixture, sans collecte GitHub.

```powershell
npm.cmd run pipeline -- --source github --system-config config/local/system.octobre-github-reference.yaml --catalogue-config config/local/catalogue.octobre-github-reference.yaml
npm.cmd run validate -- --fixture fixtures/octobre-reference.json
npm.cmd run pipeline -- --source fixture --fixture fixtures/octobre-reference.json
```

Les profils GitHub dérivent leur owner et leur périmètre du RAW. Leur catalogue
conserve les composants déclarés des repositories présents, y compris ceux sans
issue ; les entrées explicitement rattachées à un repository hors collecte sont
écartées. Les références fixture conservent ces composants déclarés.
Les scopes GitHub et fixture sont distincts et nommés pour éviter les comparaisons
historiques entre ces deux contextes.

Une référence GitHub fige un profil de collecte, pas les données distantes.
La référence fixture fige les données et leurs configurations.

## Anonymisation et contrôles

La préparation remplace les titres et les identités techniques, décale les dates,
anonymise les responsables, squads, streams et tags du catalogue et retire ses
URLs de documentation/Figma. Les dates d'audit du catalogue suivent le même décalage.

Par défaut, les noms de composants et les labels sont conservés selon le contrat
historique. Avec `--anonymize-components`, les noms des composants, leurs présences
historiques et les labels correspondant au préfixe configuré suivent le même mapping.
Les autres labels, types d'issues, statuts Project, titres/états de milestones,
branches et tags Git restent des faits métier conservés : une revue humaine est
nécessaire avant partage. Le nom choisi pour la référence doit aussi être non sensible.

Le script refuse les relations issue/PR manquantes, les chaînes suspectes détectées
par le validateur, les repositories incohérents et les configurations non exploitables.
Il ne supprime pas les relations pour rendre artificiellement un jeu valide.
Les limites du validateur existant restent applicables : il ne constitue pas une
preuve exhaustive de confidentialité ni de conformité métier.

Tous les contrôles ont lieu avant publication. Les fichiers sont préparés dans un
dossier temporaire local sous `data/raw/`, nettoyé en fin d'exécution. Un fichier
existant est refusé par défaut ; `--force` autorise uniquement le remplacement des
huit cibles de ce nom. Une erreur pendant la publication déclenche la restauration
des fichiers remplacés et la suppression des fichiers nouvellement publiés.
Cette restauration ne garantit pas une transaction en cas d'arrêt brutal du processus.
Les entrées ne peuvent pas être remplacées par des sorties et les cibles existantes
qui ne sont pas des fichiers réguliers sont refusées. Éviter deux préparations
concurrentes du même nom et des répertoires de sortie redirigés par liens symboliques.

## Tests et référence V1

Les tests réutilisent le dataset et sa paire de configurations : aucune copie
supplémentaire dans `tests/` n'est produite. La préparation n'invente pas des
assertions attendues à partir des résultats observés et ne génère pas de test vide.

`fixtures/v1-reference.json`, `config/system.v1-reference.yaml` et
`config/catalogue.v1-reference.yaml` sont vérifiés et conservés. Le contrôle de
préparation vérifie périmètre, catalogue et normalisation ; les assertions métier
complètes restent celles de `tests/v1-reference-scenario.test.ts`.

Cette commande ne régénère pas la référence synthétique V1 : les scénarios métier
volontaires ne peuvent pas être reconstruits à partir d'une collecte réelle.
Un générateur synthétique distinct nécessiterait un contrat de scénarios dédié.

`tests/reference-preparation.test.ts` vérifie la préparation, la cohérence des
identités et labels, le chargement explicite des profils, l'absence de graine dans
le manifeste, la régénération déterministe, le refus des écrasements et des entrées
invalides, ainsi que la conservation de V1 et le refus des relations manquantes.

## Proposition de ménage après adoption

Aucune suppression de fichiers existants n'est effectuée dans ce lot.

| Ensemble                                                                | Proposition                                                                  | Condition avant suppression                                              |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `system.yaml`, `catalogue.yaml`                                         | Conserver comme configurations sources/par défaut                            | Migrer tous les usages avant tout remplacement                           |
| `system.github.yaml`, `catalogue.github.yaml`                           | Archiver ou supprimer ces profils non sélectionnés par défaut                | Comparer leurs contenus et conserver leurs métadonnées uniques           |
| `system.fixture.yaml`, `catalogue.fixture.yaml`, `fixtures/github.json` | Conserver le scénario de démonstration stable                                | Ils restent utilisés par les tests et les commandes par défaut           |
| Ensemble `v1-reference`                                                 | Conserver ensemble                                                           | Référence métier dédiée, distincte des collectes                         |
| Trois anciens datasets anonymisés et leurs paires                       | Choisir une référence représentative, archiver les autres ensembles complets | Revoir confidentialité, usages, diagnostics et différences de couverture |
| `config/quality-rules.yaml`                                             | Clarifier son statut documentaire ou archiver                                | Vérifier les références ; le moteur utilise `src/quality/rules.ts`       |
| Rapports historiques de validation                                      | Conserver avec le dataset correspondant ou archiver ensemble                 | Ne pas laisser un rapport associé à un dataset remplacé                  |
| `data/raw/` et `config/local/`                                          | Nettoyage local explicite selon besoin                                       | Conserver les RAW et traces utiles ; jamais publier ces dossiers         |

Pour chaque référence adoptée, conserver ensemble JSON, deux YAML, manifeste et
rapport. Documenter sa raison d'être et exécuter les tests avant retrait d'un ancien
ensemble. Le renouvellement doit être explicite, jamais automatique à chaque collecte.

Voir [Configurations et tests](../../08-implementation/configurations-et-tests.md) et [Fixtures](../../08-implementation/fixtures.md).

## Preuves de validation locale

- `npm run check` : succès, 175 tests dans 36 fichiers, typage, lint, TSDoc et compilation.
- `npm run format:check` et `npm run docs:api` : succès.
- `npm run test:browser` : 10 tests réussis, dont contrôles axe sur sept pages desktop/mobile.
- CLI `reference:prepare` exécutée sur V1 avec des configurations sources explicites : huit sorties produites sous le nom temporaire `validation-smoke`.
- CLI `validate` exécutée sur la fixture générée puis sur V1 avec la paire GitHub locale générée : trois repositories validés dans chaque cas.
- Aides CLI de préparation et de pipeline vérifiées ; profils locaux et traces confirmés ignorés par Git.
- Artefacts temporaires de cette validation retirés ; données et configurations de référence existantes conservées.

Les commandes CLI ont été exécutées hors sandbox en raison de l'erreur système
`uv_os_get_passwd / ENOMEM` observée avec tsx dans cet environnement.
Aucune collecte GitHub réelle, aucun commit et aucun push ne sont effectués dans ce lot.
