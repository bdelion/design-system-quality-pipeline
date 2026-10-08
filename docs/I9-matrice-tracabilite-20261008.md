# I9 — Matrice de traçabilité des 19 scénarios V1

**Référence :** ZIP `design-system-quality-pipeline-20261008-0727.zip`. **Méthode :** inspection statique de `fixtures/v1-reference.json`, `tests/v1-reference-scenario.test.ts` et section 14.4 du plan. Aucun test exécuté dans cette revue.

**Lecture :** « Couvert » signifie qu’une assertion ciblée vérifie le comportement principal ; « Partiel » signifie que les données existent mais que le contrat n’est pas suffisamment asserté. Ce n’est pas un résultat d’exécution Vitest.

| # | Scénario | Données de fixture | Preuve automatisée / lacune | Statut |
|---:|---|---|---|---|
| 1 | Plusieurs repositories | `lib-core, lib-react, lib-docs` | normalized.libraries length = 3 | **Couvert** |
| 2 | Component Catalogue sans Issue | `Tabs` | discoverySource=catalogue; absence d’Issue non assertée | **Partiel** |
| 3 | Issue transverse sans Component | `epic-transverse` | componentIds=[] | **Couvert** |
| 4 | Issue multi-Component | `feature-multi` | componentIds length=2 | **Couvert** |
| 5 | Bug hors Audit | `bug-outside` | origin=HORS_AUDIT | **Couvert** |
| 6 | Audit pré-PROD conforme | `audit-button-v1` | Aucune assertion ciblée sur statut et chronologie | **Partiel** |
| 7 | Audit pré-PROD non conforme avec anomalies | `audit-modal-v11-preprod, bug-modal-preprod` | statut, dates, anomalie associée | **Couvert** |
| 8 | RC auditée explicite | `1.1.0-rc.2` | RC, tag et createdAt | **Couvert** |
| 9 | Audit de rattrapage post-PROD | `audit-modal-v11` | absent atRelease, présent currentKnowledge; date post-PROD non assertée | **Partiel** |
| 10 | Audit incomplet plus récent | `audit-button-v11-incomplete` | aucune assertion ciblée sur incomplétude et priorité | **Partiel** |
| 11 | Anomalie corrigée avec date Done | `bug-button-focus` | correctedAt et everCorrected | **Couvert** |
| 12 | Anomalie encore ouverte | `bug-modal-a11y` | aucune assertion ciblée sur état ouvert et non corrigé | **Partiel** |
| 13 | DQ Done/Closed incohérent | `bug-outside` | DQ-013 sur anomalyId | **Couvert** |
| 14 | Criticité RGAA manquante | `bug-modal-a11y` | DQ-001 présent, sans liaison assertée à anomalyId | **Partiel** |
| 15 | Deux Versions, Catalogues historiques différents | `lib-core 1.0.0 et 1.1.0` | versions length=4; catalogues par version non comparés | **Partiel** |
| 16 | Component ajouté entre Versions | `Modal absent 1.0.0, présent 1.1.0` | pas d’assertion d’appartenance historique | **Partiel** |
| 17 | Tag/Catalogue historique manquant → unknown | `lib-react 2.0.0 missing; lib-docs 3.0.0 invalid` | pas d’assertion unknown | **Partiel** |
| 18 | PR mergée reliée à Anomalie | `bug-button-focus` | merged et relatedIssueIds | **Couvert** |
| 19 | État à la Release vs connaissance actuelle | `Modal 1.1.0` | audit catch-up absent puis présent, verdicts vérifiés | **Couvert** |

**Bilan : 10/19 couverts par assertions ciblées, 9/19 partiels.**

## Actions de clôture recommandées

1. Renforcer les assertions des scénarios partiels, notamment #6, #9, #10, #12, #15, #16 et #17.
2. Vérifier explicitement que `DQ-001` concerne `bug-modal-a11y` (#14).
3. Asserter la composition historique des Catalogues pour les versions 1.0.0 et 1.1.0, et les états `unknown` (#15–17).
4. Ajouter un contrôle d’anonymisation sur la fixture ou une fixture représentative : conservation des relations, chronologie relative, absence de fuite, validation structurelle.
5. Exécuter `npm.cmd run check` et les tests d’anonymisation en CI avant de déclarer I9 terminé.

**Décision :** ne pas déclarer I9 terminé sur la seule base du GREEN actuel ; la couverture contractuelle doit être renforcée.
