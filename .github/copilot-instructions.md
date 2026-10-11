# Instructions Copilot

Lire et appliquer `AGENTS.md` à la racine, puis les consignes du dossier concerné.
Projet Node.js/TypeScript ESM, pipeline GitHub en lecture seule, dashboard statique.
Répondre en français. Toute modification de code inclut les tests correspondants,
TSDoc français et mises à jour pertinentes de README/docs dans le même patch.
Distinguer décisions métier et état implémenté ; conserver les inconnues et la provenance.
Utiliser l'index `docs/08-implementation/ai-context-map.md` pour cibler les lectures.
Exécuter `npm run check` pour le code, `npm run check:dashboard` pour le dashboard.
Lire également les consignes des dossiers parents, notamment `src/AGENTS.md`.
Pour les consignes IA, exécuter `npm run check:ai` ; après évolution du registre,
régénérer l’index avec `npm run ai:index:update`.
Ne pas exposer les secrets ni modifier les données GitHub collectées.
Un commit, push ou changement externe exige une demande correspondante. Décrire exactement les validations exécutées.
Les skills partagées sont dans `.agents/skills/` ; charger seulement celle utile.
