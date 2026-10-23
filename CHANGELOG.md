# Changelog

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
