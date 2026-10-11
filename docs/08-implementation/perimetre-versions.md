# Périmètre des versions analysées — issue #39

**Implémenté** : la version du `package.json` racine, lue sur la branche par défaut de chaque repository, borne les versions analysées. Cette source respecte D-002 et D-004 : elle déclare une version nominale et ne prouve pas sa publication PROD.

Avec `package.json.version = 1.8.0`, les versions et milestones reconnues en 1.9.0, 2.0.0 ou 3.0.0 ne sont pas sélectionnables pour la conformité ni utilisées pour les analyses d'accessibilité. La comparaison des trois nombres est numérique : 1.10.0 dépasse 1.9.0. Les suffixes de construction (`-SNAPSHOT`, `-rc.1`) gardent la même version nominale M.m.r ; ils ne deviennent pas des tags PROD.

**Arbitrage utilisateur du 11 octobre 2026** : conserver les issues des milestones futures dans l'activité des équipes. Les stocks, statuts Project, délais des issues, liens et PR restent donc inclus. Leurs audits, anomalies et improvements n'alimentent pas les populations d'accessibilité. Un enfant explicitement rattaché à un unique audit futur est également hors de ces populations ; aucun audit de remplacement n'est attribué. Une issue sans milestone reste analysée selon les règles existantes, sans version inventée.

## Traçabilité et compatibilité

- RAW : `repositories[].packageManifest = { status: 'available', version: '1.8.0' }` ; `missing` pour HTTP 404, `invalid` pour un contenu non exploitable. Seule la version est conservée, jamais le package complet. Les erreurs de permission et d'API restent bloquantes et suivent les retries existants.
- Le RAW reste intégral : tags, milestones, issues, relations et catalogues futurs restent disponibles pour diagnostic. Le snapshot en garde une copie.
- Normalisation : versions et présences composant × version futures exclues ; `Issue.futureVersion` identifie les issues conservées dans l'activité mais hors populations d'accessibilité. Le libellé d'activité rend cette distinction visible.
- Un composant mentionné uniquement par une issue future n'entre pas dans le patrimoine courant sans autre preuve (catalogue, historique admissible ou issue non future). Les labels de cette issue restent conservés.
- Les catalogues historiques continuent de prouver la présence au tag exact ; le package ne remplace jamais cette preuve et n'attribue pas de verdict.
- [DQ-033](../quality-rules/DQ-033.md) signale une borne absente/invalide, notamment dans les anciennes fixtures. Leurs données restent exploitables avec une réserve ; on ne devine pas la version depuis un tag maximal, une milestone ou `auditVersion`.
- [DQ-034](../quality-rules/DQ-034.md) explique les versions écartées et la conservation de l'activité. Cette information n'est pas une erreur de données.
- Les réserves par bibliothèque sont comptées dans les périmètres du dashboard correspondant au repository sélectionné.

## Fixtures, références et snapshots

Une nouvelle collecte GitHub alimente automatiquement ce champ. `fixture:anonymize` et `reference:prepare` le préservent avec les versions et relations existantes : la borne ne contient aucune identité. Les anciens fichiers ne sont pas enrichis avec une version supposée. Pour une fixture ancienne, recollecter puis régénérer les références, ou ajouter la version uniquement à partir d'une preuve vérifiée du package sur la branche concernée.

```json
{
  "packageManifest": {
    "status": "available",
    "version": "1.8.0"
  }
}
```

Les sept profils system fournis utilisent `ruleVersion: dq-2026.10-version-scope`. Cette frontière empêche de comparer les populations anciennes et nouvelles ou de produire des flux de suppression trompeurs. Le modèle reste additif (2.2). Pour un profil personnel ou `config/local/` déjà généré, faire évoluer sa `ruleVersion` avant de rejouer le pipeline, ou régénérer le profil depuis les configurations mises à jour.

Cette entrée se place dans l'objet du repository RAW, **pas dans le catalogue YAML**. Ne pas changer `historicalCatalogues` pour simuler une borne. Rejouer ensuite le pipeline avec le profil fixture associé. Les snapshots existants restent immuables : régénérer un snapshot par le pipeline pour appliquer ce périmètre ; une simple régénération HTML d'un ancien snapshot ne renormalise pas ses données.

## Matrice de validation

| Besoin                  | Population / règle                         | Restitution                                  | Preuve automatisée                                                                                       |
| ----------------------- | ------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Borne par repository    | Version nominale <= package                | Filtres versions et conformité               | `tests/version-scope.test.ts` : égalité, antériorité, futur, 1.9/1.10, multi-repositories                |
| Activité conservée      | Toutes les issues et PR                    | Activité des équipes, libellé version future | Même test : stocks, PR, faits Analytics et HTML                                                          |
| Accessibilité bornée    | Audits et défauts des versions admissibles | Accessibilité et métriques communes          | Même test : audits, anomalies, enfants explicitement reliés, absence de rattachement inventé             |
| Présence historique     | Catalogue au tag exact admissible          | Composants × versions                        | Même test : deux présences, exclusion du composant futur seul                                            |
| Sources inconnues       | Ancien RAW, package absent/invalide        | Qualité des données et réserves              | Même test : DQ-033, conservation des données et impacts                                                  |
| Source collectée        | Package racine sur branche par défaut      | RAW et snapshot                              | Même test : HTTP 200/404/403, JSON invalide, branche encodée                                             |
| Anonymisation cohérente | Même borne sur la référence                | Fixture et profils de préparation            | Même test + suite anonymisation/références existante                                                     |
| Historique et filtres   | Versions normalisées admissibles           | Snapshot et pages générées                   | Même test : RAW intact, historique borné, filtre sans 1.9.0, DQ-034 visible                              |
| Non-régression UI       | Neuf pages et navigation existante         | Dashboard, clavier, WCAG A/AA                | `tests/browser/dashboard.spec.ts` et `tests/browser/version-scope.spec.ts` via `npm run check:dashboard` |

## Validation exécutée le 11 octobre 2026

`npm run check:dashboard` réussit sur la branche `fix/issue-39-version-scope` : kit IA, TypeScript, ESLint, TSDoc, 242 tests unitaires (42 fichiers), build, 23 tests navigateur, formatage et TypeDoc. Les tests navigateur couvrent les neuf pages, les anciens liens, les filtres, le clavier et WCAG A/AA ; le test ajouté vérifie le périmètre #39 avec des filtres repository actifs.

Les 29 cas de `tests/version-scope.test.ts` couvrent notamment la comparaison numérique, les sources absentes/invalides, les limites par repository, les populations, le pont legacy, les réserves filtrées, la conservation RAW, les snapshots et la séparation des versions de règles. `tests/reference-preparation.test.ts` vérifie en plus la borne préservée dans une référence préparée utilisable.

La collecte API est validée avec des réponses GitHub simulées ; aucune nouvelle collecte opérationnelle n'a été exécutée. Les fixtures et snapshots existants restent inchangés. Les anciennes références sans borne doivent être actualisées à partir d'une preuve package puis leur snapshot régénéré. Aucun commit ou push n'a été effectué.
