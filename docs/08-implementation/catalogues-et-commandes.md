# Catalogues de composants : collecte, anonymisation et rejeu

**IMPLÉMENTÉ.** Cette page précise quelles sources sont lues par les commandes,
à quel moment et ce qui est conservé. Les recettes sont dans le
[guide d’utilisation](guide-utilisation.md#8-enrichir-un-jeu-avec-un-catalogue-ou-un-historique)
et les schémas dans le [contrat des datasets](datasets.md#historique-des-composants-par-version).

## Trois sources distinctes

| Source                       | Contenu                                                                 | Chargement                                                                                              |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Catalogue historique GitHub  | `config/catalogue.yaml` dans chaque dépôt extrait, au tag exact `M.m.r` | `collect`                                                                                               |
| Catalogue métier courant     | Métadonnées métier du YAML local choisi explicitement                   | `fixture:prepare --catalogue <fichier>` depuis un RAW                                                   |
| Référentiel historique local | Identités et observations de présence par version                       | `fixture:prepare --historical-catalogue <fichier...>` ou `pipeline --historical-catalogue <fichier...>` |

**ÉTABLI — D-143, D-210 et D-211.** Le catalogue historique GitHub correspond
au contenu du dépôt au tag PROD exact. Le catalogue courant ne sert pas de
substitut rétroactif. Voir le [registre des décisions](../00-cadrage/questions-ouvertes.md).
Un inventaire absent ne prouve pas une population vide.

## Collecte GitHub : `collect`

Pour chaque dépôt, après récupération des tags Git, le collecteur sélectionne
les noms correspondant exactement à `M.m.r`, par exemple `1.7.1`. Il lit via
l’API GitHub `config/catalogue.yaml` à chacun de ces tags. Le chemin est fixe ;
aucun fichier de `config/local/` n’est automatiquement utilisé.

Le RAW conserve dans `repositories[].historicalCatalogues` le tag, le statut et
les noms des composants. Le YAML complet et ses métadonnées ne sont pas conservés
dans cette preuve historique.

| Statut      | Signification                      |
| ----------- | ---------------------------------- |
| `available` | Fichier lu et catalogue validé     |
| `missing`   | Fichier absent, réponse HTTP 404   |
| `invalid`   | Contenu YAML ou catalogue invalide |

Une autre erreur HTTP interrompt la collecte. Les noms de tags préfixés par `v`
ou les préversions ne correspondent pas au filtre exact `M.m.r`.

Source : [collecteur GitHub](../../src/collectors/github.ts).

## Préparation et anonymisation : `fixture:prepare`

### Depuis un RAW

| Entrée                                     | Traitement et destination                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Preuves GitHub du RAW                      | Conservées dans `dataset.json`, sous `rawData.repositories[].historicalCatalogues`                                          |
| Sans `--catalogue`                         | `catalogue: null` dans le dataset ; création ou conservation du brouillon privé `<RAW>.catalogue.draft.yaml`, à côté du RAW |
| Avec `--catalogue <fichier>`               | Catalogue validé, limité aux dépôts du périmètre, anonymisé et embarqué sous `catalogue`                                    |
| Avec `--historical-catalogue <fichier...>` | Référentiels validés, transformés et embarqués sous `historicalComponents`                                                  |

Le brouillon de catalogue courant conserve les noms réels, même avec
`--anonymize-components`. Il n’est pas automatiquement intégré au dataset :
compléter ses valeurs, retirer `draft: true` après revue et le fournir
explicitement avec `--catalogue`.

Les noms des composants sont conservés par défaut. `--anonymize-components`
pseudonymise aussi leurs noms, les labels préfixés correspondants et les noms
des preuves historiques. Les identités du référentiel historique local sont
pseudonymisées. Les métadonnées du catalogue suivent les transformations
d’anonymisation, notamment pour les responsables et équipes ; les liens de
documentation et Figma sont supprimés.

### Depuis une fixture existante

Le manifeste source est vérifié. Les faits, les alias, les dates, la configuration
et le catalogue courant déjà embarqués sont conservés, sans nouvelle
anonymisation. Un historique fourni remplace celui du même dépôt dans la nouvelle
fixture ; les autres historiques sont conservés. Sans nouvel historique, les
historiques embarqués sont conservés.

Les options `--catalogue` et `--anonymize-components` sont refusées pour cette
entrée. Fournir à `--historical-catalogue` directement le référentiel de présences,
en utilisant les noms et alias de la fixture. Le fichier de règles d’identités
qui pointe vers ce référentiel est une entrée de `pipeline`, pas de cette préparation.

Source : [gestion des datasets](../../src/datasets.ts).

## Validation, pipeline et consultation

| Commande                                         | Sources effectivement relues                                                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `fixture:validate --dataset …`                   | Catalogue courant, historique local et preuves GitHub embarqués ; exécution du pipeline hors réseau dans une sortie temporaire       |
| `pipeline --dataset <fixture>`                   | Les mêmes sources embarquées ; aucun YAML local d’origine n’est automatiquement relu                                                 |
| `pipeline --dataset <raw.json>`                  | Preuves GitHub du RAW contextualisé ; catalogue courant à `null`                                                                     |
| `pipeline … --historical-catalogue <fichier...>` | En plus du dataset, fichiers externes relus à chaque exécution ; remplacement pour ce run de l’historique embarqué du dépôt concerné |
| `dashboard:serve`                                | Fichiers HTML et ressources déjà générés ; aucun catalogue relu ni calcul relancé                                                    |

Le pipeline charge et valide les entrées avant la normalisation. Celle-ci utilise
le catalogue courant et les preuves historiques pour construire les composants
et leurs relations aux versions. Viennent ensuite les verdicts, les contrôles DQ,
les indicateurs, le snapshot et le dashboard.

Les observations historiques locales validées priment pour les noms sélectionnés
et leurs noms historiques. Les autres composants conservent leurs preuves GitHub.
Un import local ne supprime pas le constat d’un catalogue absent de GitHub et ne
prouve pas les présences hors de sa sélection.

Les imports externes ne modifient pas le dataset source. Pour un seul fichier,
`--historical-repository <owner/repository>` permet de l’affecter explicitement
au dépôt réel du RAW lorsque son alias diffère. Pour plusieurs dépôts, fournir
plusieurs fichiers correctement affectés, sans cette option d’affectation unique.

Sources : [pipeline](../../src/pipeline.ts),
[import historique](../../src/historical-import.ts) et
[normalisation](../../src/normalizers/github.ts).

## Fichiers du parcours local de l’issue #49

Ces chemins désignent des fichiers locaux non livrés avec le dépôt ; ils ne
constituent pas des valeurs par défaut des commandes.

| Fichier                                                   | Rôle                                                                                                                                                                                      |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `config/local/demo-react-historique-composants.yaml`      | Référentiel de présences et d’identités par version, utilisable directement par `fixture:prepare` et `pipeline`                                                                           |
| `config/local/demo-react-historique-identites.draft.yaml` | Règles d’identités ; `pipeline` le lit s’il désigne le référentiel via `historicalCatalogue: ./demo-react-historique-composants.yaml`, puis vérifie la cohérence entre les deux documents |
| `config/local/demo-react-historique-selection.draft.csv`  | Source de sélection ayant servi à constituer le référentiel ; aucune lecture automatique par ces commandes                                                                                |
| `datasets/issue-49/catalogue-historique.draft.yaml`       | Ancienne grille de revue, non lue par le pipeline                                                                                                                                         |
| `datasets/issue-49-historique/dataset.json`               | Fixture enrichie autonome ; `historicalComponents` contient l’historique intégré lors de sa préparation                                                                                   |

Le chemin `historicalCatalogue` est résolu relativement au fichier d’identités.
Le suffixe `.draft.yaml` et `draft: true` sont acceptés pour ce document de règles ;
ils ne constituent pas une preuve de présence. Cette tolérance ne s’applique pas
au catalogue métier courant fourni avec `--catalogue`.

```text
config/local/demo-react-historique-composants.yaml
    ↓ fixture:prepare --historical-catalogue …
datasets/issue-49-historique/dataset.json : historicalComponents
    ↓ fixture:validate / pipeline
snapshot et dashboard
```

Modifier le YAML local ne change pas un rejeu ordinaire de la fixture enrichie.
Pour prendre en compte sa nouvelle version, préparer une nouvelle fixture ou
le fournir explicitement à `pipeline --historical-catalogue`. Les commandes
complètes sont dans le [parcours historique du guide](guide-utilisation.md#8-enrichir-un-jeu-avec-un-catalogue-ou-un-historique).
