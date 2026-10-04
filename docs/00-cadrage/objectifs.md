# Objectifs du produit

## 1. Objectif général

Construire un outil permettant de suivre et de piloter les Design Systems, leurs librairies et, à terme, leurs applications consommatrices.

Le projet doit fournir des informations compréhensibles, traçables et exploitables à différents niveaux : entreprise, responsables, Squads, développeurs, designers, qualité et accessibilité.

---

## 2. Objectifs prioritaires

### 2.1. Mesurer la qualité des librairies

Le premier objectif est de fournir rapidement une vision fiable de la qualité des librairies du Design System.

Les besoins identifiés sont notamment :

* mesurer la conformité des composants ;
* mesurer la couverture des audits ;
* suivre les anomalies ;
* analyser les anomalies par criticité ;
* suivre les résultats des audits ;
* disposer d'informations sur la qualité des composants.

Les définitions exactes des indicateurs restent à établir.

---

### 2.2. Piloter l'activité des librairies

Le second objectif est de fournir une vision opérationnelle de l'activité.

Les informations attendues comprennent notamment :

* les travaux en cours ;
* les anomalies à traiter ;
* les audits ;
* les sprints ou itérations ;
* les délais de traitement ;
* les versions ;
* l'évolution de ces éléments dans le temps.

Les indicateurs correspondants sont à définir dans le catalogue des indicateurs.

---

## 3. Objectifs futurs

### 3.1. Connaître les consommateurs

Le produit doit pouvoir évoluer afin d'analyser les applications qui utilisent les librairies du Design System.

L'objectif est notamment de connaître :

* quelles applications utilisent quelles librairies ;
* quelle version de chaque librairie est utilisée ;
* quels composants sont utilisés ;
* combien de fois les composants sont utilisés ;
* quels composants sont les plus utilisés.

La source de données et la méthode d'analyse restent à déterminer.

---

### 3.2. Suivre la dette de version

À terme, le produit devra pouvoir comparer :

* la version utilisée par une application ;
* la version attendue ou recommandée, lorsqu'une telle information existe ;
* l'écart entre ces versions.

Cette comparaison doit permettre d'identifier une éventuelle dette de version.

Les règles permettant de déterminer qu'une version est « attendue », « recommandée » ou « obsolète » ne sont pas encore définies.

**À instruire.**

---

### 3.3. Alerter les équipes responsables

Lorsque la dette de version pourra être identifiée de manière fiable, le produit devra pouvoir fournir des informations permettant d'alerter les Squads responsables des montées de version attendues.

Le mécanisme technique d'alerte n'est pas défini à ce stade.

**À instruire.**

---

### 3.4. Relier qualité du Design System et qualité des applications

Un objectif futur consiste à pouvoir fournir une information sur la qualité RGAA/WAI-ARIA d'une application consommatrice.

Cette information pourrait prendre en compte :

* la version de la librairie utilisée ;
* les composants utilisés par l'application ;
* l'état de qualité ou de conformité connu pour ces composants.

La forme exacte de cette information — note, badge, niveau ou autre — n'est pas décidée.

La méthode permettant de calculer cette information n'est pas définie.

**À instruire.**

---

## 4. Objectifs d'architecture

L'architecture actuelle doit rester suffisamment simple pour permettre une mise en œuvre rapide.

Elle doit néanmoins éviter de rendre impossible l'évolution vers :

* plusieurs sources de données ;
* l'analyse de code des applications ;
* une base de données ;
* un backend ;
* une API ;
* un frontend applicatif.

Les choix techniques précis nécessaires à cette évolution seront définis après stabilisation du modèle métier et des indicateurs.

---

## 5. Ce qui n'est pas encore un objectif défini

Les éléments suivants sont évoqués comme possibilités mais ne constituent pas encore des spécifications :

* formule de calcul d'une note de qualité applicative ;
* définition d'un badge RGAA/WAI-ARIA ;
* définition de la dette de version ;
* définition de la version attendue ;
* mécanisme d'alerte ;
* méthode exacte d'analyse du code des consommateurs ;
* architecture finale du produit consommateur.

Ces sujets doivent être instruits avant leur implémentation.
