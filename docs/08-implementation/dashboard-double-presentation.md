# Deux présentations du même dashboard

> **Cible de présentation validée le 24 octobre 2026 :** [maquette A des fenêtres GitHub](dashboard-fenetres-github-maquette-a.md). Elle demande un seul accès dans l’en-tête de la fenêtre, sans liens supplémentaires dans les pages/tableaux et sans lots. La correction fonctionnelle reste à implémenter. Les descriptions ci-dessous des liens distribués et par lots retracent le comportement existant, que l’utilisateur a rejeté ; elles ne constituent pas la cible validée.

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

Les valeurs avec des issues sources ouvrent leurs preuves dans une fenêtre accessible sans quitter l’écran ; chaque URL source HTTP(S) disponible est proposée. Les valeurs de composants peuvent renvoyer aux issues liées et non à une liste de composants : la définition de la colonne fait foi. Les recherches de PR sont des recherches actuelles de contexte et ne reproduisent pas un snapshot historique. Les liens anonymisés ne sont pas réinventés. Chaque tableau synthétique et chaque liste de preuves dispose d’un export CSV UTF-8 (BOM), avec protection des formules. L’export contient toute la sélection filtrée et triée, avant pagination, ainsi que les liens GitHub disponibles. Les espaces classiques restent accessibles pour les graphiques et investigations approfondies.

## Délais et limites connues

Les délais sont calculés en jours calendaires sur les cohortes terminées, avec médiane, P90, effectif mesurable et dossiers exclus : fermeture GitHub, traitement métier et correction de bug confirmée. La correction prend la date où Done et la fusion liée sont tous deux prouvés. Les dates insuffisantes ou incohérentes ne deviennent pas zéro. Les exclusions de traitement provenant des faits Analytics sont conservées.

Le contrat actuel de collecte ne conserve pas la date d’ouverture des PR ni une date de début d’audit exploitable : les délais de fusion et de réalisation d’audit restent indisponibles. Une collecte enrichie sera nécessaire pour les mesurer. Le temps passé réel et la vélocité de l’équipe ne sont pas déduits des durées calendaires.

## Architecture et contrôles

`generateDashboard` orchestre les deux présentations. `generateClassicDashboard` reste le générateur ciblé du classique, utilisé par ses tests et son benchmark pour conserver les références antérieures. `analytics/simplified-dashboard.ts` projette les faits métier ; le navigateur ne recalcule aucun verdict. La nouvelle page embarque uniquement son contrat de restitution versionné, jamais le RAW ou le snapshot complet.

Les tests couvrent l’absence de mutation du snapshot, les deux sorties, les inconnues, les liens sources, les filtres avant pagination, le tri, les preuves, le clavier, l’accessibilité automatique et le mobile. Les budgets classiques à 0 % restent inchangés. La référence de la page d’entrée et de la vue synthétique est distincte de la référence classique. Sa mise à jour pour la présentation compacte est validée le 22 octobre 2026 ; le budget classique reste inchangé.

## Présentation compacte et compteurs détaillés — 22 octobre 2026

L’en-tête et le menu partagent un bandeau fixe au défilement. Sa hauteur réelle est mesurée pour conserver le contenu et le focus visibles, notamment au zoom. Police de base : 13 px ; cellules de tableau : 12 px, avec 6 px de marge verticale. Le contenu utilise toute la largeur de la fenêtre, sans plafond ; les compteurs d’accueil sont une bande compacte plutôt que de grandes cartes. Le défilement horizontal des grands tableaux reste local au tableau.

Le tableau **Activité par librairie et composant**, dans Composants, présente les issues distinctes par ligne : total, en cours, Done, Cancelled, moyenne, médiane, P90 et plus ancienne issue ouverte. Une issue multi-composants contribue à chaque ligne concernée ; les lignes ne s’additionnent donc pas en un total d’issues distinctes. Cette synthèse couvre toutes les versions ; son filtre de recherche et celui de repository s’appliquent avant le tri et la pagination.

**Validé par l’utilisateur** : en cours comprend Backlog et Ready, hors Done et Cancelled. Les statuts Project inconnus ou contradictoires sont affichés séparément ; Closed seul ne devient pas Done. Done est un état Project et ne prouve pas une correction. Les délais restent ceux admissibles dans les faits Analytics du pipeline, avec leurs exclusions DQ : leur effectif mesurable peut différer du nombre de Done. Le détail donne les issues retenues et les limites de cohorte.

