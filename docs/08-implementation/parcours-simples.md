# Choisir un parcours et obtenir un dashboard

Ce guide est le point de départ quand on veut simplement savoir quoi lancer. Pensez au projet comme à une petite cuisine :

Pour faire le parcours complet de trois librairies — configuration, catalogues, historique, dashboard privé puis anonymisé — suivez le [workflow des trois librairies](workflow-3-librairies.md).

- **collect** rapporte les ingrédients depuis GitHub ;
- **fixture:prepare** en fait une copie partageable en remplaçant les identités ;
- **pipeline** calcule les résultats et fabrique le dashboard ;
- **dashboard:serve** ouvre les pages déjà fabriquées.

Le mot **repository** désigne ici un dépôt GitHub, souvent celui d’une librairie. Plusieurs repositories peuvent être réunis dans une collecte s’ils ont le même owner. Les exemples sont écrits pour PowerShell ; remplacez `mon-organisation` par votre organisation et choisissez un nom de jeu neuf.

## Je veux juste voir à quoi ça ressemble

Ce chemin n’utilise pas GitHub et ne demande pas de token :

```powershell
npm.cmd ci
npm.cmd run pipeline
npm.cmd run dashboard:serve
```

Ouvrez `http://127.0.0.1:4174/`. Arrêtez le serveur avec Ctrl+C. Le jeu de démonstration est `examples/demo/dataset.json`.

## Je veux un dashboard récent de mes librairies

### 1. Préparer les dépôts

Dans `repositories.json`, écrivez les noms complets des dépôts GitHub. Tous doivent appartenir au même owner :

```json
["mon-organisation/librairie-react", "mon-organisation/librairie-web"]
```

Configurez `GITHUB_TOKEN` dans votre environnement ou dans `.env` à partir de `.env.example`. Ne partagez jamais ce fichier.

### 2. Rapporter les données

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/mon-jeu/raw.json
```

Si vous utilisez les bornes de suivi d’audit par dépôt, ajoutez `--audit-tracking config/local/audit-tracking.json` à cette commande. Ce fichier JSON associe chaque `owner/repository` à sa version minimale incluse.

Cette commande lit GitHub. Pour les tags de version au format `1.2.3`, elle essaie aussi de lire `config/catalogue.yaml` dans le dépôt à ce tag. C’est une preuve historique du catalogue publié quand ce fichier existe. La collecte ne lit pas vos fichiers `config/local/`.

### 3. Fabriquer le dashboard

```powershell
npm.cmd run pipeline -- --dataset data/local/mon-jeu/raw.json --output data/output/mon-jeu
npm.cmd run dashboard:serve -- data/output/mon-jeu/dashboard
```

Pour imposer les bornes d’audit à ce rejeu, ajoutez `--audit-tracking config/local/audit-tracking.json` à la commande `pipeline`. Pour un jeu anonymisé, les clés de ce fichier doivent être les alias du jeu ; les bornes embarquées lors de `collect` sont transposées automatiquement par `fixture:prepare`.

Ouvrez `http://127.0.0.1:4174/`. Le RAW et le dashboard contiennent des noms réels : gardez-les privés. Cette commande `pipeline` relit le fichier local, sans appeler GitHub. Pour actualiser, refaites `collect` vers un nouveau chemin RAW, puis utilisez ce nouveau RAW.

## Je veux préparer un jeu anonymisé à partager

Faites d’abord la collecte ci-dessus, puis préparez une fixture dans un nouveau dossier :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-anonyme
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu-anonyme
npm.cmd run pipeline -- --dataset datasets/mon-jeu-anonyme --output data/output/mon-jeu-anonyme
npm.cmd run dashboard:serve -- data/output/mon-jeu-anonyme/dashboard
```

La préparation remplace les identités selon la graine privée enregistrée dans le RAW. Pour pseudonymiser aussi les noms de composants, ajoutez `--anonymize-components` à la commande `fixture:prepare`. Vérifiez manuellement le dataset et le dashboard avant de les partager : l’anonymisation automatique ne garantit pas que chaque texte métier est anonyme.

La fixture contient les faits collectés et les conventions de traitement. Elle ne crée pas les informations absentes. Une réserve Data Quality, un catalogue manquant ou un historique incomplet peut donc rendre certaines parties du dashboard inconnues ou partielles, même si la validation passe.

Pour copier un jeu anonymisé sur un autre PC afin de reproduire un bug, transférez ensemble `dataset.json` et `manifest.json` dans le dossier de fixture. Les étapes d’archive, de validation, de rejeu et la liste des fichiers privés à exclure sont dans le [workflow de transfert et diagnostic](workflow-3-librairies.md#6-copier-le-jeu-anonymis%C3%A9-sur-un-autre-pc-pour-un-diagnostic).

## Je veux ajouter le catalogue métier courant

Un catalogue courant décrit les métadonnées que vous connaissez maintenant : par exemple l’équipe ou le niveau RGAA d’un composant. Il ne raconte pas, à lui seul, quels composants existaient dans chaque ancienne version.

Sans `--catalogue`, la préparation crée à côté du RAW un brouillon privé nommé `raw.json.catalogue.draft.yaml`. Faites vérifier et compléter ce brouillon, puis retirez `draft: true`. Ensuite, préparez une nouvelle fixture en lui donnant ce fichier :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-catalogue --catalogue data/local/mon-jeu/raw.json.catalogue.draft.yaml
```

Validez et lancez le pipeline avec `datasets/mon-jeu-catalogue`, comme dans le parcours anonymisé. Les valeurs non vérifiées doivent rester inconnues ; ne remplissez pas les champs avec des suppositions.

