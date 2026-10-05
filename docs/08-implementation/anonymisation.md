# Anonymisation

L'anonymisation est déterministe à partir d'une seed.

Elle produit également un manifeste de traçabilité local `*.trace.json` qui ne doit pas être partagé car il peut contenir des identifiants de la source réelle.

## Données conservées

- labels ;
- state ;
- issueType ;
- projectStatuses.status ;
- milestone.title ;
- milestone.state.

## Données à anonymiser

- repositories / owners ;
- identifiants ;
- dates ;
- textes libres ;
- URLs ;
- utilisateurs ;
- relations dépendantes des identifiants.

## Incident historique documenté

Une validation précédente avait détecté un grand nombre de chaînes suspectes classées comme téléphones alors qu'il s'agissait notamment de timestamps ISO. La correction du scanner doit donc être validée par tests avant toute interprétation du nombre de chaînes suspectes.
