---
name: dsq-business-review
description: 'Comparer décisions métier DSQ, documentation et implémentation ; utiliser pour une gap analysis, un arbitrage ou la cohérence des règles audits, versions et indicateurs. Ne pas appliquer de migration non demandée.'
---

# dsq-business-review

1. Lire `docs/README.md` et l’index `docs/08-implementation/ai-context-map.md`.
2. Rechercher les décisions par ID ou sujet dans `docs/08-implementation/ai-decisions-index.md`, puis lire leur texte exact dans `docs/00-cadrage/questions-ouvertes.md` ; l’index n’est pas normatif.
3. Lire les pages métier et contrats/tests correspondant au sujet, sans charger toute la documentation.
4. Présenter un tableau : règle et source, comportement observable, écart, action proposée, validation nécessaire.
5. Conserver distincts ÉTABLI, IMPLÉMENTÉ, PROPOSITION et QUESTION OUVERTE. Ne pas inventer un choix ni renuméroter les décisions.
6. Vérifier `npm run check:ai` après une évolution des consignes ou index ; régénérer l’index D/Q avec `npm run ai:index:update` si le registre a changé.
7. Si une mise à jour documentaire est demandée, modifier les pages dépendantes et les liens. Si du code est demandé, utiliser le workflow dsq-change.
