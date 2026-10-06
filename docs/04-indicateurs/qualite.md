# Qualité et fiabilité des indicateurs

## 1. Deux notions différentes

Le projet doit distinguer :

```text
qualité métier du Design System
```

et :

```text
qualité / fiabilité des données utilisées pour la mesurer
```

Une métrique peut être fiable tout en décrivant une mauvaise situation
métier.

Inversement, une situation métier peut être bonne mais impossible à
mesurer de manière fiable.

---

## 2. Qualité d'un Component

La construction d'un score ou verdict global de qualité d'un Component
pour une Version n'est pas encore définie.

`Q-031` reste ouverte.

Les états d'Audit :

```text
NON AUDITÉ
AUDITÉ & CONFORME
AUDITÉ & NON CONFORME
```

ne doivent pas être transformés automatiquement en score numérique.

---

## 3. Qualité d'une Version

`Q-030` reste ouverte.

Le modèle dispose déjà d'indicateurs distincts :

- couverture d'Audit ;
- taux de conformité ;
- traitement des Anomalies ;
- répartition par criticité ;
- qualité des données.

Ils ne doivent pas être combinés arbitrairement en un score unique.

---

## 4. Reliability d'une métrique

Le contrat V2 associe une information de fiabilité à chaque métrique.

Cette fiabilité doit refléter les Data Quality Issues réellement
susceptibles d'affecter son calcul.

Exemple :

```text
criticité manquante
```

peut affecter :

```text
répartition des Anomalies par criticité
```

sans nécessairement affecter :

```text
nombre total d'Anomalies
```

si l'Anomalie reste correctement identifiée.

---

## 5. Exclusions

Une métrique doit pouvoir expliquer les exclusions appliquées.

Une exclusion ne doit pas supprimer l'entité du Snapshot.

Elle signifie uniquement que l'entité ne peut pas participer de manière
fiable à ce calcul précis.

---

## 6. Unknown

Lorsqu'une donnée nécessaire n'est pas disponible, il peut être
préférable de représenter le résultat comme inconnu plutôt que de
produire artificiellement `0`.

Principe :

```text
absence de preuve
≠
preuve de zéro
```

---

## 7. Snapshot global

Le statut global du Snapshot reste utile pour signaler qu'une exécution
contient des réserves.

Il ne doit pas entraîner mécaniquement :

```text
toutes les métriques = partial
```

La fiabilité doit rester métrique-spécifique.

---

## 8. Vue manager

La vue destinée aux responsables doit privilégier des formulations
compréhensibles :

```text
Donnée fiable
Donnée partielle
Donnée inconnue
Calcul impossible
```

Les identifiants techniques `DQ-xxx` peuvent rester disponibles dans une
vue de détail ou de traçabilité.
