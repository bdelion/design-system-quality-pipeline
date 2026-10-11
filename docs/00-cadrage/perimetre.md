# Périmètre du produit

## 1. Périmètre actuel

Le projet actuel est principalement consacré à l'analyse des données des librairies de Design System hébergées sur GitHub.

Le périmètre actuel comprend notamment :

- les repositories ;
- les issues ;
- les Pull Requests ;
- les labels ;
- les Issue Types ;
- les Projects et leurs statuts ;
- les Iterations ;
- les Milestones ;
- les composants ;
- les audits ;
- les anomalies ;
- les criticités ;
- les relations entre ces objets ;
- les versions lorsqu'elles peuvent être déterminées à partir des données disponibles.

Le projet produit actuellement des données normalisées, des indicateurs, des snapshots et des dashboards HTML statiques.

---

## 2. Qualité des librairies

Le périmètre prioritaire comprend :

- la couverture des audits ;
- la conformité des composants ;
- les anomalies ;
- les criticités ;
- les catégories d'anomalies ;
- les délais de traitement ;
- les indicateurs de qualité associés aux composants et audits.

Les définitions précises seront établies dans les documents métier, règles et indicateurs.

---

## 3. Pilotage opérationnel

Le périmètre comprend également l'analyse :

- des travaux ;
- des statuts ;
- des anomalies ;
- des audits ;
- des itérations/sprints ;
- de la vélocité lorsqu'elle est disponible ;
- des délais ;
- des versions ;
- de l'évolution historique lorsque les snapshots permettent de la déterminer.

---

## 4. Périmètre futur : consommateurs

Le périmètre pourra être étendu aux applications utilisant les librairies du Design System.

Les informations recherchées sont notamment :

### Applications

- applications utilisant une ou plusieurs librairies ;
- version de chaque librairie utilisée.

### Composants

- composants effectivement utilisés ;
- nombre d'utilisations de chaque composant ;
- identification des composants les plus utilisés.

### Dette

- comparaison entre version utilisée et version attendue ;
- identification d'une éventuelle dette de version ;
- suivi de cette dette dans le temps.

### Alertes

- identification des applications nécessitant une montée de version ;
- information des Squads responsables.

### Qualité applicative

Possibilité future de rapprocher :

- l'application ;
- la version de la librairie utilisée ;
- les composants utilisés ;
- les informations de qualité RGAA/WAI-ARIA connues pour ces composants.

La méthode de calcul d'une éventuelle note ou d'un badge n'est pas encore définie.

---

## 5. Sources de données

### Sources actuelles

La source actuellement exploitée est principalement GitHub.

Le projet dispose également d'un mécanisme de fixture permettant de travailler sur des données représentatives sans dépendre directement de GitHub.

### Sources futures

Le futur périmètre consommateurs nécessitera probablement des données provenant de l'analyse du code des applications.

La ou les technologies utilisées pour cette analyse ne sont pas encore définies.

La nature exacte des données produites par cette analyse devra être précisée avant implémentation.

---

## 6. Hors périmètre défini à ce stade

Les éléments suivants ne sont pas suffisamment spécifiés pour être considérés comme faisant partie de l'implémentation actuelle :

- calcul d'une note globale de qualité d'une application ;
- calcul d'un badge RGAA/WAI-ARIA ;
- définition automatique d'une dette de version ;
- définition automatique d'une version cible ;
- mécanisme automatique de notification ;
- architecture backend définitive ;
- base de données définitive ;
- API définitive ;
- frontend définitif.

Ces éléments restent des sujets d'évolution.

---

## 7. Organisation fonctionnelle envisagée

L'orientation privilégiée est un point d'entrée unique permettant d'accéder à plusieurs sections.

Une organisation possible, non encore figée, serait :

```text
Dashboard
│
├── Synthèse entreprise
│
├── Qualité des librairies
│
├── Pilotage opérationnel
│
├── Audits & accessibilité
│
└── Consommateurs
```

Cette arborescence constitue une orientation fonctionnelle et non une spécification d'interface définitive.

---

## 8. Principe d'évolution

Le périmètre doit pouvoir s'étendre sans remettre en cause les données fondamentales déjà produites pour les librairies.

Les évolutions devront donc privilégier la séparation entre :

- sources ;
- données brutes ;
- modèle normalisé ;
- règles métier ;
- qualité des données ;
- indicateurs ;
- snapshots ;
- présentation.

Les modalités exactes permettant d'intégrer les données des consommateurs seront définies ultérieurement.
