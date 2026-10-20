# Deux présentations du même dashboard

**FAIT / IMPLÉMENTÉ** : chaque exécution de `pipeline` produit les deux présentations, sans option de sélection. Le snapshot, les conventions métier et les verdicts sont communs ; aucune source du dataset n’est modifiée.

```text
dashboard/
├── index.html                  # Choix de la présentation
├── classic/index.html          # Dashboard détaillé existant
└── simplified/index.html       # Présentation synthétique
```

La commande de service reste identique :

```powershell
npm.cmd run pipeline -- --dataset datasets/mon-jeu --output data/output/mon-jeu
npm.cmd run dashboard:serve -- data/output/mon-jeu/dashboard
```

Ouvrir `http://127.0.0.1:4174/`. Les liens « Vue détaillée » et « Choisir la présentation » permettent de changer de restitution. L’ancien lien direct `/issues.html` redirige vers `/classic/issues.html`, en conservant les paramètres de filtre et l’ancre. Les neuf anciens liens de pages sont conservés de cette manière. Les anciens assets éventuellement présents dans une sortie ne sont pas supprimés.

## Parcours synthétique

- **Synthèse** : composants avec des bugs d’accessibilité sans vérification confirmée. Ce n’est pas un classement automatique de criticité.
- **Composants** : dernier audit terminé, bugs d’accessibilité connus, corrections d’accessibilité confirmées et bugs sans audit. Les catégories ne s’additionnent pas. Les anciens snapshots sans qualification métier explicite affichent les compteurs concernés comme indisponibles, sans supposer zéro.
- **Activité** : toutes les issues distinctes du snapshot, statut GitHub et Project, composants et correction. Les filtres de dates portent explicitement sur la création de l’issue.
- **Repositories et équipe** : stocks d’issues/PR, composants et délais mesurables par repository. Ces tableaux couvrent toutes les dates ; ils ne prétendent pas représenter une vélocité de sprint. Le filtre de version y est désactivé.
- **Audits par version** : audits à faire, en attente (Project Blocked), en cours, faits, annulés ou au statut inconnu ; composants conformes, non conformes et non couverts à partir des verdicts déjà calculés ; bugs et améliorations d’audit distincts.

Une version sans relation historique de composants affiche des compteurs de conformité indisponibles. Le nombre d’audits à faire porte sur les audits déjà planifiés, pas sur un besoin déduit d’un catalogue courant. Les corrections ne démontrent pas la conformité. L’héritage de verdicts reste celui du pipeline existant.

## Filtres, tris et preuves

Chaque tableau propose une recherche, un tri numérique ou textuel, le choix du sens et une pagination première/précédente/suivante/dernière. Filtrage et tri portent sur toute la population avant pagination. Les inconnues restent à la fin. La taille initiale est de 25 lignes ; les listes de preuves ont leur propre pagination.

Les valeurs avec des issues sources ouvrent leurs preuves dans une fenêtre accessible sans quitter l’écran ; chaque URL source HTTP(S) disponible est proposée. Les valeurs de composants peuvent renvoyer aux issues liées et non à une liste de composants : la définition de la colonne fait foi. Les recherches de PR sont des recherches actuelles de contexte et ne reproduisent pas un snapshot historique. Les liens anonymisés ne sont pas réinventés. Les espaces du dashboard classique restent accessibles pour les CSV, graphiques et investigations approfondies.

## Délais et limites connues

Les délais sont calculés en jours calendaires sur les cohortes terminées, avec médiane, P90, effectif mesurable et dossiers exclus : fermeture GitHub, traitement métier et correction de bug confirmée. La correction prend la date où Done et la fusion liée sont tous deux prouvés. Les dates insuffisantes ou incohérentes ne deviennent pas zéro. Les exclusions de traitement provenant des faits Analytics sont conservées.

Le contrat actuel de collecte ne conserve pas la date d’ouverture des PR ni une date de début d’audit exploitable : les délais de fusion et de réalisation d’audit restent indisponibles. Une collecte enrichie sera nécessaire pour les mesurer. Le temps passé réel et la vélocité de l’équipe ne sont pas déduits des durées calendaires.

## Architecture et contrôles

`generateDashboard` orchestre les deux présentations. `generateClassicDashboard` reste le générateur ciblé du classique, utilisé par ses tests et son benchmark pour conserver les références antérieures. `analytics/simplified-dashboard.ts` projette les faits métier ; le navigateur ne recalcule aucun verdict. La nouvelle page embarque uniquement son contrat de restitution versionné, jamais le RAW ou le snapshot complet.

Les tests couvrent l’absence de mutation du snapshot, les deux sorties, les inconnues, les liens sources, les filtres avant pagination, le tri, les preuves, le clavier, l’accessibilité automatique et le mobile. Les budgets classiques à 0 % restent inchangés. La première référence de la page d’entrée et de la vue synthétique est distincte et proposée à validation ; elle ne modifie pas implicitement la référence classique approuvée.
