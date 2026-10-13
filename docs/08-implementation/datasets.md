# Datasets autonomes et migration du parcours local

**IMPLÉMENTÉ.** Le parcours utilisateur comporte quatre commandes : `collect`, `fixture:prepare`, `fixture:validate` et `pipeline`. Les conventions DSQ sont livrées dans `config/profiles/dsq.json`, sans périmètre personnel. Les anciennes commandes remplacées sont supprimées, sans alias.

## Contrat des entrées et sorties

| Étape     | Entrée                                                      | Sortie                                                                         |
| --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Collecter | Liste JSON de `owner/repository`, token et options de quota | RAW local avec `collectionContext.config`, profil exact appliqué               |
| Préparer  | RAW, graine et catalogue métier facultatif                  | Nouveau dossier publié atomiquement : `dataset.json`, `manifest.json`          |
| Valider   | Dossier du dataset                                          | Contrôles structurels et d’anonymisation ; pipeline temporaire et compteurs DQ |
| Rejouer   | Dataset autonome et destination                             | `current/snapshot.json`, `runs/`, `dashboard/` dans la destination             |

Le périmètre doit avoir un owner unique. Les doublons et noms incomplets sont refusés. Les destinations de capture et de préparation existantes sont refusées, y compris un RAW proposé comme sortie. Une préparation invalide ne publie pas de dossier utilisable. Le programme ne supprime pas vos anciens jeux.

### Diagnostic des relations manquantes

Correction liée à l’issue #61 : les références de clôture vers une PR connue du dépôt (même fermée sans merge) ne sont pas enregistrées comme des relations vers une issue. Le dépôt explicite d’une référence `owner/repository#123` ou d’une URL d’issue est conservé. Une référence dont la cible n’est pas connue reste présente pour diagnostic ; elle n’est pas supprimée pour rendre la fixture artificiellement valide. Les anciennes captures doivent être recollectées pour bénéficier de cette correction.

Si `fixture:prepare` détecte une relation invalide, la console indique le chemin d’un rapport `fixture-diagnostics-…/relations.json`, créé à côté du RAW source. Ouvrir ce fichier dans l’éditeur : chaque entrée précise le dépôt, le type et le numéro de l’issue ou PR source, le type et l’identifiant de l’élément référencé, ainsi que son chemin JSON. Le rapport distingue un élément absent du RAW d’un élément présent dans un autre dépôt.

Vérifier la relation dans GitHub, le périmètre de collecte et les accès du token, puis refaire une collecte si nécessaire. Une relation entre dépôts peut nécessiter une adaptation du traitement ; ne pas effacer la relation pour contourner le contrôle. Aucun dataset n’est publié lors de cet échec, et le RAW reste inchangé. Le rapport contient des identités réelles : le conserver privé et le relire avant partage. Il ne contient ni token, ni graine, ni copie des textes du RAW.

## Format du dataset

Une capture récente peut aussi être rejouée directement avec `pipeline --dataset data/local/mon-jeu/raw.json --output data/output/mon-jeu-local`. Le contexte enregistré fournit ses conventions et son périmètre, sans autre profil. Ce mode `local` conserve les identités réelles et les liens GitHub, ne fait aucun appel réseau et exclut la graine de la capture des sorties. Ses fichiers restent privés ; il ne remplace pas la préparation anonymisée avant partage. Un ancien RAW sans contexte doit d’abord être préparé.

`dataset.json` embarque `schemaVersion: 1`, `kind` (`fixture`, démonstration synthétique `demo`, ou rejeu privé `local`), `profileId`, `config`, `catalogue`, `rawData` et, facultativement, `historicalComponents`. Le périmètre de `config` doit correspondre exactement aux faits. Les conventions sont vérifiées avant interprétation, puis conservées avec les données ; l’environnement ne remplace pas les règles durant le rejeu.

