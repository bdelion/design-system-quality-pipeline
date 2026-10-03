# Périmètre

## Couvert actuellement

- Repositories GitHub configurés.
- Issues.
- Pull Requests.
- Statuts de projets collectés dans le RAW.
- Milestones collectées dans le RAW.
- Labels conservés dans le RAW.
- Issue Type conservé dans le RAW.
- Catalogue de composants YAML.
- Normalisation vers libraries, components, audits, anomalies et pull requests.
- Data Quality DQ-001 à DQ-010.
- Métriques V2 actuellement déclarées dans `src/analytics/catalog.ts`.
- Snapshots et diff de snapshots.
- Dashboard HTML statique.
- Fixture et anonymisation.

## Partiellement couvert / à confirmer

- Sprints / Iterations : présents dans les besoins métier, mais le modèle RAW actuel observé dans le ZIP ne contient pas encore un objet Iteration dédié.
- Velocity : demandée dans les spécifications, mais absente du `RawIssue` actuel observé dans `src/domain/types.ts`.
- Créateur / assignee : demandés dans les indicateurs, mais absents du modèle RAW actuel observé.
- Branches : évoquées dans le workflow, mais absentes du modèle RAW actuel observé.
- Commentaires utilisés pour identifier les PR : évoqués dans les règles, mais non représentés comme objets dans le RAW actuel.
- Applications consommatrices : demandées par le client, mais aucune source d'application n'est présente dans le modèle actuel.
- Fréquence d'utilisation des composants : demandée, mais aucune source d'usage n'est actuellement définie.
- Nexus : le modèle possède `nexusAvailable`, mais aucune métrique `portfolio.release.*` n'est actuellement déclarée dans le catalogue V2.

## Hors périmètre actuel / non démontré

Aucune base documentaire disponible ne permet d'affirmer que le projet dispose aujourd'hui d'une API, d'un backend persistant ou d'une base SQL.
