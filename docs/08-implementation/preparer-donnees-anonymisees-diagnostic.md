# Préparer des données anonymisées pour un diagnostic

**IMPLÉMENTÉ.** Le dossier contenant `dataset.json` et `manifest.json` suffit pour rejouer le pipeline : configuration et catalogue sont embarqués. Pour vérifier des améliorations attendues, joindre aussi une description précise des résultats attendus et, si le problème concerne le rendu, les sorties correspondantes.

Pour l’issue #49, commencer par une nouvelle collecte avec le code corrigé : anonymiser l’ancien RAW ne récupère pas les parents manquants. Voir le [diagnostic local](issue-49-audit-diagnostic.md).

## 1. Fichiers à préparer sur le poste

| Fichier                    | Emplacement conseillé          | Utilité                                                                                                             |
| -------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Liste des dépôts           | `repositories.json`            | Périmètre de collecte, incluant les dépôts contenant les parents référencés ; un propriétaire GitHub unique par jeu |
| Token et paramètres GitHub | `.env`                         | Collecte uniquement ; reste privé                                                                                   |
| Profil DSQ livré           | `config/profiles/dsq.json`     | Conventions appliquées lors de la collecte ; automatiquement enregistrées dans le RAW                               |
| Extraction récente         | `data/local/issue-49/raw.json` | Faits GitHub, contexte de configuration et graine privée                                                            |
| Catalogue approuvé         | `config/local/catalogue.yaml`  | Enrichissements métier facultatifs, nécessaires pour vérifier les indicateurs qui en dépendent                      |

