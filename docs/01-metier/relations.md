# Relations métier

## Relations actuellement représentées

- Pull Request → issues liées.
- Issue → pull requests liées.
- Issue → parents.
- Issue → component via les données normalisées.
- Audit → component.
- Anomaly → audit.
- Anomaly → component.
- Library → repository.

## Relations mentionnées dans les spécifications mais incomplètement modélisées

- Epic → sub-issues.
- Issue → Iteration.
- Issue → Milestone avec sémantique métier.
- Issue → branche.
- Issue → application consommatrice.
- Component → applications utilisatrices.
- Component → version de bibliothèque consommée.
- Conception → Epic / composant.
- Audit de maquette → conception.

## Intégrité relationnelle

La validation des fixtures vérifie notamment les références PR → issue. Une référence vers une issue absente est actuellement signalée comme erreur d'intégrité.

**À ne pas faire sans décision :** supprimer automatiquement les relations externes ou absentes. Il faut d'abord distinguer les relations réellement invalides des relations vers des entités hors périmètre.
