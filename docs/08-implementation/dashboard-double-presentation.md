# Deux présentations du même dashboard

> **Présentation A appliquée au code le 24 octobre 2026 :** [maquette validée des fenêtres GitHub](dashboard-fenetres-github-maquette-a.md). Un accès global dans l’en-tête de la fenêtre ; aucun raccourci supplémentaire dans les cartes ou tableaux, aucun lot.

Le [suivi borné, le mode latest et les composants à auditer (#132–#134)](suivi-audits-132-134.md)
complètent les tableaux. La mesure de ces ajouts sur control/81 inchangée est de
68 972 octets HTML, 65 873 octets JSON et 1 570 nœuds DOM maximum ; le maximum de
24 lignes initiales et les budgets classiques sont conservés. Les mesures
antérieures ci-dessous restent historiques.

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

Les totaux n’ajoutent aucun filtre ouvert/fermé implicite. Les cohortes Done et Cancelled restent des cohortes Project (D-163) ; Closed n’en est pas une preuve. Un filtre d’état n’est ajouté que s’il est explicitement demandé et compatible avec toutes les sources ; sinon il est omis et la recherche doit encore représenter la sélection parmi les faits connus. Aucun motif de fermeture n’est inventé. La recherche En cours du tableau composants fait l’objet du filtre explicite `state:open` demandé dans #121 ; une divergence Project/GitHub y est annoncée sans supprimer ce filtre.

Le modèle simplifié ne contient pas les PR individuelles : leur fenêtre propose la recherche du compteur et explique l’absence de preuves individuelles. Elle n’affiche pas de tableau vide d’en-têtes. Les contrôles axe couvrent ces fenêtres, les listes d’issues et les tableaux filtrés sans résultat ; ils ne constituent pas un audit RGAA manuel.

### Liens v2 — issue #118

**IMPLÉMENTÉ — 25 octobre 2026.** Une recherche portant sur un seul repository ouvre directement `/<owner>/<repository>/issues?q=…` (ou `/pulls` pour les PR), sans recherche globale ni qualificateur `repo:` redondant. Les préfixes et emojis des labels sources sont conservés. Une sélection de plusieurs repositories conserve un accès global unique.

Les fenêtres **Issues Done** et **Issues Cancelled** utilisent la vue Project explicitement configurée dans `.env`, avec `filterQuery=status:… repo:… label:…` depuis la correction #121. Les valeurs viennent de `github.projectStatuses.keywords.DONE` et `.CANCELLED` du profil appliqué au pipeline ; toutes les variantes sont réunies avec la syntaxe OR par virgules de GitHub Projects. Aucun `is:closed`, motif de fermeture ou nom de statut anglais n’est substitué au profil. Ces liens sont prioritaires même si la liste contient un seul ticket. Les autres listes conservent l’ouverture directe d’une source unique.

Depuis #121, la vue Project est filtrée sur le repository, les statuts et les labels sources du composant. La réserve sur les différences entre GitHub actuel et snapshot reste affichée. Les liens individuels et CSV conservent les preuves exactes du composant. Sans configuration Project, la fenêtre explique le paramétrage manquant ; un éventuel lien élargi vers Issues ne prétend pas filtrer le statut Project.

Voir [les variables Projects et leurs exemples](guide-utilisation.md#liens-vers-les-vues-github-projects). Elles sont lues au moment de la génération, y compris pour un dataset déjà collecté, sans modifier ses sources. Une prévisualisation sans profil explicite utilise le profil DSQ livré. Les générations classiques ne changent pas.

### Corrections des cohortes composants — issue #121

**IMPLÉMENTÉ — 26 octobre 2026.** Dans « Activité par librairie et composant », la fenêtre **Issues en cours** ouvre une recherche `state:open`, y compris lorsqu’une seule issue est présente. Le compteur conserve sa définition : tous les statuts Project non terminés, hors Cancelled. Si certaines issues de cette population sont Closed dans GitHub, elles restent dans la liste locale ; la note annonce que la recherche GitHub ouverte diffère des états Project. Les autres totaux ne reçoivent aucun filtre ouvert implicite.

Les vues **Done** et **Cancelled** ajoutent `label:…` à `filterQuery=status:… repo:…`. Les labels sont ceux réellement collectés sur les issues explicitement rattachées au composant, avec le préfixe du profil et ses alias déclarés. Les variantes de labels sont réunies par virgules (OR), avec leurs préfixes, espaces et emojis. Aucune recherche Project sans label de composant n’est fabriquée lorsque cette preuve manque. Les correspondances de repositories de #118 restent applicables.

**DÉCISION UTILISATEUR — 26 octobre 2026 :** « Liste locale exacte ; lien GitHub seulement si reproductible ». Cette règle concerne **Délais mesurables** et les trois cellules de durée de la même cohorte (moyenne, médiane, P90). Elle constitue une exception ciblée au repli élargi validé précédemment : si les filtres GitHub incluent d’autres issues connues, la fenêtre n’offre pas de recherche élargie au composant/dépôt. Elle explique la limite et conserve les liens individuels, les résultats exacts et leur CSV complet. Si une source unique ou une combinaison de filtres représente la sélection parmi les issues du snapshot, le lien reste disponible. L’état actuel de GitHub peut toujours différer de celui du snapshot.

Les calculs, exclusions de délais, compteurs et références de revue sont conservés. Les tests `tests/issue-121.test.ts` et `tests/browser/issue-121.spec.ts` couvrent les filtres manquants, un statut Project actif avec une issue Closed, les labels personnalisés et alias, ainsi que les cohortes de délais reproductibles et non reproductibles.

### Cumuls et preuves d’audit — issue #122

**IMPLÉMENTÉ — 26 octobre 2026.** Les colonnes conformes/non conformes cumulées comptent les composants distincts selon le verdict `Component × Version` calculé par le pipeline. Conformément à D-069/D-070, un verdict peut provenir d’une version antérieure. Plusieurs audits applicables peuvent justifier un seul composant. Le détail conserve désormais uniquement `applicableAuditIds` : il n’ajoute plus tous les audits de la version concernant le même composant, notamment ceux en cours ou annulés. Une absence de preuve applicable ne devient pas un audit fictif ; les compteurs et verdicts ne sont pas recalculés par le dashboard.

Les recherches GitHub peuvent combiner les labels et les titres exacts des milestones sources, y compris plusieurs milestones pour un cumul hérité. Ces titres proviennent des issues RAW, rapprochées par URL source ; ils ne sont pas reconstruits depuis le numéro de version (une milestone peut s’appeler `1.7.1-Audit`). Sans titre source, aucun filtre milestone n’est inventé. Les filtres sont vérifiés sur les issues connues ; le repli élargi et son avertissement restent applicables si cette sélection n’est pas reproductible.

**Analyse de la proposition de #122 :** `is:issue label:"Audit RGAA" milestone:… state:closed no:sub-issue` et sa variante `has:sub-issue` permettent d’inspecter une campagne GitHub actuelle, mais ne constituent pas des définitions des cumuls. D-244 utilise Project Done pour terminer un audit ; Closed seul ne suffit pas. Une sous-issue peut être une amélioration sans effet sur le verdict, et une anomalie d’accessibilité non vérifiée peut maintenir la non-conformité. La présence ou l’absence d’enfants ne remplace donc pas les règles métier. Une milestone unique exclut aussi les preuves héritées. Aucun changement de décision métier ni ajustement du décompte pour égaler ces recherches n’est appliqué.

Les tests `tests/issue-122.test.ts` et `tests/browser/issue-122.spec.ts` vérifient les preuves héritées, l’exclusion des audits non applicables, la distinction composant/audits, les milestones multiples et la fenêtre accessible. Le dataset anonymisé mentionné dans l’issue n’étant pas joint à celle-ci, le total attendu pour son cas `1.7.1` ne peut pas être confirmé à partir du seul identifiant de revue.

### Revue des espaces — issues #124 à #128

**IMPLÉMENTÉ — 27 octobre 2026.** L’ancienneté du plus ancien ticket ouvert compte les changements de date en `Europe/Paris` au moment du snapshot, y compris les journées de 23/25 heures. Une issue créée hier indique donc 1 j même avant 24 heures écoulées. La capture reste la référence : l’horloge du navigateur ne modifie pas les compteurs. Les dates futures ou non calculables restent indisponibles.

La colonne **Traitement** remplace Correction dans l’activité et les détails. Pour les tâches non BUG : Restant à faire, Réalisée si Project Done, Annulée si Cancelled. Les labels exacts `Grooming` et `📌 Grooming` affichent **À groomer** pour une issue non terminée/non annulée. Ils sont paramétrables par `issuePolicy.grooming: { labels, prefixes }` ; une configuration explicite remplace ces valeurs par défaut, et une liste vide désactive cette interprétation. Les bugs conservent leurs preuves de correction et de vérification. Une FEATURE sans rattachement à un audit est **Improvement** ; **Improvement d’audit** exige un lien normalisé `auditImprovements`.

Le compteur de composants du repository ouvre la page Labels recherchée avec le préfixe configuré. Le nom de la cohorte Fermeture ouvre les issues `state:closed` ; Traitement métier ouvre la vue Project Done + Closed configurée ; Correction confirmée propose les types bruts et labels de qualification configurés présents dans ses sources. Ces accès sont prioritaires sur l’ouverture d’une source unique et explicitement approchés : les dates mesurables, exclusions DQ, preuves de PR et références exactes restent locales. Les autres cellules des délais continuent à détailler leurs propres références, notamment les exclus, sans remplacer cette population par celle du nom de cohorte.

**DÉCISION UTILISATEUR — D-245, 27 octobre 2026, #126 :** le délai de correction confirmée de cette vue mesure le **premier In progress daté → dernier Done daté**. Si l’une des transitions manque, la paire entière est remplacée par **création → clôture GitHub**. Les bornes, le nombre de jours et la provenance Project/repli GitHub figurent dans le détail et le CSV. Une paire inversée ou non calculable reste exclue, jamais zéro. La PR fusionnée reste nécessaire à la population des corrections confirmées, mais sa date ne borne plus cette durée. Cette évolution cible la cohorte synthétique des corrections confirmées ; les KPI historiques et la cohorte générique de traitement conservent leurs contrats. Les effectifs Fermeture et Traitement métier diffèrent parce que la première population exige Closed, tandis que la seconde exige Done ET Closed et applique ses exclusions DQ.

Dans les campagnes, **Audits terminés / composants (%)** remplace le ratio de tous les audits. Après le diagnostic et la validation **D-246**, les colonnes propres à la campagne sont **Composants sans/avec BUG RGAA déclaré — version** et **BUG RGAA déclarés — audits terminés**. Elles prennent uniquement les audits terminés et leurs enfants de type GitHub BUG explicite portant le préfixe RGAA du profil. Les enfants d’un autre composant restent comptés dans cette lecture par parent, avec leurs propres labels et leurs réserves DQ. L’absence de BUG déclaré ne prouve pas la conformité. Les cumuls métier existants restent distincts (D-069/D-070/D-244), avec leurs positions de revue conservées et sans changer la reconnaissance des bugs par labels. Les EPIC reconnues par type ou label configuré ne deviennent pas des audits. Le pipeline matérialise les références `Audit.declaredRgaaBugIssueIds` ; sans cette preuve dans une ancienne capture, les colonnes déclaratives restent indisponibles jusqu’au rejeu. Les répartitions métier de #128 conservent leur périmètre qualifié et leurs réserves.

Les accès des campagnes utilisent types bruts, labels de reconnaissance et milestones sources ; les EPIC configurées sont exclues. Pour les résultats terminés, la vue Projects configurée utilise Done et les milestones des preuves, y compris héritées. [GitHub documente](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects) les filtres de champs de l’item et la sélection par parent ; il ne documente pas de filtre du parent selon le type ET le label de ses enfants. Aucun filtre fictif « sans/avec enfant BUG RGAA » n’est donc ajouté. La destination Projects demeure approchée et l’avertissement explique cette limite ; la liste locale reste la preuve du verdict.

Trois sections distinctes présentent les anomalies d’audit par **criticité**, **critère d’accessibilité** et **composant**. Le sélecteur **Population représentée** choisit Total, Reste à faire ou Réalisé ; il filtre les lignes à effectif positif avant pagination et export. Les effectifs restent numériques, sans barre comparative. Réalisé signifie correction confirmée (Done + PR fusionnée), sans rétablir automatiquement la conformité (D-226/D-244). Les annulations et statuts inconnus restent séparés. Une issue multi-critères/composants peut figurer dans plusieurs lignes : les sommes des lignes ne sont pas nécessairement des issues distinctes. Les filtres repository/version s’appliquent aux trois sections. #99 reste une proposition plus large, pas un prérequis à ces répartitions.

**DEMANDÉ ET IMPLÉMENTÉ — 28 octobre 2026 :** une colonne **Traités** porte seule
une barre de progression HTML native, calculée par Analytics sur
`(Réalisé + Annulées) / Total`. Elle affiche le numérateur, le total et le
pourcentage, par exemple `2/4 — 50 %`. Les inconnus restent dans Total sans
augmenter le nombre traité. Les annulations comptent dans le traitement, sans
neutralisation métier implicite ni preuve de conformité. Le clic conserve les
preuves exactes des issues réalisées ou annulées ; le tri et le CSV utilisent le
même calcul. Le choix de population ne modifie pas ce dénominateur.

La mesure de cet ajout sur control/81 est de 61 273 octets HTML, 58 174 octets JSON
et 1 442 nœuds DOM maximum. L’empreinte de fixture, le maximum de 24 lignes et les
budgets classiques sont inchangés. La référence précédente est conservée dans
`treatedProgressMeasurement` ; la croissance hors fonctionnalités reste à 0 %.

La mesure précédente de la vue synthétique sur control/81 était de 60 367 octets HTML, 57 268 octets JSON et 1 355 nœuds DOM ; maximum initial de 24 lignes rendues conservé. Les notes et réserves de la lecture D-246 ajoutaient 766 octets à la première mesure de #128. Les références classiques et le seuil de croissance hors fonctionnalités restent inchangés. Les valeurs précédentes sont conservées dans `config/benchmark-simplified-baseline.json`.

**DIAGNOSTIC EFFECTUÉ — 27 octobre 2026 :** le [dataset fourni et les comparaisons de populations](diagnostic-124-128-20261027.md) expliquent les 154 j et reproduisent le résultat attendu 12/29 dans la lecture stricte validée par D-246. Les verdicts métier et les réserves des bugs inférés restent distincts ; aucun résultat métier n’est forcé pour égaler une recherche GitHub. Les cumuls restent indisponibles dans ce jeu sans catalogue historique exploitable.

Validation ciblée : `tests/issues-124-125.test.ts`, `tests/issue-126-duration.test.ts`, `tests/issues-126-127-links.test.ts`, `tests/issues-127-128.test.ts` et `tests/browser/issues-124-128.spec.ts`.
