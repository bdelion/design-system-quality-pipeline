## Primauté des audits applicables — non publiée

- Correction de D-227/D-228 : les défauts hors audit ne remplacent plus les verdicts de Component × Version ; les défauts et réserves individuels restent visibles.
- Rejeu de 1.7.1 avec DateBox et le regroupement métier Live Zone (A11yProvider + A11yRegion) : 11 conformes, 15 non conformes, 50 non couverts sur 76 composants ; ratios 11/26 et 11/76.

## Historique déclaratif de DateBox — non publiée

- Présences historiques confirmées sans Excel : provenance déclarative conservée, changements non renseignés et aucune absence inventée avant la première observation.
- Correction locale de l’exclusion de DateBox depuis 0.0.2 ; catalogue 1.7.1 recalculé à 77 composants, sans déduction de conformité.

## Audits par version (#130) — non publiée

- Répartitions initialement triées par Total décroissant ; colonne existante Restant renommée Reste à faire, avec états inconnus séparés.
- Liens limités aux labels métier de la dimension, sans Grooming accidentel ; sélection des audits parents dans une vue Project configurée, sans milestone parent appliquée aux enfants.
- Notes de réconciliation catalogue/audits/verdicts et diagnostic des écarts 6/12, 24/14, 30/29 et 76/46. Lecture déclarative D-246 et verdicts métier conservés.

## Configuration des conventions — non publiée

- Conventions de compatibilité déplacées du TypeScript vers `config/defaults/`, sans changement de leurs valeurs ; Grooming explicite dans le profil DSQ.
- Qualification et présomption d’accessibilité configurables ; alias des types d’audit candidats lus depuis les conventions du dataset.
- Documentation des priorités, du remplacement local `--issue-policy` et des contrats métier qui restent dans le code ; présentation des dashboards conservée.

## Diagnostic sur le dataset anonymisé du 27 octobre — non publiée

- Réconciliation des écarts #126/#127 : 153,961 j selon l’ancien calcul contre 1,012 j selon D-245 ; 12/29 reproductibles avec un périmètre strict distinct de la qualification métier.
- Lecture déclarative validée D-246 : uniquement audits terminés et enfants de type GitHub BUG explicite avec label RGAA, même si leur composant diffère. Preuves matérialisées dans le pipeline ; colonnes sans/avec BUG déclaré distinctes des cumuls métier. Anciennes captures sans preuve indisponibles jusqu’au rejeu.
- Correction du label réel `📌 Grooming`, désormais reconnu avec `Grooming` et paramétrable via `issuePolicy.grooming` ; tests de régression sur le label, sa configuration et les dates anonymisées.
- Cumuls indisponibles lorsque les catalogues historiques sont `missing` : aucune présence de composant passée n’est inventée. Dataset source conservé.

## Revue des espaces synthétiques (#124–#128) — non publiée

