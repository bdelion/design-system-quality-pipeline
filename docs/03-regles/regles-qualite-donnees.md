# Règles de qualité des données

## 1. Objet de cette page

Cette page distingue :

1. les règles `DQ-001` à `DQ-010` réellement implémentées ;
2. leur intention ;
3. les divergences observées avec le modèle métier consolidé ;
4. les points qui devront être arbitrés avant modification du code.

Aucune divergence listée ici ne constitue à elle seule une décision de
modifier une règle.

## 2. Sémantique actuelle

Le contrat actuel utilise notamment :

```text
severity : ERROR | WARNING
action   : include | exclude | unknown
```

Une donnée signalée reste conservée dans le Snapshot.

L'action décrit son impact sur le calcul concerné, pas une suppression
de la donnée source.

## 3. Inventaire lisible des règles actuelles

### DQ-001 --- Criticité absente

**Actuel**

```text
Severity : ERROR
Action   : exclude
```

Détecte une Anomalie sans criticité normalisée.

Impact actuel : indicateurs de criticité.

**Consolidation métier**

Pour une Anomalie d'Audit Accessibilité, exactement une criticité RGAA
est attendue.

La règle doit à terme être suffisamment contextualisée pour ne pas
imposer une criticité RGAA aux objets auxquels elle ne s'applique pas.

---

### DQ-002 --- Criticités incompatibles

**Actuel**

```text
Severity : ERROR
Action   : exclude
```

Détecte plusieurs criticités dans le cas pris en charge par le code.

**Consolidation métier**

Une Anomalie d'Audit Accessibilité doit avoir exactement une criticité
RGAA.

La criticité RGAA est distincte des autres domaines de priorité ou
criticité.

---

### DQ-003 --- Parents multiples

**Actuel**

```text
Severity : ERROR
Action   : exclude
```

Détecte une Anomalie avec plusieurs `parentRefs`.

**Consolidation métier**

La règle correspond à une cardinalité désormais établie :

```text
Anomaly d'Audit
→ exactement 1 Audit parent
```

Il faudra également contrôler l'absence de parent lorsque l'objet est
qualifié comme Anomalie d'Audit.

**Divergence technique**

Un impact `audit.anomalyCount.*` est déclaré alors que ce préfixe n'est
pas présent dans le catalogue V2 observé.

---

### DQ-004 --- PR de correction absente

**Actuel**

```text
Severity : WARNING
Action   : include
```

Détecte actuellement une Anomalie `done` sans `pullRequestRefs`.

**Consolidation métier**

Une Anomalie d'Audit suit un workflow de correction par PR dans le
fonctionnement décrit.

Cependant, la règle générale :

```text
Done → PR
```

n'est pas universelle pour toutes les Issues.

DQ-004 doit donc rester comprise comme une règle appliquée à un contexte
précis, et non comme la preuve qu'une PR est obligatoire pour EPIC ou
AUDIT.

---

### DQ-005 --- PR mergée et Issue ouverte

**Actuel**

```text
Severity : WARNING
Action   : include
```

Détecte une PR mergée liée à une Issue encore ouverte.

**Consolidation métier**

Le merge d'une PR et la clôture métier d'une Issue sont deux événements
distincts.

Pour une Anomalie d'Audit, l'état traité nécessite notamment :

```text
Done + Closed
```

Une PR mergée avec Issue encore ouverte peut donc être une situation
transitoire légitime.

La sévérité actuelle `WARNING` est cohérente avec le fait qu'il s'agit
d'un signal à examiner plutôt que d'une suppression de donnée.

---

### DQ-006 --- Component absent du Catalogue

**Actuel**

```text
Severity : WARNING
Action   : include
```

Détecte `discoverySource = suggested`.

**Consolidation métier**

Le Component reste exploitable, mais les indicateurs dépendant du
Catalogue peuvent être incomplets.

**Divergence technique**

L'impact actuel `portfolio.*` paraît potentiellement plus large que
nécessaire.

L'impact cible doit être défini métrique par métrique.

---

### DQ-007 --- Label inconnu

**Actuel**

```text
Severity : WARNING
Action   : include
```

Détecte le label configuré comme inconnu.

**Consolidation métier**

La donnée reste utilisable mais une partie de sa classification est
incertaine.

L'impact doit dépendre de la dimension portée par le label concerné.

---

### DQ-008 --- Issue Cancelled référencée par une PR

**Actuel**

```text
Severity : ERROR
Action   : exclude
```

Une Issue Cancelled liée à une PR est exclue des KPI selon la règle
actuelle.

**Point métier ouvert**

`Q-022` n'a pas encore établi qu'une Issue Cancelled ne peut jamais
conserver une relation vers une PR.

Cette règle doit donc être considérée comme :

```text
comportement actuellement implémenté
≠
invariant métier définitivement validé
```

---

### DQ-009 --- Nexus indisponible

**Actuel**

```text
Severity : WARNING
Action   : include
```

Détecte :

```text
raw.nexusAvailable = false
```

**Consolidation métier**

Seules les métriques qui dépendent réellement d'une preuve Nexus doivent
être affectées.

**Divergence technique**

L'impact `portfolio.release.*` ne correspond à aucun préfixe démontré
dans le catalogue V2 actuel.

---

