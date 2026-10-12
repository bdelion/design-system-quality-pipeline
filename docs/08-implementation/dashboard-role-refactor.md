# Refonte du dashboard par besoins

**Statut : IMPLÉMENTÉ localement ; refonte complétée par les issues #35, #45, #47 et #48.**
La demande validée privilégie les responsables des audits d’accessibilité, puis la Squad (PO et AM), puis la direction et les consommateurs. Ce document décrit le comportement livré ; il ne remplace pas le registre des décisions métier.

## Navigation et populations

Six espaces principaux : Vue d’ensemble, Accessibilité, Activité des équipes, Composants et versions, Historique, Qualité des données. Les neuf fichiers HTML sont accessibles ; audits.html, anomalies.html et graph.html deviennent des vues détaillées. Les anciens fichiers et leurs ancres sont conservés. Les liens d’espace conservent repository, composant et version ; ils abandonnent les filtres d’objet pour éviter une sélection invisible. Historique conserve seulement le repository. Vue d’ensemble et Qualité des données restent des vues du snapshot complet et ne reçoivent pas de filtres hérités.

**IMPLÉMENTÉ — #48 :** Vue d’ensemble ne présente aucun filtre. Elle affiche, dans cet ordre, « Patrimoine et activité par repository », « Temps de traitement des issues par repository », puis les huit cartes « Patrimoine et activité globale ». Les paramètres d’une ancienne URL ne réduisent pas cette synthèse globale. Les KPI de couverture et conformité restent dans Accessibilité et Audits.

**IMPLÉMENTÉ — #35 et #45 :** Activité des équipes présente en tête les effectifs distincts d’issues, d’issues avec Project, avec itération et avec transition datée, puis les effectifs de PR ouvertes, fusionnées, fermées sans fusion et reliées à des issues. Cette synthèse du snapshot complet est masquée en périmètre filtré ; les statistiques de sélection existantes restent disponibles. `Analytics.teamActivity` est calculé par le pipeline ; les anciens snapshots sont projetés avec la même fonction Analytics. Les issues absentes restent indisponibles. Les colonnes Composants, Statut Project, Itération et Velocity source complètent le tableau et son CSV. Plusieurs Projects restent distingués par leur nom, conformément à D-175, D-179, D-180 et D-181 : aucune Velocity absente n’est remplacée par zéro et aucune performance de sprint n’est déduite.

**IMPLÉMENTÉ — #47 :** Les liens d’issues des deux listes Accessibilité affichent `#numéro ↗` et ouvrent un nouvel onglet, comme les sources explicites du tableau DQ. Les entités sans source résolue restent du texte. Les compteurs des composants ouvrent des recherches GitHub par repository et label source. Les différences sont expliquées au-dessus du tableau : état GitHub ouvert distinct du statut métier ouvert ; motif `completed` distinct de Done ET Closed ; motif `not planned` distinct de Cancelled dans Project. La recherche des PR repose sur les références d’issues dans leur description et peut manquer les liens manuels. Les grandes populations proposent plusieurs recherches courtes, sans tronquer les références. Les recherches reflètent les données actuelles de GitHub, les compteurs celles du snapshot. Dernier audit et conformité ouvrent les audits justificatifs résolus, sans substituer un verdict recalculé.

Le cartouche universel « Périmètre de navigation » est remplacé par des contrôles compacts pertinents. Les définitions des indicateurs accessibilité sont auprès de chaque chiffre. Le catalogue technique est consultable dans Qualité des données ; les graphiques historiques y restent disponibles dans un volet replié.

Anomaly demeure la spécialisation technique des BUG configurés : ce nom ne prouve pas une anomalie d’accessibilité. Analytics.workspaces ajoute une qualification indépendante :

- **Qualifiée** : relation explicite valide avec un audit, ou même label contenant Audit et RGAA, sans sensibilité à la casse.
- **Présumée, à examiner** : catégorie accessibilité, criticité RGAA ou signal de label RGAA/a11y, sans preuve précédente.
- **Non qualifiée** : aucune preuve suffisante ; cela ne signifie pas « non accessible » ni « non liée à l’accessibilité ».

