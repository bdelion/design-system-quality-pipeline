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

`dataset.json` embarque `schemaVersion: 1`, `kind` (`fixture`, démonstration synthétique `demo`, ou rejeu privé `local`), `profileId`, `config`, `catalogue` et `rawData`. Le périmètre de `config` doit correspondre exactement aux faits. Les conventions sont vérifiées avant interprétation, puis conservées avec les données ; l’environnement ne remplace pas les règles durant le rejeu.

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
