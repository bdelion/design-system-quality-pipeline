# Objets métier

## 1. Objectif

Ce document recense les objets du **Design System Quality Pipeline** et
précise leur rôle dans le modèle consolidé.

Les cardinalités sont centralisées dans `relations.md`.

Quatre statuts sont utilisés :

- **ÉTABLI** : définition métier suffisamment stabilisée ;
- **ACTUEL** : représentation observée aujourd'hui ;
- **À CONFIRMER** : abstraction ou propriété encore ouverte ;
- **FUTUR** : objet volontairement hors V1.

---

## 2. Design System

Le **Design System** est l'ensemble cohérent de ressources, Composants,
règles et Librairies mis à disposition des produits de l'entreprise.

Il constitue la racine métier du périmètre suivi.

**Statut : ÉTABLI.**

---

## 3. Librairie

Une **Librairie** est une unité métier du Design System mise à
disposition des Applications consommatrices.

### Actuel

```text
1 Repository = 1 Librairie
1 Librairie = 1 Package
```

### Cible

```text
1 Repository = 1..n Librairies
1 Librairie = 1..n Packages
```

La Librairie possède donc une identité métier qui ne doit pas être
réduite à celle du Repository.

**Statut : ÉTABLI pour l'objet et l'orientation cible.**

---

## 4. Repository

Le **Repository** est un conteneur technique GitHub.

Il fournit notamment :

- Issues ;
- Pull Requests ;
- Milestones ;
- branches ;
- tags ;
- Releases ;
- informations de Projects.

Il constitue une source et un périmètre technique, pas l'identité métier
définitive d'une Librairie.

**Statut : ÉTABLI.**

---

## 5. Package

Le **Package** est une unité distribuable pouvant être référencée comme
dépendance par une Application.

Éléments déjà établis :

- il possède un nom ;
- il possède des Versions ;
- ses artefacts sont publiés dans Nexus ;
- une Application le consomme dans une Version donnée.

Aujourd'hui, une Librairie correspond à un Package.

À terme, une Librairie pourra être distribuée par plusieurs Packages.

Les propriétés définitives et les cas multi-Packages restent à
instruire.

**Statut : PARTIELLEMENT ÉTABLI --- Q-001, Q-002.**

---

## 6. Version

Une **Version** identifie un état versionné d'un Package.

Les formes actuellement établies sont notamment :

```text
M.m.r-SNAPSHOT
M.m.r-rc.n
M.m.r-hc.n
M.m.r
```

Il faut distinguer :

- Version déclarée dans `package.json` ;
- Version d'artefact construite ou publiée par Jenkins.

Une Version PROD :

- est de forme `M.m.r` ;
- n'a pas de suffixe ;
- est publiée dans l'espace Nexus PROD ;
- possède un Tag Git correspondant ;
- doit disposer d'une Milestone `M.m.r` ;
- possède normalement une Release GitHub, dont le caractère
  obligatoire reste à confirmer.

Conformément à D-199, `Version` possède un `versionId` métier stable, distinct des identifiants GitHub associés.

Conformément à D-200, son numéro principal est le numéro PROD canonique `M.m.r`, distinct de toute Release Candidate auditée.

Conformément à D-201 et D-202, une Version n’est considérée publiée que si son Git tag PROD exact existe, et `releasedAt` provient de la date de ce tag. Aucune date de Milestone ou de GitHub Release ne s’y substitue silencieusement.

Conformément à D-203, une Version identifiable sans tag PROD reste conservée mais n’est pas publiée : `releasedAt` reste absent et une Data Quality non bloquante est produite.

Conformément à D-204, la Milestone PROD correspondante est référencée via `milestoneId` lorsqu’elle existe, sans devenir la source de vérité de `releasedAt`.

Conformément à D-205 et D-206, un Audit pré-PROD conserve séparément la RC réellement auditée et, lorsqu’il existe, son Git tag et sa date.

Conformément à D-207, une RC indéterminable n’est jamais inventée : l’Audit est conservé et une Data Quality non bloquante signale l’absence.

Conformément à D-208, un Audit de rattrapage référence directement la Version PROD et ne nécessite aucune RC artificielle.

**Statut : ÉTABLI, sauf Release GitHub obligatoire.**

---

## 7. Build Jenkins

Le **Build Jenkins** est une exécution technique participant à la
construction et à la publication des Versions.

Son numéro intervient dans les suffixes `rc.n` et `hc.n`.

Il reste un objet de source technique et n'est pas nécessairement un
objet métier autonome du futur modèle normalisé.

**Statut : ACTUEL / technique.**

---

## 8. Composant

Le **Composant** est une unité fonctionnelle réutilisable appartenant à
une Librairie.

Il peut être concerné par :

- des Issues ;
- des Audits ;
- des Anomalies ;
- des Improvements ;
- des Versions ;
- des informations de qualité.

Le Catalogue constitue la référence des Composants connus.

Le rattachement futur exact du Composant aux Packages d'une Librairie
multi-Packages reste ouvert.

**Statut : ÉTABLI pour l'objet ; relation Package À CONFIRMER.**

---

## 9. Issue