Le catalogue doit contenir des métadonnées vérifiées, sans « À remplacer », `null` dans les champs obligatoires, ni `draft: true`. Pour le produire et le compléter, suivre le [parcours des enrichissements facultatifs](datasets.md#enrichissements-facultatifs).

Pour les verdicts **composant × version**, un catalogue courant ne suffit pas : il faut les preuves historiques de présence dans les versions. Dans le RAW examiné pour #49, les 39 catalogues historiques étaient manquants. Distinguer ce manque de données d’une erreur de calcul ; ne pas inventer rétroactivement une présence historique.

## 2. Commandes

Exécuter depuis la racine du projet. Adapter les chemins et utiliser des destinations inexistantes pour la collecte et la préparation :

```powershell
npm.cmd run collect -- --repositories repositories.json --output data/local/issue-49/raw.json
```

Vérifier que GraphQL est configuré pour récupérer les parents. Les paramètres `GITHUB_API_URL`, `GITHUB_GRAPHQL_URL` et `GITHUB_URL` doivent correspondre à la même instance ; voir le [guide de collecte](guide-utilisation.md#3-collecter-vos-repositories). Les conventions enregistrées dans une ancienne capture ne sont pas remplacées automatiquement par le profil livré.

Préparer le dataset avec le catalogue approuvé, le valider puis produire ses sorties :

```powershell
npm.cmd run fixture:prepare -- --input data/local/issue-49/raw.json --output datasets/issue-49 --catalogue config/local/catalogue.yaml
npm.cmd run fixture:validate -- --dataset datasets/issue-49
npm.cmd run pipeline -- --dataset datasets/issue-49 --output data/output/issue-49
```

Ajouter `--anonymize-components` à la préparation si les noms de composants sont sensibles. Sinon, les conserver facilite la comparaison avec les noms utilisés dans l’issue. Sans catalogue approuvé, omettre `--catalogue` : le dataset restera utilisable avec des métadonnées inconnues et un brouillon privé sera généré à côté du RAW.

**Ne pas modifier directement le dataset préparé** : cela invalide son manifeste. Corriger les entrées appropriées et préparer un nouveau dossier. Un résultat Data Quality partiel peut signaler des faits incomplets sans rendre le format invalide ; conserver ces réserves dans le diagnostic.

## 3. Dossier à fournir ou à indiquer localement

```text
datasets/issue-49/
  dataset.json
  manifest.json

data/output/issue-49/
  current/
    snapshot.json
  dashboard/
    … dossier complet généré
  runs/
    … seulement si le problème concerne l’historique

attendus-issue-49.md
```

| Élément                               | Nécessité                                                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `dataset.json`                        | Indispensable : RAW anonymisé, configuration exacte, catalogue anonymisé et versions des conventions                   |
| `manifest.json`                       | Indispensable : contrôle de cohérence du dataset                                                                       |
| `attendus-issue-49.md`                | Indispensable pour valider les résultats métier                                                                        |
| `current/snapshot.json`               | Utile pour comparer le résultat obtenu au résultat attendu                                                             |
| Dossier `dashboard/` complet          | Utile pour reproduire un problème d’affichage ; les fichiers HTML seuls ne suffisent pas                               |
| Dossier `runs/`                       | Nécessaire uniquement pour les comparaisons entre exécutions ; inclure les runs concernés et préciser leurs périmètres |
| Commandes exécutées et commit utilisé | Nécessaires pour reproduire ; noter le commit avec `git rev-parse HEAD`, et signaler les changements locaux éventuels  |
| Messages d’erreur éventuels           | Utiles après retrait des informations sensibles                                                                        |

Un `system.yaml`, un catalogue YAML séparé ou un fichier V1 ne sont pas nécessaires lorsque le dataset embarque correctement ces informations. Le catalogue source reste privé ; les enrichissements utilisés sont accessibles dans `dataset.json`.

## 4. Décrire les résultats attendus

Pour chaque résultat, préciser :

- le dépôt et la campagne concernés ;
- les versions et filtres retenus ;
- les exclusions : anciennes campagnes, annulations, versions futures, etc. ;
- le résultat attendu et sa méthode de comptage ;
- les identifiants anonymisés des issues qui justifient ce résultat.

Exemple à compléter avec les identifiants du nouveau dataset :

```markdown
## Périmètre

Repository : demo-react
Campagne : tâches Audit RGAA ciblant 1.7.1 et 1.8.0
Les autres campagnes sont exclues de cette comparaison.

## Audits

27 composants distincts
28 audits : 16 terminés, 2 en cours, 10 à faire
Table possède deux audits sur deux versions différentes.

## Améliorations

6 issues attendues, avec leurs identifiants anonymisés
et le parent Audit de chacune.

## Anomalies traitées

4 issues attendues, avec preuve Done ET Closed.

## Points à vérifier

Liste des anomalies sans criticité.
Liste des anomalies ciblant une version future.
```

Ces listes permettent de comprendre pourquoi un nombre diffère, plutôt que de modifier les calculs pour atteindre un total. Les chiffres ci-dessus reprennent la référence de #49 ; ils ne remplacent pas la vérification des faits de la nouvelle collecte. Les règles de couverture et de conformité peuvent distinguer un audit en cours d’un verdict acquis : conserver cette distinction dans les attendus.

## 5. Fichiers qui restent privés

Ne pas transmettre ni versionner avec le jeu de diagnostic :

- `.env`, token ou graine d’anonymisation ;
- RAW original ;
- catalogue source nominatif ;
- brouillon `raw.json.catalogue.draft.yaml` ;
- rapport `fixture-diagnostics-…/relations.json` non anonymisé ;
- table de correspondance entre identités réelles et anonymisées.

Relire le dataset et les sorties avant partage : les labels métier, milestones, branches et tags peuvent conserver des informations sensibles. L’anonymisation automatique et `fixture:validate` ne remplacent pas cette revue. Le manifeste conserve l’état de revue `required` ; un contrôle automatique réussi ne constitue pas une certification de confidentialité.

Pour poursuivre un diagnostic local, indiquer les chemins du nouveau dataset, de ses sorties et du fichier d’attendus. Ces données locales sont ignorées par Git ; les tests versionnés restent des scénarios synthétiques ou anonymisés minimaux et ne sont pas remplacés automatiquement par une collecte personnelle.
