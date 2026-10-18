# ADR-005 — Modèles de lecture du dashboard par page

Statut : accepté. Date : 18/10/2026. Décision technique, issue #83.

L’utilisateur a validé explicitement « Go pour JSON intégré au HTML » après comparaison des alternatives dans la [proposition détaillée](../08-implementation/page-read-models-proposal.md).

Chaque page embarque une enveloppe `dsq-dashboard-page`, version 1, avec son identité, les métadonnées de capture et les seules projections nécessaires à ses interactions. Le snapshot complet et le RAW restent dans le pipeline. Les règles et qualifications métier restent calculées côté pipeline ; les filtres et CSV utilisent les faits projetés.

Le consommateur commun valide et parse une fois le contrat du document. Une absence, un JSON invalide, une version inconnue ou une section requise manquante désactive les interactions et affiche une explication, sans convertir l’absence en zéro. Les anciennes captures sont projetées par le mécanisme de compatibilité existant. Un dossier généré doit être distribué avec ses propres assets ; mélanger des générations n’est pas un mode supporté.

L’alternative de fichiers JSON séparés via HTTP permettrait du cache partagé et du chargement différé, au prix d’une gestion supplémentaire du réseau et des erreurs. Elle reste une évolution possible après mesure. La solution retenue garde une distribution statique simple ; chaque navigation indépendante relit son contrat. L’avertissement `file:` demeure : servir le dossier en HTTP pour ses interactions.

La source unique du modèle des espaces introduite par #82 est conservée dans chaque document, mais le transport global `window.__SNAPSHOT__` est remplacé. Les octets HTML incluent le JSON ; les assets communs sont recensés séparément et dédupliqués pour le coût du dossier. Les budgets validés de croissance nulle restent inchangés.
