# Indicateurs d'Audit Accessibilité

## 1. Objectif

Ces indicateurs répondent aux besoins des responsables des Audits
d'accessibilité sans confondre :

- activité d'Audit ;
- couverture ;
- conformité ;
- traitement des Anomalies.

---

## 2. États de conformité

Le modèle distingue au minimum :

```text
NON AUDITÉ

AUDITÉ & CONFORME

AUDITÉ & NON CONFORME
```

Un Component non audité n'est pas considéré comme non conforme.

---

## 3. Couverture d'Audit

**Statut : ÉTABLI.**

### Question

Quelle part des Components du périmètre possède un Audit applicable ?

### Formule

```text
nombre de Components couverts
/
nombre de Components du Catalogue applicable
```

### Périmètre

La mesure doit être interprétée pour un contexte donné, notamment :

- Librairie ;
- Version ;
- Snapshot / date de connaissance.

Le Catalogue applicable doit être celui du contexte historique
considéré.

### Attention

Un Audit historique réalisé sur une ancienne Version ne doit pas être
présenté comme un nouvel Audit de la Version suivante.

Un verdict peut éventuellement rester applicable par héritage selon les
règles métier, mais l'historique de l'Audit réel doit rester exact.

---

## 4. Taux de conformité

**Statut : ÉTABLI.**

### Question

Parmi les Components couverts par un Audit applicable, quelle part est
conforme ?

### Formule

```text
nombre de Components conformes
/
nombre de Components couverts
```

### Exclusion essentielle

Les Components `NON AUDITÉ` ne font pas partie du dénominateur.

Il ne faut donc pas calculer :

```text
Components conformes
/
tous les Components
```

et appeler ce ratio « taux de conformité ».

---

## 5. Verdict d'un Audit

Pour un Audit Accessibilité réalisé :

```text
0 Anomalie
→ CONFORME

1..n Anomalies
→ NON CONFORME
```

Les Improvements n'entrent pas dans ce calcul.

---

## 6. Nombre d'Anomalies détectées

**Statut : ÉTABLI comme unité de comptage.**

```text
1 Issue qualifiée comme Anomalie
=
1 Anomalie
```

Une Issue peut décrire plusieurs occurrences techniques ; elles ne sont
pas extraites ou estimées par le pipeline.

---

## 7. Répartition par criticité

**Statut : ÉTABLI pour les Anomalies d'Audit Accessibilité.**

Les Anomalies peuvent être ventilées selon :

```text
bloquante
majeure
mineure
```

Chaque Anomalie d'Audit Accessibilité possède exactement une criticité
RGAA.

Ces criticités ne doivent pas être mélangées avec des criticités métier,
fonctionnelles, techniques, DX ou UX.

---

## 8. Répartition par catégorie a11y

**Statut : ÉTABLI dans son principe.**

Les Anomalies d'Audit Accessibilité peuvent être ventilées par leur
catégorie :

```text
♿ a11y:xxx
```

Le besoin métier prévoit une catégorie a11y par Anomalie. Le modèle
courant accepte toutefois une liste de catégories ; tant que cette
cardinalité n'est pas contrôlée, le Dashboard affiche les catégories
observées et précise qu'une Anomalie peut contribuer à plusieurs catégories.

---

## 9. Taux de traitement

**Statut : ÉTABLI dans son principe.**

### Global

```text
Anomalies historiquement traitées
/
Anomalies historiquement détectées
```

### Par criticité

Le même ratio peut être calculé séparément pour :

- bloquante ;
- majeure ;
- mineure.

Une Anomalie est traitée lorsque :

```text
Project Status = Done
ET
GitHub Issue State = Closed
```

Une Anomalie traitée reste dans l'historique.

**Disponibilité actuelle :** le Dashboard expose le statut courant et le
nombre d'Anomalies d'Audit Accessibilité observées par statut. Il ne calcule
pas encore le taux historique Done + Closed : un statut courant ne prouve
pas qu'une Issue n'a jamais été rouverte et refermée.

---

## 10. Traitement et conformité

Ces deux dimensions ne doivent pas être fusionnées.

Exemple :

```text
Audit historique : NON CONFORME
Anomalies : toutes traitées
Revalidation : en attente
```

Le taux de traitement peut être `100 %` alors que le dernier verdict
d'Audit reste `NON CONFORME`.

La conformité change seulement après un nouvel Audit applicable.

---

## 11. Délai de traitement

Le besoin existe :

```text
date de détection
→
date de correction
```

avec notamment :

- moyenne ;
- médiane ;
- P90 ;
- ventilation éventuelle par criticité.

**Statut : À INSTRUIRE.**

Les dates métier exactes ne sont pas encore établies :

- `Q-013` : date de détection ;
- `Q-014` : date de correction.

Aucune formule normative de délai ne doit être figée avant résolution de
ces questions.

Le Dashboard présente à titre provisoire les délais observés entre la date
de détection disponible et la première transition vers Done (moyenne,
médiane et P90). Ces valeurs ne sont pas le taux de traitement Done + Closed
et doivent être interprétées avec les réserves Q-013 et Q-014.

---

## 12. Audit pré-PROD et rattrapage

Les indicateurs historiques doivent distinguer :

```text
Audit pré-PROD
```

de :

```text
Audit de rattrapage post-PROD
```

Un résultat obtenu après la publication ne doit pas être projeté
rétroactivement comme s'il était connu à la date de sortie de la
Version.