## Je veux fabriquer les fichiers de catalogue

Le projet utilise deux fichiers différents. Choisissez celui qui répond à votre question :

- **Catalogue métier courant** : « Que savons-nous des composants aujourd’hui ? » Il se complète à la main depuis le brouillon généré à côté du RAW, comme expliqué juste au-dessus.
- **Historique des composants** : « Quels composants étaient présents dans chaque version ? » Il peut être créé depuis les classeurs Excel de comparaison des versions.

### Créer l’historique depuis des classeurs Excel

Demandez ou préparez un fichier `*_component_comparison.xlsx` par librairie. Placez-les ensemble dans un dossier, par exemple `data/local/comparaisons`. Les fichiers doivent contenir une feuille `Component Comparison` avec les colonnes attendues par l’export. Le nom avant `_component_comparison.xlsx` sert de nom de repository ; le résultat sera à associer au dépôt GitHub correspondant.

Lancez l’import vers un dossier de sortie qui n’existe pas encore :

```powershell
npm.cmd run components:import -- --input data/local/comparaisons --dependency-catalogs data/local/catalogues-graphe --output config/local/historiques-v1
```

Ouvrez `config/local/historiques-v1/rapport.json` et vérifiez les versions, les lignes signalées et les réserves. Le dossier contient un YAML `*-historique-composants.yaml` par librairie. Gardez les classeurs, le rapport et les YAML privés : ils peuvent contenir des noms réels et des chemins locaux.

Vérifiez que les composants d’interface concernés ont `kind: ui` dans les YAML. Ces fichiers de graphe sont distincts de `config/catalogue.yaml` dans GitHub, et DSQ ne les génère pas : procurez-vous une sortie de l’outil de graphe ou préparez les JSON à partir d’une classification vérifiée. Chaque fichier doit contenir `nodes` et associer exactement le nom `Public Names` du classeur à un `kind` égal à `ui` en minuscules. Sans ce rapprochement, l’historique reste utilisable, mais ces composants et leurs audits ne sont pas comptés dans la vue simplifiée « Audits et composants par version ». Voir le [workflow détaillé des trois librairies](workflow-3-librairies.md#3-cr%C3%A9er-lhistorique-des-composants-par-version).

Si le nom d’une librairie dans le classeur ne correspond pas au dépôt GitHub, créez `config/local/repositories.json` avec une correspondance, par exemple :

```json
{
  "librairie-react": "mon-organisation/librairie-react",
  "librairie-web": "mon-organisation/librairie-web"
}
```

Puis ajoutez `--repositories config/local/repositories.json` à la commande d’import. Pour une configuration encore plus simple, les noms de fichiers Excel peuvent directement reprendre les noms de librairies attendus.

Enfin, utilisez les YAML produits pour préparer le jeu anonymisé. Remplacez les noms de fichiers ci-dessous par ceux présents dans votre dossier :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-avec-historique --historical-catalogue config/local/historiques-v1/librairie-react-historique-composants.yaml config/local/historiques-v1/librairie-web-historique-composants.yaml
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu-avec-historique
npm.cmd run pipeline -- --dataset datasets/mon-jeu-avec-historique --output data/output/mon-jeu-avec-historique
npm.cmd run dashboard:serve -- data/output/mon-jeu-avec-historique/dashboard
```

Les noms du dépôt indiqués dans les YAML doivent correspondre aux dépôts de la collecte ou à leurs alias anonymisés. L’import Excel décrit les présences dans son tableau de comparaison ; il ne décide pas quels composants sont conformes, actifs ou approuvés métier. Pour le format Excel détaillé, les conventions de version et les cas à revoir, voir [Générer les historiques depuis Excel](import-comparaisons-excel.md).

## Je veux comparer les composants entre versions

Il existe deux sortes de renseignements historiques :

1. Pendant `collect`, le projet cherche le catalogue GitHub `config/catalogue.yaml` à chaque tag PROD exact (`1.2.3`). C’est automatique, mais seulement si ce fichier existe et est valide à ce tag.
2. Pour suivre précisément l’identité et la présence de chaque composant d’une version à l’autre, il faut fournir un référentiel historique local vérifié. Le catalogue courant ne remplace pas ce travail.

Si vous possédez ce référentiel YAML, ajoutez-le à la préparation anonymisée :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-historique --historical-catalogue config/local/mon-historique.yaml
```

Puis validez et lancez le pipeline sur `datasets/mon-jeu-historique`. Pour plusieurs repositories, fournissez un référentiel correctement associé à chaque dépôt. Le format de ces fichiers et la recette de création depuis Excel sont expliqués dans [Catalogues de composants](catalogues-et-commandes.md) et [Import des comparaisons Excel](import-comparaisons-excel.md).

Si vous n’avez pas ce référentiel, vous pouvez tout de même créer un dashboard. Les parties qui ont besoin de ces renseignements historiques resteront limitées ou signalées comme inconnues. C’est préférable à inventer une présence passée.

## Où aller si je suis bloqué ?

- Pour la liste complète des commandes et les erreurs courantes : [guide d’utilisation](guide-utilisation.md).
- Pour savoir quel fichier est lu à quelle étape : [catalogues et commandes](catalogues-et-commandes.md).
- Pour le format complet des jeux et de l’historique : [datasets](datasets.md).
- Les décisions métier sur le catalogue historique sont D-143, D-210 et D-211 ; le registre complet est dans [questions ouvertes](../00-cadrage/questions-ouvertes.md).
