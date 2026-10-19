# Liens du dashboard et temporalité — #86

Les tableaux de repositories et de composants affichent la date du snapshot et distinguent les recherches externes par « GitHub actuel ≈ ». Ce sont des recherches actuelles et approchées, jamais une liste exhaustive justifiant un compteur figé. Un snapshot du 1er octobre peut compter quatre issues ouvertes alors que GitHub en montre trois aujourd’hui : aucune actualisation des compteurs n’est effectuée par la navigation.

Les requêtes et le calcul des relations restent inchangés. Les liens directs d’audit, issue ou PR désignent une entité résolue du snapshot, dont le contenu GitHub peut évoluer. Sans résolution, la référence reste textuelle ; aucune racine GitHub ni ancre de substitution n’est inventée pour les PR du graphe. Les endpoints Enterprise configurés sont conservés.

Les identités historiques conservent leur preuve locale sur Audits. Aucun nouveau détail interne prétendant expliquer exactement les populations des recherches n’est ajouté : les recherches par labels, Issue Type ou références de corps de PR peuvent différer du périmètre collecté, notamment sur un snapshot partiel.

Validation : tests contractuels de génération, données partielles et Enterprise ; tests navigateur des libellés, liens et compteurs indépendants des résultats externes. Budgets de non-régression inchangés.

Le [benchmark de contrôle #86](benchmarks/issue-86-control.md), graine 81 et trois passages, respecte les budgets de croissance de 0 % face au contrôle #85 : aucune hausse HTML/JSON, des lignes ou du DOM. La référence approuvée de #85 reste inchangée. Les résultats sont synthétiques ; les durées restent indicatives et sans seuil.