Ces conventions reprennent la demande utilisateur validée, sans modifier D-124 : aucun audit n’est attribué par un label. Une qualification par label ne transforme pas un BUG en audit. La liste de revue comprend toutes les issues qualifiées ou présumées sans label combiné, même lorsqu’une relation explicite d’audit existe. Elle conserve labels et raisons pour l’examen au cas par cas. Les critères configurables optionnels github.accessibilityRecognition.labelAllOf et repositories permettent une convention par repository ; une règle vide ou mal formée est refusée.

Les KPI accessibilité incluent les qualifiées et les présumées, dont les effectifs restent distincts. Déclarées, traitées et restant à traiter excluent les annulations ; les listes gardent les annulations visibles. D-081 demeure Done ET Closed. Les anomalies sont dédupliquées par issue. Les catégories multiples ne constituent pas des populations disjointes.

Sans version sélectionnée, couverture et conformité utilisent la version PROD courante de chaque librairie. Le stock des anomalies couvre toutes les versions et les versions inconnues ; il est nommé séparément. Un filtre de version accepte les relations explicites et les audits applicables déjà calculés par le pipeline. Il ne modifie pas l’attribution historique de version dans l’explorateur d’issues. D-227 et D-228 sont conservées : corriger une anomalie hors audit ne rend pas un composant conforme, et non couvert reste distinct de non conforme.

## Matrice besoin → population → indicateur → écran → test

| Besoin                                             | Population                                            | Indicateur                                                                 | écran                                      | Preuve de test                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Nombre d’anomalies déclarées et corrigées          | Issues accessibilité distinctes non annulées          | Déclarées, traitées, restant à traiter, taux Done + Closed                 | Accessibilité                              | dashboard-workspaces.test.ts : qualification, déduplication, invariants ; browser : périmètre  |
| Délais de correction par criticité                 | Même population, délais calculables non exclus par DQ | Moyenne par criticité et effectif calculable ; moyenne/médiane/P90 globale | Accessibilité                              | dashboard-workspaces.test.ts : dates réelles/estimées ; suites metrics et analytics existantes |
| Répartition par criticité                          | Accessibilité qualifiée + présumée                    | Déclarées/traitées par criticité, inconnue conservée                       | Accessibilité                              | dashboard-workspaces.test.ts : reconnaissance et population ; navigateur sans erreur           |
| Répartition par catégorie et composant             | Même population ; liens explicites                    | Effectifs multi-catégories, par composant                                  | Accessibilité                              | dashboard-workspaces.test.ts : absence de mutation et filtres ; browser : composant/version    |
| Taux de couverture par audit                       | Composant × version courante ou sélectionnée          | Couverts / présents ; inconnu rend le taux indisponible                    | Accessibilité, Audits                      | dashboard-workspaces.test.ts : couvert/non couvert ; browser : Modal 0 %, Button 100 %         |
| Taux de conformité                                 | Couples couverts                                      | Conformes / couverts ; non couvert séparé                                  | Accessibilité, Audits, Audits              | mêmes tests ; v1-reference-scenario.test.ts ; component-version-metrics-i6.test.ts             |
| Applications consommant les librairies et versions | Source de consommation absente                        | Indisponible                                                               | Accessibilité                              | Génération et parcours des neuf pages ; aucun taux inventé                                     |
| Fréquence d’usage des composants                   | Source d’usage absente                                | Indisponible                                                               | Accessibilité                              | Génération et parcours des neuf pages                                                          |
| Conformité de release et évolution                 | Snapshots compatibles et couples versionnés           | Photographie à publication, connaissance actuelle, transitions             | Audits, Historique                         | v1-reference-scenario.test.ts, dashboard.test.ts et tests de snapshots existants               |
| Audits futurs des maquettes et leurs anomalies     | Identification Design non disponible                  | Indisponible                                                               | Accessibilité                              | Parcours des neuf pages ; mention explicite d’absence de source                                |
| Stabiliser les issues pour PO et AM                | Toutes les issues, familles exclusives                | Stocks, durées et sélection exportable                                     | Activité des équipes                       | browser : moyenne/médiane identiques entre issues et composants ; export CSV                   |
| Examiner les cas incertains                        | Accessibilité sans label combiné                      | Liste, labels, raisons, CSV                                                | Accessibilité #review                      | dashboard-workspaces.test.ts : qualification et CSV ; browser : téléchargement                 |
| Distinguer bugs, audits et accessibilité           | Toutes les issues et spécialisations                  | Famille, qualification, origine explicite                                  | Activité, Défauts normalisés, Cartographie | dashboard-consolidation.test.ts, dashboard-workspaces.test.ts, browser : traçabilité           |
| Cohérence cartes/tableaux/navigation               | Périmètre repository/composant/version                | Agrégats pré-calculés communs                                              | Six espaces                                | browser : filtre hérité, reset, ancien lien ciblé, filtre catégorie                            |
| Diagnostics et explicabilité                       | Réserves DQ et contrats Analytics                     | Sources, exclusions, fiabilité                                             | Chiffres et Qualité des données            | dashboard.test.ts ; browser : définition près du chiffre et DQ                                 |
| Accès aux écrans                                   | Neuf pages desktop/mobile                             | axe-core, focus, absence d’erreur JS                                       | Tous                                       | tests/browser/dashboard.spec.ts                                                                |

