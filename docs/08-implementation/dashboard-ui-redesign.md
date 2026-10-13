# Refonte visuelle du dashboard

Statut : implémenté, sans modification des calculs métier.

Fond gris clair, surfaces blanches, navigation bleu foncé, cartes hiérarchisées et tableaux alternés facilitent la lecture. Les statuts conservent leurs libellés ; les icônes de navigation sont décoratives. Les polices système évitent une dépendance réseau. La palette reprend le bleu #27509B, le bleu foncé #00205B et un accent jaune #FCE500. Les éléments graphiques sont propres au projet ; aucune conformité officielle Michelin n’est revendiquée.

## Sources d’inspiration

- [Justinmind](https://www.justinmind.com/ui-design/dashboard-design-best-practices-ux) : hiérarchie et accès aux détails.
- [Fuselab](https://fuselabcreative.com/dashboard-systems-design/) : navigation par espace de travail.
- [Raw Studio](https://raw.studio/blog/top-10-custom-dashboard-design-tips-for-2024) : simplicité visuelle.
- [Smart Insights](https://www.smartinsights.com/digital-marketing-strategy/dashboard-design-best-practices-streamline-operational-reporting/) : indicateurs opérationnels visibles.
- [Michal Malewicz](https://michalmalewicz.medium.com/the-end-of-dashboards-and-design-systems-5d98ec9de627) : introduction seulement, article réservé aux membres ; contenu complet non consulté.
- [Plain Concepts](https://www.plainconcepts.com/how-to-create-analytical-dashboard-guide/) : organisation selon les besoins.
- [Michelin : principes dashboard](https://designsystem.michelin.com/data-visualization/design-guidelines/principles-of-a-dashboard) et [couleurs](https://designsystem.michelin.com/colors) : surfaces claires, filtres distincts et palette cohérente.

## Matrice de vérification

| Besoin                            | Écrans                                      | Contrôle                                                              |
| --------------------------------- | ------------------------------------------- | --------------------------------------------------------------------- |
| Navigation et clavier             | Neuf pages                                  | Anciens liens, navigation contextuelle et lien d’évitement Playwright |
| Lecture mobile                    | Neuf pages                                  | Largeur à 390 px et captures desktop/mobile                           |
| Métriques et inconnues explicites | Accueil, accessibilité, explorateurs        | Tests des populations et informations des métriques                   |
| Tableaux utilisables              | Issues, composants, qualité                 | Filtres, sélection et exports CSV                                     |
| Contrastes et intitulés           | Neuf pages                                  | axe WCAG A/AA sur desktop et mobile                                   |
| Traçabilité                       | Audits, anomalies, historique, cartographie | Tests des relations et anciens liens                                  |

Les captures sont des preuves de revue visuelle, sans comparaison pixel par pixel. Les contrôles axe ne constituent pas un audit RGAA complet. Les snapshots métier restent inchangés.

Validation : npm run check:dashboard. Prévisualisation : npm run dashboard:preview, puis npm run dashboard:serve -- data/dashboard-refactor-preview/dashboard.

La page Accessibilité présente les répartitions par criticité, catégorie et composant en barres horizontales, avec valeurs textuelles et détails dépliables. Elles utilisent les agrégats Analytics du périmètre repository/composant/version ; un ciblage sans agrégat affiche une indisponibilité. Les populations présumées restent comprises dans ce périmètre, sans être requalifiées.

Les cartes d’indicateurs de périmètre sont compactes. Un bouton d’information de 24 px en haut à droite ouvre une infobulle au clic, à Entrée ou Espace. Échap et un clic extérieur la ferment. Elle conserve les définitions, réserves et liens ; son rôle dialog permet ces liens interactifs. Les états indisponibles restent visibles dans la carte.
