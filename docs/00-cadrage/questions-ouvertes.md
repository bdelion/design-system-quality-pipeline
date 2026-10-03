# Questions ouvertes

Ce document centralise les points qui ne doivent pas être transformés en règles sans arbitrage.

## Q-001 — Définition d'une anomalie

**Constat actuel :** la configuration `system.yaml` utilise `issueTypes.anomaly: BUG` et le normaliseur actuel reconnaît une anomalie à partir de l'Issue Type configuré.

**Besoin métier :** le document des indicateurs indique que « Bug peut être dans un label ou un issue type » et que la définition peut varier selon repository ou organisation.

**À décider :** la définition cible doit-elle supporter issue type, label, combinaison de critères et surcharge par repository ?

## Q-002 — Anomalie liée obligatoirement à un audit ?

Le modèle actuel `Anomaly` contient `auditId`, mais les spécifications distinguent les bugs ordinaires des bugs d'audit. La sémantique exacte d'un `auditId` obligatoire pour toutes les anomalies n'est pas suffisamment définie.

## Q-003 — Un composant non audité est-il non conforme ?

La demande client pose explicitement la question. La recommandation de conception formulée dans les échanges est de distinguer « non audité » de « audité non conforme », mais cette règle doit être validée métier.

## Q-004 — Statut d'une Release avant disponibilité

Le workflow indique « Blocked (ou Backlog ?) ». Décision non arrêtée dans la source.

## Q-005 — Règles de passage d'une Epic à Ready / In progress / In review

Plusieurs règles sont proposées dans le workflow mais certains critères sont marqués « à déterminer ».

## Q-006 — Velocity = 0 versus Velocity vide

La distinction est explicitement demandée, mais la signification métier exacte du zéro pour les audits, R&D, POC, etc. reste à décider.

## Q-007 — Modèle d'Iteration

Les indicateurs demandent des calculs de sprint et le workflow décrit des itérations de trois semaines, mais le modèle RAW actuel ne possède pas d'objet Iteration dédié.

## Q-008 — Criticités multiples

Le code actuel DQ-002 considère plusieurs criticités comme incompatibles dans un cas lié aux labels de criticité d'accessibilité. La généralisation aux différents domaines de criticité reste à spécifier.

## Q-009 — Score qualité 0–100

Un score est demandé par les besoins d'accessibilité. La formule, les pondérations, les critères non applicables et les règles de comparaison entre versions ne sont pas définis dans les sources disponibles.

## Q-010 — Sources applicatives

Les applications utilisant le Design System, celles qui devraient l'utiliser et leur fréquence d'utilisation nécessitent une source complémentaire à GitHub. Cette source n'est pas définie actuellement.

## Q-011 — Moment de vérité d'une conformité de version

Le besoin demande une conformité globale juste avant mise en production mais reconnaît que la conformité évolue « au fil de l'eau ». Le moment exact du calcul reste à définir.

## Q-012 — Monorepo

Le besoin prévoit qu'un repository puisse contenir plusieurs bibliothèques. Le modèle cible doit donc éviter de confondre repository et library. Le modèle actuel `Library.repository` prépare cette distinction, mais la collecte et le catalogue restent à faire évoluer.
