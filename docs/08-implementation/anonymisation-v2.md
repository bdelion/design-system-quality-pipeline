# Préparer une fixture GitHub reproductible

1. Copier `.env.example` vers `.env` (ne jamais committer `.env`). Définir une seule fois `ANONYMIZATION_SEED`, `ANON_GITHUB_OWNER` et les alias `ANON_REPO_<NOM_SOURCE_NORMALISÉ>` (le nom source est `repositories[].name` du RAW, en majuscules, ponctuation remplacée par `_`). Les alias ne sont pas obligatoires : le hash déterministe prend le relais.
2. Collecter un RAW récent : `npm.cmd run collect -- --source github --output data/raw/my-real-dataset-new.json`.
3. Vérifier que les issues possèdent les champs historiques attendus (`projectStatuses[].statusHistory`).
4. Préparer **ensemble** fixture, système et catalogue :

```powershell
npm.cmd run fixture:prepare -- --input data/raw/my-real-dataset-new.json --output fixtures/my-real-dataset-anonymized-new.json
```

5. La commande écrit `fixtures/my-real-dataset-anonymized-new.json`, `config/system.my-real-dataset-anonymized-new.yaml`, `config/catalogue.my-real-dataset-anonymized-new.yaml` et un manifeste `.manifest.json`. Elle échoue si les références sont invalides ou si un composant observé manque au catalogue de référence. Elle ne publie pas de sortie si la validation échoue.
6. Valider : `npm.cmd run fixture:validate -- --input fixtures/my-real-dataset-anonymized-new.json`.
7. Exécuter : `npm.cmd run pipeline -- --source fixture --fixture fixtures/my-real-dataset-anonymized-new.json`.
8. Terminer par `npm.cmd run check` et `npm.cmd run docs:api`.

**Sécurité** : les alias lisibles ne doivent pas révéler d'identité réelle. Le RAW, `.env`, les traces de correspondance et les exports locaux ne doivent pas être partagés. Le catalogue de référence est la source des métadonnées métier ; le RAW permet de vérifier la présence des composants, pas d'inventer `owner`, `squad`, `rgaaLevel` ou des URL. Le format YAML reste celui des chargeurs existants.