Une **Issue** est un élément de travail actuellement matérialisé dans
GitHub.

Elle peut notamment porter :

- Issue Type ;
- labels ;
- Status ;
- Velocity ;
- Iteration ;
- Milestone ;
- relations avec d'autres Issues ;
- relations avec des Pull Requests ;
- zéro, un ou plusieurs Composants selon sa nature.

Une Issue n'est pas automatiquement une Anomalie.

Toutes les Issues GitHub collectées sont conservées dans le modèle
normalisé sous la forme d'une entité générique `Issue`, y compris
lorsqu'elles ne correspondent à aucun objet métier spécialisé.

Lorsqu'une Issue satisfait les règles d'un objet spécialisé, cet objet
est dérivé de l'Issue sans la remplacer. Une même donnée source peut
donc être représentée par l'`Issue` normalisée et par l'objet métier
spécialisé correspondant, reliés par leur identité ou leur provenance.

Une Issue qui concerne effectivement un Composant doit porter le label
correspondant. Une Issue réellement transverse peut ne porter aucun
Composant.

L’`Issue` normalisée conserve son type d’Issue GitHub/métier collecté dans un champ `issueType`. Ce type participe, avec les relations de l’Issue et les autres règles métier applicables, à la dérivation éventuelle des objets spécialisés.

Les Issue Types relèvent d’un vocabulaire global au système, commun aux repositories suivis. Les valeurs effectivement rencontrées peuvent être inventoriées à partir de l’ensemble des Issues collectées. Leur interprétation métier repose sur une configuration globale de reconnaissance associant chaque notion canonique à une ou plusieurs valeurs ou mots-clés acceptés, dans la continuité de `github.issueTypes.keywords` dans `system.yaml`.

Conformément à D-148, une valeur d’Issue Type non reconnue reste portée par l’Issue sous sa forme brute. Elle déclenche une réserve Data Quality non bloquante « issueType à déclarer », avec la valeur concernée et un lien vers l’Issue GitHub source.

Conformément à D-149, l’Issue distingue explicitement la valeur brute d’Issue Type remontée par GitHub de la notion canonique reconnue par le pipeline. La reconnaissance ne remplace jamais la valeur source : plusieurs valeurs brutes peuvent converger vers une même notion canonique.

Conformément à D-150, lorsqu’aucune notion canonique n’est reconnue, cette propriété est absente. Aucune valeur canonique `UNKNOWN` n’est injectée comme valeur de repli ; la valeur brute et la réserve Data Quality définie par D-148 portent explicitement cette situation.

Conformément à D-151, la notion canonique est recalculée à chaque exécution du pipeline à partir de la valeur brute et de la configuration courante. Une évolution des mots-clés peut donc reclassifier une Issue existante et modifier les objets métier spécialisés qui en sont dérivés, sans modification de l’Issue GitHub source.

Conformément à D-153, les valeurs configurées sont des variantes complètes explicitement autorisées. Elles ne sont pas interprétées comme des sous-chaînes : toute variante acceptée doit être déclarée dans `system.yaml`.

Conformément à D-154, la comparaison stricte des variantes applique uniquement un `trim` et une comparaison insensible à la casse. Elle reste une égalité sur la valeur complète et ne modifie jamais la valeur brute conservée.

Conformément à D-152, si plusieurs notions canoniques correspondent à une même valeur brute, aucune n’est retenue : `issueType` reste absent. Le pipeline n’applique aucune priorité implicite et signale l’ambiguïté en Data Quality avec la valeur brute, les notions candidates et le lien vers l’Issue source.

La liste définitive des notions canoniques reste à préciser.

Conformément à D-155, l’absence totale d’Issue Type n’empêche pas la conservation de l’Issue. Dans ce cas, `rawIssueType` et `issueType` sont tous deux absents. Aucune valeur artificielle n’est injectée. Une réserve Data Quality non bloquante « issueType manquant » doit fournir un lien vers l’Issue GitHub concernée. Ce cas reste distinct d’une valeur présente mais non reconnue, traitée par D-148 comme « issueType à déclarer ».

Conformément à D-156, toute `Issue` normalisée conserve également son `title` GitHub. Cette propriété générique est conservée même lorsqu’aucun objet métier spécialisé n’est dérivé de l’Issue. Elle peut être exploitée par les couches aval, notamment le dashboard et la Data Quality, sans revenir au `RawDataset`.

Conformément à D-157, toute `Issue` normalisée conserve son état GitHub dans `state`, avec les valeurs `OPEN` ou `CLOSED`. Cet état natif de l’Issue ne doit pas être confondu avec le statut GitHub Projects (`Backlog`, `Ready`, `In progress`, `In review`, `Done`, etc.). Il est conservé même lorsqu’aucune spécialisation métier n’est dérivée de l’Issue.

Conformément à D-158, toute `Issue` normalisée conserve également `createdAt` et, lorsqu’elle est fermée, `closedAt`. Ces propriétés représentent les dates GitHub natives de création et de fermeture de l’Issue. Elles restent distinctes des dates métier dérivées telles que `detectedAt`, `correctedAt` et `completedAt`.

