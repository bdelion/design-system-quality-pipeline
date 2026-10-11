---
name: dsq-change
description: 'Modifier le code DSQ avec tests, documentation et validations. Utiliser pour corriger ou faire évoluer le pipeline ou le dashboard ; pas pour une revue documentaire seule.'
---

# dsq-change

1. Lire les consignes racine et locales ; inspecter le diff existant.
2. Utiliser `docs/08-implementation/ai-context-map.md` pour trouver les contrats et tests liés au symptôme.
3. Identifier le comportement attendu et créer/adapter un test de régression avant la correction.
4. Corriger à la bonne couche, conserver provenance et inconnues, documenter les fonctions en français.
5. Mettre à jour README/docs concernés ; exécuter le test ciblé puis `npm run check`, ou `npm run check:dashboard` pour le dashboard.
6. Pour les consignes IA, utiliser `npm run check:ai` ; après modification du registre, régénérer uniquement l’index avec `npm run ai:index:update`, sans réécrire les décisions.
7. Relire le diff ; restituer le résultat, les validations effectives et les limites. Si une commande est bloquée, fournir sa cause et la commande locale à lancer, sans annoncer un succès.
