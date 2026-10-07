# Documentation du projet

Cette documentation constitue le référentiel documentaire courant du **Design System Quality Pipeline**.

Elle décrit à la fois le modèle métier visé, les décisions prises pendant le cadrage, l'architecture cible et, lorsque cela est utile, l'état actuellement implémenté dans le repository.

## Règle de lecture

Les documents distinguent volontairement les statuts suivants :

- **ÉTABLI / DÉCIDÉ** : décision métier explicitement validée et enregistrée dans le cadrage ;
- **FAIT / IMPLÉMENTÉ** : comportement observable dans le dépôt, le code, les tests ou la configuration actuels ;
- **RÈGLE MÉTIER** : règle de fonctionnement documentée ; son caractère établi, proposé ou encore à confirmer doit être explicite lorsque nécessaire ;
- **PROPOSITION** : recommandation ou cible issue des travaux de conception, non encore validée comme règle métier ;
- **À CONFIRMER / À INSTRUIRE** : information ou choix qui nécessite encore une décision ;
- **QUESTION OUVERTE** : point explicitement non décidé et conservé dans le registre des questions ;
- **NON COUVERT** : information demandée mais absente des sources disponibles ;
- **HISTORIQUE** : contenu conservé pour la traçabilité mais remplacé comme référence courante.

> **Principe anti-invention :** lorsqu'une information n'est pas démontrée par les sources du projet ou par les échanges de conception, elle n'est pas présentée comme une vérité. Elle est marquée explicitement.

## Sources de vérité selon la question posée

Il n'existe pas une source unique valable pour toutes les questions.

| Question | Source de référence |
|---|---|
| Quelle décision métier a été prise ? | `docs/00-cadrage/questions-ouvertes.md` et documents métier courants |
| Quel modèle métier voulons-nous construire ? | `docs/01-metier/`, puis les règles et décisions associées |
| Quel workflow cible est documenté ? | `docs/02-workflow/` et `docs/03-regles/` |
| Quels indicateurs voulons-nous produire ? | `docs/04-indicateurs/` |
| Quel comportement est réellement exécuté aujourd'hui ? | code, tests et configuration versionnés |
| Quelle était la demande ou la matière métier d'origine ? | `specifications/` |
| Pourquoi une décision d'architecture structurante a-t-elle été prise ? | `docs/07-decisions/` |
| Que disait une documentation remplacée ? | `docs/_historique/` lorsqu'elle y aura été archivée |

Une décision métier établie n'est pas invalidée parce que le code ne l'implémente pas encore. Dans ce cas, l'écart doit être traité comme un **écart entre cible et implémentation**, et non comme une contradiction à résoudre en faveur du code.

Inversement, la documentation ne doit pas prétendre qu'un comportement est déjà implémenté tant qu'il n'est pas observable dans le code, les tests ou la configuration.

## Registre des décisions et questions

`00-cadrage/questions-ouvertes.md` conserve les décisions `D-xxx` et les questions `Q-xxx` avec des identifiants stables.

Principes :

- un identifiant existant n'est pas renuméroté ;
- une question résolue reste dans le registre et change de statut ;
- une décision établie n'est pas supprimée silencieusement ;
- une décision devenue obsolète doit être explicitement remplacée ou amendée avec traçabilité ;
- les nouveaux documents de synthèse doivent respecter les décisions déjà établies et signaler les éventuelles incohérences.

Le registre n'a pas vocation à remplacer les documents métier thématiques : il assure la traçabilité des arbitrages, tandis que les documents thématiques présentent le modèle consolidé.

## Parcours recommandé

| Besoin | Document |
|---|---|
| Comprendre le projet | `00-cadrage/vision.md` |
| Comprendre le périmètre | `00-cadrage/perimetre.md` |
| Consulter les décisions et questions | `00-cadrage/questions-ouvertes.md` |
| Comprendre les objets métier | `01-metier/modele-metier.md` |
| Comprendre le workflow | `02-workflow/README.md` |
| Connaître les règles | `03-regles/README.md` |
| Connaître les indicateurs | `04-indicateurs/catalogue-indicateurs.md` |
| Comprendre les données | `05-donnees/architecture-donnees.md` |
| Comprendre l'architecture logicielle | `06-architecture/architecture.md` |
| Comprendre les décisions d'architecture | `07-decisions/README.md` |
| Développer | `08-implementation/guide-developpement.md` |
| Préparer une présentation | `../presentation/README.md` |

## Rôle de `specifications/`

Le dossier `specifications/` conserve les **sources métier, demandes initiales et matériaux de conception** ayant servi au cadrage.

Il n'est pas destiné à devenir une seconde documentation normative concurrente de `docs/`.

Tant que leur contenu n'a pas été complètement consolidé, certaines spécifications restent indispensables pour comprendre l'origine d'une règle ou d'un besoin. Elles ne doivent donc pas être supprimées ou archivées prématurément.

Voir `../specifications/README.md` pour la gouvernance détaillée de ce dossier.

## Documentation historique

Le dossier `_historique/` est réservé aux documents qui ont été **remplacés comme référence courante**, mais que le projet souhaite conserver pour la traçabilité.

Un document ne doit y être déplacé qu'après vérification que :

1. son contenu encore valide a été repris dans la documentation courante ;
2. ses informations uniques utiles ont été conservées ;
3. les liens vers la documentation courante ont été corrigés ;
4. son archivage ne supprime aucune source nécessaire à la compréhension du modèle actuel.

Voir `_historique/README.md`.

## Sources documentaires utilisées pendant la consolidation

Parmi les principales sources présentes dans le repository :

- `specifications/gh-workflow.md` : description détaillée du fonctionnement GitHub et des workflows ;
- `specifications/indicateurs-souhaites.md` : indicateurs souhaités, contraintes, règles et demandes client ;
- `specifications/chatgpt-workflow-indicateurs-review.md` : analyse et recommandations issues des échanges de conception ;
- `specifications/chatgpt-restructuration-repo.md` : proposition précédente de structuration documentaire ;
- les anciens `docs/*.md` : documentation technique à migrer progressivement vers l'arborescence structurée ;
- le code, les tests et la configuration : état effectivement implémenté.

Ces sources n'ont pas toutes le même statut. Leur présence ne suffit pas à transformer leur contenu en décision métier établie.

## Hiérarchie de confiance

La confiance dépend de la nature de l'information recherchée :

1. **Décision métier établie** : registre D/Q et documentation métier consolidée ;
2. **État réellement exécuté** : code, tests et configuration versionnés ;
3. **Besoin ou fonctionnement déclaré à l'origine** : spécifications métier sources ;
4. **Architecture cible ou arbitrage structurant** : documentation d'architecture et ADR ;
5. **Proposition de conception** : notes d'analyse et de conception ;
6. **Historique** : documents remplacés, conservés uniquement pour traçabilité.

En cas d'écart entre deux niveaux, l'écart doit être documenté. Il ne doit pas être résolu silencieusement en réécrivant l'un des deux.

## Politique de migration documentaire

La réorganisation documentaire suit une migration progressive :

1. identifier l'ancien document et sa destination cible ;
2. comparer les contenus ;
3. migrer les informations encore valides ;
4. distinguer explicitement état actuel, cible et points ouverts ;
5. vérifier qu'aucune information utile n'est perdue ;
6. corriger les références ;
7. seulement ensuite déplacer l'ancien document dans `_historique/`.

Aucun déplacement massif de l'ancienne documentation n'est attendu tant que cette vérification n'a pas été réalisée sujet par sujet.