Conformément à D-159, toute `Issue` normalisée conserve l’ensemble de ses labels GitHub dans `labels: string[]`, y compris ceux qui ne sont pas interprétés par le pipeline. Les notions métier dérivées depuis certains labels restent des propriétés séparées et ne remplacent jamais cette collection source.

Conformément à D-160, toute `Issue` normalisée conserve explicitement `repositoryId` en plus de `libraryId`. La provenance repository ne doit donc pas être reconstruite uniquement à partir de la Library. Ce choix découple l’Issue de l’hypothèse actuelle « une Library = un repository » et prépare l’évolution vers plusieurs repositories ou packages par Library.

Conformément à D-161, toute `Issue` normalisée conserve explicitement son URL GitHub dans `url: string`. Cette donnée source permet notamment au dashboard et à la Data Quality de proposer un lien direct vers l’Issue sans reconstruire son URL à partir de `repositoryId` et `number`.

Conformément à D-162, toute `Issue` normalisée conserve son rattachement éventuel à une Milestone dans `milestoneId?: string`. La `Milestone` demeure un objet normalisé distinct : l’Issue porte sa référence sans dupliquer ses propriétés. Ce rattachement est conservé pour toutes les Issues, indépendamment de son interprétation métier ultérieure.

Conformément à D-163, toute `Issue` normalisée conserve également ses rattachements et statuts GitHub Projects dans `projectStatuses`. Cette donnée générique est préservée même lorsqu’elle n’est pas utilisée par une spécialisation métier. Les statuts Projects restent distincts de `state`, qui représente uniquement l’état natif `OPEN` ou `CLOSED` de l’Issue.

Conformément à D-164, `Issue` conserve ses relations de parenté via `parentIssueId?: string` et `subIssueIds: string[]`. Ces relations restent génériques et peuvent ensuite être utilisées par les règles de spécialisation métier.

Conformément à D-165, `Issue` conserve également `linkedPullRequestIds: string[]`, contenant les références aux Pull Requests liés.

Conformément à D-166, D-167 et D-168, les informations GitHub Projects `Iteration`, `Velocity` et `Scheduling` sont conservées dans l’Issue normalisée lorsqu’elles existent. Elles appartiennent au socle générique de pilotage de l’Issue ; leur représentation détaillée doit rester alignée avec le contrat GitHub Projects et ne doit pas être inventée avant sa formalisation.

Conformément à D-169, `Issue` conserve `componentIds: string[]`, dérivé des labels de Component reconnus. Une Issue peut ainsi référencer zéro, un ou plusieurs Components sans perdre ses labels GitHub source.

Conformément à D-170 et D-171, `Issue` conserve également les criticités et catégories Accessibility reconnues depuis ses labels. Leur présence au niveau générique ne leur confère pas automatiquement les contraintes métier propres à une anomalie d’Audit Accessibility ; ces contraintes restent portées par les spécialisations concernées.

Conformément à D-172, les données GitHub Projects d’une Issue sont structurées par Project d’origine. Le statut, l’Iteration, `Velocity` et `Scheduling` d’un Project ne sont pas fusionnés avec ceux d’un autre Project.

Conformément à D-173, toute valeur GitHub Projects soumise à reconnaissance mais non reconnue est conservée sous sa forme brute, sans valeur canonique artificielle. Le pipeline reste non bloquant et la situation est signalée par la Data Quality.

Conformément à D-174, chaque contexte GitHub Project associé à une `Issue` conserve `projectId` et `projectName`. L’identifiant constitue la référence stable tandis que le nom reste disponible pour l’affichage, le diagnostic et les fixtures.

Conformément à D-175, le statut Project brut est conservé séparément de sa notion canonique éventuelle. La canonicalisation ne remplace jamais la valeur source et l’absence de reconnaissance laisse la notion canonique absente.

Conformément à D-176, la notion canonique du statut Project est recalculée à chaque exécution à partir de la valeur brute et de la configuration courante.

Conformément à D-177, les variantes de statut Project sont reconnues par égalité sur la valeur complète après `trim` et sans distinction de casse. Aucun matching par sous-chaîne n’est autorisé.

Conformément à D-178, une correspondance avec plusieurs notions canoniques ne produit aucun choix automatique : la valeur brute est conservée, la notion canonique reste absente, les candidats sont signalés et une Data Quality non bloquante est produite.

Conformément à D-179, une Iteration GitHub Projects conserve au minimum son identifiant, son titre, sa date de début et sa durée ou sa date de fin lorsque GitHub fournit ces informations. Une donnée absente n’est jamais inventée.

Conformément à D-180, l’Iteration est portée par le contexte du Project qui l’attribue à l’Issue. Une Issue présente dans plusieurs Projects peut donc avoir des Iterations différentes sans fusion implicite.

Conformément à D-181, `Velocity` conserve séparément sa valeur brute et une valeur numérique normalisée lorsqu’une conversion valide est possible. La représentation numérique ne remplace jamais la donnée source.

Conformément à D-182, une `Velocity` renseignée mais non interprétable conserve sa valeur brute, ne produit aucune valeur numérique et déclenche une Data Quality non bloquante sans interrompre le pipeline.

