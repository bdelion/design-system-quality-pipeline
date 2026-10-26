/* global location, MutationObserver */
import context from './review-context.js';
import { reviewId, reviewEntity, markReview } from './review-core.js';

/** Installe les références stables et un inspecteur local, sans modifier les interactions normales. */
export function startReview(presentation) {
  let selected,
    panel,
    output,
    status,
    extra,
    active = false,
    origin;
  const identities = new Map();
  let problems = [];
  let previousFocus,
    selectedReference = '';
  /** Calcule la clé de l’écran logique, distincte de l’emplacement du fichier sur disque. */
  function pageKey() {
    return presentation === 'simple'
      ? document.querySelector('[data-space][aria-current="page"]')?.dataset.space || 'summary'
      : document.body.dataset.dashboardPage || location.pathname.split('/').at(-1) || 'index.html';
  }
  /** Calcule la référence d’un élément depuis ses rôles source et identités d’ancêtres. */
  function identify(node) {
    const parts = [];
    for (let current = node; current && current.nodeType === 1; current = current.parentElement) {
      const slot =
        current.dataset.reviewSlot || (current.id ? 'id:' + current.id : 'implicit:' + current.localName);
      const key = reviewEntity(current);
      parts.unshift(slot + (key ? ':' + key : ''));
      if (current === panel) break;
      if (current.localName === 'dialog' && current.dataset.reviewOrigin)
        parts.unshift('origin:' + current.dataset.reviewOrigin);
    }
    return reviewId(context.site, presentation, pageKey(), parts);
  }
  /** Recense les éléments courants et signale toute collision au lieu de la masquer par un suffixe. */
  function refresh() {
    identities.clear();
    problems = [];
    for (const node of document.querySelectorAll('*')) {
      const id = identify(node);
      if (identities.has(id))
        problems.push({
          slot: node.dataset.reviewSlot || node.localName,
          tag: node.localName,
          parent: node.parentElement?.dataset.reviewSlot,
          id
        });
      else identities.set(id, node);
      node.dataset.reviewId = id;
    }
    if (panel && selected?.isConnected) {
      const next = identify(selected);
      if (output.value === selectedReference) output.value = next;
      selectedReference = next;
    }
    return problems;
  }
  /** Prépare les métadonnées de contexte sans titres ni corps de tickets ni texte de recherche libre. */
  function reference() {
    if (!selected || !selected.isConnected) return { erreur: 'Élément absent du rendu courant.' };
    const controls = [...document.querySelectorAll('input, select')]
      .filter((node) => !panel?.contains(node))
      .map((node) => ({
        element: identify(node),
        valeur:
          node.localName === 'select' || ['checkbox', 'radio', 'date'].includes(node.type)
            ? node.type === 'checkbox'
              ? node.checked
              : node.value
            : node.value
              ? '[texte saisi omis]'
              : ''
      }));
    return {
      element: identify(selected),
      parent: selected.parentElement ? identify(selected.parentElement) : null,
      generation: context.generation,
      generateur: context.generator,
      snapshot: context.snapshot,
      capture: context.capturedAt,
      presentation,
      ecran: pageKey(),
      origine: selected.closest('dialog')?.dataset.reviewOrigin || null,
      controles: controls,
      etats: [...document.querySelectorAll('[data-review-state]')].map((node) => ({
        element: identify(node),
        etat: JSON.parse(node.dataset.reviewState)
      })),
      ...(extra?.checked
        ? { valeurVisible: selected.innerText?.slice(0, 500) || '', url: selected.getAttribute('href') || '' }
        : {})
    };
  }
  /** Sélectionne sans naviguer et conserve le focus du contenu examiné. */
  function select(node) {
    if (!node || panel?.contains(node)) return;
    selected?.removeAttribute('data-review-selected');
    selected = node;
    selected.dataset.reviewSelected = 'true';
    refresh();
    selectedReference = identify(node);
    if (output) output.value = selectedReference;
  }
  /** Crée un contrôle de l’inspecteur avec son propre rôle stable. */
  function control(tag, role, text, parent) {
    const node = markReview('review-ui-' + role, document.createElement(tag));
    if (text) node.textContent = text;
    if (parent) parent.append(node);
    return node;
  }
  /** Copie uniquement après une action explicite ; un échec laisse le texte sélectionnable. */
  async function copy(withContext) {
    const text = withContext ? JSON.stringify(reference(), null, 2) : output.value;
    if (!selected?.isConnected || problems.length) {
      status.textContent = 'Référence indisponible : aucune sélection ou collisions détectées.';
      return;
    }
    output.value = text;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Référence copiée.';
    } catch {
      output.focus();
      output.select();
      status.textContent = 'Copie automatique indisponible : utilisez Ctrl+C.';
    }
  }
  /** Ouvre ou ferme le mode de revue, accessible également au clavier et par URL. */
  function toggle(value = !active) {
    active = value;
    if (!panel) {
      panel = control('aside', 'panel');
      panel.setAttribute('aria-label', 'Revue du dashboard');
      panel.style.cssText =
        'position:fixed;right:8px;bottom:8px;width:min(420px,95vw);max-height:65vh;overflow:auto;z-index:2147483647;background:white;color:#182b40;border:2px solid #1758ae;padding:12px;box-shadow:0 2px 12px #0004;font:13px/1.4 sans-serif';
      control('h2', 'title', 'Revue du dashboard', panel);
      control(
        'p',
        'help',
        'Alt+clic : sélectionner. Alt+Maj+I : inspecter le focus. Remonter : sélectionner le conteneur.',
        panel
      );
      const label = control('label', 'label', 'Identifiant ou référence à retrouver', panel);
      output = control('textarea', 'reference', '', label);
      output.rows = 3;
      output.style.width = '100%';
      const buttons = [
        ['parent', 'Remonter', () => select(selected?.parentElement)],
        ['id', 'Copier l’identifiant', () => copy(false)],
        ['context', 'Copier le contexte', () => copy(true)],
        ['find', 'Retrouver', () => find(output.value)],
        ['close', 'Fermer la revue', () => toggle(false)]
      ];
      for (const [role, text, handler] of buttons) {
        const button = control('button', role, text, panel);
        button.type = 'button';
        button.addEventListener('click', handler);
      }
      const option = control('label', 'extra-label', ' Inclure la valeur visible et l’URL', panel);
      extra = control('input', 'extra', '', option);
      extra.type = 'checkbox';
      status = control('p', 'status', '', panel);
      status.setAttribute('role', 'status');
      const style = control('style', 'style');
      style.textContent =
        '[data-review-selected="true"]{outline:3px solid #c04600!important;outline-offset:2px!important}';
      panel.append(style);
    }
    if (active) {
      previousFocus = document.activeElement;
      (document.querySelector('dialog[open]') || document.body).append(panel);
      panel.hidden = false;
      refresh();
      output.focus();
      status.textContent = problems.length
        ? problems.length + ' collision(s) détectée(s).'
        : 'Sélectionnez un élément ; les références sont stables entre générations.';
    } else {
      panel.hidden = true;
      selected?.removeAttribute('data-review-selected');
      previousFocus?.focus?.();
    }
  }
  /** Retrouve uniquement une référence exacte ; un élément filtré est annoncé explicitement. */
  function find(id) {
    refresh();
    if (problems.length) {
      if (status) status.textContent = 'Recherche impossible : collisions détectées.';
      return false;
    }
    const node = identities.get(id.trim());
    if (!node) {
      if (status)
        status.textContent =
          'Référence absente du rendu courant : autre génération, écran ou page de résultats. Aucun autre élément sélectionné.';
      return false;
    }
    if (!node.getClientRects().length || node.closest('[hidden]')) {
      if (status) status.textContent = 'Élément présent mais masqué par les filtres ou la fenêtre fermée.';
      return false;
    }
    select(node);
    node.scrollIntoView({ block: 'center' });
    if (status) status.textContent = 'Élément retrouvé.';
    return true;
  }
  // La sélection au pointeur couvre aussi les contrôles désactivés, qui n’émettent pas de clic natif.
  document.addEventListener(
    'pointerdown',
    (event) => {
      if (active && event.altKey && !panel?.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        select(event.target);
      }
    },
    true
  );
  document.addEventListener(
    'click',
    (event) => {
      if (active && event.altKey && !panel?.contains(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
        select(event.target);
        return;
      }
      if (!panel?.contains(event.target)) {
        origin = identify(event.target.closest('button, a, input') || event.target);
      }
    },
    true
  );
  document.addEventListener(
    'keydown',
    (event) => {
      if (event.altKey && event.shiftKey && event.code === 'KeyR') {
        event.preventDefault();
        toggle();
      }
      if (event.altKey && event.shiftKey && event.code === 'KeyI') {
        event.preventDefault();
        const focused = document.activeElement;
        if (!active) toggle(true);
        select(focused);
      }
    },
    true
  );
  const observer = new MutationObserver((records) => {
    for (const dialog of document.querySelectorAll('dialog[open]')) {
      if (
        origin &&
        (!dialog.dataset.reviewOrigin ||
          records.some((record) => record.target === dialog && record.attributeName === 'open'))
      )
        dialog.dataset.reviewOrigin = origin;
      if (active && panel && !dialog.contains(panel)) dialog.append(panel);
    }
    if (active && panel && !document.querySelector('dialog[open]') && panel.closest('dialog'))
      document.body.append(panel);
    refresh();
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['open']
  });
  window.addEventListener('hashchange', refresh);
  window.dsqReview = { refresh, select, reference, find, toggle, id: identify, report: () => problems };
  refresh();
  if (new URLSearchParams(location.search).get('review') === '1') toggle(true);
}
