# Design System Quality Pipeline

Pipeline Node.js et TypeScript, en lecture seule côté GitHub, pour collecter et analyser les données de qualité de plusieurs librairies de Design System.

Le pipeline collecte des données GitHub ou lit une fixture locale, les normalise, évalue leur qualité, calcule des indicateurs et produit un snapshot ainsi qu'un dashboard HTML statique.

> **État actuel :** la migration vers le modèle V1 est en cours sur la branche `feature/dashboard-v1-i0-i9`. Les décisions métier et le plan décrivent la cible ; ils ne signifient pas que toutes les fonctionnalités correspondantes sont déjà implémentées.

La porte d'entrée de la documentation est [`docs/README.md`](docs/README.md).

## Pipeline actuel

```text
GitHub / Fixture
       │
       ▼
     RAW
       │
       ▼
 Normalisation
       │
       ▼
 Data Quality
       │
       ▼
 KPI / Analytics
       │
       ▼
 Snapshot
       │
       ▼
 Dashboard statique
```

Principes structurants :

- collecte GitHub en lecture seule ;
- conservation explicite des données nécessaires au diagnostic ;
- absence de conversion silencieuse d'une donnée inconnue ou invalide en `0`, `false` ou « conforme » ;
- contrôles Data Quality non bloquants lorsqu'une donnée métier est incomplète mais exploitable ;
- KPI accompagnés de leur périmètre et de leur fiabilité ;
- snapshots rejouables et comparables ;
- normalisation déterministe à dataset brut et configuration identiques.

## Cible V1 et état d'avancement

Le modèle cible distingue notamment :

- `Issue`, conservée comme fait GitHub générique ;
- `Audit`, `Anomaly` et `AuditImprovement`, spécialisations référencées de l'Issue ;
- `Version`, identifiée par la version PROD canonique et son Git tag ;
- `Component`, avec identité métier stable ;
- la relation historique `Component × Version` issue du Catalogue au tag de la Version ;
- les contextes GitHub Projects et leur historique de statuts ;
- `Anomaly.origin = AUDIT | HORS_AUDIT | UNDETERMINED`.

Pour un couple `Component × Version`, la couverture nécessite au moins un Audit terminé applicable. Le verdict courant est calculé à partir de **l'ensemble des Audits terminés applicables**. Un Audit incomplet ne modifie pas le verdict acquis et la seule correction d'une anomalie ne rétablit pas la conformité : un nouvel Audit terminé applicable doit la valider.

Les lots avancent progressivement :

| Lot | État | Avancement |
|---|---|---|
| I1 — Contrats de domaine | Terminé | Contrats V1, préservation des Issues génériques, intégrité des relations et déterminisme. |
| I2 — Collecte GitHub | Partiel | Collecte des Components, parents, champs et historique Projects, tags PROD/RC. La validation avec l'organisation cible et le nom du champ RC auditée restent à établir. |
| I3 — Normalisation métier | Implémenté | Les entités V1 et leurs relations sont normalisées ; les cardinalités invalides, relations ambiguës et incohérences sont conservées et signalées par Data Quality. |
| I4 — Catalogue historique | Implémenté, validation réelle en attente | Le pipeline lit le Catalogue au tag PROD exact, conserve sa provenance et matérialise `Component × Version` ; aucun fallback au Catalogue courant. La validation reste à faire contre les droits et repositories de l’organisation cible. |
| I5 — Data Quality V1 | Implémenté, décision métier en attente | Les règles DQ V1 couvrent les spécialisations, relations, statuts, tags et Catalogues historiques. La sémantique de `Cancelled` reste inconnue tant que Q-022 n’est pas tranchée. |
| I6 — Analytics V1 | Implémenté | Les métriques consomment les objets V1, les appartenances historiques et les dates métier ; les valeurs non établies restent `unknown`. La validation sur la collecte réelle reste à faire. |
| I7 — Snapshots et historique | Implémenté | Les diffs consomment les Anomalies V1 ; les projections « à la Release » et « connaissance actuelle » sont matérialisées séparément. |
| I8 — Dashboard V1 | Implémenté | Les vues Anomalies, Audits, Cartographie et Historique consomment les contrats V1, y compris les verdicts inconnus et les états temporels. |
| I9 — Fixtures et non-régression | Implémenté | Une fixture synthétique de référence couvre le pipeline V1 de bout en bout ; les scénarios ciblent aussi les Catalogues historiques, métriques, spécialisations et projections temporelles. |