Conformément à D-183, `Scheduling` conserve systématiquement sa valeur brute telle que collectée dans le contexte du Project. Toute interprétation ou canonicalisation reste séparée de cette valeur source.

Conformément à D-184, chaque contexte GitHub Project conserve l’historique des changements de statut de l’Issue, et pas uniquement son statut courant.

Conformément à D-185, une transition conserve au minimum le Project concerné, le statut brut précédent lorsqu’il est disponible, le nouveau statut brut et la date/heure de transition. Une donnée non fournie n’est pas inventée.

Conformément à D-186, les statuts historiques sont canonicalisés avec les mêmes règles que le statut courant tout en conservant systématiquement leurs valeurs brutes.

Conformément à D-187, toutes les transitions disponibles sont conservées, y compris plusieurs entrées dans `Done` et les sorties ultérieures de `Done`. La sélection d’une transition pertinente relève des règles métier aval.

Conformément à D-188, un historique insuffisant ne conduit jamais à inventer `correctedAt`, `completedAt` ou une autre date métier. Les données disponibles sont conservées, la date indéterminable reste absente et une Data Quality non bloquante est produite.

Conformément à D-189, D-190 et D-191, `Audit`, `Anomaly` et `AuditImprovement` sont des spécialisations qui référencent l’`Issue` générique par `issueId` sans recopier les faits GitHub communs.

Conformément à D-192, ces spécialisations possèdent respectivement `auditId`, `anomalyId` et `auditImprovementId`, identifiants métier propres, stables et distincts de `issueId`.

Conformément à D-193, une `Anomaly` d’origine `AUDIT` porte l’`auditId` de son Audit lorsque la relation est valide, tandis qu’une anomalie `HORS_AUDIT` n’en porte pas. Une relation Audit attendue mais invalide reste distinguable par la Data Quality.

Conformément à D-194, une `AuditImprovement` porte obligatoirement l’`auditId` de son Audit parent ; aucun rattachement artificiel n’est créé lorsqu’une relation valide ne peut pas être établie.

Conformément à D-195, `Audit` porte explicitement son unique `componentId`. Conformément à D-196, une `Anomaly` d’origine `AUDIT` porte également le `componentId` associé à son Audit lorsque la relation est valide.

Conformément à D-197, une divergence de Component entre l’Issue enfant et l’Audit parent n’est jamais corrigée silencieusement : les faits source sont conservés et une Data Quality non bloquante signale le conflit.

Conformément à D-198, une Issue `Bug` reste matérialisée en `Anomaly` même si son parent Audit attendu est absent ou invalide. Aucun `auditId` artificiel n’est créé et une Data Quality non bloquante signale la relation impossible à établir.

### Décisions I1 sur Catalogue, Component × Version et conformité

