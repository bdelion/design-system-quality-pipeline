# Pagination Activité et Qualité des données — #87

**IMPLÉMENTÉ dans le patch.** Les deux listes utilisent une pagination simple de 50 lignes, sans virtualisation. Les filtres et tris portent sur toute la population avant le découpage. Les boutons Précédent/Suivant et la plage « 1–50 sur 3 000 · Page 1/60 » restent dans le DOM. Un filtre, un tri, un reset ou une navigation URL repart à la première page ; une demande hors limites est bornée, avec « 0–0 sur 0 » pour un résultat vide. La pagination n’est pas enregistrée dans l’URL ; un lien ciblé filtre les faits avant de présenter la première page correspondante.

## Sélection et exports

Activité conserve les issues distinctes sélectionnées entre pages. La case d’en-tête sélectionne **toutes les issues filtrées, toutes pages**, pas seulement les 50 occurrences montées. Les KPI portent sur l’intersection entre sélection et population filtrée, sans compter plusieurs fois une issue multi-labels. Effacer la sélection rétablit les KPI des issues filtrées. Le CSV d’Activité exporte **toutes les lignes filtrées et triées**, indépendamment de la sélection utilisée par les KPI ; ce contrat est affiché dans l’interface.

DQ ne propose pas de sélection individuelle. Depuis [#88](dashboard-quality-causes.md), choisir une cause restreint le détail et le CSV à ses occurrences, tout en conservant les filtres. Son CSV exporte tous les diagnostics concernés et triés, avec identifiant, règle, sévérité, entité, repository prouvé ou « Non déterminé », message, action, motifs et impacts complets, URL source et issue reliée. Il n’est jamais limité à la page courante. Les deux exports utilisent UTF-8 avec BOM, séparateur `;`, guillemets échappés et protection des valeurs pouvant devenir des formules de tableur.

## Données et preuves

Le JSON `dsq-dashboard-page` v1 de `quality.html` possède désormais sa section requise `data.quality`. Elle contient exclusivement les projections nécessaires aux filtres, tris, liens et exports de cette page. Aucun RAW ni snapshot complet n’est ajouté ; les autres pages ne reçoivent pas les diagnostics. Le HTML DQ initial contient au plus les 50 premiers diagnostics, puis le module remonte la page filtrée depuis ce contrat. Les tableaux et définitions hors de ces deux listes conservent leur rendu ; la limite de 50 n’est pas une limite universelle du dashboard.

Les URL Enterprise et les relations explicites existantes sont conservées. Une source non résolue reste textuelle. Un contrat absent/invalide affiche une erreur, désactive les contrôles et l’export, et indique le compteur indisponible sans inventer zéro. Les anciens fichiers générés restent utilisables avec leurs propres assets ; régénérer le dossier complet pour bénéficier de cette pagination.

## Clavier et validation

Les contrôles de pagination sont des boutons natifs et la plage possède une annonce `role="status"`. Le focus reste sur le bouton actionné ; lorsqu’il devient désactivé, il passe au bouton encore utilisable ou à la plage. Une case d’issue garde son focus après le rendu de sa sélection. Les filtres, boutons de tri et liens de preuves restent accessibles au clavier.

Les tests PC couvrent 120 issues et 3 000 diagnostics, dont 120 filtrables : dernière page partielle, sélection inter-pages, tris sur toute la population, remise à la première page après filtrage, résultat vide, URL ciblée, preuves Enterprise, export des 120 résultats depuis la dernière page et erreurs de contrat. Les contrats de génération vérifient la borne de 50 lignes HTML et l’absence de modification du snapshot.

## Mesures synthétiques

Le [rapport avant/après](benchmarks/issue-87-pagination.json) réutilise `measureBrowserPage` du protocole #81, à 1 440 × 900, avec chauffe puis trois contextes neufs par page, HTTP local sans cache et aucune requête GitHub. Les deux générateurs reçoivent les mêmes faits fictifs (`pagination-synthetic-v1`) et la même empreinte de fixture. Référence avant : `develop` au démarrage, `a2b36e4` ; données et règles métier inchangées.

| Mesure                             |     Avant |     Après |
| ---------------------------------- | --------: | --------: |
| Activité : lignes rendues          |       120 |        50 |
| Activité : nœuds DOM               |     4 036 |     1 946 |
| DQ : diagnostics montés            |     3 000 |        50 |
| DQ : nœuds DOM                     |    70 459 |     2 629 |
| DQ : HTML incluant le JSON, octets | 2 296 767 | 1 335 566 |

Le comptage global de lignes DQ inclut deux autres lignes hors de la liste : 3 002 avant et 52 après. Ces volumes sont ceux de cette fixture ; les durées mesurées ne garantissent pas un gain universel. Les données complètes restent en mémoire pour les filtres et exports ; la pagination borne les lignes du tableau, pas le coût de toutes les analyses ni la taille totale des autres sections.

Reproduction depuis la branche du patch, en conservant une copie locale du générateur de référence et des destinations neuves :

```powershell
npx.cmd tsx scripts/dashboard-pagination-benchmark.ts --before-source 'D:/chemin/vers/reference/src/dashboard/generate.ts' --output data/benchmark-pagination.json
```

Le [petit contrôle #81](benchmarks/issue-87-review.md) signale le coût fonctionnel des nouveaux contrôles et de la section JSON DQ : +472 octets HTML sur Activité ; +2 611 octets HTML, +10 006 octets JSON inclus dans ce HTML et +10 nœuds DOM sur DQ. **Validation explicite de l’utilisateur le 19/10/2026 : « Oui, valider ces ajouts et la nouvelle référence ».** La référence automatique est actualisée pour ce coût fonctionnel ; les alertes dès la moindre augmentation et le budget de 0 % restent inchangés. Les dépassements archivés dans le rapport de revue sont ceux constatés face à l’ancienne référence, avant cette validation.
