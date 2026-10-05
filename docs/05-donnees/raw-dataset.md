# RAW Dataset

Le RAW est le contrat d'entrée du pipeline.

## Champs importants

- Repository : id, name, owner, defaultBranch, issues, pullRequests.
- Issue : id, number, title, state, issueType, labels, component, criticities, parents, dates, linkedPullRequestIds, projectStatuses, milestone.
- Pull Request : id, number, state, mergedAt, relatedIssueIds.
- Milestone : id, number, title, state.

## Conservation sémantique

L'anonymisation doit conserver exactement les champs dont la valeur est une sémantique métier :

- labels ;
- state ;
- issueType ;
- projectStatuses[].status ;
- milestone.title ;
- milestone.state.

Les objets riches GitHub ne doivent pas être recopiés arbitrairement dans le RAW minimal.
