# Priorisation des questions pour la V1

## 1. Objet

Ce document est un **outil de pilotage**.

Il ne remplace pas `questions-ouvertes.md`, qui reste le registre
cumulatif de référence des décisions `D-xxx` et questions `Q-xxx`.

La priorité V1 et le statut métier répondent à deux questions
différentes :

```text
Statut métier
→ la question est-elle résolue ?

Priorité V1
→ faut-il la résoudre avant de figer / implémenter la V1 ?
```

Une question peut donc rester `À instruire` tout en étant classée
`V1.1`, `Futur` ou `À traiter pendant l'implémentation`.

---

## 2. Niveaux de priorité

### BLOQUANT V1

Une décision métier est nécessaire avant de figer le modèle ou une règle
essentielle de la V1.

### À TRAITER PENDANT L'IMPLÉMENTATION

Le besoin métier est suffisamment cadré pour commencer la V1, mais un
choix technique, une règle de robustesse ou une vérification du
comportement réel reste nécessaire.

### V1.1 / ÉVOLUTION

La question est pertinente mais peut être différée sans rendre
incohérent le cœur de la V1.

### FUTUR

La question dépend d'un périmètre explicitement futur, notamment les
Applications consommatrices, l'usage réel ou une architecture plus
large.

### DÉJÀ ÉTABLI

La question possède déjà une réponse métier suffisante pour la V1. Elle
reste dans le registre pour la traçabilité.

---

# 3. Questions bloquantes pour la V1

Le nombre de questions réellement bloquantes est désormais limité.

## 3.1 Anomalies et temporalité

### Q-011 --- Définition d'une Anomalie

**Priorité : DÉJÀ ÉTABLI**

La règle générale est désormais établie :

```text
Issue Type = 🐛 Bug
→ Anomalie hors Audit
```

Lorsqu'une Issue `🐛 Bug` est reliée comme sub-Issue à un Audit, elle est
une Anomalie issue de cet Audit.

Q-011 ne bloque donc plus la V1.

### Q-013 --- Date de détection

**Priorité : DÉJÀ ÉTABLI**

La date métier de détection d'une Anomalie est la date de création de
l'Issue `🐛 Bug` dans GitHub :

```text
detectedAt = GitHub Issue.createdAt
```

Cette règle vaut pour les Anomalies issues d'un Audit et hors Audit.

### Q-014 --- Date de correction

**Priorité : DÉJÀ ÉTABLI**

La date métier de correction d'une Anomalie est la date à laquelle
l'Issue `🐛 Bug` passe au statut Project `Done` :

```text
correctedAt = date du passage à Done
```

Dans le fonctionnement nominal, cette date doit être cohérente avec la
fermeture de l'Issue et le merge de la Pull Request de correction.

Un écart relève de la qualité des données ; `Closed` ou la date de merge
ne remplacent pas silencieusement la référence `Done`.

### Q-019 --- Temporalité exacte de l'Audit

**Priorité : PARTIELLEMENT ÉTABLI — NON BLOQUANT POUR LA FIN D'AUDIT**

La date métier de fin d'un Audit est la date à laquelle son Issue passe au statut Project `Done` :

```text
Audit.completedAt = date du passage à Done
```

L'Issue doit également être `Closed` pour que l'Audit soit réalisé. À `completedAt`, le Component concerné devient audité pour les calculs historiques.

La date de début de l'Audit reste à définir seulement si un besoin métier ou un indicateur la nécessite.

### Q-045 --- Représentation de la famille d'Audit

**Priorité : BLOQUANT V1 uniquement si la V1 migre vers
`Issue Type = Audit`**

Le fonctionnement actuel peut continuer à reconnaître l'Audit
Accessibilité par la représentation configurée existante.

La cible doit séparer :

```text
nature = Audit
famille = Accessibilité
```

Le mécanisme GitHub exact reste à décider avant une migration.

### Q-046 --- Cardinalité de la famille d'Audit

**Priorité : BLOQUANT V1 uniquement si la famille devient une donnée
normalisée obligatoire**

Le fonctionnement actuel ne pratique qu'une famille Accessibilité.

Il faut éviter d'imposer prématurément une cardinalité générique si la
V1 n'en a pas besoin.

