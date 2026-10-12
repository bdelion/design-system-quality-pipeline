# Anonymisation

Appliquer également les consignes racine `AGENTS.md`.

Préserver le déterminisme seed/alias et les références entre objets. Produire un dataset autonome cohérent depuis le même RAW, avec conventions et enrichissements embarqués. Ne pas anonymiser par défaut labels, state, issueType, statut Project ni titre/état Milestone ; les labels préfixés de composants suivent leurs alias seulement avec l’option explicite `--anonymize-components`. Conserver le diagnostic des relations manquantes, sans effacer silencieusement les objets. Utiliser les tests anonymization*.test.ts et datasets.test.ts.
