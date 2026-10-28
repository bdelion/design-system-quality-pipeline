# Populations de composants et preuves (#85)

## Statut et limites

**IMPLÉMENTÉ**, 19/10/2026, depuis `develop` à `3fbf500`, après #84. Ce patch clarifie la restitution des populations et expose leurs preuves. Il ne change ni métriques, ni sélection PROD, ni verdicts, ni identités normalisées. La correction éventuelle des effectifs reste dans #63. Les règles D-209 à D-219 et les contrats existants demeurent applicables ; aucune conformité RGAA n’est déduite d’un comptage.

## Inventaire et contrat des libellés

| Affichage                                           | Population et périmètre                                                                       | Source et exclusions                                                                                                                                                                                                                      |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identités historiques par repository, à l’accueil   | Toutes les identités normalisées, tous statuts ; un même nom peut avoir plusieurs componentId | `analytics.repositoryActivity[].components`, projection compatible `repositoryActivity` ; ce nombre n’est pas limité aux actifs                                                                                                           |
| Composants actifs, synthèse globale                 | Identités dont le statut vaut exactement `active`, tous repositories du snapshot              | Métrique `portfolio.components`, ses `sourceEntityIds`, exclusions et réserves DQ ; removed/deprecated/experimental/unknown ne sont pas des actifs                                                                                        |
| Composants et versions, lignes de l’explorateur     | Groupes par nom/repository, avec leurs faits filtrés et leur sélection                        | `componentsExplorerModel` ; regroupement préexistant, distinct du nombre d’identités ; voir le détail nominatif pour les incarnations                                                                                                     |
| Présences matérialisées par version                 | Couples identifiés par componentId et versionId avec relation normalisée                      | `normalizedData.componentVersions`, provenance et identifiant de chaque relation ; aucune présence rétroprojetée depuis le catalogue courant                                                                                              |
| Couverture du périmètre calculé                     | Numérateur `covered`, dénominateur `components` du WorkspaceSummary du périmètre exact        | Formule préexistante : sans version explicite, identités dont le statut n’est pas `removed` ; avec version explicite, nombre de relations matérialisées ; ce dénominateur ne constitue pas à lui seul un effectif de présences démontrées |
| Conformité des couples couverts                     | Couples CONFORME / couples CONFORME ou NON_CONFORME dans le périmètre                         | Agrégats `conform` / `covered` ; ne pas les confondre avec le nombre de composants actifs ou historiques                                                                                                                                  |
| Couples présents non couverts                       | Relations dont le verdict vaut NON_COUVERT                                                    | Champ `nonCovered` préexistant ; un verdict absent est indéterminé et n’est pas présenté comme NON_COUVERT                                                                                                                                |
| Component × Version historisés, couverts, conformes | Ensemble des relations du snapshot, toutes versions                                           | Métriques `componentVersion.*`, distinctes du périmètre PROD courant des cartes Workspace                                                                                                                                                 |
| Composants avec audit, synthèse de campagnes        | Identités rattachées aux audits reconnus de cette campagne/version cible                      | `analytics.auditCampaigns` ; une campagne n’est pas un inventaire de présences PROD                                                                                                                                                       |

Les valeurs existantes sont conservées, même lorsque leurs populations diffèrent. Le libellé du ratio de couverture indique « éléments du périmètre calculé », sans affirmer que tous sont des présences démontrées. Les infobulles des cartes de composants conduisent vers `audits.html#component-populations` avec le contexte de navigation conservé.

## Détail consultable

La page **Audits et conformité** propose une section native dépliable : **Patrimoine historique, actifs et présences par version : preuves et exclusions**. Le tableau expose repository, nom, componentId, alias déclarés, statut courant, exclusion des actifs, version, présence, verdict, audits applicables et sources. Les exclusions DQ déjà enregistrées sur l’identité ou la relation sont restituées avec l’identifiant de métrique et la règle ; les autres réserves restent accessibles dans Qualité des données.

Le tableau suit repository/composant/version. Sans filtre de version, il montre les PROD courantes sélectionnées par le mécanisme existant de #80 ; en leur absence, une observation explicitement indéterminée conserve les identités connues. Les filtres d’issues et d’audits ne définissent pas cette population de catalogue ; cette limite est indiquée près du tableau.

Le résumé compte les identités distinctes visibles et les observations de présence projetées. Il ne recalcule aucun taux, verdict ou règle de sélection dans le navigateur. Une identité retirée reste dans le patrimoine historique, avec son exclusion des actifs affichée ; elle n’est pas confondue avec une identité active du même nom.

### Présence, absence et inconnu

