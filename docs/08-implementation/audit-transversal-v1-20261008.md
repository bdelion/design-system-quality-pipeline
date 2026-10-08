# Audit transversal V1 — première passe

**Baseline :** `design-system-quality-pipeline-20261008-1928.zip`.

## Périmètre et niveau de preuve

Cette première passe est une revue statique ciblée des contrats, de la CI, des tests I9,
du générateur HTML et de l'outillage documentaire. Elle **ne constitue pas** un audit
exhaustif des décisions D-001 à D-147. Aucun test n'a été exécuté sur cette livraison.

| Priorité | Constat                                                                                                        | Action recommandée                                                                                            |
| -------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| P1       | Le dashboard contient des textes de statut et de version codés en dur (`À SURVEILLER`, `V2.1`) dans l'en-tête. | Distinguer statut calculé, version du produit et version du modèle ; ajouter des tests de restitution.        |
| P1       | Le générateur utilise une interpolation HTML dense.                                                            | Auditer l'échappement de chaque donnée affichée, les liens et la navigation clavier avant diffusion publique. |
| P1       | La matrice I9 conserve un bilan historique qui peut diverger des assertions désormais présentes.               | Réconcilier chaque ligne avec une assertion et la décision métier correspondante.                             |
| P1       | La CI n'impose pas encore un formatage reproductible.                                                          | Ajouter Prettier et `format:check` après la stabilisation du lockfile.                                        |
| P2       | Les commentaires TSDoc sont inégaux entre les API publiques.                                                   | Documenter progressivement les contrats et les fonctions métier, sans paraphraser le code.                    |
| P2       | Plusieurs projections `legacy` subsistent dans Analytics.                                                      | Conserver la compatibilité tant que les consommateurs ne sont pas migrés ; documenter la dépréciation.        |

## Garde-fous

- Aucun changement de formule KPI, de règle Data Quality ou de contrat RAW dans ce lot.
- Ne pas formatter les exports générés, snapshots, fixtures contractuelles ni données anonymisées sans revue des diffs.
- La documentation HTML TypeDoc est un artefact de build, non une source versionnée.
- L'étape suivante doit confronter le code aux décisions métier consolidées, règle par règle.