### Q-048 --- Release Candidate réellement auditée

**Priorité : DÉJÀ ÉTABLI**

Pour un Audit pré-PROD, la Version cible et l'artefact réellement audité sont deux informations complémentaires :

```text
Milestone de l'Issue d'Audit
→ Version cible M.m.r

Champ explicite sur l'Issue d'Audit
→ RC réellement auditée M.m.r-rc.n
```

La Milestone doit être prise en compte, mais elle ne suffit pas à identifier la RC auditée. La RC ne doit notamment pas être déduite de la dernière RC Jenkins disponible.

L'absence du champ explicite sur un Audit pré-PROD constitue une information manquante à traiter par la qualité des données.

### Q-081 --- Construction du Catalogue historique

**Priorité : DÉJÀ ÉTABLI**

Pour une Version PROD `M.m.r`, le Catalogue historique applicable est
reconstruit à partir du contenu du Repository au Git tag `M.m.r`.

```text
Git tag M.m.r
→ état du Repository
→ Catalogue historique de M.m.r
```

Ce Catalogue est le périmètre de référence des indicateurs historiques
de la Version, notamment le dénominateur de la couverture d'Audit.

Le Catalogue courant ne doit pas être projeté rétroactivement sur les
anciennes Versions.

### Q-096 --- Date exacte de Release et source

**Priorité : BLOQUANT V1 si la V1 produit une vue « état à la Release
»**

La règle métier de non-rétroactivité est établie, mais la frontière
temporelle de la Release doit être déterminée à partir d'une source
explicite.

---

# 4. Questions à traiter pendant l'implémentation

Ces questions ne doivent pas bloquer la gap analysis code ↔ modèle
cible.

## Versions et sources

- `Q-007` --- vérifier le rôle réel d'une GitHub Release et ne pas la
  rendre obligatoire sans preuve ;
- `Q-008` --- définir le comportement DQ si la Milestone PROD manque ;
- `Q-009` --- définir le comportement DQ si le Tag Git attendu manque
  ;
- `Q-037` --- déterminer les données Nexus réellement nécessaires ;
- `Q-038` --- déterminer si Jenkins doit être interrogé directement ;
- `Q-068` --- vérifier la disponibilité technique des timestamps
  nécessaires au passage `Done`.

## Workflow

- `Q-020` --- formalisation technique des profils STANDARD, EPIC,
  AUDIT, RELEASE et CONCEPTION ;
- `Q-021` --- traduire les exceptions PR déjà identifiées en règles
  exécutables ;
- `Q-022` --- formaliser les propriétés interdites ou tolérées pour
  `Cancelled`.

## Audits et qualité de données

- `Q-055` --- définir le minimum du futur template d'Issue d'Audit ;
- `Q-059` --- confirmer avec l'auditeur la sémantique exacte des
  criticités RGAA ;
- `Q-061` --- confirmer la responsabilité opérationnelle de clôture
  d'une Anomalie ;
- `Q-062` --- matérialiser le déclenchement d'une revalidation ;
- `Q-063` --- préciser qui crée ou matérialise la revalidation ;
- `Q-070` --- choisir la sévérité DQ de plusieurs Audits non terminés
  pour un même `Component × Version` ;
- `Q-073` --- définir la sévérité d'une incohérence entre sources de
  Version ;
- `Q-074` --- définir la restitution UX d'une information de Version
  manquante.

## Anomalies non issues d'Audit

- `Q-097` --- préciser la gestion complète des Versions affectées
  après Release ;
- `Q-098` --- stabiliser la représentation d'une Version affectée pour
  un Bug hors Audit ;
- `Q-099` --- définir le format exact de cette information.

Ces sujets peuvent être traités avec les tests, fixtures et cas réels
pendant l'implémentation.

---

# 5. Questions V1.1 / évolution

Ces questions sont importantes mais ne doivent pas retarder le socle V1.

## Modèle Package / Repository

- `Q-001` --- propriétés génériques du Package ;
- `Q-002` --- plusieurs Packages par Librairie ;
- `Q-003` --- plusieurs Librairies dans un Repository ;
- `Q-004` --- relation future Component / Package.

La V1 peut conserver le fonctionnement actuel :