## Calcul et compatibilité

**IMPLÉMENTÉ — compléments de la Vue d’ensemble :** « Patrimoine et activité par repository » ajoute Issues (tous types), Issues ouvertes (état GitHub OPEN) et PR (tous états), conserve les composants, les anomalies et les PR fusionnées, et retire Fiabilité. Chaque effectif connu dispose d’une recherche GitHub externe : labels de composants, Issue Types des anomalies, issues, issues ouvertes, PR et PR fusionnées. Les listes reflètent les données GitHub actuelles ; les comptes restent ceux du snapshot. Les composants ouvrent les issues portant les labels source. Le stock d’anomalies ouvertes conserve sa définition pipeline, distincte de l’état GitHub ouvert utilisé par la recherche.

`Analytics.repositoryActivity` contient les stocks et les délais par repository. Les cohortes sont présentées dans l’ordre Ensemble (Done et estimations admissibles), Sans estimation (Done), Avec estimation (closedAt). Chacune présente les issues mesurables, la moyenne, la médiane et le P90 interpolé en jours calendaires. Les règles et exclusions DQ de `projectIssueFacts` s’appliquent ; Done ET Closed reste requis, les annulations et les durées invalides sont exclues. Une population vide ne produit pas un délai nul. Les anciens snapshots sont projetés par la même fonction Analytics, sans réécriture. Ce complément ne modifie pas l’écart établi entre D-047 et les dates implémentées.

Le pipeline calcule Analytics.workspaces ; le navigateur sélectionne uniquement les agrégats pré-calculés et filtre leurs listes. Les anciens snapshots sans ce contrat sont projetés au moment de la génération, sans réécriture. L’absence du tableau Issues signifie indisponible, pas zéro. Les inconnues de présence/verdict sont conservées. Les exclusions DQ des délais sont appliquées ; les dates Done prouvées et les estimations sont distinguées. Le dénominateur nul rend un taux indisponible.

Les filtres d’objet ou de détail issus d’anciens liens masquent les agrégats non calculés pour ces dimensions ; les listes de preuves restent consultables. Les cartes globales des vues filtrables sont masquées dès qu’un filtre est appliqué. Vue d’ensemble reste toujours globale. Les explorateurs Issues et Composants conservent leurs contrôles et statistiques de sélection.

La branche locale feature/dashboard-v1-i0-i9 a été comparée : navigation par rôles, activité Squad et portefeuille ont été repris dans leur intention. Ses anciennes formules d’audit/dates ne sont pas importées automatiquement. L’écart documenté entre D-047 et la date Done implémentée reste un écart explicite ; cette refonte ne décide pas une migration métier.

## Prévisualisation et liste locale

Exécuter npm run dashboard:preview, éventuellement avec -- chemin/du/snapshot.json. Le script lit le snapshot et écrit uniquement data/dashboard-refactor-preview/. Servir data/dashboard-refactor-preview/dashboard/ sur HTTP pour les modules JavaScript. La liste locale est data/dashboard-refactor-preview/accessibility-review.csv ; les écrans exportent également la liste filtrée. Ces artefacts restent ignorés par Git. Ils peuvent contenir les identités de la source locale et ne doivent pas être publiés comme fixtures anonymisées.

## Validation et limites

