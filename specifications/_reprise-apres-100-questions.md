Oui. Après les 100 questions et la photographie complète du repository, je changerais maintenant de méthode. **Je ne lancerais ni une nouvelle longue série de questions, ni l’implémentation immédiatement.**

Je propose un cycle en **6 étapes**, avec un commit propre à chaque jalon.

### Planning proposé

| Étape | Travail | Livrable | Code ? |
|---|---|---|---|
| **1. Audit & ménage documentaire** | Identifier documents actuels, historiques, doublons, contradictions | Arborescence documentaire assainie | Non |
| **2. Consolidation métier V1** | Transformer D-001→D-136 en modèle cohérent | Modèle métier + relations + cardinalités | Non |
| **3. Questions bloquantes uniquement** | Poser uniquement les questions nécessaires à V1 | Liste courte de décisions supplémentaires | Non |
| **4. Spécification V1** | Workflow, règles, DQ, KPI, sources | Spécification implémentable | Non |
| **5. Gap analysis code ↔ cible** | Comparer TypeScript/fixtures/config au modèle V1 | Backlog technique priorisé | Non |
| **6. Implémentation incrémentale** | Faire évoluer RAW → normalisation → DQ → métriques → snapshot → dashboard | V2 fonctionnelle | Oui |

Je ne fixerais pas ce planning en nombre de jours : chaque étape possède plutôt un **critère de sortie vérifiable**.

---

## 1. Oui, je commencerais par faire du ménage

Mais **sans supprimer immédiatement les anciens documents**.

Le ZIP montre que nous avons accumulé plusieurs générations de documentation. Je propose donc une règle simple :

```text
docs/
├── ... documentation normative actuelle
│
└── _historique/
    └── ... documents remplacés mais conservés
```

Le principe serait :

```text
Document actuel et cohérent
        ↓
     conserver

Document utile mais ancien
        ↓
déplacer dans _historique/

Document en doublon
        ↓
consolider d'abord
        ↓
archiver l'ancienne version

Document manifestement obsolète
        ↓
_historique/ avec indication de son remplacement
```

Je veux surtout éviter une erreur dangereuse : **déplacer un ancien document avant d'avoir vérifié qu'il ne contient pas une information métier absente de son successeur.**

C'est pourquoi je ferais d'abord une matrice du type :

| Document | Rôle actuel | Fraîcheur | Doublon | Décision |
|---|---|---:|---|---|
| ancien document A | ancienne spécification | historique | oui | archiver |
| `01-metier/audits.md` | référence Audit | actuelle | partiel | conserver |
| `questions-ouvertes.md` | registre décisions | actuelle | non | conserver |
| ancienne architecture | historique V1 | ancienne | oui | archiver |

Et **seulement après validation avec toi**, nous effectuerons les déplacements.

---

# 2. Ensuite : fabriquer notre véritable modèle métier

C'est selon moi le travail le plus important maintenant.

Nous avons beaucoup de décisions, mais elles sont dispersées dans les réponses et documents.

Je veux arriver à une représentation centrale comme :

```text
Organisation
     │
     ├── Library
     │      │
     │      ├── Package
     │      │     └── Version
     │      │
     │      └── Component
     │
     └── Repository
             │
             ├── Issue
             │    ├── Audit
             │    │    ├── Anomaly
             │    │    └── Improvement
             │    │
             │    ├── Bug
             │    ├── Feature
             │    └── ...
             │
             ├── Pull Request
             ├── Milestone
             └── Iteration
```

Avec, pour **chaque relation**, sa cardinalité et son statut :

```text
Audit ───────────── Component
       exactement 1

Audit ───────────── Anomaly
       0..n

Anomaly ─────────── Audit
       exactement 1

Issue ───────────── Component
       0..n

Package ─────────── Version
       1..n
```

Et surtout :

> **Établi / À confirmer / Futur**

Ainsi une hypothèse encore incertaine ne deviendra pas accidentellement une règle de code.

---

# 3. Oui, il restera des questions — mais beaucoup moins

Je **ne veux surtout pas recommencer 100 questions**.

Les nouvelles questions devront passer un filtre :

```text
Cette réponse est-elle nécessaire
pour définir ou implémenter la V1 ?
          │
     ┌────┴────┐
    NON       OUI
     │         │
   backlog   question
   futur     utilisateur
```

Je m'attends plutôt à découvrir **une petite dizaine de zones réellement structurantes**, pas à continuer indéfiniment.

Par exemple, nous savons déjà qu'il reste des sujets importants autour de :

- cardinalités `Library / Repository / Package`;
- définition générale d'une Anomalie **hors Audit** ;
- certaines exceptions des workflows ;
- sources exactes de certaines dates ;
- constitution du Catalogue historique par Version.