La fixture `fixtures/my-real-dataset-anonymized.json` est une capture antérieure à l'enrichissement I2. Elle contient 1 716 Issues, mais pas les relations parent, les transitions Projects, les champs Project ni les tags. Elle est utile pour tester la compatibilité avec les données historiques, mais ne valide pas la collecte enrichie et ne permet pas de déduire les relations ou les dates absentes. Son catalogue associé ne fournit pas non plus un rattachement vérifié aux repositories anonymisés. La fixture synthétique `fixtures/v1-reference.json` et ses Catalogues historiques sont la référence des tests de bout en bout V1.

Le Catalogue historique d’une Version publiée est lu dans `config/catalogue.yaml` au tag PROD exact, via l’API GitHub. Une Version sans tag, un Catalogue absent ou un Catalogue invalide restent présents mais portent un état historique `unknown` et une alerte Data Quality ; le Catalogue courant n’est jamais substitué. Les métriques de couverture reposent sur les relations `Component × Version`, et les vues historiques distinguent l’état à la Release de la connaissance actuelle.

La définition normative et le plan de migration sont documentés dans :

- [`docs/00-cadrage/questions-ouvertes.md`](docs/00-cadrage/questions-ouvertes.md) — registre stable des décisions `D-xxx` et questions `Q-xxx` ;
- [`docs/01-metier/objets-metier.md`](docs/01-metier/objets-metier.md) — objets métier consolidés ;
- [`docs/05-donnees/modele-normalise.md`](docs/05-donnees/modele-normalise.md) — modèle normalisé cible ;
- [`docs/08-implementation/plan-implementation-v1.md`](docs/08-implementation/plan-implementation-v1.md) — séquence d'implémentation V1.

## Prérequis

- Node.js **22.15.0 ou supérieur** ;
- version de référence du repository : **22.23.3** (`.nvmrc`) ;
- npm.

Sous Windows avec `nvm-windows` :

```powershell
nvm install 22.23.3
nvm use 22.23.3
node --version
npm --version
```

Si PowerShell bloque `npm.ps1`, utiliser `npm.cmd`.

## Installation et vérifications

Installation reproductible depuis le lockfile :

```bash
npm ci
```

Gates de qualité :

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Exécuter le pipeline

La source par défaut est la fixture de démonstration `fixtures/github.json` :

```bash
npm run pipeline
```

Pour exécuter le pipeline sur la fixture réaliste anonymisée de référence :

```bash
npm run pipeline -- --source fixture --fixture fixtures/my-real-dataset-anonymized.json
```

La fixture utilise des fichiers de configuration dédiés :

```text
config/system.my-real-dataset-anonymized.yaml
config/catalogue.my-real-dataset-anonymized.yaml
```

La fixture est antérieure aux champs enrichis I2 ; utilisez-la pour les tests de compatibilité, pas comme preuve de bon fonctionnement de ces champs. Les petites fixtures synthétiques restent adaptées aux tests unitaires ciblés.

### Étapes disponibles

```bash
npm run collect
npm run validate
npm run analyze
npm run snapshot
npm run dashboard
npm run pipeline
```

Le pipeline produit un statut `COMPLETE` ou `PARTIAL`. `PARTIAL` signifie que l'exécution est terminée mais que certaines données ou métriques portent des réserves de qualité.

## Collecte GitHub

Le collecteur GitHub est en lecture seule. Le token est fourni uniquement par l'environnement et ne doit pas être inscrit dans un fichier versionné :

Créez d'abord le dossier de sortie s'il n'existe pas :

```powershell
New-Item -ItemType Directory -Force data/raw
```

Puis lancez la collecte :

```powershell
$env:GITHUB_TOKEN = "..."
npm.cmd run collect -- --source github --output data/raw/my-real-dataset.json
```

Pour GitHub Enterprise, les URLs sont configurées dans `.env` :

```text
GITHUB_API_URL=...
GITHUB_GRAPHQL_URL=...
GITHUB_URL=...
```

Le fichier `.env` et les données RAW réelles ne doivent pas être versionnés.

## Anonymisation et validation d'une fixture réelle

Pour utiliser une nouvelle collecte comme fixture de travail, gardez d'abord le RAW réel local, puis anonymisez-le :

```bash
npm run fixture:anonymize -- --input data/raw/my-real-dataset.json --output fixtures/my-real-dataset-anonymized.json
```

L'anonymisation génère également les configurations dédiées à cette fixture. Elle est déterministe à partir de sa seed. Vérifiez les fichiers générés et la cohérence du catalogue anonymisé avec les repositories avant de les utiliser dans le pipeline.