- **D-209 — Catalogue historique propre à chaque Version PROD** : Chaque Version PROD possède son propre Catalogue historique, représentant les Components présents dans le repository pour cette Version.
- **D-210 — Catalogue historique lu dans le Git tree du tag PROD** : Le Catalogue historique d’une Version est reconstruit à partir du fichier de catalogue présent dans le Git tree du tag PROD exact `M.m.r`. Le catalogue courant ne sert jamais de substitut rétroactif.
- **D-211 — Catalogue indéterminable lorsqu’un tag PROD manque** : Si une Version est identifiable mais que son tag PROD est absent, son Catalogue historique est indéterminable. Le catalogue courant n’est pas utilisé comme fallback.
- **D-212 — Catalogue absent ou illisible au tag PROD** : Si le tag PROD existe mais que le fichier Catalogue attendu est absent ou illisible dans ce tag, la Version est conservée, son Catalogue historique reste indéterminable et une Data Quality non bloquante est produite. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-213 — Conservation historique d’un Component supprimé** : Un Component présent dans le Catalogue d’une ancienne Version reste membre du Catalogue historique de cette Version même s’il a ensuite été supprimé du catalogue courant.
- **D-214 — Absence historique d’un Component ajouté ultérieurement** : Un Component ajouté après une Version `M.m.r` est absent du Catalogue historique de cette Version. Sa présence actuelle ne doit jamais être rétroprojetée.
- **D-215 — Identifiant métier stable de Component** : Chaque `Component` possède un `componentId` métier stable, distinct de son nom ou libellé affiché.
- **D-216 — Identité d’un Component conservée entre Versions continues** : Lorsqu’un même Component métier est présent dans plusieurs Versions continues, il conserve le même `componentId` afin de permettre son suivi longitudinal.
- **D-217 — Renommage explicite d’un Component** : Un renommage peut conserver le `componentId` lorsqu’il est explicitement établi que le Component métier reste le même. Cette continuité doit être déclarée par configuration ou règle explicite et ne doit jamais être devinée automatiquement.
- **D-218 — Nouvelle identité après disparition puis réapparition** : Lorsqu’un Component disparaît du Catalogue pendant une ou plusieurs Versions puis réapparaît, sa réapparition ne réutilise pas le `componentId` historique précédent. Elle constitue une nouvelle identité métier.
- **D-219 — Matérialisation de la relation Component × Version** : Le modèle normalisé matérialise explicitement la présence d’un Component dans une Version. Les KPI et verdicts ne doivent pas reconstruire implicitement cette relation à partir du catalogue courant.
- **D-220 — Couverture fondée sur au moins un Audit terminé applicable** : Un couple `Component × Version` est couvert dès lors qu’au moins un Audit applicable à ce couple est terminé au sens métier défini par D-141.
- **D-221 — Audit incomplet insuffisant pour la couverture** : Un Audit commencé mais non terminé ne rend jamais un couple `Component × Version` couvert à lui seul.
- **D-222 — Verdict courant agrégé sur l’ensemble des Audits terminés applicables** : Le verdict courant d’un couple `Component × Version` est calculé à partir de l’ensemble des Audits terminés applicables à ce couple, et non à partir du seul Audit terminé le plus récent. Tous les Audits terminés applicables contribuent à l’état courant selon les règles de conformité. Cette décision remplace la règle antérieure de sélection du dernier Audit terminé portée notamment par D-046.
- **D-223 — Un Audit incomplet ne modifie pas le verdict acquis** : Un Audit plus récent mais incomplet ne contribue pas au verdict courant et ne remplace pas l’état acquis à partir des Audits terminés applicables.
- **D-224 — Conformité conditionnée à l’absence d’anomalie d’Audit ouverte pertinente** : Un couple `Component × Version` couvert ne peut être conforme que si l’ensemble des Audits terminés applicables pris en compte pour son verdict ne laisse aucune anomalie d’Audit ouverte affectant la conformité.
- **D-225 — AuditImprovement sans effet sur le verdict de conformité** : Une `AuditImprovement`, ouverte ou fermée, n’intervient jamais dans le calcul du verdict de conformité d’un couple `Component × Version`.
- **D-226 — Correction d’une anomalie insuffisante pour rétablir la conformité** : La correction ou la fermeture d’une anomalie issue d’un Audit ne rétablit pas à elle seule la conformité du Component. Le Component reste non conforme jusqu’à ce qu’un nouvel Audit terminé applicable valide la conformité. L’anomalie corrigée reste conservée dans l’historique.
- **D-227 — Anomalie HORS_AUDIT sans effet direct sur la conformité d’Audit** : Une anomalie d’origine `HORS_AUDIT` ne modifie pas directement le verdict de conformité calculé à partir des Audits applicables au couple `Component × Version`.
- **D-228 — État NON_COUVERT en absence d’Audit terminé applicable** : Si un Component appartient au Catalogue historique d’une Version mais ne possède aucun Audit terminé applicable, son état est `NON_COUVERT` / non évalué. Il ne doit jamais être assimilé à `NON_CONFORME`.

**Statut : ÉTABLI pour la conservation exhaustive, la conservation optionnelle du type brut, sa séparation de la notion canonique, le traitement des types absents/non reconnus et le principe de reconnaissance globale configurable ; liste définitive des notions canoniques À CONFIRMER.**

---

## 10. Audit

Un **Audit** représente l'évaluation d'un Composant dans un contexte de
Version.

Aujourd'hui, le travail est matérialisé par une Issue GitHub d'Audit.

Une Issue d'Audit :

- concerne exactement un Composant ;
- peut produire zéro à plusieurs Anomalies ;
- peut produire zéro à plusieurs Improvements ;
- est réalisée lorsqu'elle est à la fois `Project Status = Done` et
  `GitHub Issue State = Closed`.

Pour un Audit Accessibilité terminé :

```text
0 Anomalie
→ AUDITÉ & CONFORME

1..n Anomalies
→ AUDITÉ & NON CONFORME
```

Les Improvements n'affectent pas ce verdict.

Il reste à décider si `Audit` doit être un objet métier indépendant de
l'Issue GitHub qui le matérialise.

**Statut : PARTIELLEMENT ÉTABLI --- Q-015.**

---

## 11. Famille d'Audit

La **Famille d'Audit** décrit la nature de l'évaluation réalisée.

La nature de l'Issue et la famille sont deux dimensions distinctes :

```text
Issue Type = Audit
Famille     = Accessibilité / RGAA actuellement
```

La représentation technique de cette famille reste à décider.

**Statut : principe ÉTABLI ; représentation À CONFIRMER.**

---

## 12. Campagne d'Audit

Une **Campagne d'Audit** est une abstraction potentielle permettant de
regrouper plusieurs Audits.

Aujourd'hui, une Milestone peut jouer ce rôle de regroupement pour :

- une future Version PROD ;
- un Audit de rattrapage.

Il n'est pas établi qu'une Campagne doive devenir un objet métier
autonome.

**Statut : À CONFIRMER --- Q-016.**

---

## 13. Anomalie

Une **Anomalie** est un problème identifié sur le Design System.

Pour les Anomalies provenant d'un Audit, le modèle est désormais strict
:

- une Issue GitHub qualifiée comme Anomalie compte pour une Anomalie ;
- elle est sous-Issue d'exactement un Audit ;
- son Issue Type est `🐛 Bug` ;
- elle concerne exactement le même Composant que son Audit parent ;
- pour un Audit Accessibilité, elle possède exactement une criticité
  RGAA et exactement une catégorie `a11y`.

