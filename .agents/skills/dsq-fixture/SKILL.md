---
name: dsq-fixture
description: 'Diagnostiquer une fixture DSQ, son anonymisation, ses alias, ses références manquantes ou son échec pipeline. Utiliser pour les datasets et configurations associés ; pas pour collecter GitHub sans demande.'
---

# dsq-fixture

1. Lire `src/anonymization/AGENTS.md` et les seules sections utiles de `docs/08-implementation/anonymisation-v2.md` et `docs/08-implementation/fixtures.md`.
2. Identifier le triplet fixture/system/catalogue, sa seed et ses alias ; inspecter `src/lib/paths.ts` pour la résolution effective. Lire `.env.example`, jamais afficher les valeurs secrètes de `.env`.
3. Exécuter `npm run fixture:validate -- --input <fixture>` ; isoler l’objet et la relation fautive avec un petit extrait anonymisé.
4. Pour un repository manquant, comparer les noms RAW/anonymisés/configurés. Pour un catalogue vide, vérifier la collecte et la source du catalogue avant d’en inventer un.
5. Si la régénération est demandée, relire les options de `src/cli.ts`, produire un nouveau triplet cohérent sans écraser le RAW, puis valider et rejouer `npm run pipeline -- --source fixture --fixture <fixture>`.
6. En cas de correction du code, ajouter les tests associés et appliquer la gate `npm run check`. Distinguer validation confidentialité, intégrité et exécution pipeline.