- **Présent** : relation Component × Version explicite ; la preuve indique son identifiant et sa provenance.
- **Absent** : aucune relation, et un catalogue historique complet lu pour le tag PROD exact ne contient ni le nom ni ses alias déclarés. Un tag manquant, une RC, un canal de développement ou un catalogue manquant/illisible ne prouve pas l’absence.
- **Indéterminé** : aucune relation et aucune preuve suffisante d’absence. Si le catalogue contient le nom mais que l’identité n’est pas matérialisée, la présence reste indéterminée ; le nom ne suffit pas à attribuer une incarnation.
- **Verdict indéterminé** : aucune valeur de verdict unique n’est fournie par les relations existantes. Aucune valeur NON_COUVERT ou CONFORME n’est inventée. Les preuves multiples restent visibles.

Le RAW n’est pas redistribué : seules les références et observations nécessaires à ce détail sont rendues dans le HTML. La capture source reste immuable.

## Exemple synthétique et tests

Le scénario contient cinq identités : `tag-old` retirée, `tag-new` active portant aussi le nom Tag, `renamed` active avec l’alias déclaré OldName, Modal active et Mystery active. Il comprend deux versions PROD prouvées.

La version 2 possède trois relations de présence : Tag nouvelle incarnation, Renamed et Modal. Deux couples sont couverts/conformes ; Modal est NON_COUVERT. Mystery active n’a pas de relation : le nom apparaît au catalogue, mais l’identité reste indéterminée. L’ancienne incarnation Tag n’a pas non plus de relation : son nom seul ne permet pas de la fusionner avec la nouvelle. Le détail conserve donc aussi cette incertitude historique, avec son statut retiré explicite. Les totaux d’inconnus sur le patrimoine complet ne sont pas forcés à égaler ceux des seuls actifs.

La version 1 montre l’ancienne incarnation Tag et la même identité `renamed` sous son alias déclaré ; Modal et Mystery sont absents du catalogue complet. Un test retire ensuite le tag ou le catalogue : cette absence redevient indéterminée. Les métriques et le snapshot sont comparés avant/après projection pour protéger l’absence de mutation.

`tests/component-populations.test.ts` protège la projection ; `tests/browser/component-populations.spec.ts` contrôle sur PC l’ouverture au clavier, les identités, les preuves, le filtrage par deux versions, le rechargement et le reset. Les parcours #79/#80/#84 restent couverts. La validation de livraison exige `npm.cmd run check:dashboard` et la revue des écarts aux budgets existants, sans remplacement silencieux de baseline.

## Revue mesurée du coût fonctionnel

Le [rapport de revue](benchmarks/issue-85-review.md) et ses [mesures JSON](benchmarks/issue-85-review.json) comparent le patch à #84, avec le même contrôle synthétique, graine, navigateur et protocole. Les scripts JSON intégrés restent identiques en taille ; aucun RAW n’est ajouté. Sur Audits, le détail ajoute douze lignes de preuves : HTML de 162 064 à 173 394 octets, lignes initiales/rendues de 18 à 30, DOM de 1 312 à 1 529 nœuds. Les nouveaux libellés ajoutent 132 octets HTML à Accessibilité et 210 octets à Composants, dont le lien vers les preuves ; Composants ajoute trois nœuds DOM. Les pages Accueil et Qualité diminuent respectivement de 211 et 229 octets ; les autres pages ne changent pas d’octets HTML, de lignes ou de nœuds.

Le budget de croissance nulle signale ces ajouts : les échecs sont conservés dans le rapport de revue, pas masqués. La baseline automatique #81 bloque également les nouvelles lignes et le DOM d’Audits. Une nouvelle référence exige la validation explicite prévue par le [protocole](dashboard-benchmark.md#budgets-et-comparaison-avantaprès). Le taux de 0 % et les archives historiques restent inchangés.

**VALIDÉ PAR L’UTILISATEUR LE 19/10/2026** : « Oui, valider cet ajout et la nouvelle référence », après présentation des douze lignes et d’environ 11 ko ajoutés à Audits. `config/benchmark-control-baseline.json` prend donc les mesures déterministes de #85 comme nouvelle référence de contrôle, avec la validation et sa provenance enregistrées. `config/benchmark-budgets.json` conserve strictement 0 % ; les archives #81 à #84 ne sont pas réécrites. La comparaison de revue reste une trace des ajouts acceptés ; les passages suivants doivent à nouveau respecter la croissance nulle.

Le [contrôle rejoué après validation](benchmarks/issue-85-control.md) et son [rapport JSON](benchmarks/issue-85-control.json) passent les budgets de 0 % contre cette nouvelle référence : aucune hausse des octets HTML/JSON, lignes initiales/rendues ou nœuds DOM sur les dix pages. Les durées restent descriptives, sans seuil automatique.

## Vérifications de livraison

`npm.cmd run check:dashboard` a abouti : kit IA, types, lint, TSDoc, tests, build, **45 tests Playwright PC**, format et TypeDoc. La suite unitaire finale rejouée avec `npm.cmd test` contient **335 tests réussis**, dont la régression de génération pour un verdict manquant. Le contrôle synthétique contre la nouvelle baseline validée passe avec le budget inchangé de 0 %. TypeDoc conserve l’avertissement préexistant sur `Resource` dans `github-requests.ts`, sans erreur.