À l'inverse, des sujets comme le futur calcul de fréquence d'utilisation des Components dans les applications peuvent rester explicitement **V2/futur**.

---

# 4. Ensuite seulement : figer la spécification V1

À ce moment-là, je voudrais que `specifications/` ne soit plus un ensemble de réflexions, mais un **contrat implémentable**.

Nous devrions pouvoir répondre précisément à :

```text
GitHub
   │
   ▼
RAW DATASET
   │
   ▼
NORMALIZED MODEL
   │
   ├── Domain Rules
   ├── Workflow Rules
   ├── Relationship Rules
   └── Reference Rules
   │
   ▼
DATA QUALITY
   │
   ▼
METRIC ENGINE
   │
   ▼
SNAPSHOT
   │
   ├── Dashboard
   ├── History
   └── Export
```

Chaque KPI devra alors avoir au minimum :

```text
ID
Nom
Définition métier
Formule
Numérateur
Dénominateur
Périmètre
Entités sources
Exclusions
Fiabilité
Impact des erreurs DQ
Drill-down
```

C'est là que les 100 questions commenceront réellement à produire leur valeur.

---

# 5. Puis : Gap Analysis du code existant

À ce moment seulement je comparerais la cible au code.

Nous savons déjà qu'il existe un écart important.

Par exemple, le modèle actuel est essentiellement autour de :

```text
Library
Component
Audit
Anomaly
PullRequest
```

alors que notre domaine cible devient sensiblement plus riche.

Je produirai quelque chose comme :

| Domaine | Existant | Cible | Action |
|---|---|---|---|
| Library | ✓ | ✓ | adapter |
| Component | ✓ | ✓ enrichi | faire évoluer |
| Audit | ✓ | ✓ enrichi | faire évoluer |
| Anomaly | ✓ | ✓ enrichi | faire évoluer |
| Improvement | — | ✓ | ajouter |
| Package | — | ✓ | ajouter |
| Version | partiel | ✓ | modéliser |
| Catalogue historique | — | ✓ | ajouter |
| Audit applicable | — | ✓ | ajouter |
| Consumer App | — | futur | ne pas implémenter V1 |

Cela donnera le **backlog technique réel**.

---

# 6. Enfin : implémentation

Je ne ferais surtout pas un gros refactoring unique.

Je procéderais verticalement et par commits :

```text
1. modèle normalisé
       ↓
2. collecte / RAW
       ↓
3. normalisation
       ↓
4. règles métier
       ↓
5. Data Quality
       ↓
6. métriques
       ↓
7. snapshot
       ↓
8. dashboard
```

Chaque étape avec fixtures + tests.

Nous pourrons alors transformer progressivement nos décisions en tests :

```text
D-117
Audit = exactement 1 Component
             ↓
          fixture
             ↓
        règle DQ
             ↓
           test
```

C'est une évolution importante : **les décisions métier deviennent progressivement des règles exécutables**.

---

## Et le dashboard ?

Je le laisserais volontairement après le moteur métier.

Il sera alors construit sur des données stables et non sur les particularités actuelles de GitHub.

La structure cible que nous avons esquissée reste pertinente :

```text
Accueil / Portfolio
       │
       ├── Qualité
       │     ├── Accessibilité
       │     ├── Audits
       │     ├── Anomalies
       │     └── Components
       │
       ├── Pilotage
       │     ├── Issues
       │     ├── Sprints
       │     ├── Délais
       │     └── Versions
       │
       ├── Patrimoine
       │     ├── Components
       │     └── évolutions
       │
       └── Consommateurs       ← futur
             ├── applications
             ├── versions
             ├── usages
             └── dette
```

Nous pourrons alors travailler sérieusement le design contemporain, responsive et accessible plutôt que d'adapter progressivement les pages HTML existantes à chaque nouvelle règle.

---

# Ce que je ferais maintenant concrètement

**Prochaine action : Étape 1 — audit documentaire du ZIP.**

Je ne déplacerais encore aucun fichier. Je produirais d'abord le **plan de ménage**, fichier par fichier :

```text
CONSERVER
FUSIONNER
RENOMMER
DÉPLACER → docs/_historique/
SUPPRIMER éventuellement
À EXAMINER
```

avec la justification et les éventuelles informations à récupérer avant déplacement.

Ensuite **je te soumets ce plan**. Tu le valides ou le corriges.

Puis seulement nous faisons le ménage avec un commit dédié, par exemple :

```bash
git status
git diff

git add docs specifications

git commit -m "docs: reorganize project documentation"

git push
```

Après cela, **Étape 2 : bilan métier consolidé**, puis éventuellement quelques questions bloquantes.

Donc je recommande : **pas de nouvelle implémentation maintenant et pas de Question 101 maintenant. On commence par l'audit et le plan de ménage du repository que tu viens de me transmettre.**