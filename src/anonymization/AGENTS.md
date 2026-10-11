# Anonymisation

Appliquer également les consignes racine `AGENTS.md`.

Préserver le déterminisme seed/alias et les références entre objets. Produire fixture, system et catalogue cohérents depuis le même RAW. Ne pas anonymiser par défaut labels, state, issueType, statut Project ni titre/état Milestone ; vérifier les contrats actuels avant toute évolution. Conserver le diagnostic des relations manquantes, sans effacer silencieusement les objets. Utiliser les tests anonymization*.test.ts et fixture-config.test.ts.