La plus ancienne issue ouverte est choisie parmi les issues GitHub OPEN hors Project Done/Cancelled, à la date du snapshot. Une date de création absente, future ou incohérente empêche de garantir le plus ancien ticket ; le résultat reste alors indisponible. Son tri porte sur l’âge, pas sur le numéro du ticket.

Le tableau **Audits et composants par version** ajoute le nombre de composants, le total des audits, les audits en attente (non démarrés ou Blocked), en cours, terminés et les deux lectures de conformité demandées :

- **Audits / composants** : total d’audits de la version divisé par ses composants connus ; plusieurs audits d’un composant peuvent porter ce rapport au-delà de 100 %.
- **Conformes audités / audits terminés** : composants distincts conformes effectivement audités sur cette version, divisés par les audits terminés sur cette version. Une conformité uniquement héritée n’entre pas au numérateur.
- **Conformes cumulés / composants** : tous les composants conformes de la version, y compris les verdicts hérités calculés par le pipeline, divisés par tous ses composants connus.

Ces deux lectures de conformité sont **validées par l’utilisateur**. Les compteurs de composants conformes/non conformes restent cumulatifs. Chaque ratio explique son numérateur et son dénominateur dans le détail. Un dénominateur nul ou inconnu donne « Indisponible ». Les colonnes d’anomalies et d’améliorations recensent les issues distinctes explicitement liées aux audits concernés. Les preuves de conformité héritée renvoient aussi aux audits des versions précédentes, au lieu d’afficher une liste vide.

Les nombres des cartes et les cellules disposant de preuves ouvrent une liste paginée avec les liens individuels GitHub et un export complet. Les cellules de libellé peuvent ouvrir les issues associées à la ligne ; les cellules numériques conservent leur propre population. Les liens GitHub utilisent les URL collectées, sans créer d’URL à partir d’un numéro anonymisé ni convertir une recherche courante en preuve historique.

## Référence de taille — validée le 22 octobre 2026

L’utilisateur a validé : « Oui, conserver ces ajouts et actualiser la référence ». Sur le jeu de contrôle synthétique, la vue compacte passe de 31 605 à 44 079 octets de HTML, de 29 576 à 42 010 octets de JSON et de 686 à 689 nœuds DOM. Les lignes initiales (0) et les lignes montées au maximum par défaut (24 sur ce jeu) restent inchangées.

`config/benchmark-simplified-baseline.json` conserve la même empreinte de fixture et une croissance autorisée de **0 %**. Cette validation concerne les ajouts mesurés de cette version ; toute augmentation suivante reste signalée. La page de choix et les budgets du dashboard classique sont inchangés.

## Accès GitHub dans la vue synthétique

Les compteurs et cellules ouvrant une liste de preuves possèdent un lien textuel **Ouvrir la recherche dans GitHub ↗**
quand des URL GitHub sources sont disponibles. Ces accès existent aussi dans les
fenêtres et près des outils des tableaux : à cet endroit ils portent sur toutes
les issues associées aux lignes filtrées, avant pagination. Les libellés de ligne
utilisent leurs preuves associées ; un compteur de composants ne devient pas un
compteur d’issues. Les CSV et les listes locales restent les populations de référence.

L’en-tête de la fenêtre propose « Ouvrir dans GitHub ». Une source unique, complète et dédupliquée ouvre directement le ticket ; plusieurs sources ouvrent une recherche. Les liens individuels des lignes restent des accès directs aux tickets. Les sources sont regroupées
par dépôt et type, puis par lots de six numéros au maximum (requêtes de 256 caractères
au maximum). Les liens numérotés ouvrent chacun un seul nouvel onglet. Les recherches
utilisent les opérateurs [GitHub documentés](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/filtering-and-searching-issues-and-pull-requests).
Une recherche par numéros peut aussi retrouver des tickets mentionnant ces numéros :
son intitulé l’indique et la fenêtre rappelle cette limite. Les résultats dépendent
aussi des droits, de l’indexation et de l’état actuel de GitHub, distinct du snapshot.

