# ADR-001 — Snapshots comme persistance de la phase actuelle

**Statut : ACCEPTÉ POUR LA PHASE ACTUELLE**

## Décision

Utiliser des snapshots JSON comme représentation persistée des exécutions du pipeline.

## Justification observée

Le code actuel construit et écrit des snapshots et les compare pour produire des flows.

## Conséquence

Le système reste simple, rejouable et exportable.

## Limite

Cette décision ne préjuge pas de la persistance finale. Une base de données pourra être ajoutée ultérieurement.