Le rapport d’exécution final accompagne cette matrice. Les sources de consommation et de maquettes restent NON COUVERTES. Les présomptions nécessitent une revue humaine : l’outil fournit la liste sans inventer une décision issue par issue. Les contrôles axe-core et clavier automatisés ne constituent pas un audit RGAA manuel.

Le contrôle de format couvre désormais src/dashboard : l’ancien motif dashboard/ excluait aussi les sources ; /dashboard/ limite cette exclusion au dossier généré racine. Les changements de format dans les anciens modules n’en modifient pas les règles métier.

## Preuves d’exécution — 11 octobre 2026

- `npm run check` : 37 fichiers de tests, **184 tests réussis** ; contrôle IA, TypeScript strict, ESLint, TSDoc et build réussis.
- `npm run test:browser` : **16 tests réussis** ; les neuf pages sont contrôlées desktop/mobile avec axe-core, focus et absence d’erreur JavaScript. Les interactions vérifient anciens liens, contexte partagé, annulations, exports et retour aux espaces principaux.
- `npm run dashboard:preview` : neuf pages générées dans le dossier isolé ; **29 issues présumées sans label combiné** dans le CSV local à examiner.
- Snapshot source inchangé avant/après prévisualisation : SHA-256 `42FCD26ACA4CE58A017B7B217ABCD14DA00A6F714672AD16AE1EFF615AA48175`.
- `git diff --check` : aucune erreur d’espacement. Aucun commit ni push réalisé.

Les besoins de la matrice sont restitués ou explicitement indisponibles. La validation automatique ne qualifie pas individuellement les présomptions et ne remplace pas un audit RGAA manuel.

La commande complète `npm run check:dashboard` est réussie : elle inclut également le contrôle de format et la génération TypeDoc.

## Correction de la synthèse globale

L’accueil conserve les quatre priorités accessibilité et affiche également les métriques globales du patrimoine, des audits et des BUG normalisés. Cette population du snapshot complet est clairement nommée et masquée lorsqu’un contexte est appliqué. Les cartes accessibilité indisponibles expliquent l’absence de présence composant × version, de verdict ou de population calculable. Les formules et le snapshot source ne sont pas modifiés.

## Consultation et présentation des diagnostics

La cause des filtres inactifs signalés était l’ouverture directe en `file:///`. `dashboard:serve` fournit désormais une origine HTTP locale ; le mode fichier est expliqué à l’écran. Les filtres repository acceptent les événements input et change. La page DQ dispose de colonnes structurées, de filtres combinés, d’une recherche et d’un compteur. La provenance repository provient de relations explicites ; une réserve sans relation reste non déterminée. Les chiffres accessibilité et le compteur DQ utilisent une présentation numérique compacte ; les explications des cartes sont accessibles par une icône i nommée, au clavier. Tests : dashboard-server.test.ts et parcours navigateur repository/DQ/mode fichier, en plus des contrôles axe-core sur neuf pages.

## Validation complémentaire — accueil, consultation et DQ

`npm run check:dashboard` réussit après ces corrections : **185 tests unitaires dans 38 fichiers**, **19 tests navigateur**, TypeScript, ESLint, TSDoc, contrôle IA, formatage, build et TypeDoc. Les neuf pages passent axe-core sur desktop et mobile. Les nouveaux tests couvrent le serveur local et son confinement, la synthèse globale, les événements du filtre repository, les filtres DQ/réinitialisation/compteur et le mode fichier. La prévisualisation isolée a été régénérée ; aucun commit ni push n’a été réalisé.

## Présences et verdicts inconnus

Les ratios de couverture/conformité sont affichés « Ratio indisponible » lorsque leur taux n’est pas calculable : aucun 0 / N n’est présenté comme un dénominateur établi. Le stock de composants non couverts est affiché indisponible si des présences ou verdicts restent inconnus. Une carte distincte indique l’effectif de situations indéterminées. Lorsque toutes les situations sont établies, les ratios et le stock non couvert restent affichés normalement. La liste de 1.7.1 ne prouve pas la présence dans les versions courantes suivantes.

Validation de cette correction : `npm run check:dashboard` réussit avec 187 tests unitaires et 20 tests navigateur, ainsi que les contrôles TypeScript, ESLint, TSDoc, format, build et TypeDoc. Le dashboard et la prévisualisation sont régénérés depuis le snapshot existant, sans modifier ses données.
