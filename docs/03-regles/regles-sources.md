# Règles de disponibilité des sources

Le modèle RAW contient `nexusAvailable`.

Lorsque Nexus est indisponible, DQ-009 est produit.

La table d'impacts associe DQ-009 à des métriques `portfolio.release.*`, mais aucune métrique de ce préfixe n'est présente dans le catalogue V2 actuel.

**Conclusion :** il existe une intention de gérer une source de release externe, mais le KPI correspondant n'est pas démontré comme implémenté dans le ZIP actuel.
