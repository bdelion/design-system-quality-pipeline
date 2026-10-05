# Indicateurs souhaités et contraintes associées

## Idées de représentations

Utiliser Mermaid et par exemple :

- [Sankey](https://mermaid.js.org/syntax/sankey.html)
- [Kanban](https://mermaid.js.org/syntax/kanban.html)
- [Radar](https://mermaid.js.org/syntax/radar.html)
- [Event Modeling](https://mermaid.js.org/syntax/eventmodeling.html)
- [TreeMap](https://mermaid.js.org/syntax/treemap.html)
- [TreeView](https://mermaid.js.org/syntax/treeView.html)

## Indicateurs suivs par librairie

- nombres d'issues par composant
- délai de résolution des issues par composant :
  - délai moyen
  - délai médian
  - délai percentile 90
  - délai min
  - délai max
- répartition des issues de composant par :
  - par label
  - par issue type
- vélocité des issues par composant :
  - vélocité moyenne
  - vélocité médiane
  - vélocité percentile 90
  - vélocité min
  - vélocité max
- nombre d'issue sans composant
- nombre d'issue par label
- nombre d'issue par issue type
- pour chaque sprint avec les dates de début et de fin
  - la durée du sprint
  - le nombre de jour ouvrée du sprint en tenant compte des jours fériés en France
  - nombre d'issue traitée
  - nombre d'issue Done
  - nombre d'issue Cancelled
  - nombre d'issue autre que Done et Cancelled --> problème dans ce cas sauf pour les milestone non fermée
  - pour le sprint en court, la répartition par status
  - nombre d'issue par créateur et différencier les créateurs de la Squad et en dehors de la Squad
  - nombre d'issue par assigné et différencier les assignés de la Squad et en dehors de la Squad
- Avoir par créateur d'issue
  - différencier les créateurs de la Squad et en dehors de la Squad
  - le nombre d'issue créée
  - la répartition par label
  - la répartition par issue type
- Avoir par assigné d'issue
  - différencier les assignés de la Squad et en dehors de la Squad
  - le nombre d'issue créée
  - la répartition par label
  - la répartition par issue type
  - délai de résolution des issues par composant :
    - délai moyen
    - délai médian
    - délai percentile 90
    - délai min
    - délai max
- pour chaque milestone avec les dates de début et de fin
  - la durée de la milestone
  - le nombre de jour ouvrée de la milestone en tenant compte des jours fériés en France
  - nombre d'issue traitée
  - nombre d'issue Done
  - nombre d'issue Cancelled
  - nombre d'issue autre que Done et Cancelled --> problème dans ce cas sauf pour les milestone non fermée
  - nombre d'issue par créateur et différencier les créateurs de la Squad et en dehors de la Squad
  - nombre d'issue par assigné et différencier les assignés de la Squad et en dehors de la Squad

## Indicateurs suivs par librairie - Focus accessibilité

- par campagne d'audit
  - le nombre de composant prévu
  - le nombre de composant en cours d'audit
  - le nombre de composant dont l'audit est terminée
  - les composants conformes
  - les composants non conformes
  - le ratio de composants conformes par rapport au nombre de composants audités
  - par composant
    - le nombre d'issues d'anomalie
    - le nombre d'issues d'amélioration proposée
    - la répartition par criticité d'accessibilité/RGAA/WAI ARIA
    - la répartition par famille de critère d'accessiblité
- par composant
  - le nombre d'issue d'audit :
    - à faire
    - en cours
    - terminée
  - le nombre d'anomalie lié à un audit :
    - à faire
    - en cours
    - terminée
  - le nombre d'anomalie suite à un audit
  - le nombre d'anomalie traité suite à un audit
  - le nombre d'amélioration proposée suite à un audit
  - la répartition par criticité d'accessibilité/RGAA/WAI ARIA
  - la répartition par famille de critère d'accessiblité
  - pour les issues d'anomalie traité suite à un audit
    - la moyenne de la vélocité
    - le délai moyen de traitement
    - la médiane de la vélocité
    - le délai médian de traitement
    - le P90 de la vélocité
    - le délai P90 de traitement
  - par version, un scoring de la qualité d'accessibilité du composant
- par criticité d'accessibilité/RGAA/WAI ARIA
  - le nombre de composant concerné au global
  - le nombre de composant concerné par des issues encore ouverte
  - le nombre d'issue d'audit :
    - à faire
    - en cours
    - terminée
  - la répartition par famille de critère d'accessiblité
  - pour les issues d'anomalie traité suite à un audit
    - la moyenne de la vélocité
    - le délai moyen de traitement
    - la médiane de la vélocité
    - le délai médian de traitement
    - le P90 de la vélocité
    - le délai P90 de traitement
- par famille de critère d'accessiblité
  - le nombre de composant concerné au global
  - le nombre de composant concerné par des issues encore ouverte
  - le nombre d'issue d'audit :
    - à faire
    - en cours
    - terminée
  - la répartition par criticité d'accessibilité/RGAA/WAI ARIA
  - pour les issues d'anomalie traité suite à un audit
    - la moyenne de la vélocité
    - le délai moyen de traitement
    - la médiane de la vélocité
    - le délai médian de traitement
    - le P90 de la vélocité
    - le délai P90 de traitement
- par version
  - la liste des composants audités
  - le nombre d'issue d'anomalie d'audit traitée
  - la liste des composants conforme
  - la liste des composants non conforme avec un scoring
  - le nombre de composant concerné par des issues encore ouverte
  - la répartition par criticité d'accessibilité/RGAA/WAI ARIA
  - la répartition par famille de critère d'accessiblité
  - pour les issues d'anomalie traité suite à un audit
    - la moyenne de la vélocité
    - le délai moyen de traitement
    - la médiane de la vélocité
    - le délai médian de traitement
    - le P90 de la vélocité
    - le délai P90 de traitement

## Règles

- Une issue Done doit être associée à au moins une PR soit par les commentaires soit pas les associations
- Un bug et un bug d'audit sont différents pour le suivi de la conformité RGAA/WAI ARIA
- Une criticité RGAA/WAI ARIA est différente d'une criticité métier ou d'une criticité de fonctionnalité métier ou d'une criticité technique ou d'une criticité "developer experience"/"designer experience"
- Une issue cancelled ne doit pas avoir de référence à une PR
- Une issue à l'état "Grooming" ne peut pas avoir :
  - d'itération/sprint associé
  - de vélocité
  - de milestone/version associé

> 🚧 TODO A continuer

## Configuration

- Pouvoir configurer tous les critères, exemple : Bug peut-être dans un label ou un issue type et leur contenu peut-être différent d'un repository à un autre ou d'une orga GitHub à une autre
- Differencier vélocité à 0 de vélocité vide ... mais que faire avec ?
- Un repository = une librairie actuellement mais demain, et avec la mise en place de mono repository, un repository = n librairie
- Une milestone 1.1.0 et 1.1.0-Audit doivent être considérées comme les mêmes versions, c'est à dire 1.1.0. Le suffixe "-Audit" doit pouvoir être paramétrable

## Demande client

### Responsables des audits d'accessibilité

J'aurais besoin des undicateurs :

- Ratio de tickets déclaré versus corrigés (au global + à détailler par niveau de criticité ?)
- Délai moyen entre détection anomalie et sa correction (au global + détailler par niveau de criticité ?)
- Nombre d'anomalie réparti par criticité (bloquant, majeur, mineur)
- Ratio de composant audité versus nombre total de composants dans les lib (il y a t'il un intérêt à dissocier par lib ou tout confondu ?)
- Ratio de composant 100% conforme versus nombre total de composants dans les libs (voir si on inclu ceux pas encore audité comme étant non conforme ou si on les exclu)
- Nombre d'anomalie par type/catégorise (contraste, navigation clavier, sémantique, etc.)
- Nombre d'applications qui utile le DS, par version. Celle qui ne l'utilise pas et qui "devrait".
- Nombre d'anomalie pour chaque composant, à rapprocher avec fréquence d'utilisation du composant

Pour après :

- Taux de nouveaux composants ayant été audité dès la maquette Design
- Nombre d'anomalie dans maquette Design par répartition de criticité (Bloquant, Majeur, Mineur)
- Taux de conformité globale d'une version quand elle sort (est-ce qu'on pourra vraiment définir juste avant MEP vu que ça sera au fil de l'eau ?)

Questionnement :

- possible de faire des "photos" des indicateurs à des instants précis (historique) ou sera qu'à l'instant T ?
