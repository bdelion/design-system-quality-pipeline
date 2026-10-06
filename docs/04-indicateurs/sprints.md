# Indicateurs Sprint / Iteration

## 1. Objectif

Les indicateurs Sprint servent au pilotage opérationnel de la Squad.

Ils doivent rester séparés des indicateurs de conformité d'Audit.

---

## 2. Population

La population d'un Sprint est constituée des Issues rattachées à
l'Iteration concernée selon les données GitHub collectées.

La définition exacte de certains profils de workflow restant ouverte,
les indicateurs doivent permettre de filtrer ou ventiler par Issue Type
/ profil plutôt que supposer que toutes les Issues ont la même
sémantique de Velocity.

---

## 3. Velocity

Le modèle distingue :

```text
velocity = null
velocity = 0
velocity > 0
```

Ces valeurs ne doivent pas être fusionnées.

En particulier :

- `null` représente l'absence de valeur ;
- `0` est une valeur explicite ;
- `> 0` représente une charge pesée dans le workflow nominal STANDARD.

Les Epics et Audits peuvent avoir une sémantique différente.

---

## 4. Agrégats souhaités

Les besoins historiques mentionnent notamment :

- moyenne de Velocity ;
- médiane de Velocity ;
- P90 de Velocity.

Ces agrégats ne doivent être calculés qu'après définition claire de la
population :

```text
quels Issue Types ?
quels profils ?
inclut-on velocity = 0 ?
exclut-on velocity = null ?
```

**Statut : À CONSOLIDER avant normalisation définitive des métriques.**

---

## 5. Délais

Les besoins mentionnent également :

- délai moyen de traitement ;
- délai médian ;
- P90.

La définition générique du début et de la fin d'un délai de traitement
n'est pas encore suffisamment stabilisée pour toutes les Issues.

Les métriques de délai doivent donc documenter explicitement leurs
événements de début et de fin.

---

## 6. Stock et flux

La vue Sprint doit distinguer autant que possible :

```text
stock planifié
travail démarré
travail terminé
travail reporté
```

La définition précise du report d'une Iteration à l'autre reste à
formaliser si cet indicateur devient prioritaire V1.

---

## 7. Relation avec les Anomalies d'Audit

Les Anomalies découvertes lors d'un Audit suivent leur propre Grooming,
pesée et planification.

Elles peuvent donc être analysées dans les Sprints sans confondre :

```text
activité de correction
```

avec :

```text
activité d'Audit
```
