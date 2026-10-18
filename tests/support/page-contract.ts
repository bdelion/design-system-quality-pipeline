import type { DashboardPageModel } from '../../src/dashboard/page-read-model.js';
/** Lit l'enveloppe publique d'une page générée sans exécuter son JavaScript. */
export function pageContract(html: string): DashboardPageModel {
  const json = html.match(/<script type="application\/json" id="dashboard-page-data">([^<]+)<\/script>/)?.[1];
  if (!json) throw new Error('Contrat de page absent');
  return JSON.parse(json) as DashboardPageModel;
}
