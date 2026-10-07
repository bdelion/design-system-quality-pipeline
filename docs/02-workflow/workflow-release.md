# Workflow RELEASE

## 1. Rôle

Une Issue de Release sert à piloter une publication de Version.

La source historique décrit un workflow spécifique et ne permet pas de
la traiter comme une Issue STANDARD ordinaire.

---

## 2. Informations décrites dans la source

La source prévoit notamment :

```text
titre       : 🔖 Release M.m.r
Milestone   : M.m.r
branche source :
    release/M.m.r
    ou hotfix/M.m.r
branche cible :
    master
    ou support/...
```

ainsi qu'une description contenant :

- numéro de Version ;
- branches source et cible ;
- mode opératoire ;
- checklist de publication ;
- points de vigilance spécifiques à la Version.

---

## 3. Relation avec le cycle de Version

Les cycles établis sont :

### Release

```text
release/***
    ↓
M.m.r-rc.n
    ↓
merge vers master
    ↓
Jenkins
    ↓
Tag M.m.r
+
Nexus PROD M.m.r
```

### Hotfix

```text
hotfix/***
    ↓
M.m.r-hc.n
    ↓
merge vers master
    ↓
Jenkins
    ↓
Tag M.m.r
+
Nexus PROD M.m.r
```

La Release GitHub existe normalement pour une PROD mais son caractère
obligatoire reste à confirmer.

---

## 4. Milestone

L'Issue de Release décrite dans la source est rattachée à la Milestone :

```text
M.m.r
```

Cette Milestone représente la Version PROD concernée.

---

## 5. Branche et Pull Request

Contrairement aux profils EPIC et AUDIT, le processus RELEASE est
explicitement lié à des branches de release/hotfix et à leur intégration
vers une branche cible.

La Pull Request appartient donc au processus de publication.

Les règles détaillées de review sont documentées dans
`pull-requests.md`.

---

## 6. Statuts encore ouverts

La source indique notamment que l'Issue de Release :

- resterait `Blocked` **ou `Backlog`** tant que les autres Issues ne
    sont pas terminées ;
- deviendrait `Ready` après une période de retour des early adopters.

La présence explicite de l'alternative `Blocked (ou Backlog ?)` montre
que cette transition n'est pas décidée.

Elle ne doit pas être transformée en règle DQ.

---

## 7. Matrice RELEASE

  Dimension                   Règle
  --------------------------- ---------------------------------------------
  Milestone                   `M.m.r` dans le scénario décrit
  Version                     `M.m.r`
  Branche source              release ou hotfix selon contexte
  Branche cible               master ou support selon contexte
  Pull Request                fait partie du processus décrit
  Checklist                   prévue par la source
  Backlog / Blocked initial   ouvert
  Ready                       déclencheur exact ouvert
  In progress                 à formaliser
  In review                   à formaliser avec PR
  Done                        à formaliser par rapport à publication PROD

---

## 8. Ce qui reste à formaliser

Avant de transformer RELEASE en machine à états normative, il faut
décider :

- statut initial réel ;
- condition de passage à Ready ;
- articulation avec les Audits pré-PROD ;
- condition exacte de Done ;
- comportement pour branches `support/*` ;
- rôle exact de la Release GitHub.

Ces points ne doivent pas être déduits de la seule implémentation
actuelle.
