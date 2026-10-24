# Dashboard statique V2.2

Le dashboard est généré depuis un snapshot en lecture seule. Il conserve les sept pages historiques et ajoute accessibility.html et quality.html. Les six espaces principaux et leurs populations sont décrits dans la [matrice de refonte](../08-implementation/dashboard-role-refactor.md). Les pages historiques sont : `index.html` (synthèse), `issues.html` (toutes les issues), `components.html` (exploration par composant), `audits.html` (cycles de vie et composant × version), `anomalies.html` (spécialisation anomalies et DQ), `graph.html` (cartographie et chaîne de preuve exhaustive), `history.html` (stocks, flux et transitions).

## Responsabilités

- `src/domain/business.ts` : classification exclusive, statut actuel Project, Done ET Closed, annulation et cycle d'audit.
- `src/analytics/issues.ts`, `component-versions.ts`, `catalog.ts` : faits, verdicts et contrats des indicateurs.
- `src/analytics/statistics.js` : moyenne, médiane et P90 partagés avec le navigateur, déduplication et populations séparées.
- `src/dashboard/read-model.ts` : projection des preuves par snapshot ; aucune nouvelle attribution d'audit.
- `src/dashboard/page-read-model.ts`, `explorer-read-model.ts` : contrats versionnés par usage et projections des faits nécessaires ; aucun snapshot complet ni RAW distribué.
- `src/dashboard/assets/page-model.js` : lecture et validation communes du JSON intégré au document ; explication des contrats absents, invalides ou inconnus, sans zéro de substitution. Voir [ADR-005](../07-decisions/ADR-005-modeles-lecture-dashboard.md).
- `src/dashboard/evidence.ts` : sources, exclusions, formules, diagnostics et journal.
- `src/dashboard/assets/context.js` : intersection exacte du périmètre et propagation des liens.

Les cartes accessibilité suivent les agrégats pré-calculés du périmètre repository/composant/version. Les anciens agrégats du snapshot complet sont masqués en contexte filtré. Les tableaux et statistiques d'exploration suivent le contexte et la sélection. Un résultat par composant concerne sa dernière version PROD ; un filtre vers une autre version utilise la table des couples et ne présente pas ce résultat comme celui de la version filtrée. La couverture par repository de la page audits utilise les verdicts des dernières versions PROD, tandis que `portfolio.componentsAudited` mesure le patrimoine avec un audit terminé dans son historique : ces populations différentes sont nommées distinctement.

## Consultation et accessibilité

Servir le répertoire généré complet, HTML et assets d’une même génération, sur HTTP(S) avec un serveur de fichiers statiques : les modules JavaScript partagés nécessitent cette origine. Aucun serveur applicatif ni base de données n’est requis. Chaque page contient son JSON versionné ; chaque navigation indépendante le lit pour ses modules, sans garantie de cache ou parsing partagé entre documents. Un lien d’évitement, des contrôles nommés, un focus visible, des tableaux défilants accessibles au clavier et des annonces de filtrage assurent l’accès aux interactions. Les tests Playwright couvrent les parcours PC ; axe-core contrôle WCAG A/AA sur les neuf pages de son parcours automatique. Cela ne constitue pas un audit RGAA manuel.

## Compatibilité historique

Le modèle et les règles passent à `2.2` / `dq-2026.10-consolidation`. Aucun ancien fichier de snapshot n'est réécrit. Un diff n'est calculé qu'entre captures chronologiques au périmètre, modèle et règles compatibles. Une photographie à la publication déjà conservée dans un snapshot compatible est gelée ; les connaissances actuelles peuvent évoluer sans réécrire cette photographie. Sans capture ancienne compatible, la vue à la publication est une reconstruction avec les preuves temporelles disponibles et ne prétend pas connaître des événements manquants.

Voir le [contrat de cohérence](../08-implementation/dashboard-coherence.md) et le [rapport de validation](../08-implementation/dashboard-consolidation-complete.md).

## Consultation locale et diagnostics filtrables

La commande `npm run dashboard:serve` sert `data/dashboard` sur http://127.0.0.1:4174/ (interface locale uniquement, sans cache navigateur). Un dossier différent peut être passé en argument. En mode fichier, une indication explique la nécessité de HTTP et les contrôles interactifs sont désactivés.

Qualité des données présente un tableau : règle, sévérité, repository, type et identité de l’entité, diagnostic, action et effets sur les métriques. Les filtres repository/règle/sévérité/action/type/métrique et la recherche se combinent ; le compteur annonce les alertes affichées. Les repositories non prouvés restent « Non déterminé ». Les cartes accessibilité disposent d’une icône d’information accessible au clavier avec un nom décrivant le chiffre concerné.

La [refonte visuelle du dashboard](../08-implementation/dashboard-ui-redesign.md) décrit la palette, les références et les contrôles desktop/mobile.