Une Issue peut regrouper plusieurs occurrences du même problème : le
dashboard ne cherche pas à compter ces occurrences internes.

Pour les Anomalies hors Audit, l'identification configurable, les
origines et certaines propriétés restent à consolider.

**Statut : ÉTABLI pour l'Anomalie d'Audit ; PARTIEL pour l'Anomalie
générale.**

---

## 14. Improvement

Une **Improvement** issue d'un Audit est une proposition d'amélioration
qui ne constitue pas une non-conformité.

Elle :

- est une sous-Issue d'exactement un Audit ;
- possède l'Issue Type `✨ Feature` ;
- concerne exactement le même Composant que l'Audit ;
- ne porte aucune criticité RGAA ;
- peut porter une catégorisation `a11y`, mais celle-ci est facultative
  ;
- n'affecte pas le verdict de conformité.

La cardinalité maximale des catégories `a11y` d'une Improvement reste à
confirmer.

**Statut : ÉTABLI sauf cardinalité maximale a11y.**

---

## 15. Criticité

La **Criticité** qualifie la gravité d'un problème dans un domaine
déterminé.

Les domaines identifiés comprennent :

- accessibilité / RGAA / WAI-ARIA ;
- métier ;
- fonctionnalité ;
- technique ;
- Developer Experience ;
- Designer Experience.

Les labels RGAA `bloquante`, `majeure`, `mineure` sont strictement
réservés aux Anomalies provenant d'un Audit Accessibilité.

**Statut : ÉTABLI.**

---

## 16. Catégorie a11y

Une **catégorie a11y** décrit une thématique d'accessibilité.

Elle est transverse à la nature et à l'origine de l'Issue.

Elle peut donc apparaître sur :

- Anomalie d'Audit ;
- Improvement d'Audit ;
- Issue hors Audit.

Elle ne suffit jamais à conclure qu'une Issue est une Anomalie ou
provient d'un Audit.

**Statut : ÉTABLI.**

---

## 17. Pull Request

Une **Pull Request** représente une proposition de modification du code.

Elle peut être liée à une ou plusieurs Issues.

Son caractère obligatoire dépend du profil de workflow : une règle
générale ne doit pas être appliquée indistinctement aux Issues STANDARD,
EPIC, AUDIT, RELEASE ou CONCEPTION.

**Statut : objet ÉTABLI ; obligations À FORMALISER.**

---

## 18. Iteration

Une **Iteration** représente une fenêtre de planification
opérationnelle, actuellement assimilée au Sprint dans le fonctionnement
de la Squad.

Son usage et son obligation dépendent du statut et du profil de
workflow.

**Statut : ÉTABLI comme objet source ; règles À FORMALISER.**

---

## 19. Milestone

Une **Milestone** est un regroupement GitHub dont la sémantique est
polymorphe.

Elle peut notamment représenter :

- une Version `M.m.r` ;
- un Audit de rattrapage `M.m.r-Audit` ;
- un horizon trimestriel ou semestriel ;
- un lot de priorité Design.

Une Milestone doit donc être classifiée avant d'être interprétée.

`M.m.r-Audit` ne constitue pas une Version supplémentaire.

**Statut : ÉTABLI.**

---

## 20. Release GitHub

Une **Release GitHub** peut correspondre à une Version PROD.

Son existence est actuellement considérée comme normale mais son
caractère obligatoire et son mécanisme exact de création ne sont pas
établis.

**Statut : À CONFIRMER --- Q-007.**

---

## 21. Tag Git

Un **Tag Git** `M.m.r` constitue l'un des éléments permettant
d'identifier une Version PROD.

Pour le processus nominal établi, Jenkins produit le Tag lors de la
publication PROD.

La règle de traitement d'un Tag attendu mais absent reste à définir.

**Statut : ÉTABLI pour le nominal ; anomalie À INSTRUIRE.**

---

## 22. Application consommatrice

Une **Application** est un produit consommant potentiellement un ou
plusieurs Packages du Design System.

Le futur modèle devra pouvoir représenter :

```text
Application
└── Package @ Version
```

puis l'usage éventuel de Composants.

Les sources et méthodes de détection ne sont pas définies.

**Statut : FUTUR.**

---

## 23. Consommation

La **Consommation** est un futur objet ou une future relation permettant
de représenter qu'une Application utilise un Package dans une Version
donnée.

Elle pourra éventuellement porter d'autres informations d'observation ou
d'environnement.

Sa forme technique n'est pas arrêtée.

**Statut : FUTUR.**

---

## 24. Snapshot

Un **Snapshot** représente l'état connu du pipeline à un instant de
capture.

Il contient notamment les données sources projetées, données
normalisées, résultats DQ et métriques.

Il ne doit pas être confondu avec un événement métier.

**Statut : ÉTABLI techniquement.**

---

## 25. Data Quality Issue

Une **Data Quality Issue** signale une incohérence, une absence ou une
réserve sur les données exploitées.

Elle ne corrige pas silencieusement les données sources.