```text
1 Repository = 1 Librairie
1 Librairie  = 1 Package
```

tout en gardant un modèle extensible.

## Audits

- `Q-015` --- objet métier `Audit` indépendant de l'Issue GitHub ;
- `Q-016` --- objet `Campagne d'Audit` explicite ;
- `Q-051` --- règle organisationnelle de blocage PROD selon la
  couverture ;
- `Q-052` --- règle organisationnelle de blocage PROD selon les
  Anomalies ;
- `Q-053` --- migration des anciennes Issues vers le modèle cible ;
- `Q-060` --- mécanisme opérationnel complet de revalidation ;
- `Q-065` --- pilotage des Audits lors des changements de Version.

Le dashboard peut mesurer et signaler sans devenir, en V1, un moteur de
gouvernance bloquant la Release.

## Qualité synthétique

- `Q-030` --- score ou qualité synthétique d'une Version ;
- `Q-031` --- score ou qualité synthétique d'un Component.

La V1 doit privilégier des indicateurs explicables :

```text
couverture
conformité
Anomalies
criticité
traitement
```

plutôt qu'un score global non défini.

## Historisation avancée

- `Q-034` --- politique complète de déclenchement des Snapshots ;
- `Q-036` --- durée de conservation ;
- `Q-077` --- détermination automatique NEW / EVOLVED / UNCHANGED /
  DECOMMISSIONED ;
- `Q-078` --- mécanisme de comparaison des Components entre Versions ;
- `Q-079` --- recherche de la Version SemVer précédente dans les
  différents flux ;
- `Q-082` / `Q-083` --- représentation complète de la réactivation ;
- `Q-084` --- UX détaillée de l'origine directe ou héritée d'un
  verdict.

Une V1 peut conserver des Snapshots à chaque exécution et exposer
l'origine d'un verdict de manière simple, sans résoudre toute
l'automatisation historique.

## Usage et ratios

- `Q-104` --- normalisation par l'usage ;
- `Q-105` --- ratios d'usage à conserver ;
- `Q-106` --- autres ratios d'usage ;
- `Q-111` --- heuristique de détection d'un label Component
  probablement manquant ;
- `Q-112` --- design avancé de la page Issues multi-filtres ;
- `Q-113` --- futurs types de sub-Issues d'Audit.

---

# 6. Questions futures

Le périmètre Applications consommatrices reste explicitement futur :

- `Q-023` --- identification des Applications ;
- `Q-024` --- Packages utilisés ;
- `Q-025` --- Versions utilisées ;
- `Q-026` --- usage de Versions non-PROD ;
- `Q-027` --- Components réellement utilisés ;
- `Q-028` --- dette de montée de Version ;
- `Q-029` --- alertes aux Squads consommatrices ;
- `Q-032` --- badge ou note d'une Application ;
- `Q-033` --- synthèse RGAA / WAI-ARIA d'une Application ;
- `Q-039` --- source des Applications et dépendances ;
- `Q-040` --- source d'usage réel des Components.

Relèvent également d'une architecture ultérieure :

- `Q-041` --- passage éventuel à un backend ;
- `Q-042` --- stockage historique cible ;
- `Q-043` --- orchestration multi-source complète.

---

# 7. Questions déjà suffisamment établies pour la V1

Les questions suivantes ne doivent plus être utilisées pour bloquer la
conception V1, même si certains détails techniques peuvent encore
apparaître lors de l'implémentation :

- `Q-005` --- cycle Release Candidate → PROD ;
- `Q-006` --- cycle Hotfix Candidate → PROD ;
- `Q-010` --- signification de `M.m.r-Audit` ;
- `Q-017` --- principe du verdict d'Audit ;
- `Q-018` --- distinction Audit pré-PROD / rattrapage, hors
  identification exacte de la RC ;
- `Q-044` --- famille actuellement pratiquée : Accessibilité ;
- `Q-047` --- un Audit concerne exactement un Component ;
- `Q-049` --- fin d'une Issue d'Audit = `Done` + `Closed` ;
- `Q-050` --- relation Audit → Anomalie par sub-Issue et cardinalité
  précisée par les décisions ultérieures ;
- `Q-054` --- distinction Version déclarée / Version d'artefact ;
- `Q-064` --- absence de relation directe obligatoire entre Anomalies
  de deux Audits successifs ;
