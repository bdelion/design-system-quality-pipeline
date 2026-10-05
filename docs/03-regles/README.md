# Règles

Les règles doivent être séparées en familles.

1. **Règles métier** — ce que signifie un objet correctement défini.
2. **Règles workflow** — cohérence entre statut et attributs attendus.
3. **Règles relationnelles** — cohérence des liens entre entités.
4. **Règles référentielles** — cohérence avec le catalogue, composants et versions.
5. **Règles de qualité des données** — données manquantes, contradictoires ou inconnues.
6. **Règles de disponibilité des sources** — une source externe nécessaire est-elle disponible ?

Le code actuel appelle principalement la dernière famille « Data Quality » et dispose de DQ-001 à DQ-010. Cette nomenclature pourra évoluer, mais aucune suppression/réécriture des règles actuelles n'est faite dans V11.
