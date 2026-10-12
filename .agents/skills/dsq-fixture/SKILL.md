---
name: dsq-fixture
description: 'Diagnostiquer un dataset DSQ, son anonymisation, ses alias, ses références manquantes ou son échec pipeline ; ne pas collecter GitHub sans demande.'
---

# dsq-fixture

1. Lire `src/anonymization/AGENTS.md` et les sections utiles de `docs/08-implementation/datasets.md`.
2. Identifier le dossier autonome, son `dataset.json`, son manifeste, la provenance du profil et les alias ; lire `src/datasets.ts`. Ne jamais afficher les secrets de `.env`.
3. Exécuter `npm run fixture:validate -- --dataset <dossier>` ; isoler les références fautives avec un extrait anonymisé minimal.
4. Comparer les noms RAW, anonymisés et le périmètre embarqué. Un catalogue absent ne prouve pas l’absence de composants ; ne pas inventer de métadonnées.
5. Si une régénération est demandée, utiliser `fixture:prepare --input <raw> --output <nouveau-dossier>` puis `pipeline --dataset <dossier> --output <sorties>`. Conserver le RAW et les jeux existants. Les scénarios de tests et la démonstration ne sont pas des destinations de collecte personnelle.
6. Pour une correction de code, ajouter les tests et appliquer `npm run check`, ou `npm run check:dashboard` pour le rendu. Distinguer intégrité, anonymisation, réserves DQ et preuve métier.