- Ancienneté du plus ancien ticket en jours civils à Paris, sans attendre 24 heures écoulées (#124).
- Colonne Traitement : tâches restantes/réalisées, À groomer et distinction Improvement/Improvement d’audit (#125).
- Navigation vers labels, issues Closed et cohortes Projects ; correction confirmée mesurée de premier In progress à dernier Done, repli création/clôture explicite avec bornes et provenance dans le détail/CSV (#126).
- Ratio audits terminés/composants, exclusion des EPIC et des anomalies non enfants, résultats directs distincts des cumuls hérités (#127).
- Répartitions par criticité, critère d’accessibilité et composant avec filtres Total/Restant/Réalisé, graphiques accessibles, liens individuels et export ; nouvelle mesure du budget synthétique, références classiques inchangées (#128).
- Les totaux réels 6/12 et 35/29 restent à diagnostiquer avec le dataset anonymisé ; aucun total attendu n’est forcé. Les filtres Projects sur le contenu des sous-issues ne sont pas inventés.

## Preuves des cumuls d’audit (#122) — non publiée

- Suppression des audits non applicables dans les justificatifs des composants conformes/non conformes cumulés ; maintien des preuves héritées et des décomptes métier.
- Recherches GitHub affinées par les milestones sources lorsqu’elles distinguent la sélection ; aucun filtre Closed ou sous-issue substitué au verdict calculé.
- Documentation de la différence entre composants cumulés, audits et campagnes GitHub actuelles ; tests unitaires et navigateur dédiés.

## Cohortes GitHub des composants (#121) — non publiée

- Filtre `state:open` conservé sur les recherches En cours, même pour une source unique ; divergences avec les statuts Project annoncées sans changer les compteurs.
- Labels complets des composants et alias collectés dans les vues Projects Done/Cancelled, avec le préfixe du profil ; aucun label manquant n’est inventé.
- Accès GitHub des délais limité aux cohortes reproductibles parmi les sources connues. Sinon, explication et maintien de la liste locale et du CSV exacts, sans recherche élargie.

## Identifiants de revue du dashboard — non publiée

- Références stables par site, présentation, écran, rôle et entité pour les pages, chiffres, tableaux, contrôles, liens et fenêtres dynamiques.
- Inspecteur local optionnel : sélection souris/clavier, copie de l’identifiant ou du contexte, recherche exacte et signalement des collisions.
- Origines distinctes des fenêtres réutilisées ; titres et URL exclus de la copie par défaut. Évolution indépendante de #118, toujours en attente de validation utilisateur.

## Liens GitHub v2 (#118)

- Ouverture des recherches d’un repository unique dans sa page Issues/PR, avec les labels sources complets.
- Liens Done/Cancelled vers une vue Projects paramétrée par `.env`, avec les statuts du profil ; suppression de la substitution par Closed.
- Correspondances facultatives de repositories explicites et maintien de l’avertissement de recherche élargie, des listes exactes et de leurs CSV.

## Fenêtres GitHub — application de la maquette A (#115)

- Suppression des raccourcis GitHub dans les cartes, outils et cellules des tableaux synthétiques ; une seule action dans la ligne du titre de la fenêtre.
- Remplacement des recherches par lots de numéros par une destination unique fondée sur les filtres sources et vérifiée contre le snapshot ; repli vers une recherche élargie du composant/dépôt, avec avertissement, conformément au choix utilisateur.
- Conservation des états explicites des totaux et des hôtes sources GitHub Enterprise. Correction des tableaux sans cellules dans les fenêtres sans preuves et dans le HTML initial de la maquette.

# Changelog

## Maquette A des fenêtres GitHub (#115) — conception validée

- Versionnement du choix utilisateur du 24 octobre 2026 et du prototype HTML fictif de comparaison A/B ; seule la variante A est retenue.
- Demande formalisée : un accès global dans l’en-tête de chaque fenêtre, aucun ajout dans les pages/tableaux, aucun lien par lot.
- Correction fonctionnelle et vérification sur données non anonymisées restant à réaliser ; aucune modification de l’application dans cette livraison.

## Liens d’en-tête des fenêtres (#115) — non publiée

- « Ouvrir dans GitHub » dans l’en-tête des fenêtres ; ouverture directe d’une source unique complète.
- Références propres à Composant/Situation/Prochaine action et aux compteurs par composant, labels collectés partagés, filtres ouverts/fermés lorsque les états les justifient.
- Divergences Project/GitHub signalées sans masquer de ticket ni modifier les métriques ; aucune déduction du motif de fermeture.

## Recherches GitHub des fenêtres — non publiée

- Recherche GitHub explicite dans les fenêtres de listes, même pour une seule issue ; parcours des fenêtres des cinq espaces vérifié.
- Totaux issues et PR tous états, sans filtre implicite « ouvertes » ; recherches ouvertes et fusionnées séparées.
- Recherche du périmètre du compteur prioritaire sur les lots de numéros ; absence de sources individuelles de PR explicitée.

## Liens GitHub explicites — non publiée

- Les liens affichent « Ouvrir la recherche dans GitHub » ou « Ouvrir l’issue dans GitHub » dans tous les espaces simplifiés, compteurs, tableaux et fenêtres ; les icônes seules sont remplacées et les recherches de contexte ne sont plus dupliquées dans les fenêtres.

## Accès GitHub — vue synthétique — non publiée

- Ajout de raccourcis ↗ distincts des fenêtres locales pour les compteurs, cellules et listes filtrées complètes.
- Liens directs pour une issue, recherches par numéros réparties en lots pour plusieurs sources ; limites et sources absentes signalées, sans reconstruction des URL anonymisées.

## Vue synthétique compacte — non publiée

- Nouvelle référence de taille explicitement validée le 22 octobre 2026 ; alerte à 0 % conservée, budgets classiques inchangés.

- En-tête et menu fixes, polices et lignes de tableaux plus compactes.
- Export CSV de toutes les lignes filtrées/triées et des listes de preuves, avec URL GitHub.
- Synthèse librairie/composant : états Project, délais moyen/médian/P90 et plus ancienne issue ouverte.
- Synthèse librairie/version : audits, composants, ratios de couverture et conformité auditée/cumulée distincts.
- Preuves des verdicts hérités accessibles depuis les versions concernées ; inconnues et exclusions conservées.

## Double présentation du dashboard — non publiée

- Génération automatique d’un accueil de choix, du dashboard classique et d’une présentation synthétique.
- Synthèse, composants, activité, repositories et équipe, audits par version ; preuves accessibles sur place et liens sources GitHub.
- Recherche, tris avant pagination et détails paginés ; délais mesurables et inconnues explicites.
- Conservation des budgets historiques du classique ; première référence synthétique distincte proposée à la validation.

## Revue métier des bugs et audits — non publiée

- Labels et préfixes configurables pour les catégories de bugs, les demandes d’avis auditeur et les motifs d’annulation.
- Correction confirmée par Done et PR liée fusionnée, distincte de sa vérification par audit ultérieur.
- Rattachements issus des labels composant, comptage par occurrence et maintien des bugs prévus dans une version future.
- Filtres Project, bugs sans audit/composant, nature et corrections ; versions de correction et preuves PR dans l’explorateur.
- Synthèse des audits et des améliorations, diagnostic DQ-035 et conservation des sources.

## Périmètre des versions — issue #39 — non publié

- Lecture de la version du package racine et exclusion des versions futures des analyses accessibilité et conformité.
- Issues et PR futures conservées dans l’activité des équipes, avec libellé explicite.
- Nouvelle version de règles dans les sept profils pour séparer les comparaisons avant/après ce périmètre.
- Borne préservée par l’anonymisation ; réserves DQ pour les anciens RAW ou packages absents/invalides.
- Tests des collectes, comparaisons numériques, périmètres multi-repositories, snapshots et pages générées.

## Releases automatiques — non publiées

- Job de tag et release sur main après succès de la CI complète.
- Formatage immédiatement après installation et TypeDoc avant les tests navigateur.
- Versionnement Conventional Commits, notes utilisateurs issues des PR et reprise sans doublon.
- Tests des collisions, erreurs, permissions du workflow et modèle de PR.

## Progression console GitHub — non publiée

- Ligne de progression actualisée en terminal, avec repositories, issues et quota GraphQL.
- Sortie sobre en CI/redirection et clôture propre en cas d’échec.

## Refonte visuelle du dashboard — non publiée

- Cartes de périmètre compactes et petit bouton d’information en haut à droite ouvrant une infobulle accessible.

- Répartitions graphiques rétablies dans Accessibilité, filtrées et accompagnées de détails accessibles.

- Interface claire inspirée des recommandations dashboard et de la palette Michelin.
- Navigation illustrée, cartes et tableaux harmonisés, filtres et focus visibles.
- Polices locales et adaptation mobile vérifiée sur les neuf pages.

## Refonte du dashboard par besoins — non publiée

- Synthèse globale rétablie sur l’accueil ; explications des chiffres indisponibles.
- Serveur HTTP local pour les filtres, message en mode fichier et tableau DQ filtrable.
- Compteurs numériques et icônes d’information accessibles.

- Six espaces principaux, vues historiques conservées et filtres compacts.
- Population accessibilité qualifiée ou présumée distincte des BUG génériques ; liste de revue exportable.
- Agrégats communs par repository/composant/version, définitions près des chiffres et inconnues explicites.
- Prévisualisation isolée, matrice de validation et contrôles des neuf pages desktop/mobile.

## Préparation des références — non publiée

- Commande reference:prepare : profils GitHub locaux, référence fixture anonymisée, manifeste et rapport.
- Sélection explicite de paires system/catalogue pour les commandes existantes.
- Validation avant publication, refus des écrasements, restauration en cas d’erreur et protection de V1.
- Anonymisation des métadonnées du catalogue et mapping cohérent des labels de composants sur option.
- Tests, guide d’utilisation et proposition de ménage sans suppression des références existantes.

## Configurations et tests — non publié

- Sélection cohérente des paires system/catalogue de fixture ; refus des profils partiels.
- Tests isolés des configurations GitHub opérationnelles et quatre régressions ciblées.
- Guide des fichiers requis, de leur positionnement et du renouvellement des jeux anonymisés.

## Kit Codex / Copilot — non publié

- Consignes racine et locales, trois skills et six tâches VS Code.
- Contrôle `check:ai` intégré à npm et à la CI ; couverture du formatage étendue à `.agents/`.
- Index D/Q régénérable avec `ai:index:update`, sans modification des décisions.
- Références et chemins corrigés ; écart D-047 / date Done implémentée documenté.
- Tests de non-régression des métadonnées, tâches, liens, chemins et index.

## Consolidation dashboard V2.2 — non publiée

- Classification et états métier partagés ; Closed seul ne signifie plus traité ; audits annulés distincts.
- Verdicts composant × version et héritage cohérents entre pages ; photographies de release préservées.
- Analytics issues, statistiques dédupliquées, journal des transitions et chaîne de preuve exhaustive.
- Navigation contextuelle commune, explications des métriques, DQ-030 à DQ-032, contrôles clavier et mobile.
- Tests Vitest et Playwright/axe-core, TSDoc français, CI et documentation actualisés.

Voir le [rapport des dix chantiers](docs/08-implementation/dashboard-consolidation-complete.md).

## V11 — Documentation

- Ajout d'une documentation structurée par cadrage, métier, workflow, règles, indicateurs, données, architecture, décisions et implémentation.
- Ajout d'un dossier `presentation/` avec un socle commun et des supports par population.
- Les points non démontrés sont marqués explicitement « à confirmer », « question ouverte », « proposition » ou « non couvert ».
- Aucun changement fonctionnel volontaire du code n'est introduit par cette V11 documentaire.

## I5 — Data Quality V2

- ajoute DQ-017 à DQ-029 pour les ambiguïtés de canonicalisation, les spécialisations invalides et l'intégrité référentielle ;
- conserve les données sources et évite toute valeur/relation inventée ;
- déduplique les alertes DQ par règle et entité ;
- ajoute les tests de contrat Data Quality V2 et la documentation détaillée.

### I6 — Analytics V2 Component × Version

- matérialisation du verdict `NON_COUVERT` / `CONFORME` / `NON_CONFORME` sur `ComponentVersion` ;
- héritage des Audits terminés applicables et agrégation du dernier groupe d’Audits terminés par Version auditée ;
- conservation du verdict acquis lorsqu’un Audit plus récent reste incomplet ;
- absence de restauration automatique de conformité après simple correction d’une anomalie ;
- métriques historiques `componentVersion.*` avec séparation couverture / conformité ;
- propagation de la fiabilité Data Quality vers ces métriques.

## I7 — snapshots et historique

- distingue l'état d'une Version à sa Release de la connaissance actuelle ;
- empêche la rétroprojection des Audits de rattrapage et Anomalies postérieurs à la Release ;
- sélectionne le Snapshot précédent par `capturedAt` parmi les Snapshots de même scope/modelVersion/ruleVersion ;
- étend les diffs aux Versions et relations ComponentVersion ;
- utilise `correctedAt` comme preuve métier de correction dans les flows ;
- expose des séries de métriques fondées sur les valeurs persistées, sans recalcul du passé.
