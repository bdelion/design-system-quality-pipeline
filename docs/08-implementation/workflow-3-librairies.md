# Workflow complet pour trois librairies

Ce parcours prépare deux dashboards à partir des mêmes trois repositories : un dashboard privé avec les noms réels, puis un jeu et un dashboard anonymisés. Suivez les étapes dans l’ordre et remplacez les exemples par vos chemins et dépôts.

> **À savoir avant de commencer :** la récupération des catalogues GitHub aux tags se fait pendant `collect`. Il n’existe pas de commande séparée pour les télécharger avant la collecte. Le RAW créé à l’étape 4 conserve ces preuves ; le pipeline privé et la préparation anonymisée réutilisent tous deux ce même RAW.

## 1. Préparer la configuration

Créez `config/local/repositories.json` avec vos trois dépôts. Les trois doivent avoir le même owner :

```json
["mon-organisation/librairie-react", "mon-organisation/librairie-web", "mon-organisation/librairie-mobile"]
```

Créez `config/local/audit-tracking.json` pour dire à partir de quelle version inclure le suivi d’audit de chaque dépôt :

```json
{
  "mon-organisation/librairie-react": "1.7.0",
  "mon-organisation/librairie-web": "2.3.0",
  "mon-organisation/librairie-mobile": "1.4.2"
}
```

Les clés doivent reprendre exactement les valeurs de `repositories.json`. La version minimale est incluse dans le suivi. Un dépôt omis est exclu du suivi d’audit ; cela ne supprime pas ses autres données du dashboard. Le fichier `config/audit-tracking.example.json` montre le même format.

Configurez aussi `GITHUB_TOKEN` dans `.env` ou dans l’environnement du terminal, avec les droits de lecture nécessaires. Gardez `.env` et les fichiers de `config/local/` privés.

## 2. Vérifier les catalogues de composants publiés

Pour chaque version PROD au tag exact `M.m.r` (par exemple `1.7.0`), le collecteur cherchera `config/catalogue.yaml` dans le repository à ce tag. Il conservera dans le RAW le résultat de cette recherche et les noms des composants déclarés.

Avant la collecte, vérifiez dans chacun des trois repositories que ce fichier est bien présent et que les tags PROD suivent le format exact `M.m.r`. Il n’y a pas de commande DSQ séparée pour télécharger ces catalogues : cette lecture sera faite à l’étape 4. Après la collecte, les états `available`, `missing` ou `invalid` permettront de voir ce qui a été trouvé.

Cette preuve contient les noms observés dans le catalogue publié ; elle ne télécharge pas le YAML complet ni ses métadonnées métier. Si vous avez aussi besoin du catalogue métier courant (équipe, statut, niveau RGAA, etc.), il s’agit d’un fichier différent : partez du brouillon créé à côté du RAW à l’étape 4, faites vérifier ses valeurs, puis fournissez-le avec `--catalogue` à `fixture:prepare` à l’étape 5. N’inventez pas les champs inconnus.

Ces catalogues GitHub ne contiennent pas non plus le classement technique `kind: ui` demandé par les tableaux d’audit simplifiés. Celui-ci vient du catalogue JSON du graphe de dépendances décrit à l’étape 3.

## 3. Créer l’historique des composants par version

Rassemblez un export Excel `*_component_comparison.xlsx` par librairie dans `data/local/comparaisons`. Chaque fichier doit comporter la feuille `Component Comparison` et les colonnes attendues par l’importeur.

Pour que les tableaux d’audit simplifiés comptent les composants UI, obtenez ou produisez aussi les catalogues JSON du graphe de dépendances, un par librairie. DSQ ne génère pas ces fichiers : `components:import` les lit et les rapproche des classeurs. Chaque fichier doit s’appeler `<préfixe-de-librairie>-component-dependency-graph.dependencies.catalog.json` et contenir `nodes`, avec pour chaque nœud son `name` et son `kind`. Pour un composant d’interface, le nom public doit correspondre exactement, casse comprise, à la colonne `Public Names` du classeur, et son type doit être `"ui"` en minuscules. Rangez ces fichiers dans `data/local/catalogues-graphe`.

Exemple minimal de structure attendue dans chaque fichier JSON :

```json
{
  "nodes": [{ "name": "Button", "kind": "ui" }]
}
```

Les noms de fichier doivent correspondre aux repositories indiqués dans `repositories.json`. Si vos noms Excel sont différents, créez `config/local/repositories-excel.json`, par exemple :

```json
{
  "react": "mon-organisation/librairie-react",
  "web": "mon-organisation/librairie-web",
  "mobile": "mon-organisation/librairie-mobile"
}
```

