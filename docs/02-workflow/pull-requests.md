# Pull Requests

La source de workflow décrit notamment :

- une PR peut être Draft tant que les issues associées ne sont pas en In review ;
- elle peut devenir Open lorsque les issues associées sont en In review ;
- elle doit avoir un assignee ;
- en revue, elle a un ou plusieurs reviewers ;
- une PR fermée et mergée doit avoir des reviewers, au moins un approve, les discussions closes et les checks OK.

Le modèle RAW actuel ne conserve qu'un sous-ensemble : état, date de merge et relations vers les issues.

**Important :** les règles complètes de review ne peuvent donc pas être évaluées par le pipeline actuel avec les seules données du modèle RAW.
