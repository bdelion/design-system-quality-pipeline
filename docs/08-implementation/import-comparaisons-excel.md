# Générer les historiques depuis les comparaisons Excel

**IMPLÉMENTÉ.** `components:import` lit localement les fichiers
`*_component_comparison.xlsx` et produit un référentiel historique YAML par
librairie. Aucune collecte GitHub ni modification de dataset n’est effectuée.
La lecture XLSX utilise [ExcelJS](https://github.com/exceljs/exceljs).

## Génération

```powershell
npm.cmd run components:import -- --input .tmp --output config/local/historiques-excel-v1
```

Le dossier de sortie doit être nouveau, même s’il existe déjà vide. Les classeurs
restent intacts. Le script lit la feuille `Component Comparison` par son nom et
repère les colonnes par leurs en-têtes, sans supposer leur position.

Tous les exports sont inclus : composants UI, icônes, utilitaires, types et autres
symboles. Ce périmètre technique ne constitue pas une qualification de composant
métier. Aucun propriétaire, statut actif, niveau RGAA ou résultat d’audit n’est
inventé. Le YAML historique suffit à décrire ces identités et présences ; aucun
catalogue courant `--catalogue` ni fichier d’identités séparé n’est nécessaire.

Le nom précédant `_component_comparison.xlsx` devient le champ `repository`.
Pour utiliser les noms réels des dépôts du RAW, fournir un fichier JSON local :

```json
{
  "demo-react": "mon-organisation/demo-react",
  "demo-react-enterprise": "mon-organisation/demo-react-enterprise",
  "enterprise-assets": "mon-organisation/enterprise-assets"
}
```

```powershell
npm.cmd run components:import -- --input .tmp --output config/local/historiques-excel-v2 --repositories config/local/repositories-excel.json
```

Une librairie absente du mapping conserve son nom de fichier comme repository.
Deux classeurs affectés au même repository sont refusés.

## Fichiers produits et preuves

Chaque `<librairie>-historique-composants.yaml` respecte le
[contrat historique des datasets](datasets.md#historique-des-composants-par-version).
Il contient également le nom du classeur, son empreinte SHA-256, la feuille,
les lignes et chemins source des exports, ainsi que les réserves d’import.
`rapport.json` récapitule les populations, versions et réserves par librairie.
Ces fichiers peuvent contenir des chemins et noms réels : les garder privés.

Les versions sont triées numériquement. Une colonne `M.m.r` éventuellement suivie
de `💥` reçoit le canal `release`. Une annotation `(develop)`, `(release candidate)`
ou `(hotfix candidate)` reçoit `development`, y compris avec `💥`. Ce classement
provient de l’en-tête, sans preuve supplémentaire de publication GitHub. Un
en-tête de version avec une autre annotation est refusé.

La première ligne de chaque cellule détermine la présence : `+`, `~` et `=`
signifient présent ; `-` et la cellule vide signifient absent dans le périmètre
de comparaison. La valeur complète et l’adresse Excel sont conservées.
Les symboles inconnus, formules et erreurs Excel sont refusés, sans conversion
en absence. Les textes enrichis et les libellés d’hyperliens sont acceptés.

Le changement est calculé sur la succession des présences : première présence
`added`, disparition `removed`, absence prolongée `absent`. Une présence continue
marquée `~` ou `+` est `modified`, sinon `unchanged`, sauf renommage explicite.
Les annotations `name:` et `nameChanged: ancien -> nouveau` restituent le nom
historique. Un renommage continu conserve l’identité ; une réapparition après
absence reçoit une nouvelle identité, conformément aux règles D-217 à D-219.
Une modification technique ne prouve ni audit ni invalidation de conformité.

Les marqueurs `⚠️` en fin de nom sont retirés. Les homonymes sont conservés
séparément avec un suffixe `[ligne N]`, également dans leur nom historique : ils
ne sont pas fusionnés et leur correspondance avec les issues métier reste à
revoir. Les identités sont déterministes pour le même classeur, le repository,
le chemin source, la ligne et l’épisode de présence ; réordonner les lignes ou
changer les chemins source peut donc modifier les identités.

La présence de lignes dans `Historique à vérifier` est signalée dans le rapport.
Les continuités du comparateur restent à revoir ; aucune ancienne règle locale
spécifique, telle qu’une fusion Checkbox ou une attribution Table/RMCTable,
n’est reprise implicitement. Le validateur existant bloque les collisions de
noms historiques et les incohérences d’identité non représentables.

## Alimenter le dashboard

Relire les réserves avant utilisation. Pour un rejeu privé, passer les trois
fichiers générés explicitement, en les affectant aux repositories du RAW :

```powershell
npm.cmd run pipeline -- --dataset data/local/mon-jeu/raw.json --output data/output/mon-jeu-excel --historical-catalogue config/local/historiques-excel-v2/demo-react-historique-composants.yaml config/local/historiques-excel-v2/demo-react-enterprise-historique-composants.yaml config/local/historiques-excel-v2/enterprise-assets-historique-composants.yaml
npm.cmd run dashboard:serve -- data/output/mon-jeu-excel/dashboard
```

Pour embarquer ces historiques dans un jeu anonymisé autonome :

```powershell
npm.cmd run fixture:prepare -- --input data/local/mon-jeu/raw.json --output datasets/mon-jeu-excel --historical-catalogue config/local/historiques-excel-v2/demo-react-historique-composants.yaml config/local/historiques-excel-v2/demo-react-enterprise-historique-composants.yaml config/local/historiques-excel-v2/enterprise-assets-historique-composants.yaml
npm.cmd run fixture:validate -- --dataset datasets/mon-jeu-excel
npm.cmd run pipeline -- --dataset datasets/mon-jeu-excel --output data/output/mon-jeu-excel-anonymise
```

Ajouter `--anonymize-components` à la préparation si les noms des composants
doivent aussi être pseudonymisés. Pour enrichir une fixture existante, les noms
et repositories des historiques doivent déjà correspondre aux alias de cette
fixture. Les champs de provenance supplémentaires du YAML restent locaux ; le
dataset conserve les preuves prévues par son contrat.

Un nouveau tag PROD peut rendre caduque une colonne encore décrite comme
candidate ou développement : actualiser alors le classeur et régénérer dans un
nouveau dossier, sans requalifier silencieusement sa publication. Voir aussi
[les sources lues par chaque commande](catalogues-et-commandes.md).
