export const pageSize = 50;

/**
 * Borne une page sans tronquer la population utilisée par les filtres, tris ou exports.
 * @template T
 * @param {T[]} rows - Population complète à découper pour le rendu.
 */
export function paginate(rows, requested = 1) {
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.max(1, Math.min(pages, Number.isFinite(requested) ? Math.floor(requested) : 1));
  return {
    rows: rows.slice((page - 1) * pageSize, page * pageSize),
    page,
    pages,
    total: rows.length,
    start: rows.length ? (page - 1) * pageSize + 1 : 0,
    end: Math.min(page * pageSize, rows.length)
  };
}

/** Produit des contrôles stables, conservés lors du remplacement des lignes du tableau. */
export function paginationContent(kind) {
  return `<nav data-review-slot="s13" class="issue-actions" data-pagination="${kind}" aria-label="Pagination ${kind === 'issues' ? 'des issues' : kind === 'quality-causes' ? 'des causes DQ' : 'des diagnostics'}"><button data-review-slot="s14" type="button" data-page-previous disabled>Précédent</button><span data-review-slot="s15" data-page-range role="status" aria-live="polite" tabindex="-1">Pagination indisponible</span><button data-review-slot="s16" type="button" data-page-next disabled>Suivant</button></nav>`;
}

/** Actualise le compteur et maintient le focus utilisable lorsqu’un bouton devient indisponible. */
export function updatePagination(root, state) {
  root.dataset.reviewState = JSON.stringify({ page: state.page, size: pageSize });
  const previous = root.querySelector('[data-page-previous]');
  const next = root.querySelector('[data-page-next]');
  const range = root.querySelector('[data-page-range]');
  const active = document.activeElement;
  previous.disabled = state.page <= 1;
  next.disabled = state.page >= state.pages;
  range.textContent = `${state.start}–${state.end} sur ${state.total} · Page ${state.page}/${state.pages}`;
  if ((active === previous || active === next) && active.disabled)
    (previous.disabled ? (next.disabled ? range : next) : previous).focus();
}
