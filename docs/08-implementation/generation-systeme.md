# Générer un brouillon de configuration système

**IMPLÉMENTÉ.** `system:generate` produit un brouillon `system.yaml` depuis un RAW local, sans catalogue source, token ni accès réseau.

```powershell
npm.cmd run system:generate -- --input data/raw/collecte.json --output config/local/system.brouillon.yaml
```

Les deux chemins sont obligatoires. Le dossier parent est créé si nécessaire ; aucun fichier existant n’est écrasé, y compris le RAW d’entrée. La console affiche uniquement le nombre de repositories et le chemin. Le brouillon contient des valeurs métier et des noms réels : le conserver localement, par exemple dans `config/local/`, ignoré par Git.

## Faits extraits

- `githubOwner` est renseigné uniquement si un seul owner est observé ; sinon il reste à `null`. `owners` conserve tous les owners observés. Le pipeline exige un unique owner : scinder le périmètre si nécessaire.
- `repositories` contient les noms simples dédupliqués ; `inventory` conserve les noms complets `owner/repository`.
- Pour chaque repository, l’inventaire regroupe les labels, types GitHub bruts, types canoniques legacy, statuts Project et titres de milestones, avec les numéros d’issues justificatives. Les valeurs sont conservées telles qu’observées, triées et dédupliquées. Les titres et corps des issues ne sont pas copiés.
- Les types bruts et canoniques restent séparés : un type canonique ancien ne prouve pas une convention GitHub actuelle. Des compteurs distinguent les champs `rawIssueType` et `projectStatuses` absents des listes présentes et vides. L’absence d’un statut dans ce RAW ne prouve pas qu’il n’existe pas dans le Project.

Le fichier doit être un RAW du pipeline, pas un snapshot ni une réponse API non transformée. Les champs utilisés sont validés ; les repositories dupliqués sont refusés. Un RAW sans repository produit un brouillon sans owner connu, à compléter.

## Règles à confirmer

`modelVersion`, `ruleVersion`, `auditVersion`, `scope`, les URLs et les règles `github` restent à `null`. La commande ne choisit pas quels labels sont des composants, quels types sont des audits ou anomalies, quels statuts sont terminés/annulés, ni quelle milestone désigne une version ou un audit.

Pour constituer la configuration finale :

1. Choisir le périmètre et vérifier l’owner unique.
2. Reprendre les versions de modèle/règles/audit et les conventions d’une configuration approuvée, adaptée au contexte. Le RAW seul ne suffit pas à les établir.
3. Confirmer les correspondances métier à l’aide de l’inventaire. Compléter les règles obligatoires et renseigner ou supprimer les règles facultatives selon le contrat décrit dans `src/config.ts`. Ne pas conserver des valeurs `null` comme règles opérationnelles. Fournir les URLs adaptées à GitHub public ou à l’instance Enterprise, via la configuration ou l’environnement.
4. Retirer `draft`, `collectedAt`, `owners` et `inventory` du fichier final. Garder le brouillon séparément pour sa provenance.
5. Compléter aussi le [catalogue de composants](generation-catalogue.md), puis vérifier la paire :

```powershell
npm.cmd run validate -- --fixture data/raw/collecte.json --system-config config/local/system.complete.yaml --catalogue-config config/local/catalogue.complete.yaml
```

Le chargement refuse tout fichier marqué `draft: true`, même vide. Retirer le marqueur ne constitue pas une validation métier ; la commande `validate` ne certifie pas les correspondances choisies. Après revue, utiliser la paire pour le [rejeu local](guide-utilisation.md) ou la [préparation des références](preparation-references.md). Aucun token ni aucune graine d’anonymisation n’est généré.
