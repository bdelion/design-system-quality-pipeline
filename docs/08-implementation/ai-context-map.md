# Index de contexte pour les agents

Lire uniquement la ligne liée à la demande, puis les sources utiles. Tous les chemins
entre backticks sont relatifs à la racine du dépôt. Les noms de tests sont des points
de départ, pas une liste exhaustive. `npm run check:ai` contrôle ces chemins et l’index D/Q.

| Sujet                          | Sources utiles                                                                                                           | Code et tests de départ                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Gouvernance et décisions       | `docs/README.md` ; `docs/08-implementation/ai-decisions-index.md`, puis extrait du registre                              | `README.md` ; `docs/08-implementation/plan-implementation-v1.md`                                                                     |
| Audits, versions, conformité   | `docs/01-metier/audits.md` ; `docs/01-metier/versions-et-releases.md` ; `docs/04-indicateurs/audits-accessibilite.md`    | `src/domain/business.ts` ; `src/normalizers/github.ts` ; `tests/component-version-analytics-i6.test.ts`                              |
| Collecte GitHub et historique  | `docs/08-implementation/diagnostic-historique-github.md` ; `docs/02-workflow/projets.md`                                 | `src/collectors/github.ts` ; `tests/github-collector.test.ts` ; `tests/history-coverage.test.ts`                                     |
| Anonymisation et fixtures      | `docs/08-implementation/anonymisation-v2.md` ; `docs/08-implementation/fixtures.md`                                      | `src/anonymization/` ; `src/datasets.ts` ; `tests/anonymization.test.ts` ; `tests/datasets.test.ts`                                  |
| Data Quality                   | `docs/03-regles/regles-qualite-donnees.md` ; `docs/quality-rules.md` ; fiche DQ concernée                                | `config/quality-rules.yaml` ; `src/quality/rules.ts` ; `tests/data-quality-v2-i5.test.ts`                                            |
| Dates et délais                | `docs/01-metier/audits.md` ; `docs/08-implementation/kpi-delais-correction.md`                                           | `src/normalizers/github.ts` ; `src/analytics/` ; `tests/business-dates-i3.test.ts`                                                   |
| Dashboard et filtres           | `docs/06-architecture/dashboard.md` ; `docs/08-implementation/dashboard-coherence.md`                                    | `src/dashboard/` ; `tests/dashboard-context-filter-contract.test.ts` ; `tests/browser/dashboard.spec.ts`                             |
| Pipeline et snapshots          | `docs/06-architecture/pipeline.md` ; `docs/06-architecture/snapshot-engine.md`                                           | `src/pipeline.ts` ; `src/snapshots/` ; `tests/pipeline.test.ts` ; `tests/snapshot.test.ts`                                           |
| Consignes IA et outils VS Code | `AGENTS.md` ; `docs/08-implementation/codex-copilot-vscode.md` ; `docs/08-implementation/ai-configuration-validation.md` | `scripts/ai-config.mjs` ; `scripts/check-ai-config.mjs` ; `scripts/update-ai-decisions-index.mjs` ; `tests/ai-configuration.test.ts` |

## Décisions, implémentation et écarts à vérifier

- **ÉTABLI — D-047** : l’audit est terminé lorsque Project Done et GitHub Closed sont tous deux satisfaits. Sa date de réalisation est l’instant où la seconde condition est satisfaite. Lire `docs/00-cadrage/questions-ouvertes.md` et `docs/01-metier/audits.md`.
- **IMPLÉMENTÉ — contrat V3** : `auditCompletedAt` retient la dernière transition Project Done connue, sans substitution par `closedAt`. Ce calcul n’est pas identique à D-047 lorsque la fermeture intervient ensuite. **ÉCART À ARBITRER** : ne pas le présenter comme une décision établie ni migrer le code sans demande.
- **ÉTABLI — D-238** : cardinalité 0..n Components des anomalies HORS_AUDIT ; cette décision ne porte pas sur les dates d’audit.
- **IMPLÉMENTÉ** : un BUG configuré ne prouve pas une qualification RGAA ; lire `docs/01-metier/anomalies.md`.
- La correction seule d’une anomalie ne rétablit pas le verdict de conformité ; lire les règles d’audits applicables dans `docs/01-metier/audits.md` avant de modifier les KPI.

Ces rappels orientent la recherche. En cas de divergence, consulter les décisions
et signaler l’écart ; cet index ne constitue pas une nouvelle règle métier.
