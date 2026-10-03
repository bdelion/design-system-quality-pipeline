# Règles relationnelles

Exemples explicitement documentés :

- Done → PR attendue pour les travaux standards.
- Cancelled → pas de PR.
- PR → issues liées.
- Epic → 2 à n sous-issues selon la source.
- Audit → composant et lot/version d'audit.
- Conception → composant.

Le validateur actuel détecte notamment les références PR vers des issues absentes du même repository dans les fixtures.

**Point ouvert :** une relation vers une entité externe au périmètre doit-elle être considérée comme erreur, warning ou relation externe valide ?
