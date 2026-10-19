import { currentContext, matchesFact } from './context.js';
import { readPageModel } from './page-model.js';

/** Accorde les effectifs nominaux sans changer les populations observées. */
function quantity(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}

/** Présente les effectifs des preuves visibles sans recalculer les ratios ou verdicts Analytics. */
function renderPopulations() {
  const root = document.getElementById('component-populations');
  if (!root) return;
  if (!readPageModel()) {
    root.querySelector('[data-component-populations-summary]').textContent =
      'Détail indisponible : contrat de page invalide.';
    return;
  }
  const context = new URLSearchParams(
    [...currentContext()].filter(([key]) => ['repository', 'component', 'version'].includes(key))
  );
  const visible = [...root.querySelectorAll('[data-component-population-row]')].filter((row) => {
    row.hidden =
      !matchesFact(JSON.parse(row.dataset.context), context) ||
      (!context.get('version') && row.dataset.current !== 'true');
    return !row.hidden;
  });
  const identities = new Set(visible.map((row) => row.dataset.identity));
  const active = new Set(
    visible.filter((row) => row.dataset.active === 'true').map((row) => row.dataset.identity)
  );
  /** Compte les observations de présence déjà projetées dans le périmètre visible. */
  const count = (key) => visible.filter((row) => row.dataset.presence === key).length;
  root.querySelector('[data-component-populations-summary]').textContent =
    `${quantity(identities.size, 'identité historique', 'identités historiques')} · ${quantity(active.size, 'actif', 'actifs')} · ${quantity(count('present'), 'présence matérialisée', 'présences matérialisées')} · ${quantity(count('absent'), 'absence démontrée', 'absences démontrées')} · ${quantity(count('unknown'), 'présence indéterminée', 'présences indéterminées')} · ${quantity(visible.filter((row) => row.dataset.covered === 'true').length, 'couple couvert', 'couples couverts')} · ${quantity(visible.filter((row) => row.dataset.conform === 'true').length, 'conforme', 'conformes')}. ${context.get('version') ? 'Version sélectionnée.' : 'PROD courantes, ou présence indéterminée sans PROD prouvée.'}`;
}
window.addEventListener('dashboard-context-change', renderPopulations);
window.addEventListener('popstate', renderPopulations);
renderPopulations();