Son impact doit être déterminé au niveau des métriques concernées plutôt
que dégrader arbitrairement toutes les métriques.

**Statut : ÉTABLI comme principe analytique.**

---

## 26. Objets à ne pas confondre

Le modèle impose notamment les distinctions suivantes :

```text
Repository ≠ Librairie

Librairie ≠ Package

Version déclarée ≠ Version d'artefact

Milestone ≠ Version

Issue ≠ Anomalie

Audit métier ? Issue d'Audit
    → identité exacte encore ouverte

Anomalie ≠ Improvement

criticité RGAA ≠ catégorie a11y

Snapshot ≠ événement métier
```

Ces distinctions doivent rester visibles dans le modèle normalisé.

---

## Anomalie --- identification générale

Une Issue GitHub dont l'Issue Type est `🐛 Bug` représente une
**Anomalie hors Audit**.

Une Anomalie découverte dans le cadre d'un Audit reste également une
Issue de type `🐛 Bug`, mais elle est distinguée par sa relation de
sub-Issue avec l'Issue d'Audit d'origine.

```text
Anomalie
├── hors Audit
└── issue d'un Audit
```

La relation à l'Audit qualifie l'origine de l'Anomalie ; elle ne change
pas la nature `Anomalie` de l'Issue.

---

## Anomalie --- origine en V1

Pour la V1, l'origine d'une Anomalie est volontairement limitée à deux
valeurs métier :

```text
AUDIT
HORS_AUDIT
```

Une Anomalie `HORS_AUDIT` n'est pas subdivisée davantage en V1.

La provenance plus détaillée d'une Anomalie hors Audit constitue un
besoin V2. Les dimensions à challenger comprennent notamment le fait
qu'une Anomalie soit remontée depuis l'extérieur de la Squad ou depuis
la Squad elle-même.

La taxonomie V2 et les indicateurs associés ne sont pas encore définis.

---

## Anomalie --- date de détection

Pour une Anomalie, la date métier de détection est la date de création
de l'Issue `🐛 Bug` dans GitHub.

```text
Anomalie.detectedAt = GitHub Issue.createdAt
```

Cette règle s'applique aux Anomalies issues d'un Audit comme aux
Anomalies hors Audit. Le modèle ne reconstruit pas une éventuelle
constatation antérieure à la création de l'Issue.

---

## Anomalie --- date de correction

La date métier de correction d'une Anomalie est la date à laquelle
l'Issue `🐛 Bug` passe au statut Project `Done`.

```text
Anomalie.correctedAt = date du passage de l'Issue à Done
```

Dans le fonctionnement nominal, cet événement doit être cohérent avec
la fermeture (`Closed`) de l'Issue et le merge de la Pull Request de
correction lorsqu'une Pull Request est requise.

`Done` reste toutefois l'événement métier de référence pour
`correctedAt`. Un écart temporel ou d'état avec `Closed` ou avec le merge
de la Pull Request relève d'un contrôle de cohérence des données et ne
change pas la définition de `correctedAt`.

---

## Audit --- date de fin

La date métier de fin d'un Audit est la date à laquelle son Issue d'Audit passe au statut Project `Done`.

```text
Audit.completedAt = date du passage de l'Issue d'Audit à Done
```

Dans le fonctionnement nominal, l'Issue doit également être `Closed` de manière cohérente. C'est à `completedAt` que le Component concerné est considéré comme audité pour les calculs historiques.

La date de début d'un Audit n'est pas déduite de cette décision.

---

## Audit --- artefact réellement audité

Un Audit pré-PROD porte deux références de Version complémentaires :

```text
targetVersion
→ Version cible portée par la Milestone, de forme M.m.r

auditedReleaseCandidate
→ champ explicite porté par l'Issue d'Audit, de forme M.m.r-rc.n
```

`auditedReleaseCandidate` identifie l'artefact réellement soumis à l'Audit.

La Milestone reste nécessaire pour rattacher l'Audit à sa Version cible. Elle ne remplace pas le champ explicite de RC auditée.

---

## Version --- Catalogue historique applicable

Une Version PROD possède un Catalogue historique applicable.

Pour `M.m.r`, ce Catalogue est reconstruit depuis l'état du Repository
au Git tag `M.m.r`.

Il représente le périmètre des Components de cette Version et sert
notamment de dénominateur aux indicateurs historiques de couverture
d'Audit.

---

## Version --- date de Release

Une Version PROD `M.m.r` possède une date métier de Release définie par la date de création de son Git tag `M.m.r`.

```text
releasedAt = GitTag(M.m.r).createdAt
```

`releasedAt` sert d'instant de coupure pour reconstruire l'état connu à la Release.

## Décisions finales I1 sur validité et intégrité des spécialisations

