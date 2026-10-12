# Première utilisation

## 1. Installer et vérifier le projet

Installer Node.js 22.15.0 minimum, référence 22.23.3. Depuis la racine du checkout complet :

```powershell
npm.cmd ci
npm.cmd test
```

Les tests n’ont besoin ni de token ni de collecte. Leurs scénarios et configurations sont versionnés dans `tests/fixtures` ; ne pas les supprimer pour renouveler un dataset personnel. Sous Linux/macOS, remplacer `npm.cmd` par `npm`.

## 2. Voir la démonstration

```powershell
npm.cmd run pipeline
npm.cmd run dashboard:serve
```

Ouvrir http://127.0.0.1:4174/ et arrêter le serveur avec Ctrl+C. La démonstration est `examples/demo/dataset.json`, entièrement autonome ; ses sorties se trouvent dans `data/output/demo`. Elle ne fait aucun appel GitHub.

## 3. Collecter vos repositories

Créer une liste JSON de noms complets :

```json
["mon-organisation/librairie-react", "mon-organisation/librairie-web"]
```

Le périmètre doit avoir un unique owner ; préparer un jeu par owner. Renseigner `GITHUB_TOKEN` dans le shell ou `.env`. Les conventions DSQ sont déjà livrées : aucun fichier métier supplémentaire n’est nécessaire à la première collecte.

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/mon-jeu/raw.json
```

La capture conserve les faits et le profil réellement appliqué. Pour attendre automatiquement le reset : ajouter `--wait-for-quota`. Voir [les quotas](quotas-github.md). Les URLs d’une instance GitHub Enterprise peuvent être fournies via `GITHUB_API_URL`, `GITHUB_GRAPHQL_URL` et `GITHUB_URL`.

## 4. Préparer le dataset hors réseau

La capture contient déjà une graine privée locale ; la préparation la réutilise sans autre saisie. Le token n’est plus nécessaire. Pour garder les mêmes alias entre plusieurs collectes, définir `ANONYMIZATION_SEED` avant la collecte. Un ancien RAW sans graine locale demande cette variable ou l’option `--seed`.

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu
```

Le dossier contient `dataset.json` et `manifest.json`. Les données, conventions, périmètre et enrichissements éventuels voyagent ensemble ; aucun profil n’est recherché ailleurs selon le nom du fichier. Le RAW reste intact, et un dossier existant n’est pas remplacé. Choisir un nouveau nom pour une nouvelle préparation.

Si un catalogue métier approuvé existe, fournir `--catalogue config/local/mon-catalogue.yaml`. Son absence ne bloque pas le démarrage : les métadonnées non démontrées et le cycle de vie des composants restent inconnus. Les informations requérant un patrimoine actif complet ne sont pas remplacées par des zéros.

## 5. Contrôler et consulter votre jeu

```powershell
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu
npm.cmd run pipeline -- --dataset datasets/mon-jeu --output data/output/mon-jeu
npm.cmd run dashboard:serve -- data/output/mon-jeu/dashboard
```

La validation contrôle manifeste, schéma, périmètre, anonymisation et relations ; elle exécute le pipeline dans un espace temporaire. Les réserves Data Quality sont annoncées, sans exiger que votre collecte contienne tous les scénarios métier de la suite de tests.

Le pipeline enregistre le snapshot courant, l’historique et les pages dans la sortie choisie. Les inconnues et réserves restent visibles. Un dataset peut être structurellement valide et fournir un dashboard partiel. La validation automatique ne certifie ni les métadonnées métier ni l’absence de toute information sensible ; revoir les artefacts avant partage.

## 6. Tester après une modification

```powershell
npm.cmd run check
npm.cmd run check:dashboard
```

`check` vérifie types, lint, TSDoc, tests et build. `check:dashboard` ajoute les tests navigateur, le format et TypeDoc. Ces vérifications utilisent les références de tests et leurs sorties dédiées, pas votre dashboard personnel.

Voir [le contrat et la migration](datasets.md), [l’isolation des tests](configurations-et-tests.md) et [le développement](guide-developpement.md).
