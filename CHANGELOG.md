# Changelog

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
