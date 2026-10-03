# Objets métier

## Repository / Library

Le code actuel distingue `Library` et `repository`. Le besoin futur prévoit qu'un repository puisse contenir plusieurs libraries.

**À confirmer :** la règle exacte de mapping repository → library pour le monorepo n'est pas définie.

## Component

Le composant normalisé possède notamment : identité, nom, bibliothèque, statut, aliases, source de découverte, tags, informations de propriétaire/squad et provenance.

Le catalogue YAML est la référence utilisée pour enrichir/classer les composants.

## Issue

Le RAW conserve actuellement : identifiant, numéro, titre, état, Issue Type, labels, component éventuel, criticities, parents, dates, liens PR, statuts Project et milestone.

## Pull Request

Le RAW conserve actuellement : identifiant, numéro, état, date de merge et relations vers des issues.

## Audit

Le modèle normalisé possède : auditId, libraryId, componentId, version, status, sourceIssueId, objectiveAuditResult et provenance.

**À confirmer :** la taxonomie des types d'audit et la notion de campagne doivent encore être formalisées.

## Anomaly

Le modèle normalisé possède : auditId, componentId, criticity, categories, status, dates, correction, PR, parents, annulation et provenance.

**Point de vigilance :** cette structure actuelle suppose une relation audit/composant forte. Les règles métier doivent déterminer si toutes les anomalies doivent obligatoirement appartenir à un audit.
