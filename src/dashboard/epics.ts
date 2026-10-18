import type { Snapshot } from '../domain/types.js';

/** Rend les contrôles et données déjà calculées du suivi d'Epic, sans calcul métier côté navigateur. */
export function epicsContent(snapshot: Snapshot): string {
  const payload = JSON.stringify(snapshot.analytics.epicActivity ?? { version: 1, epics: [] }).replace(
    /</g,
    '\\u003c'
  );
  return `<section class="panel" data-epic-activity><h2>Durées par composant pour une Epic</h2><p>Les rattachements proviennent des mentions d’issues dans les descriptions, indépendamment des relations parent/enfant. Durée calendaire en heures : dernier passage à Done moins premier passage à In progress, sans retrait des pauses, week-ends ou retours en arrière. Elle ne représente pas des heures de travail effectif. Les versions futures restent incluses dans cette activité.</p><label for="epic-select">Epic</label><select id="epic-select" data-epic-select><option value="">Choisir une Epic</option></select><button type="button" data-epic-export disabled>Exporter CSV</button><p role="status" aria-live="polite" data-epic-summary></p><div class="table-wrap"><table><caption>Issues mentionnant l’Epic sélectionnée</caption><thead><tr><th>Composant</th><th>Issue</th><th>Vélocité</th><th>Premier In progress</th><th>Dernier Done</th><th>Temps passé (h)</th></tr></thead><tbody data-epic-rows></tbody></table></div></section><script type="application/json" id="epic-activity-data">${payload}</script>`;
}
