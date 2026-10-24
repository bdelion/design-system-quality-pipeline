# Deux présentations du même dashboard

> **Présentation A appliquée au code le 24 octobre 2026 :** [maquette validée des fenêtres GitHub](dashboard-fenetres-github-maquette-a.md). Un accès global dans l’en-tête de la fenêtre ; aucun raccourci supplémentaire dans les cartes ou tableaux, aucun lot.

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

**IMPLÉMENTÉ — présentation A.** Les compteurs et cellules ouvrent leurs preuves locales. Les raccourcis GitHub ajoutés dans les cartes, outils de tableau et cellules sont retirés. La fenêtre regroupe son titre, un seul accès **Ouvrir dans GitHub ↗** et **Fermer** sur la même ligne lorsque la largeur le permet ; l’en-tête se replie sur petit écran.

Une sélection complète d’un seul ticket ouvre directement son URL source. Pour plusieurs tickets, la recherche utilise le dépôt, le type et les labels réellement communs ; elle est vérifiée contre les autres issues connues du snapshot. Aucune recherche par numéros ni répartition en lots n’est produite. La destination ne dépend pas de la pagination locale. Les sources individuelles et l’export CSV restent disponibles dans la fenêtre.

Une sélection arbitraire ne possède pas toujours de filtre GitHub équivalent. Si les filtres incluraient d’autres issues connues ou si la requête dépasse les [limites documentées par GitHub](https://docs.github.com/en/search-github/getting-started-with-searching-on-github/troubleshooting-search-queries), le lien ouvre une recherche élargie au composant ou au dépôt et la note l’annonce. Si les URL sources manquent ou si même ce périmètre dépasse les limites, l’en-tête annonce **Accès GitHub indisponible** et la note explique pourquoi. **Arbitrage complémentaire validé le 24 octobre 2026 :** si une sélection ne se traduit pas exactement, proposer une recherche plus large du composant ou du dépôt, avec un avertissement explicite dans la fenêtre. Elle conserve un seul lien et n’est pas présentée comme l’équivalent exact de la sélection. Cette limite concerne notamment certaines cohortes métier ou de délais, qui ne sont pas des filtres GitHub natifs.

Les hôtes GitHub Enterprise sont conservés depuis les URL sources HTTPS. Des sources dépendant de plusieurs serveurs ne deviennent pas une recherche unique. Les hôtes réservés aux exemples/anonymisations restent indisponibles ; aucun dépôt ou numéro réel n’est reconstruit. Les résultats GitHub restent actuels, soumis aux droits et à l’indexation ; la vérification locale des filtres ne prouve pas l’égalité future avec le snapshot.

### Recherches des compteurs et états

Lorsqu’un compteur possède déjà une URL de recherche de périmètre, celle-ci est conservée :

| Compteur du repository | Recherche explicite               | États inclus                    |
| ---------------------- | --------------------------------- | ------------------------------- |
| Issues total           | `issues?q=is%3Aissue`             | Ouvertes et fermées             |
| Issues ouvertes        | `issues?q=is%3Aissue%20is%3Aopen` | Ouvertes                        |
| PR total               | `pulls?q=is%3Apr`                 | Ouvertes, fermées et fusionnées |
| PR fusionnées          | `pulls?q=is%3Apr%20is%3Amerged`   | Fusionnées                      |

Les totaux n’ajoutent aucun filtre ouvert/fermé implicite. Les cohortes Done et Cancelled restent des cohortes Project (D-163) ; Closed n’en est pas une preuve. Un filtre d’état n’est ajouté que s’il est explicitement demandé et compatible avec toutes les sources ; sinon il est omis et la recherche doit encore représenter la sélection parmi les faits connus. Aucun motif de fermeture n’est inventé.

Le modèle simplifié ne contient pas les PR individuelles : leur fenêtre propose la recherche du compteur et explique l’absence de preuves individuelles. Elle n’affiche pas de tableau vide d’en-têtes. Les contrôles axe couvrent ces fenêtres, les listes d’issues et les tableaux filtrés sans résultat ; ils ne constituent pas un audit RGAA manuel.
