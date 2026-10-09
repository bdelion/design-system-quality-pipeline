# Patch ciblé — analyse des 10 écarts API/RAW

Copier les fichiers `scripts/diagnose-history.mjs` et `tests/diagnose-history.test.ts` dans le repository, puis placer le guide dans `docs/08-implementation/`.

Exécuter `npm.cmd run check` puis `npm.cmd run format:check`.

Pour l'exécution live, lire `docs/08-implementation/diagnostic-ecarts-historiques.md` et indiquer l'heure réelle de fin de collecte du RAW dans `--collected-at`.

Ce patch ne modifie pas `src/collectors/github.ts`, les calculs de KPI, ni le contrat I3. Il ne contient pas de données RAW.
