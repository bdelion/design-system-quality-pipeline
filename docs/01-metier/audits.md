# Audits

## Besoins

Les audits d'accessibilité doivent permettre de suivre notamment :

- campagne / lot d'audit ;
- composants prévus ;
- composants en cours ;
- composants terminés ;
- conformité / non-conformité ;
- criticité RGAA / WAI-ARIA ;
- familles de critères ;
- anomalies issues de l'audit ;
- améliorations proposées ;
- délais et vélocité des anomalies issues d'audit ;
- résultats par version.

## Modèle actuel

`Audit` contient actuellement une version et un résultat objectif. `AuditStatus` prévoit :

- `not_evaluated`
- `in_progress`
- `conform`
- `conditional`
- `non_conform`
- `critical`

## Point important

Le document métier distingue un **bug ordinaire** d'un **bug d'audit** pour le suivi de la conformité RGAA/WAI-ARIA.

Cette distinction doit devenir une règle explicite du modèle et non une déduction implicite uniquement à partir du type `BUG`.

**À confirmer :** la définition exacte d'une campagne, son identifiant, ses dates et son rattachement à une Epic ne sont pas encore dans le modèle normalisé actuel.
