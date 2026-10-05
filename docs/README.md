# Documentation du projet

Cette documentation constitue le référentiel documentaire du **Design System Quality Pipeline**.

## Règle de lecture

Les documents distinguent volontairement :

- **FAIT / IMPLÉMENTÉ** : observable dans le dépôt ou le code actuel ;
- **RÈGLE MÉTIER** : règle décrite dans les spécifications de fonctionnement ;
- **PROPOSITION** : recommandation issue des échanges de conception ;
- **À CONFIRMER** : information présente dans les sources mais dont la décision n'est pas arrêtée ;
- **QUESTION OUVERTE** : point explicitement non décidé ;
- **NON COUVERT** : information demandée mais absente des sources disponibles.

> **Principe anti-invention :** lorsqu'une information n'est pas démontrée par les sources du projet ou par les échanges de conception, elle n'est pas présentée comme une vérité. Elle est marquée explicitement.

## Parcours recommandé

| Besoin | Document |
|---|---|
| Comprendre le projet | `00-cadrage/vision.md` |
| Comprendre le périmètre | `00-cadrage/perimetre.md` |
| Comprendre les objets métier | `01-metier/modele-metier.md` |
| Comprendre le workflow | `02-workflow/README.md` |
| Connaître les règles | `03-regles/README.md` |
| Connaître les indicateurs | `04-indicateurs/catalogue-indicateurs.md` |
| Comprendre les données | `05-donnees/architecture-donnees.md` |
| Comprendre l'architecture logicielle | `06-architecture/architecture.md` |
| Comprendre les décisions | `07-decisions/README.md` |
| Développer | `08-implementation/guide-developpement.md` |
| Préparer une présentation | `../presentation/README.md` |

## Sources documentaires utilisées pour V11

- `specifications/gh-workflow.md` : description détaillée du fonctionnement GitHub et des workflows.
- `specifications/indicateurs-souhaites.md` : indicateurs souhaités, contraintes, règles et demandes client.
- `specifications/chatgpt-workflow-indicateurs-review.md` : analyse et recommandations issues des échanges de conception.
- `specifications/chatgpt-restructuration-repo.md` : proposition précédente de structuration documentaire.
- `docs/*.md` existants : documentation technique du dépôt.
- `src/domain/types.ts`, `src/analytics/catalog.ts`, `src/analytics/metrics.ts`, `src/quality/rules.ts`, `src/lib/metric-impacts.ts`, `src/pipeline.ts`, `src/snapshots/*` : état implémenté observé dans le ZIP V11 source.

## Hiérarchie de confiance

1. Code et tests pour décrire ce qui est **actuellement exécuté**.
2. Configuration versionnée pour décrire les paramètres actuellement actifs.
3. Spécifications métier pour décrire le **fonctionnement souhaité ou déclaré**.
4. Notes de conception pour les propositions et arbitrages.
5. Les documents V11 de synthèse ne doivent jamais transformer une hypothèse en règle validée.