Générez les trois YAML historiques dans un dossier de sortie neuf. Cette commande associe les noms Excel aux dépôts GitHub et ajoute le classement `kind` :

```powershell
npm.cmd run components:import -- --input data/local/comparaisons --dependency-catalogs data/local/catalogues-graphe --output config/local/historiques-3-librairies --repositories config/local/repositories-excel.json
```

Si vous ne possédez pas de sortie de graphe, vous pouvez préparer ces petits JSON à partir d’une classification technique vérifiée. N’attribuez `kind: ui` qu’aux noms dont vous savez qu’ils sont des composants d’interface. Sinon, retirez l’option `--dependency-catalogs data/local/catalogues-graphe` : l’historique des présences sera tout de même créé, mais les composants ne seront pas classés pour les tableaux d’audit simplifiés.

Les clés de `repositories-excel.json` doivent être exactement les préfixes des noms de classeurs, sans `_component_comparison.xlsx`. L’import crée un fichier `*-historique-composants.yaml` par librairie et un `rapport.json`.

Ouvrez le rapport. Vérifiez que les trois librairies et toutes les versions voulues sont présentes. Examinez les lignes « à vérifier », les noms non rapprochés et les réserves. Vérifiez aussi dans chaque YAML généré que les composants UI ont `kind: ui`. Le rapport signale les noms UI du graphe sans ligne Excel correspondante ; un catalogue de graphe absent ou une correspondance de nom incorrecte laisse `kind` inconnu, sans bloquer l’import. Sans `kind: ui`, ces composants et leurs audits ne seront pas comptés dans les tableaux simplifiés « Audits et composants par version ». Corrigez les classeurs, graphes ou correspondances, puis relancez dans un autre dossier de sortie. Gardez les exports, rapports et YAML locaux : ils peuvent contenir des noms réels.

## 4. Collecter GitHub et générer le dashboard privé

Lancez la collecte. Elle lit les trois repositories, récupère les preuves de catalogue de l’étape 2 et conserve les bornes d’audit configurées à l’étape 1 :

```powershell
npm.cmd run collect -- --repositories config/local/repositories.json --output data/local/3-librairies/raw.json --audit-tracking config/local/audit-tracking.json
```

Rejouez ensuite ce RAW avec les trois historiques créés à l’étape 3 :

```powershell
npm.cmd run pipeline -- --dataset data/local/3-librairies/raw.json --output data/output/3-librairies-prive --historical-catalogue config/local/historiques-3-librairies/librairie-react-historique-composants.yaml config/local/historiques-3-librairies/librairie-web-historique-composants.yaml config/local/historiques-3-librairies/librairie-mobile-historique-composants.yaml --audit-tracking config/local/audit-tracking.json
npm.cmd run dashboard:serve -- data/output/3-librairies-prive/dashboard
```

Remplacez les trois noms de YAML par ceux réellement produits. Le pipeline n’appelle pas GitHub : il lit le RAW local. `--audit-tracking` impose explicitement à ce rejeu les mêmes bornes que celles de la collecte.

Ouvrez `http://127.0.0.1:4174/`. Ce RAW et ce dashboard contiennent des identités réelles : ne les partagez pas.

## 5. Préparer et générer le dashboard anonymisé

Il n’y a pas de deuxième collecte GitHub à faire : repartez du **même RAW de l’étape 4** pour obtenir le dashboard anonymisé à partir des mêmes données. Fournissez les trois historiques : `fixture:prepare` les embarquera et les anonymisera avec les autres identités. La préparation transpose aussi les clés d’`audit-tracking` vers les alias anonymisés du jeu.

```powershell
npm.cmd run fixture:prepare -- --input data/local/3-librairies/raw.json --output datasets/3-librairies-anonymise --historical-catalogue config/local/historiques-3-librairies/librairie-react-historique-composants.yaml config/local/historiques-3-librairies/librairie-web-historique-composants.yaml config/local/historiques-3-librairies/librairie-mobile-historique-composants.yaml --anonymize-components
npm.cmd run fixture:validate -- --dataset datasets/3-librairies-anonymise
npm.cmd run pipeline -- --dataset datasets/3-librairies-anonymise --output data/output/3-librairies-anonymise
npm.cmd run dashboard:serve -- data/output/3-librairies-anonymise/dashboard
```

