# Vision du produit

## 1. Finalité

Le projet a pour objectif de construire un outil de suivi et de pilotage des Design Systems et de leurs librairies.

Le produit doit permettre de disposer d'une vision fiable et exploitable de la qualité des librairies, tout en permettant progressivement de suivre leur fonctionnement opérationnel et leur utilisation par les applications consommatrices.

Le projet est actuellement centré sur l'exploitation de données issues de GitHub et sur la production d'un dashboard statique.

L'évolution vers d'autres sources de données et vers une architecture backend/frontend pourra être étudiée ultérieurement.

---

## 2. Trois domaines fonctionnels

Le produit est appelé à couvrir trois domaines complémentaires.

### 2.1. Qualité des librairies

Ce domaine constitue la priorité immédiate du projet.

Il doit permettre de mesurer notamment :

* la conformité des composants ;
* les anomalies ;
* leur criticité ;
* la couverture des audits ;
* la qualité des composants ;
* les résultats liés aux audits d'accessibilité, notamment RGAA/WAI-ARIA lorsque les données disponibles permettent de les établir.

Les indicateurs et leur définition précise seront définis progressivement dans les spécifications fonctionnelles.

---

### 2.2. Pilotage opérationnel des librairies

Le produit doit également permettre de suivre le fonctionnement opérationnel des équipes et des librairies.

Le périmètre identifié à ce stade comprend notamment :

* les travaux en cours ;
* les anomalies ;
* les audits ;
* les sprints ou itérations ;
* les délais ;
* les versions ;
* l'évolution de l'activité dans le temps.

Les règles précises de calcul et les indicateurs associés restent à définir dans les documents métier et indicateurs.

---

### 2.3. Pilotage des consommateurs

À terme, le produit pourra également analyser les applications qui consomment les librairies du Design System.

Les besoins identifiés à ce stade sont notamment :

* connaître les versions des librairies utilisées par les applications ;
* connaître les composants utilisés ;
* dénombrer l'utilisation de chaque composant ;
* identifier les composants les plus utilisés ;
* suivre la dette liée aux versions des librairies ;
* identifier les montées de version attendues ;
* permettre l'émission d'alertes à destination des Squads responsables.

Un objectif complémentaire est d'étudier la possibilité de fournir une information de qualité RGAA/WAI-ARIA pour une application consommatrice.

Cette information pourrait notamment prendre en compte les composants de Design System utilisés et la version des librairies correspondante.

**La méthode de calcul d'une telle note ou d'un tel badge n'est pas définie à ce stade. Elle devra faire l'objet d'une décision spécifique.**

---

## 3. Une vision globale, avec des domaines identifiables

L'orientation privilégiée à ce stade est de disposer d'un point d'entrée unique pour le produit.

Ce point d'entrée pourrait proposer plusieurs sections clairement identifiées correspondant aux différents domaines fonctionnels.

Une page d'accueil de synthèse destinée à l'entreprise est également envisagée.

Cette page devra permettre d'obtenir rapidement une vision globale de la situation avant d'accéder aux analyses détaillées.

Cette organisation constitue une orientation et non une décision définitive d'architecture fonctionnelle.

---

## 4. Évolution progressive

Le projet ne doit pas nécessiter dès maintenant la mise en place d'une architecture technique complexe.

L'architecture actuelle reste volontairement simple :

```text
Sources
   ↓
RAW Dataset
   ↓
Normalisation
   ↓
Qualité des données
   ↓
Calcul des indicateurs
   ↓
Snapshot
   ↓
Dashboard HTML
```

Cette architecture doit toutefois conserver la possibilité d'évoluer ultérieurement vers :

* plusieurs sources de données ;
* l'analyse des applications consommatrices ;
* une API ;
* un backend ;
* une base de données ;
* un frontend applicatif.

La manière précise de réaliser cette évolution sera définie ultérieurement.

---

## 5. Principes

Le projet doit privilégier :

* des définitions métier explicites ;
* des indicateurs traçables jusqu'aux données sources ;
* une distinction entre données, règles métier, qualité des données et indicateurs ;
* des décisions documentées ;
* des éléments non définis explicitement identifiés comme « À instruire » ;
* une architecture permettant l'évolution progressive du périmètre.

Le dashboard ne doit pas devenir une source implicite de définitions métier : les règles et définitions doivent être documentées indépendamment de leur représentation graphique.
