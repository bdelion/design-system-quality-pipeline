# Rapport de consolidation documentaire — 2026-10-06

## Périmètre

La consolidation porte sur les documents actifs de `docs/`, avec contrôle de `README.md`, `CHANGELOG.md`, `config/` et `specifications/`. Les contenus de `docs/_historique/` et `specifications/` sont conservés tels quels afin de préserver leur valeur historique ou de matériau de travail.

## Contrôles de cohérence

- Les décisions D-145 à D-155 sont présentes une seule fois et dans l’ordre dans le registre canonique.
- Aucun identifiant D/Q existant n’a été supprimé ou renuméroté.
- D-155 est bien propagée dans `questions-ouvertes.md`, `gap-analysis-v1.md`, `objets-metier.md`, `modele-normalise.md` et `plan-implementation-v1.md`.
- Le mécanisme `github.issueTypes.keywords` est présent dans `config/system.yaml` et reste cohérent avec les décisions D-147 à D-154.
- La formulation devenue obsolète indiquant que le traitement d’un Issue Type non reconnu restait à préciser a été retirée de `objets-metier.md` ; D-148 définit déjà ce comportement.
- La liste définitive des notions canoniques reste volontairement ouverte.

## Normalisation Markdown

- Hiérarchie des titres corrigée dans `questions-ouvertes.md` : un seul titre H1 de document, sections principales en H2, décisions/questions au niveau cohérent sous leur section.
- Listes Pandoc de forme `-   item` normalisées en listes GFM `- item`.
- Listes numérotées de forme `1.  item` normalisées en `1. item`.
- Fences de code de forme ` ``` text ` normalisées en ` ```text `.
- Séparateurs constitués de longues suites de tirets normalisés en `---`.
- Espaces de fin de ligne supprimés et suites de lignes vides réduites.
- Les tableaux GFM existants, notamment la matrice de gap analysis, sont conservés comme tableaux et leur contenu n’est pas supprimé.
- Le paragraphe monolithique sur D-147 à D-155 dans `modele-normalise.md` est découpé en paragraphes cohérents sans modifier les décisions.

## Éléments volontairement non modifiés

- `docs/_historique/` : archive documentaire.
- `specifications/` : matériaux de travail et historiques de demandes ; utilisés pour contrôle, non réécrits.
- Les questions métier encore ouvertes et la liste définitive des notions canoniques ne sont pas résolues artificiellement.
- Aucun code TypeScript, test, fixture ou fichier YAML n’est modifié par cette consolidation.
