# Versions et Releases

## 1. Version déclarée et Version d'artefact

Le modèle distingue :

```text
Version déclarée dans package.json
```

de :

```text
Version effectivement construite ou publiée
```

Dans le fonctionnement nominal :

```text
1.8.0
  │
  ├── develop / project → 1.8.0-SNAPSHOT
  ├── release           → 1.8.0-rc.n
  ├── hotfix            → 1.8.0-hc.n
  └── master / PROD     → 1.8.0
```

Jenkins sait également traiter certains cas où `package.json` contient
déjà un suffixe.

---

## 2. Version PROD

Une Version PROD :

- est de forme `M.m.r` ;
- ne porte pas de suffixe ;
- est publiée dans l'espace Nexus de production ;
- possède un Tag Git correspondant ;
- doit disposer d'une Milestone `M.m.r`.

Une Release GitHub existe normalement, mais son caractère obligatoire et
son mécanisme de création restent à confirmer.

---

## 3. Release Candidate

Une branche :

```text
release/***
```

produit :

```text
M.m.r-rc.[build Jenkins]
```

Dans le fonctionnement cible, l'Audit pré-PROD porte sur une Release
Candidate précise.

La manière de référencer précisément cette RC dans l'Issue d'Audit reste
à instruire.

---

## 4. Hotfix Candidate

Une branche :

```text
hotfix/***
```

produit :

```text
M.m.r-hc.[build Jenkins]
```

Après merge vers `master`, Jenkins produit la Version PROD `M.m.r`.

---

## 5. Milestone d'Audit

```text
M.m.r-Audit
```

ne représente pas une nouvelle Version.

Elle signifie :

```text
Version métier : M.m.r
Contexte        : Audit de rattrapage
```

Le suffixe utilisé pour reconnaître ce type de Milestone doit être
configurable.

---

## 6. Temporalité d'Audit

Deux scénarios doivent rester distincts.

### Cible

```text
Release Candidate
      ↓
Audit
      ↓
Version PROD
```

### Rattrapage

```text
Version PROD
      ↓
Audit
```

Cette distinction influence directement l'interprétation historique de
la conformité.

---

## 7. État d'une Version à sa publication

La vue historique d'une Version doit représenter les informations
connues à la date de sa publication.

Elle peut notamment comprendre :

- Catalogue applicable ;
- couverture d'Audit connue ;
- verdicts connus ;
- Anomalies connues ;
- état de traitement connu.

Une information découverte ultérieurement ne doit pas être projetée
rétroactivement.

---

## 8. Connaissance actuelle d'une Version

Une ancienne Version peut continuer à évoluer du point de vue de la
connaissance :

```text
Audit de rattrapage
correction d'Anomalies
réouverture
annulation
```

La vue actuelle peut intégrer ces évolutions tout en conservant
séparément l'état historique de Release.

---

## 9. Date de Release

Le besoin d'une date de référence exacte est identifié.

La source technique et la règle de priorité entre les signaux
disponibles ne sont pas encore établies.

Il ne faut donc pas figer prématurément une date de Release à partir
d'un seul artefact GitHub, Jenkins ou Nexus.

---

## 10. Questions associées

Restent notamment ouvertes ou partielles :

- caractère obligatoire de la Release GitHub ;
- identification précise de la RC auditée ;
- source exacte de la date de Release ;
- règles en cas de Tag ou Milestone PROD manquants ;
- impact des Audits de rattrapage sur les vues actuelles et
    historiques.

---

## Date métier de Release

Pour une Version PROD `M.m.r`, la date métier de Release est la date de création du Git tag `M.m.r`.

```text
Version.releasedAt = GitTag(M.m.r).createdAt
```

Cette date constitue l'instant de référence pour déterminer ce qui était connu au moment de la Release. La date de publication Nexus ou l'exécution Jenkins ne se substitue pas à cette référence métier.