Aucun lien n’est déduit d’un identifiant anonymisé ou d’un nom de repository : seules
les URL sources `https://github.com/.../issues/N` ou `/pull/N` sont exploitées. Une
sélection partiellement accessible est annoncée dans l’intitulé et la fenêtre.
Sans source exploitable, la fenêtre reste disponible, sans flèche trompeuse.
Les compteurs de PR sans références individuelles proposent une recherche du périmètre
du compteur, distincte d’une liste de preuves exacte.

Les libellés GitHub sont visibles dans les cinq espaces, les tableaux filtrés, les cellules, les compteurs et les fenêtres ; la flèche complète le texte et ne le remplace pas. Dans une fenêtre, la recherche de contexte n’est affichée qu’une fois.

### Recherches des compteurs et états

Chaque fenêtre possédant des sources GitHub exploitables propose **Ouvrir dans GitHub** dans son en-tête. Lorsqu’un compteur définit une recherche de périmètre, celle-ci est prioritaire sur les lots de numéros :

| Compteur du repository | Recherche explicite               | États inclus                    |
| ---------------------- | --------------------------------- | ------------------------------- |
| Issues total           | `issues?q=is%3Aissue`             | Ouvertes et fermées             |
| Issues ouvertes        | `issues?q=is%3Aissue%20is%3Aopen` | Ouvertes                        |
| PR total               | `pulls?q=is%3Apr`                 | Ouvertes, fermées et fusionnées |
| PR fusionnées          | `pulls?q=is%3Apr%20is%3Amerged`   | Fusionnées                      |

Les pages `/issues` ou `/pulls` sans requête ne sont pas utilisées pour un total, car leur filtre par défaut peut limiter aux éléments ouverts. Les recherches des autres listes utilisent leurs références collectées, sans ajouter un filtre d’état implicite. Les fenêtres conservent les liens individuels vers les sources et leur CSV.

Le snapshot normalisé ne fournit pas de sources individuelles de PR dans le modèle simplifié : les fenêtres PR donnent accès à la recherche GitHub du compteur sans fabriquer une liste locale. L’état actuel de GitHub peut différer de la capture. Les URL anonymisées ne sont jamais transformées en liens GitHub.

### Fenêtres Actions et activité par composant (#115)

**IMPLÉMENTÉ.** Le groupe d’actions est placé immédiatement sous le titre, avant les explications et la liste. Les fenêtres « Composant », « Situation » et « Prochaine action » d’« Actions à examiner » utilisent chacune leurs propres références, sans leur substituer toutes les issues du composant. Le libellé est **Ouvrir dans GitHub** ; une liste complète d’un seul ticket ouvre son URL source directe. Une sélection partielle n’est pas présentée comme une source unique.

Dans « Activité par librairie et composant », les liens conservent les références exactes de chaque cellule. Pour une recherche de plusieurs tickets, les labels effectivement communs aux sources sont ajoutés tant que la requête reste dans la limite de longueur. Aucun préfixe de composant ni label de statut n’est inventé.

| Fenêtre                       | Filtre GitHub ajouté à la recherche                        |
| ----------------------------- | ---------------------------------------------------------- |
| Composant, Issues total       | Aucun filtre ouvert/fermé                                  |
| Issues en cours               | `is:open`, uniquement si toutes les sources sont ouvertes  |
| Issues Done, Issues Cancelled | `is:closed`, uniquement si toutes les sources sont fermées |

Les statuts Project Done/Cancelled déterminent toujours les listes du pipeline ; ils ne sont pas remplacés par Closed, conformément à D-163. Si un état GitHub est absent ou divergent, le filtre d’état serait réducteur : il est omis et une réserve l’explique dans la fenêtre. Aucun `reason:completed` ou `reason:"not planned"` n’est déduit d’un statut Project ; la sélection des références conserve les cohortes Done et Cancelled distinctes.

Les recherches GitHub ne permettent pas de garantir l’égalité stricte d’un ensemble arbitraire de numéros : elles peuvent aussi retrouver des mentions. Cette limite, l’état actuel de GitHub, les droits d’accès et les lots bornés restent annoncés. Les listes et CSV locaux constituent les preuves exactes du snapshot ; aucune requête externe n’est exécutée automatiquement. Les tests synthétiques couvrent les huit cellules demandées par #115, les filtres, les sources uniques et les divergences, sans envoyer de données métier à GitHub.
