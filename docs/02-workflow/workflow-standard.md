# Workflow STANDARD

## 1. Périmètre

Le profil `STANDARD` représente le flux nominal d'une Issue de
réalisation qui n'est pas traitée par un workflow spécialisé.

Sa formalisation définitive comme profil métier fait partie de `Q-020`,
mais il sert de référence pour distinguer le nominal des exceptions.

---

## 2. Flux nominal

```text
Backlog
   ↓ refinement / pesée
Ready
   ↓ prise en charge
In progress
   ↓ revue
In review
   ↓ finalisation
Done
```

`Blocked` peut interrompre temporairement le flux.

`Cancelled` constitue une sortie terminale alternative.

---

## 3. Backlog

Nominalement :

```text
Grooming       = présent
Velocity       = null
Iteration      = absente
Milestone      = absente
branche        = absente
Pull Request   = absente
Issue State    = Open
assignee       = absent
```

L'Issue est encore en qualification.

---

## 4. Ready

Après refinement/pesée :

```text
Grooming       = absent
Velocity       > 0
branche        = absente
Pull Request   = absente
Issue State    = Open
```

L'Iteration et la Milestone peuvent être affectées dans le cadre de la
planification.

La Velocity `0` ne doit pas être confondue avec une Velocity absente.

---

## 5. In progress

Dans le nominal STANDARD :

```text
Velocity       > 0
Iteration      = attendue
Milestone      = attendue
assignee       = attendu
branche        = attendue pour travail de code
Issue State    = Open
```

L'Issue est effectivement en réalisation.

---

## 6. In review

Pour un travail de code STANDARD :

```text
Pull Request = attendue
Issue State  = Open
```

La Pull Request porte la revue de la modification.

Une PR peut avoir été créée auparavant en Draft ; le statut `In review`
correspond à la phase où la modification est réellement soumise à revue.

---

## 7. Done

Pour un travail STANDARD de code, le nominal attend une correction ou
réalisation intégrée via Pull Request.

Le workflow source associe la finalisation au merge de la PR puis à la
clôture de l'Issue.

La règle exacte devra rester compatible avec les différents Issue Types
STANDARD qui ne nécessiteraient éventuellement pas de modification de
code.

Il ne faut donc pas transformer cette page en règle universelle pour
tous les profils.

---

## 8. Blocked

Une Issue peut devenir `Blocked` lorsqu'une dépendance empêche sa
progression.

La relation GitHub `Blocked by` constitue un signal explicite possible.

Lorsque le blocage disparaît, l'Issue revient dans son flux de
réalisation.

Le statut exact de retour ne doit pas être déduit sans historique ou
règle explicite.

---

## 9. Cancelled

Une Issue peut être `Cancelled` lorsque le travail est abandonné ou
lorsqu'une analyse conclut qu'il ne correspond pas à un défaut ou
travail à réaliser sur le Design System.

Les contraintes génériques des Issues Cancelled restent ouvertes dans
`Q-022`.

---

## 10. Matrice STANDARD

---
  Statut      Grooming            Velocity Iteration    Milestone    Branche      PR
  ----------- --------------- ------------ ------------ ------------ ------------ -------------
  Backlog     obligatoire           `null` non          non          non          non

  Ready       non                    `> 0` possible     possible     non          non
                                   nominal

  In progress non                    `> 0` attendue     attendue     attendue si  possible
                                   nominal                           code         Draft

  In review   non                    `> 0` attendue     attendue     attendue si  attendue
                                   nominal                           code

  Done        non               historique historique   historique   historique   attendue si
                                                                                  réalisation
                                                                                  par code

  Blocked     dépend du point    conservée selon        selon        selon        selon
              de blocage                   contexte     contexte     contexte     contexte

  Cancelled   non défini        non défini non défini   non défini   non défini   non défini
              génériquement
---

Les cellules non définies ne doivent pas être converties en
interdictions DQ avant résolution de `Q-022`.