### DQ-010 --- Issue Cancelled avec Milestone

**Actuel**

```text
Severity : ERROR
Action   : exclude
```

Une Issue Cancelled possédant une Milestone est exclue des KPI selon la
règle actuelle.

**Point métier ouvert**

`Q-022` n'établit pas encore qu'une Issue Cancelled doit perdre toute
Milestone.

Comme DQ-008, cette règle est un comportement implémenté à réévaluer
avant d'en faire un invariant cible.

## 4. Règles manquantes révélées par le modèle consolidé

Le modèle métier fait apparaître des contrôles qui ne sont pas
représentés explicitement par les dix DQ actuelles.

Exemples établis :

```text
Audit → exactement 1 Component
Anomaly d'Audit → exactement 1 Audit parent
Improvement d'Audit → exactement 1 Audit parent
Anomaly d'Audit → même Component que l'Audit
Improvement d'Audit → même Component que l'Audit
Anomaly Accessibilité → exactement 1 criticité RGAA
Anomaly Accessibilité → exactement 1 catégorie a11y
```

Cette liste identifie des besoins de contrôle.

Les contrôles temporels établis par D-140, D-141 et D-188 sont matérialisés par `DQ-011` à `DQ-014`. Les contrôles de disponibilité du Catalogue historique établis par D-211 et D-212 sont matérialisés par `DQ-015` et `DQ-016`. I5 matérialise ensuite par `DQ-017` à `DQ-029` les ambiguïtés et violations dont la conduite à tenir est désormais explicitement décidée. Les besoins qui dépendent encore d’une question ouverte restent volontairement sans identifiant DQ.

## 5. Points techniques à corriger plus tard

Les constats suivants sont confirmés :

- logique DQ répartie entre YAML, TypeScript et table d'impacts ;
- `DQ-003` référence `audit.anomalyCount.*`, absent du catalogue V2
  observé ;
- `DQ-006` impacte `portfolio.*`, potentiellement trop largement ;
- `DQ-009` référence `portfolio.release.*`, absent du catalogue V2
  observé ;
- `DQ-008` et `DQ-010` couvrent deux interdictions liées aux Issues
  Cancelled dont le statut métier reste à formaliser ;
- la fiabilité globale du Snapshot devient actuellement `partial` dès
  qu'une alerte DQ existe, y compris un WARNING.

## 6. Fiabilité cible

La fiabilité doit être principalement métrique-spécifique.

Exemple :

```text
DQ sur la criticité d'une Anomalie
    ↓
métrique par criticité : affectée
métrique sans criticité : potentiellement non affectée
métrique de Version indépendante : non affectée
```

Une alerte ne doit donc pas contaminer automatiquement toutes les
métriques.

## 7. Méthode de gouvernance des nouvelles règles

Pour toute nouvelle règle DQ :

1. stabiliser les règles métier nécessaires à la V1 ;
2. associer chaque règle à un contexte ou profil ;
3. définir la conséquence métier d'une violation ;
4. identifier les métriques réellement concernées ;
5. décider severity et action ;
6. seulement ensuite modifier YAML, TypeScript et tests.

Les fichiers historiques `docs/quality-rules/DQ-001.md` à `DQ-010.md`
doivent rester disponibles tant que cette migration n'est pas terminée.

## 8. Data Quality V2 — ambiguïtés et intégrité du modèle normalisé

I5 matérialise les réserves de qualité déjà imposées par les décisions D-148 à D-241 sans transformer les questions encore ouvertes en règles métier.

| Règle  | Contrôle                                  | Décisions principales             |
| ------ | ----------------------------------------- | --------------------------------- |
| DQ-017 | Issue Type absent                         | D-155                             |
| DQ-018 | Issue Type non reconnu                    | D-148, D-150, D-151               |
| DQ-019 | Issue Type ambigu                         | D-152 à D-154                     |
| DQ-020 | statut Project non reconnu                | D-173, D-175, D-176               |
| DQ-021 | statut Project ambigu                     | D-177, D-178                      |
| DQ-022 | Velocity non numérique                    | D-181, D-182                      |
| DQ-023 | Audit sans Component reconnu              | D-195, D-229                      |
| DQ-024 | Audit avec plusieurs Components           | D-195, D-230                      |
| DQ-025 | Version PROD cible indéterminable         | D-200 à D-204, D-231              |
| DQ-026 | relation Anomaly → Audit indéterminée     | D-198, D-232, D-234, D-236, D-237 |
| DQ-027 | Component Anomaly/Audit incohérent        | D-196, D-197                      |
| DQ-028 | relation Feature → Audit invalide/ambiguë | D-194, D-233, D-235               |
| DQ-029 | référence normalisée orpheline            | D-241                             |

Les règles DQ-017 à DQ-028 sont non bloquantes : la donnée source reste présente et aucune valeur canonique ou relation n'est inventée. DQ-029 est un garde-fou d'intégrité : un pointeur normalisé orphelin est une erreur de modèle et ne doit pas alimenter les métriques concernées.

La détection est dédupliquée par couple `ruleId + entityId`, afin qu'un même défaut observé dans plusieurs contextes Project ne produise pas plusieurs alertes portant le même identifiant.

Les questions Q-070, Q-073 et Q-074 restent ouvertes et ne sont pas converties en règles dans ce lot.
