# Reconnaissance configurable des milestones

Dans `config/profiles/dsq.json`, la section `github.milestoneDetection` permet de reconnaître les versions associées aux milestones GitHub.

```yaml
github:
  milestoneDetection:
    caseSensitive: false
    patterns:
      - id: release
        regex: '^(?<version>\d+\.\d+\.\d+)$'
        kind: release
      - id: audit
        regex: '^(?<version>\d+\.\d+\.\d+)-Audit$'
        kind: audit
```

Les règles sont évaluées dans l'ordre et la première correspondance gagne. Chaque expression doit capturer `version` via un groupe nommé. `kind` distingue la convention de nommage (`release` ou `audit`), sans déduire à lui seul l'état de l'audit ni la publication d'une version. Les tags Git conservent leur validation stricte de version PROD.

Sans `milestoneDetection`, seule une milestone `x.y.z` est reconnue, comme auparavant. Une milestone `1.7.1-Audit` est associée à la version `1.7.1` ; la conformité dépend ensuite de la reconnaissance et de l'achèvement métier de l'audit. Les dates I3 ne sont pas assouplies.
