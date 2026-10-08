# Documentation du code TypeScript (V1)

Les modules de `src/` possèdent un en-tête TSDoc en français ; les déclarations exportées documentent leur rôle. Les descriptions restent volontairement factuelles et ne remplacent pas les spécifications métier.

## Génération

```bash
npm run docs:api
```

La configuration `typedoc.json` parcourt l’ensemble de `src/` (`entryPointStrategy: expand`). Le résultat HTML est produit dans `docs/api/` : **ce répertoire est généré et exclu de Git, d’ESLint et de Prettier**.

## Convention de rédaction

- Documenter les **contrats publics** et les règles métier en français, avec un vocabulaire stable.
- Ajouter `@param`, `@returns`, `@throws` lorsque ces informations clarifient réellement un contrat ; ne pas inventer des garanties.
- Utiliser `@remarks` pour expliquer les invariants et les limites d’un algorithme.
- Documenter les fonctions privées complexes au fil des revues, plutôt que commenter chaque instruction.
- Éviter les commentaires qui répètent simplement le nom d’une variable ou une signature.

## Vérification

```bash
npm run docs:api
npm run check
```

Le chantier est documentaire : aucune logique métier ni signature n’a été modifiée.
