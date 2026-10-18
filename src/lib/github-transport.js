// @ts-check
/* global Headers, console */
import { request } from '@octokit/request';

/**
 * Envoie un seul appel Octokit et rend la réponse brute au contrôleur appelant.
 * Les quotas, erreurs GraphQL et relances restent gérés par chaque commande.
 * Ce module ESM JavaScript typé est aussi utilisable par le diagnostic exécuté avec Node.
 * @param {string} url - URL complète, y compris pour GitHub Enterprise.
 * @param {RequestInit} [init] - Méthode, corps, en-têtes et signal de l'appel.
 * @returns {Promise<Response>} Réponse dont le corps reste disponible, même en erreur HTTP.
 */
export async function githubRequest(url, init = {}) {
  /** @type {Response | undefined} */
  let response;
  try {
    await request(url, {
      method: init.method ?? 'GET',
      headers: Object.fromEntries(new Headers(init.headers)),
      ...(init.body == null ? {} : { data: init.body }),
      request: {
        ...(init.signal == null ? {} : { signal: init.signal }),
        ...(init.redirect === undefined ? {} : { redirect: init.redirect }),
        parseSuccessResponseBody: false,
        log: {
          // Le journal Octokit standard contient l'URL ; limiter la sortie au diagnostic générique.
          warn: () => console.warn('GitHub : endpoint déprécié signalé par le serveur.')
        },
        /**
         * Conserve la réponse native avant son inspection par Octokit.
         * @param {RequestInfo | URL} input - Cible préparée par Octokit.
         * @param {RequestInit} [options] - Options HTTP préparées par Octokit.
         */
        fetch: async (input, options) => {
          response = await globalThis.fetch(input, options);
          // Octokit lit les corps d'erreur avant de lever une exception : préserver l'original.
          return response.ok ? response : response.clone();
        }
      }
    });
  } catch {
    // Une réponse HTTP reste exploitable par le contrôleur ; ne pas exposer les erreurs SDK
    // qui peuvent contenir le contexte de requête ou des données renvoyées par GitHub.
    if (!response) throw new Error('GitHub : échec du transport HTTP.');
  }
  if (!response) throw new Error('GitHub : échec du transport HTTP.');
  return response;
}