Le profil livré utilise le modèle `2.4` et les règles `dq-2026.10-audit-relations`, après le parcours autonome `2.3` / `dq-2026.10-dataset-workflow`. Il désactive les inférences historiques d’audit avec `auditDetection.allowLegacyIssueTypes: false` ; `Enhancement` et `Improvement` sont des variantes de `FEATURE`. Sans cette option, les anciens profils conservent leur compatibilité historique. Les références de tests et les anciens datasets gardent leurs versions de scénario. Voir le [diagnostic de l’issue #49](issue-49-audit-diagnostic.md) pour les limites de données et le parcours de vérification.

`manifest.json` contient l’empreinte SHA-256 du fichier exact, l’empreinte du RAW source et l’état de revue `required`. Les fixtures préparées exigent leur manifeste, même lorsqu’on fournit directement `dataset.json`. Une modification du contenu sans manifeste cohérent est refusée. Copier ou renommer le dossier complet ne change pas la résolution. Le fichier de démonstration versionné peut être chargé directement sans manifeste de préparation.

Une capture ancienne sans `collectionContext` peut être préparée avec le profil DSQ actuellement livré. Une capture récente conserve les versions et conventions réellement appliquées. Les profils incohérents avec le périmètre sont refusés. Une modification explicite des conventions nécessite de préparer un nouveau dataset et de vérifier ses indicateurs ; D-151 et D-176 restent applicables.

## Enrichissements facultatifs

Sans `--catalogue`, `fixture:prepare` génère aussi un brouillon privé nommé `<chemin-du-RAW>.catalogue.draft.yaml`, à côté du RAW. Un fichier existant est conservé sans écrasement. Ce brouillon utilise les noms d’origine même avec `--anonymize-components` ; il reste hors du dataset anonymisé et ne doit pas être partagé avec lui.

Les noms proviennent des composants déclarés dans le RAW et des labels utilisant le préfixe du profil capturé (ou du profil DSQ livré pour un ancien RAW). Les noms sont dédupliqués ; le dépôt est renseigné lorsqu’il est unique. `observedRepositories` conserve les dépôts observés lorsqu’une attribution reste à vérifier. Les champs `owner`, `squad` et `stream` portent « À remplacer » ; `status` et `rgaaLevel` sont `null`, sans audit inventé. Le fichier est marqué `draft: true` et refusé par `--catalogue` avant revue.

Compléter les métadonnées vérifiées, choisir le dépôt si nécessaire, puis retirer `draft: true`. Les noms doivent rester uniques. Utiliser ensuite le catalogue approuvé pour préparer un nouveau dossier :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu
# Compléter data/local/mon-jeu/raw.json.catalogue.draft.yaml et retirer draft après revue.
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-enrichi --catalogue data/local/mon-jeu/raw.json.catalogue.draft.yaml
```

Le catalogue absent (`catalogue: null`) du parcours minimal signifie qu’aucun enrichissement de référence n’est fourni ; il ne prouve pas l’absence de composants. Les labels et faits GitHub restent visibles. Les métadonnées d’équipe, stream, niveau RGAA et cycle de vie ne sont pas fabriquées. Un composant observé sans cycle de vie démontré possède le statut normalisé `unknown`, reste visible dans la cartographie et rend indéterminés les indicateurs exigeant un patrimoine actif complet.

Pour ajouter un catalogue vérifié :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-enrichi --catalogue config/local/mon-catalogue.yaml
```

Les métadonnées suivent les correspondances d’anonymisation ; les URLs de documentation et Figma sont retirées, les dates d’audit suivent le décalage de dates. Les responsables, squads, streams et tags sont pseudonymisés. Un catalogue partiel est accepté : les composants observés sans enrichissement restent inconnus et signalés en Data Quality. Les entrées de repositories hors collecte sont écartées ; aucune métadonnée n’est inventée pour compléter le catalogue.

## Historique des composants par version

**IMPLÉMENTÉ.** `--historical-catalogue <file...>` embarque un ou plusieurs référentiels YAML, un par dépôt, en complément du catalogue métier courant. Le fichier local peut rester dans `config/local/` : il est lu lors de la préparation puis inclus dans `dataset.json`, protégé par son manifeste. Le pipeline ne dépend ensuite ni du classeur Excel ni des fichiers locaux.

Depuis une collecte :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-historique --historical-catalogue config/local/demo-react-historique-composants.yaml
```

Depuis une fixture déjà anonymisée, sans modifier ses faits, ses dates, ses alias, sa configuration ou son catalogue :

```powershell
npm.cmd run fixture:prepare -- --input datasets/issue-49/dataset.json --output datasets/issue-49-historique --historical-catalogue config/local/demo-react-historique-composants.yaml
npm.cmd run fixture:validate -- --dataset datasets/issue-49-historique
npm.cmd run pipeline -- --dataset datasets/issue-49-historique --output data/output/issue-49-historique
```

Le manifeste source est vérifié. Choisir une nouvelle destination ; aucune édition de `dataset.json` ou recalcul manuel d'empreinte n'est nécessaire. Pour une fixture existante, les options `--catalogue` et `--anonymize-components` sont refusées : elles s'appliquent à la préparation depuis un RAW. Un historique fourni remplace uniquement l'historique du même dépôt dans la nouvelle fixture. Sans nouvel historique, ceux déjà embarqués sont conservés.

Le schéma YAML `schemaVersion: 1` contient `repository` (nom exact ou `owner/nom` dans les faits d'entrée), `versions` et `components`. Chaque version comporte `version` au format `M.m.r`, `channel` (`release` ou `development`) et `sourceLabel`. Chaque composant possède `name` et une observation `history` pour **chaque** version, dans l'ordre numérique : `version`, `channel`, `present`, `change`, `identity`, `historicalName`, `evidence` (cellule, symbole et valeur). Les valeurs sont `+`, `~`, `=`, `-` ou vide. Une absence est explicite ; une observation manquante, une valeur inconnue ou une identité ambiguë sont refusées. Les cellules vides ne s'appliquent qu'au périmètre déclaré, pas aux composants exclus de la sélection.

Les règles D-217 à D-219 conservent les identités lors d'un renommage déclaré et les séparent après suppression puis réapparition. La fusion Checkbox est représentée par une présence si au moins une ligne source est présente. L'ancien Table reste RMCTable ; le nouveau Table possède une autre identité à partir de 1.7.0. Le nom historique et la milestone cible attribuent les audits à leur identité. Sans version permettant de départager les identités, aucun choix courant n'est fabriqué. Pour une issue enfant sans milestone, celle de son parent dans le dépôt est utilisée.

La présence démontrée permet les calculs et l'héritage de conformité existants (D-220 à D-228). Une modification technique `~` ne constitue pas à elle seule un audit ni une invalidation du verdict acquis. Les observations de développement ne créent ni tag PROD ni date de publication. Les versions au-delà de `package.json` restent exclues selon les règles existantes. Le dashboard propose « Qualité par version » dans la page Composants, avec verdict calculé, audits justificatifs et cellules de présence ; le résultat propre à l'audit reste distinct de cette conformité héritée.

Les chemins privés du classeur et de la sélection ne sont pas embarqués. Les identités sont pseudonymisées ; `--anonymize-components` applique aussi les correspondances aux noms historiques lors de la préparation d'un RAW. Pour enrichir une fixture déjà pseudonymisée, fournir un historique utilisant **ses** noms et ses alias. La revue avant partage reste nécessaire. Les avertissements de catalogue GitHub absent restent factuels : un historique local ne prétend pas qu'un fichier existe dans le dépôt, ni qu'il décrit les composants hors de sa sélection.

Les observations locales validées priment sur les catalogues GitHub pour les noms sélectionnés et leurs noms historiques ; les autres composants conservent leurs preuves GitHub. Le diagnostic de catalogue absent indique le nombre de présences démontrées localement lorsqu'elles existent. Si une nouvelle collecte possède un tag PROD pour une colonne encore décrite en développement, l'import demande d'actualiser le référentiel : le contenu d'une branche de mise au point ne prouve pas celui de sa publication finale.

### Cas concret : le dataset de l'issue #49

Les chemins suivants sont relatifs à la racine du projet. Ils correspondent au jeu local enrichi pendant l'intégration :

| Élément                       | Chemin                                                                                    | Utilisation                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Fixture source et manifeste   | `datasets/issue-49/dataset.json`, `datasets/issue-49/manifest.json`                       | Entrée conservée, déjà anonymisée ; configuration, catalogue et RAW embarqués         |
| Historique à intégrer         | `config/local/demo-react-historique-composants.yaml`                                      | Référentiel des 83 éléments sélectionnés, avec les identités et présences par version |
| Fixture enrichie et manifeste | `datasets/issue-49-historique/dataset.json`, `datasets/issue-49-historique/manifest.json` | Jeu autonome **déjà créé**, incluant `historicalComponents`                           |
| Dashboard enrichi             | `data/output/issue-49-historique/dashboard/index.html`                                    | Résultat **déjà généré** depuis la fixture enrichie                                   |
| Attendus métier               | `datasets/issue-49/attendus-issue-49.md`                                                  | Notes de vérification humaine ; non lues par le pipeline                              |

**Pour utiliser le résultat maintenant**, il n'est pas nécessaire de refaire la préparation :

```powershell
npm.cmd run fixture:validate -- --dataset datasets/issue-49-historique
npm.cmd run pipeline -- --dataset datasets/issue-49-historique --output data/output/issue-49-historique
npm.cmd run dashboard:serve -- data/output/issue-49-historique/dashboard
```

Ouvrir **http://127.0.0.1:4174/**. Le serveur se ferme avec `Ctrl+C`. Dans la page **Composants**, rechercher **Tag** puis ouvrir **Qualité par version** : le jeu vérifié donne **Conforme** en **1.7.1** et en **1.8.0**, cette dernière indiquée **Développement**. Les liens affichent les audits justificatifs ; les références `AS484` et `AT484` identifient les cellules de présence du classeur. Le résultat propre à l'audit reste présenté dans sa colonne distincte.

**Si le fichier historique change**, refaire la préparation vers une nouvelle destination : le pipeline lit l'historique embarqué dans le dataset, pas le YAML de `config/local/` à chaque exécution.

```powershell
npm.cmd run fixture:prepare -- --input datasets/issue-49/dataset.json --output datasets/issue-49-historique-v2 --historical-catalogue config/local/demo-react-historique-composants.yaml
npm.cmd run fixture:validate -- --dataset datasets/issue-49-historique-v2
npm.cmd run pipeline -- --dataset datasets/issue-49-historique-v2 --output data/output/issue-49-historique-v2
npm.cmd run dashboard:serve -- data/output/issue-49-historique-v2/dashboard
```

Choisir un autre suffixe si `issue-49-historique-v2` existe déjà. Pour conserver d'autres historiques ajoutés depuis, utiliser plutôt `datasets/issue-49-historique/dataset.json` comme entrée : seul l'historique du dépôt fourni sera remplacé. Aucun `--seed`, `--catalogue` ou `--anonymize-components` n'est nécessaire pour enrichir cette fixture. Le catalogue courant et la configuration embarqués sont conservés. Les CSV de sélection, le fichier d'identités `.draft.yaml` et le classeur Excel ont servi à constituer le référentiel ; ils ne sont pas nécessaires à son import ni au rejeu.

Ne pas copier manuellement `historicalComponents` dans la fixture source : cela invaliderait son manifeste. Rejouer `datasets/issue-49` ou consulter `data/output/issue-49` utilise toujours l'ancien jeu, sans cet enrichissement. Les notes d'attendus restent dans leur dossier source ; elles ne sont pas automatiquement copiées.

L'historique ne modifie ni les milestones ni les relations GitHub. Ainsi, l'Epic dont la milestone est `1.9.0` reste une issue d'activité ; il ne devient pas un audit. Pour ce dépôt dont le package est `1.8.0`, les analyses de qualité et d'accessibilité des versions futures restent exclues selon le contrat existant. Les 247 erreurs et 2 781 avertissements Data Quality observés sur cette capture sont identiques avant et après enrichissement : il faut les examiner séparément, sans les confondre avec la conformité démontrée de Tag.

## Anonymisation

La collecte crée une graine aléatoire privée dans son RAW local, sauf si `ANONYMIZATION_SEED` est fourni. La préparation réutilise cette graine ; la variable d’environnement ou `--seed` permettent de la remplacer. Un ancien RAW sans graine locale exige l’une de ces deux entrées. Pour comparer plusieurs collectes avec les mêmes alias, définir une graine commune avant leur capture.

La préparation remplace les textes libres et décale les dates de 365 jours vers le passé. Les noms de composants et labels métier sont conservés par défaut ; `--anonymize-components` pseudonymise aussi les composants, leurs labels préfixés et leurs preuves historiques. Aucun token, graine ni table de correspondance n’est écrit dans le dataset ou manifeste. La graine reste dans la capture privée, ignorée par Git ; elle n’est pas affichée en console. Les règles par repository suivent les mêmes alias que les repositories.

Les relations et chaînes suspectes sont contrôlées avant publication. Les labels, statuts, types, milestones, branches et tags métier peuvent conserver des informations sensibles : une revue humaine reste nécessaire avant partage. Le RAW conserve les faits réels et reste local.

## Tests, démonstration et sorties

- `tests/fixtures` contient les références versionnées, avec leurs configurations internes aux scénarios. V1 y reste un scénario stable ; la préparation d’un jeu ne la charge pas.
- `examples/demo/dataset.json` est un jeu de démonstration autonome. Modifier ce fichier ne remplace pas les sources des tests.
- `data/local`, `datasets` et `data/output` contiennent vos données et sorties, ignorées par Git. Les sorties du pipeline doivent être distinctes du dossier du dataset.

Les faits RAW du dataset ne sont pas modifiés pour incorporer le catalogue. L’historique n’est lu que dans la destination choisie, puis limité au scope, modèle et règles compatibles. Les datasets de owners/périmètres différents ne sont pas fusionnés automatiquement.

## Migration

| Ancien usage                                                              | Nouveau                                                                          |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `collect --source github` et profils système/catalogue manuels            | `collect --repositories repositories.json --output data/local/jeu/raw.json`      |
| `fixture:anonymize`, `reference:prepare`, triplets générés                | `fixture:prepare --input <raw> --output <nouveau-dossier>`                       |
| `validate` et `fixture:validate --input`                                  | `fixture:validate --dataset <dossier>`                                           |
| `analyze`, `snapshot`, `dashboard`, `pipeline --source fixture --fixture` | `pipeline --dataset <dossier> --output <destination>`                            |
| `catalogue:generate`, `system:generate`                                   | Préparation autonome avec profil DSQ livré ; enrichissement catalogue facultatif |
| Démonstration par `fixtures/github.json`                                  | `pipeline`, qui utilise `examples/demo/dataset.json`                             |

Pour un ancien RAW, conserver le fichier et le fournir à `fixture:prepare`. Les anciens dossiers/configurations personnels ne sont pas déplacés ni supprimés automatiquement. Les commandes ci-dessus sont le parcours courant ; les pages historiques conservent les anciens usages uniquement pour traçabilité.
