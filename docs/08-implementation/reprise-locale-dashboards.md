# Reprendre les extractions et les dashboards avec les corrections locales

**IMPLÉMENTÉ ET VÉRIFIÉ — 28 octobre 2026.** Les deux présentations sont générées
depuis le même snapshot recalculé. La primauté des audits applicables est dans le
pipeline, pas dans un filtre d’affichage. Les défauts hors audit restent visibles
sans écraser les verdicts de conformité ; les pages d’activité ou de qualité ne
doivent pas être interprétées comme des décomptes de conformité.

## Les cinq fichiers locaux à sauvegarder

Pour le nouveau suivi, conserver aussi les fichiers locaux de bornes d’audit
réelles et anonymisées et passer `--audit-tracking` à la collecte/au rejeu.
Voir le [paramétrage et les règles #132–#134](suivi-audits-132-134.md).
Le rejeu du dataset actuel utilise `config/local/audit-tracking-anonymise.json`
avec `commun/demo-react: 1.7.1`. Ce fichier ignoré doit être sauvegardé avec les
autres configurations privées ; ne pas le réutiliser tel quel pour un dépôt
réel dont l’owner diffère.

Ces fichiers ont été modifiés ou créés pendant les corrections. Ils sont tous
ignorés par `/config/local/` dans `.gitignore` : **un push ne les sauvegardera pas**.

| Fichier sous `config/local/`                 | Rôle                                                                                                                                         | Nécessité                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `demo-react-historique-composants.yaml`      | Présences historiques, DateBox déclaré depuis 0.0.2 et une identité Live Zone avec les preuves des deux symboles                             | Lu par le pipeline ; indispensable pour reproduire le catalogue corrigé                    |
| `demo-react-historique-identites.draft.yaml` | Point d’entrée qui référence le précédent ; renommage Table/RMCTable, fusion Checkbox et regroupement Live Zone contrôlés contre les preuves | À passer à `pipeline --historical-catalogue` ; garder son lien relatif avec le référentiel |
| `demo-react-historique-selection.draft.csv`  | Sélection corrigée : DateBox inclus ; A11yProvider et A11yRegion sélectionnés sous le nom métier Live Zone                                   | Préparation et maintenance ; n’est pas lu par le pipeline                                  |
| `datebox-presence-declaration.yaml`          | Confirmation utilisateur identifiée, limites de la déclaration sans Excel                                                                    | Preuve de provenance à conserver ; pas chargé automatiquement par la CLI                   |
| `live-zone-grouping-declaration.yaml`        | Confirmation du regroupement métier, sans doubler les audits                                                                                 | Preuve de provenance à conserver ; pas chargé automatiquement par la CLI                   |

Les déclarations sont déjà matérialisées dans le référentiel historique. Modifier
un fichier de confirmation ou le CSV seul ne régénère pas ce référentiel.
Sauvegarder l’ensemble du dossier `config/local/` dans un emplacement privé et
préserver les noms relatifs. Ne pas forcer son ajout à Git : ces fichiers peuvent
contenir des noms internes ou des références privées.

## Rejouer les données actuelles

Conserver ensemble `datasets/20261027-0743-anonymise/dataset.json` et
`manifest.json`. Ils sont ignorés par Git mais n’ont pas été modifiés par ces
corrections. Le manifeste est contrôlé lors du chargement ; ne pas modifier le
dataset à la main.

Depuis la racine du dépôt, remplacer `OWNER/REPOSITORY` par le nom du dépôt
React **tel qu’il figure dans ce dataset**, et choisir une sortie distincte :

```powershell
npm.cmd run pipeline -- --dataset datasets/20261027-0743-anonymise --output data/output/mon-rejeu-corrige --historical-catalogue config/local/demo-react-historique-identites.draft.yaml --historical-repository OWNER/REPOSITORY
npm.cmd run dashboard:serve -- data/output/mon-rejeu-corrige/dashboard
```

Les sorties vérifiées de cette session sont `data/output/audit-precedence-live-zone/`
et le dossier habituel régénéré `data/output/20261027-0743-anonymise/`.
Dans `1.7.1` et le repository concerné : **76 composants = 11 conformes + 15 non
conformes + 50 non couverts**, avec 26 audits terminés. Les ratios sont 11/26 et
11/76. Ces nombres sont une référence pour cette capture, pas des valeurs à
imposer aux prochaines collectes.

Les fichiers de `data/output/` sont générés et ignorés par Git : ils peuvent être
régénérés et ne sont pas des sources de configuration. Conserver les snapshots
précédents si leur comparaison ou leur historique doit rester disponible. Une
simple prévisualisation d’un ancien snapshot ne recalcule pas ses verdicts : il
faut refaire le pipeline pour appliquer la correction métier.
Les anciennes captures restent immuables : la page Historique peut donc présenter
leurs anciens résultats datés, à côté de ceux de la nouvelle capture corrigée.

## Prochaine collecte privée

Le fichier `repositories.json` contient la liste explicite des dépôts à collecter.
Le token est configuré localement suivant le [guide d’utilisation](guide-utilisation.md).
Le `.env`, la liste de dépôts et la graine d’anonymisation éventuelle sont des
paramètres locaux distincts : ils n’ont pas été modifiés pendant ces corrections.
Conserver leurs propres sauvegardes privées, sans publier les secrets.

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/nouvelle-capture/raw.json
npm.cmd run pipeline -- --dataset data/local/nouvelle-capture/raw.json --output data/output/nouvelle-capture --historical-catalogue config/local/demo-react-historique-identites.draft.yaml --historical-repository OWNER/REPOSITORY
npm.cmd run dashboard:serve -- data/output/nouvelle-capture/dashboard
```

Pour ce second parcours, `OWNER/REPOSITORY` est le **vrai dépôt de la nouvelle
collecte**. Il peut différer du nom du dataset anonymisé. L’option affecte un seul
historique à un seul dépôt ; elle ne sert pas à appliquer ce catalogue à toutes
les librairies d’une collecte multi-repositories.

Le profil DSQ livré est utilisé lors de la collecte ; la configuration embarquée
du dataset/RAW est utilisée au rejeu. `config/local/profiles/dsq.json` n’est pas
chargé automatiquement. Une adaptation supplémentaire des labels doit être
fournie explicitement avec `pipeline --issue-policy <fichier>`.

## Préparer une nouvelle fixture anonymisée

`fixture:prepare --historical-catalogue` attend le **référentiel de présences**,
pas le fichier d’identités. Il n’offre pas l’affectation `--historical-repository`
du pipeline : son champ `repository` doit déjà correspondre au dépôt d’entrée.
Si nécessaire, créer une copie locale du référentiel avec ce seul champ adapté.

```powershell
npm.cmd run fixture:prepare -- --input data/local/nouvelle-capture/raw.json --output datasets/nouvelle-capture --historical-catalogue config/local/mon-historique-pour-la-collecte.yaml
npm.cmd run fixture:validate -- --dataset datasets/nouvelle-capture
npm.cmd run pipeline -- --dataset datasets/nouvelle-capture --output data/output/nouvelle-capture-anonymisee
```

Cette fixture embarque les présences et les identités du référentiel, dont DateBox
et Live Zone ; elle conserve son propre manifeste. Le contrôle supplémentaire des
règles du fichier d’identités reste disponible dans le parcours privé précédent.

## Lors d’un nouveau formatage ou d’une nouvelle version

- Ne pas remplacer le référentiel corrigé par son ancienne version excluant
  DateBox ou comptant A11yProvider et A11yRegion séparément.
- Préserver les cellules existantes et les références déclaratives, sans créer
  de fausses cellules Excel pour DateBox.
- Les présences actuelles sont renseignées jusqu’à `1.8.0`, marquée développement
  dans ce référentiel. Lors de sa publication, actualiser ce canal à partir du tag
  réel ; le pipeline refuse une version déclarée développement déjà publiée.
- Pour les nouvelles versions, actualiser les preuves de présence et d’identité.
  Le fichier ne découvre pas automatiquement les futurs composants et les
  déclarations ne doivent pas être étendues sans confirmation.
- Regénérer les deux dashboards par le pipeline, puis comparer les composants
  distincts, les verdicts et les réserves DQ sur le même repository et la même version.

Les modifications de code et de documentation en attente doivent elles aussi être
conservées dans un commit pour reproduire le traitement sur une autre machine.
Elles sont distinctes des cinq fichiers ignorés : notamment le support des
déclarations de présence et la correction des verdicts d’audit.