- `Q-067` --- dernier Audit terminé applicable pour un même
  `Component × Version` ;
- `Q-069` --- un Audit en cours ne remplace pas le verdict acquis ;
- `Q-071` / `Q-072` / `Q-075` --- principes d'identification de la
  Version auditée et gestion des sources disponibles ;
- `Q-076` / `Q-080` --- dénominateur de couverture fondé sur le
  Catalogue applicable ;
- `Q-085` --- un Component évolué ne perd pas automatiquement son
  verdict ;
- `Q-086` / `Q-087` / `Q-088` --- qualification d'Audit d'un Component
  évolué ou nouveau ;
- `Q-090` / `Q-091` / `Q-092` / `Q-093` --- traitement des Anomalies
  et agrégations associées ;
- `Q-094` / `Q-095` --- distinction vue courante / vue historique et
  état figé à la Release ;
- `Q-100` --- distinction Version observée / Version affectée ;
- `Q-101` / `Q-102` / `Q-103` --- erreurs d'intégration client
  annulées et suivi séparé ;
- `Q-107` / `Q-108` / `Q-109` / `Q-110` --- Issues sans Component et
  comptage multi-Component ;
- `Q-114` --- une Issue d'Anomalie compte comme une Anomalie, sans
  extraction d'occurrences internes.

Lorsque le registre canonique porte encore un statut ancien pour l'une
de ces questions, sa mise à jour doit être faite séparément et
explicitement à partir de la décision `D-xxx` correspondante.

---

# 8. Q-012 — Origine d'une Anomalie

**Priorité V1 : DÉJÀ ÉTABLI**

Pour la V1, deux origines suffisent :

```text
AUDIT
HORS_AUDIT
```

`HORS_AUDIT` n'est pas détaillé davantage.

**Évolution V2 : À CHALLENGER**

La provenance des Anomalies hors Audit pourra être enrichie. Le besoin
identifié comprend notamment la distinction entre une remontée provenant
de la Squad et une remontée extérieure à la Squad.

D'autres dimensions et indicateurs restent à challenger avant de définir
une taxonomie V2.

# 9. Cas particulier : Q-035

Le mécanisme technique complet reste à instruire, mais le principe
métier est désormais établi :

```text
état connu à la Release
≠
connaissance actuelle de cette Release
```

Un Audit de rattrapage enrichit la seconde vue sans réécrire la
première.

**Priorité proposée : À traiter pendant l'implémentation**, plutôt que
bloquant métier.

---

# 10. Séquence recommandée avant la gap analysis

Il reste donc à instruire en priorité seulement les questions dont la
réponse change réellement le contrat V1.

Ordre recommandé :

```text
1. Q-019
   Date métier de réalisation d'un Audit

2. Q-048
   RC auditée
   uniquement si la traçabilité RC exacte est exigée en V1

3. Q-081
   Catalogue historique
   uniquement si la couverture historique par Version est exigée en V1

4. Q-096
   Date de Release
   uniquement si la vue « état à la Release » est exigée en V1
```

Les questions conditionnelles doivent être résolues en décidant d'abord
si la capacité correspondante appartient réellement au périmètre V1.

---

# 11. Conclusion

La documentation consolidée permet maintenant d'éviter de traiter les
114 questions comme 114 prérequis.

Le cœur du modèle est suffisamment stable pour préparer la gap analysis.

Avant celle-ci, il reste un petit nombre de décisions métier réellement
structurantes, principalement autour :

```text
Anomalie
dates métier
Audit
historique par Version
```

La prochaine étape doit donc être une courte phase de fermeture de ces
bloqueurs V1, question par question, sans rouvrir les décisions déjà
établies.

---

## Q-096 --- Date exacte de Release

**Priorité : DÉJÀ ÉTABLI**

Pour une Version PROD `M.m.r`, la date métier de Release est la date de création du Git tag `M.m.r` :

```text
releasedAt = GitTag(M.m.r).createdAt
```

Cette date constitue l'instant de référence pour reconstruire l'état connu à la Release. Les informations produites après `releasedAt` enrichissent la connaissance actuelle mais ne doivent pas être projetées rétroactivement.