Si vous avez préparé un catalogue métier courant vérifié depuis le brouillon créé après la collecte, ajoutez aussi `--catalogue <chemin-vers-ce-catalogue.yaml>` à `fixture:prepare`. Sans ce fichier, les métadonnées métier absentes restent inconnues. N’ajoutez pas le fichier `audit-tracking.json` avec les noms réels au pipeline anonymisé : les bornes déjà embarquées utilisent les alias du jeu.

Le champ `kind` déjà inclus dans les historiques est conservé pendant l’anonymisation. Il n’est pas nécessaire de le recopier dans le catalogue métier courant ni d’ajouter une option spéciale à `fixture:prepare` ou `pipeline`. Les tableaux simplifiés filtrent explicitement sur `kind: ui` (comportement implémenté ; voir [suivi des audits](suivi-audits-132-134.md#composants-%C3%A0-auditer--d-249)). D-249 établit les motifs des composants à auditer ; la classification `kind` provient, elle, du graphe de dépendances rapproché à l’import.

La validation vérifie la structure et exécute le pipeline hors réseau ; elle ne certifie pas que chaque texte est anonyme. Avant tout partage, vérifiez le dataset et les pages HTML. Les réserves Data Quality peuvent rester visibles si les sources ou les historiques ne couvrent pas toutes les données.

## 6. Copier le jeu anonymisé sur un autre PC pour un diagnostic

Transférez le **dossier de fixture complet** `datasets/3-librairies-anonymise/`. Il doit contenir les deux fichiers suivants :

```text
3-librairies-anonymise/
  dataset.json
  manifest.json
```

`dataset.json` contient les faits pseudonymisés, la configuration réellement appliquée, le catalogue éventuellement fourni, les bornes `audit-tracking` sous les alias anonymisés et les historiques embarqués. `manifest.json` permet de vérifier que le jeu n’a pas été altéré. Copiez le dossier entier ; ne copiez pas `dataset.json` seul et ne modifiez aucun des deux fichiers.

Sur Windows, créez une archive ZIP du dossier :

```powershell
New-Item -ItemType Directory -Force data/transfer | Out-Null
Compress-Archive -Path datasets/3-librairies-anonymise -DestinationPath data/transfer/3-librairies-anonymise.zip
```

Copiez le ZIP sur l’autre PC puis extrayez-le dans le checkout du projet :

```powershell
Expand-Archive -Path data/transfer/3-librairies-anonymise.zip -DestinationPath datasets/transfert-recu
npm.cmd ci
npm.cmd run fixture:validate -- --dataset datasets/transfert-recu/3-librairies-anonymise
npm.cmd run pipeline -- --dataset datasets/transfert-recu/3-librairies-anonymise --output data/output/diagnostic-3-librairies
```

Le dossier de validation est ainsi conservé tel quel ; `pipeline` écrit les résultats dans un dossier séparé. Pour examiner le dashboard, lancez :

```powershell
npm.cmd run dashboard:serve -- data/output/diagnostic-3-librairies/dashboard
```

Joignez au jeu une courte note `attendus.md` qui indique le commit utilisé (`git rev-parse HEAD`), les commandes exécutées, la page et les filtres concernés, ce que vous attendiez, ce que vous avez observé et le message d’erreur exact s’il y en a un. Utilisez le même commit du projet sur les deux PC pour comparer les résultats.

Si le problème porte sur l’affichage, vous pouvez aussi transmettre le dossier `data/output/3-librairies-anonymise/dashboard/` entier ou, de préférence, le régénérer sur le PC de diagnostic. Pour un problème de calcul, `snapshot.json` dans `data/output/3-librairies-anonymise/current/` aide à comparer les résultats ; il est facultatif puisque le pipeline peut le reconstruire depuis la fixture.

Ne joignez pas le RAW, `.env`, token, graine privée, fichiers source Excel, brouillon de catalogue avec noms réels ni le dossier privé `config/local/`. La fixture anonymisée suffit pour rejouer hors réseau ; elle ne permet pas de refaire une collecte GitHub. L’anonymisation ne garantit pas que chaque texte libre est anonyme : relisez la fixture et les notes avant transfert. Pour un cas sensible, préparez et vérifiez une copie dédiée au diagnostic.

## 7. Si vous actualisez les données plus tard

Une nouvelle collecte doit écrire dans un nouveau RAW. Les dossiers de sortie existants ne sont pas écrasés : choisissez aussi de nouveaux noms pour les jeux et dashboards, ou archivez vos anciens résultats avant de relancer.

Pour les formats, preuves et détails des imports, voir [catalogues et commandes](catalogues-et-commandes.md), [import Excel](import-comparaisons-excel.md), [suivi des audits](suivi-audits-132-134.md) et [datasets](datasets.md).