- **D-229 — Issue Audit sans Component reconnu** : Si une Issue reconnue comme Audit ne possède aucun Component reconnu, l’Issue générique est conservée mais aucun `Audit` métier valide n’est matérialisé. Aucun Component n’est inventé. Une Data Quality non bloquante signale l’absence du Component requis. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-230 — Issue Audit avec plusieurs Components reconnus** : Si une Issue reconnue comme Audit possède plusieurs Components reconnus, l’Issue générique est conservée mais aucun `Audit` métier valide n’est matérialisé. Le pipeline ne sélectionne jamais arbitrairement un Component. Une Data Quality non bloquante signale la violation de cardinalité. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-231 — Issue Audit sans Version PROD cible déterminable** : Si la Version PROD cible d’une Issue Audit ne peut pas être déterminée, l’Issue générique est conservée mais aucun `Audit` métier complet et valide n’est matérialisé. Aucune Version cible n’est inventée. Une Data Quality non bloquante signale l’information manquante. Son identifiant `DQ-xxx` sera attribué en I5.
- **D-232 — Conservation des anomalies enfants d’un Audit invalide** : Lorsqu’une Issue Audit parente existe mais ne peut pas être matérialisée comme `Audit` valide, ses Issues `Bug` enfants restent conservées et sont matérialisées comme `Anomaly`. Aucun `auditId` invalide ou artificiel n’est produit. Les Data Quality correspondant à l’Audit invalide et à la relation d’anomalie non validable sont conservées.
- **D-233 — Feature enfant sans Audit parent valide** : Une Issue `Feature` dont l’Audit parent est absent ou invalide reste conservée comme `Issue` générique mais n’est pas matérialisée en `AuditImprovement`. Un `AuditImprovement` exige un Audit parent valide conformément à D-194. Une Data Quality non bloquante peut signaler la relation attendue non validable.
- **D-234 — Bug rattaché à plusieurs Audits valides** : Si une Issue `Bug` est sous-Issue de plusieurs Audits valides, l’`Anomaly` est conservée mais la relation vers l’Audit est considérée ambiguë. Aucun `auditId` n’est sélectionné automatiquement. Une Data Quality non bloquante expose l’ambiguïté et les Audits candidats.
- **D-235 — Feature rattachée à plusieurs Audits valides** : Si une Issue `Feature` est sous-Issue de plusieurs Audits valides, aucune `AuditImprovement` n’est matérialisée tant que la relation vers l’Audit n’est pas univoque. L’Issue générique reste conservée et une Data Quality non bloquante expose l’ambiguïté et les Audits candidats.
- **D-236 — Origine indéterminée d’une anomalie à relation Audit non validable** : Lorsqu’une Issue `Bug` présente une relation qui suggère une origine Audit mais que cette relation ne peut pas être validée, son origine n’est pas artificiellement classée `HORS_AUDIT`. L’anomalie est conservée avec une origine indéterminée et la Data Quality appropriée.
- **D-237 — Trois valeurs canoniques pour Anomaly.origin** : Le contrat normalisé de `Anomaly.origin` accepte trois valeurs canoniques : `AUDIT`, `HORS_AUDIT` et `UNDETERMINED`. `UNDETERMINED` représente les situations où les faits source suggèrent une relation d’Audit mais ne permettent pas de la valider. Cette décision étend D-138.
- **D-238 — Cardinalité Component des anomalies HORS_AUDIT** : Une `Anomaly` d’origine `HORS_AUDIT` n’impose pas exactement un Component. Elle conserve le rattachement 0..n Components dérivé de son Issue générique.
- **D-239 — Cardinalité Component des anomalies UNDETERMINED** : Une `Anomaly` d’origine `UNDETERMINED` conserve également les 0..n Components dérivés de son Issue générique. Le pipeline ne sélectionne pas artificiellement un Component.
- **D-240 — Unicité des spécialisations par Issue** : Une Issue GitHub donnée peut produire au maximum une instance de chaque spécialisation métier qui lui est applicable. Une ambiguïté ou une cardinalité source invalide ne doit jamais être résolue en dupliquant `Audit`, `Anomaly` ou `AuditImprovement`.
- **D-241 — Intégrité référentielle du modèle normalisé** : Toute référence normalisée telle que `issueId`, `auditId`, `componentId`, `versionId` ou `milestoneId` doit pointer vers une entité réellement présente dans le dataset normalisé lorsque la relation est matérialisée. Si une relation attendue ne peut pas être résolue, aucune référence orpheline n’est créée : la référence reste absente et une Data Quality non bloquante signale l’incohérence.
- **D-242 — Déterminisme de la normalisation** : À dataset brut et configuration identiques, la normalisation produit les mêmes identifiants métier, classifications et relations, indépendamment de l’ordre des objets collectés. La génération des identifiants et les règles de résolution ne dépendent ni de l’ordre d’itération ni d’un état d’exécution non déterministe.
- **D-243 — Clôture conditionnelle du lot I1 avant implémentation** : I1 est fonctionnellement spécifié lorsque ses décisions permettent de définir les contrats TypeScript sans ambiguïté métier bloquante. Avant de déclarer I1 `GREEN` et de modifier le code, un checkpoint final est réalisé sur un ZIP complet et à jour du repository contenant les décisions appliquées jusqu’à D-243. Il vérifie au minimum décisions actives/supplantées, documentation, configuration, contrats TypeScript existants, tests et fixtures. Les questions non bloquantes restantes sont reportées aux lots I2 à I9.