Validation :

```bash
npm run fixture:validate -- --input fixtures/my-real-dataset-anonymized.json
```

Un rapport Markdown est produit à côté de la fixture. La commande vérifie les données personnelles détectables et l'intégrité des relations ; elle ne garantit pas à elle seule que toutes les informations métier nécessaires sont présentes.

Un manifeste local de traçabilité RAW peut également être généré :

```text
fixtures/my-real-dataset-anonymized.json.trace.json
```

Ce manifeste peut contenir des identifiants de la source réelle. Ne le partagez pas et ne le versionnez pas ; les fichiers `*.trace.json` sont exclus par `.gitignore`.

Pour enrichir le rapport de validation avec cette trace :

```bash
npm run fixture:validate -- --input fixtures/my-real-dataset-anonymized.json --trace fixtures/my-real-dataset-anonymized.json.trace.json
```

Voir [`docs/08-implementation/anonymisation.md`](docs/08-implementation/anonymisation.md) et [`docs/08-implementation/fixtures.md`](docs/08-implementation/fixtures.md).

## Dashboard et sorties

Après génération, le dashboard statique est disponible dans :

```text
data/dashboard/index.html
```

Les données courantes et l'historique des exécutions sont produits sous :

```text
data/current/
data/runs/
```

Le dashboard est une projection du modèle et des analytics. Il ne doit pas recalculer les règles métier.

## Structure du repository

```text
config/                  Configuration du système, du catalogue et des règles
fixtures/                Fixtures locales et anonymisées
src/
  collectors/            Collecte RAW
  normalizers/           Normalisation métier
  quality/               Contrôles Data Quality
  analytics/             Métriques et KPI
  snapshots/             Snapshots et comparaison
  dashboard/             Dashboard statique
  anonymization/         Anonymisation et validation
  domain/                Contrats de données
  cli.ts                 CLI
tests/                   Tests
docs/                    Documentation courante
specifications/          Sources métier et matériaux de conception
presentation/            Supports de présentation
```

## Documentation

Le README reste volontairement synthétique. Utiliser [`docs/README.md`](docs/README.md) comme index.

Parcours principaux :

| Besoin | Document |
|---|---|
| Vision et périmètre | [`docs/00-cadrage/vision.md`](docs/00-cadrage/vision.md) |
| Décisions et questions | [`docs/00-cadrage/questions-ouvertes.md`](docs/00-cadrage/questions-ouvertes.md) |
| Modèle métier | [`docs/01-metier/modele-metier.md`](docs/01-metier/modele-metier.md) |
| Audits | [`docs/01-metier/audits.md`](docs/01-metier/audits.md) |
| Workflow GitHub | [`docs/02-workflow/README.md`](docs/02-workflow/README.md) |
| Règles | [`docs/03-regles/README.md`](docs/03-regles/README.md) |
| Indicateurs | [`docs/04-indicateurs/catalogue-indicateurs.md`](docs/04-indicateurs/catalogue-indicateurs.md) |
| Architecture des données | [`docs/05-donnees/architecture-donnees.md`](docs/05-donnees/architecture-donnees.md) |
| Architecture logicielle | [`docs/06-architecture/architecture.md`](docs/06-architecture/architecture.md) |
| Développement | [`docs/08-implementation/guide-developpement.md`](docs/08-implementation/guide-developpement.md) |
| Plan V1 | [`docs/08-implementation/plan-implementation-v1.md`](docs/08-implementation/plan-implementation-v1.md) |
| Data Quality | [`docs/quality-rules.md`](docs/quality-rules.md) |

`specifications/` conserve les sources et demandes ayant alimenté le cadrage ; il ne remplace pas la documentation normative courante.

## Sécurité

Ne jamais versionner :

- tokens GitHub ;
- `.env` contenant des secrets ;
- RAW issus d'un environnement réel ;
- manifestes de trace RAW ;
- fichiers contenant des données personnelles ou confidentielles.

## État d'implémentation

La branche contient une baseline exécutable, les contrats de domaine V1 et une première partie de la collecte et de la normalisation V1. Les consommateurs d'analytics et le dashboard ne sont pas encore migrés vers l'ensemble du modèle V1 ; ils restent à traiter dans les lots suivants. Consultez le plan d'implémentation pour les prérequis et critères d'acceptation de chaque lot.

**Version du package :** `0.1.0`
**Stack :** Node.js 22 · TypeScript · Commander · Vitest · ESLint
**Modèle configuré actuel :** `2.1`
