# Design System Quality Pipeline

Pipeline Node.js + TypeScript, en lecture seule côté GitHub, destiné au suivi de la qualité de plusieurs librairies de Design System.

Le projet collecte des données GitHub, les normalise dans un modèle métier, contrôle leur qualité, calcule des indicateurs, produit des snapshots et génère un dashboard HTML statique.

> **État du projet :** la documentation métier V1 a été consolidée jusqu'à D-243. Le code présent dans la branche reflète encore le modèle antérieur sur plusieurs points ; le plan d'implémentation V1 décrit la migration à réaliser. Une décision métier établie n'est donc pas nécessairement déjà implémentée.

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

## Cible V1 en cours d'implémentation

Le modèle cible distingue notamment :

- `Issue`, conservée comme fait GitHub générique ;
- `Audit`, `Anomaly` et `AuditImprovement`, spécialisations référencées de l'Issue ;
- `Version`, identifiée par la version PROD canonique et son Git tag ;
- `Component`, avec identité métier stable ;
- la relation historique `Component × Version` issue du Catalogue au tag de la Version ;
- les contextes GitHub Projects et leur historique de statuts ;
- `Anomaly.origin = AUDIT | HORS_AUDIT | UNDETERMINED`.

Pour un couple `Component × Version`, la couverture nécessite au moins un Audit terminé applicable. Le verdict courant est calculé à partir de **l'ensemble des Audits terminés applicables**. Un Audit incomplet ne modifie pas le verdict acquis et la seule correction d'une anomalie ne rétablit pas la conformité : un nouvel Audit terminé applicable doit la valider.

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
npm run pipeline --   --source fixture   --fixture fixtures/my-real-dataset-anonymized.json
```

Cette fixture est associée à :

```text
config/system.my-real-dataset-anonymized.yaml
config/catalogue.my-real-dataset-anonymized.yaml
```

Les petites fixtures synthétiques restent adaptées aux tests unitaires ciblés ; `fixtures/my-real-dataset-anonymized.json` constitue la référence réaliste pour les tests d'intégration, métier et de non-régression.

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

Le collecteur GitHub est en lecture seule. Le token est fourni uniquement par l'environnement :

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

Chaîne recommandée :

```bash
npm run fixture:anonymize --   --input data/raw/my-real-dataset.json   --output fixtures/my-real-dataset-anonymized.json
```

L'anonymisation génère également les configurations associées à la fixture. Elle est déterministe à partir de sa seed.

Validation :

```bash
npm run fixture:validate --   --input fixtures/my-real-dataset-anonymized.json
```

Un rapport Markdown est produit à côté de la fixture. Un manifeste local de traçabilité RAW peut également être généré :

```text
fixtures/my-real-dataset-anonymized.json.trace.json
```

Ce manifeste peut contenir des identifiants de la source réelle. Il est local uniquement et les fichiers `*.trace.json` sont exclus par `.gitignore`.

Pour enrichir le rapport de validation avec cette trace :

```bash
npm run fixture:validate --   --input fixtures/my-real-dataset-anonymized.json   --trace fixtures/my-real-dataset-anonymized.json.trace.json
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

| Besoin                   | Document                                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| Vision et périmètre      | [`docs/00-cadrage/vision.md`](docs/00-cadrage/vision.md)                                               |
| Décisions et questions   | [`docs/00-cadrage/questions-ouvertes.md`](docs/00-cadrage/questions-ouvertes.md)                       |
| Modèle métier            | [`docs/01-metier/modele-metier.md`](docs/01-metier/modele-metier.md)                                   |
| Audits                   | [`docs/01-metier/audits.md`](docs/01-metier/audits.md)                                                 |
| Workflow GitHub          | [`docs/02-workflow/README.md`](docs/02-workflow/README.md)                                             |
| Règles                   | [`docs/03-regles/README.md`](docs/03-regles/README.md)                                                 |
| Indicateurs              | [`docs/04-indicateurs/catalogue-indicateurs.md`](docs/04-indicateurs/catalogue-indicateurs.md)         |
| Architecture des données | [`docs/05-donnees/architecture-donnees.md`](docs/05-donnees/architecture-donnees.md)                   |
| Architecture logicielle  | [`docs/06-architecture/architecture.md`](docs/06-architecture/architecture.md)                         |
| Développement            | [`docs/08-implementation/guide-developpement.md`](docs/08-implementation/guide-developpement.md)       |
| Plan V1                  | [`docs/08-implementation/plan-implementation-v1.md`](docs/08-implementation/plan-implementation-v1.md) |
| Data Quality             | [`docs/quality-rules.md`](docs/quality-rules.md)                                                       |

`specifications/` conserve les sources et demandes ayant alimenté le cadrage ; il ne remplace pas la documentation normative courante.

## Sécurité

Ne jamais versionner :

- tokens GitHub ;
- `.env` contenant des secrets ;
- RAW issus d'un environnement réel ;
- manifestes de trace RAW ;
- fichiers contenant des données personnelles ou confidentielles.

## État d'implémentation

La branche contient une baseline exécutable du pipeline et une documentation V1 plus avancée que le modèle TypeScript actuellement implémenté.

La prochaine étape est l'implémentation des contrats métier I1 dans `src/domain/types.ts` et la normalisation associée, puis l'enrichissement progressif de la collecte GitHub, du Catalogue historique, de la Data Quality, des analytics et du dashboard conformément au plan V1.

**Version du package :** `0.1.0`
**Stack :** Node.js 22 · TypeScript · Commander · Vitest · ESLint
**Modèle configuré actuel :** `2.1`
