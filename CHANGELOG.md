# Changelog

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
