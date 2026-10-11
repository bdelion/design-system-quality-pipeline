import { currentContext, matchesRow } from './context.js';
const filter = document.querySelector('[data-map-filter]');
const kind = document.querySelector('[data-map-kind-filter]');
const reset = document.querySelector('[data-map-reset]');
const repositories = [...document.querySelectorAll('[data-map-repository]')];

/** Combine recherche, niveau et contexte ; un parent n'est visible que s'il contient une preuve visible. */
function applyMapFilters() {
  const query = (filter?.value || '').toLowerCase().trim(),
    selectedKind = kind?.value || '';
  const context = currentContext();
  repositories.forEach((repository) => {
    let visibleComponent = false;
    repository.querySelectorAll('[data-map-component]').forEach((component) => {
      let visibleNode = false;
      component.querySelectorAll('[data-map-node]').forEach((node) => {
        const kindMatch = !selectedKind || node.dataset.mapKind === selectedKind;
        const textMatch =
          !query ||
          node.textContent.toLowerCase().includes(query) ||
          component.dataset.search.includes(query);
        node.hidden = !(kindMatch && textMatch && matchesRow(node, context));
        if (!node.hidden) visibleNode = true;
      });
      component.hidden = !visibleNode;
      if (visibleNode) visibleComponent = true;
    });
    const repositoryNode = repository.querySelector('[data-map-kind="repository"]');
    const ownMatch =
      (!selectedKind || selectedKind === 'repository') &&
      (!query || repository.dataset.search.includes(query)) &&
      repositoryNode &&
      matchesRow(repositoryNode, context);
    repository.hidden = !(ownMatch || visibleComponent);
  });
}
[filter, kind].filter(Boolean).forEach((control) => control.addEventListener('input', applyMapFilters));
reset?.addEventListener('click', () => {
  if (filter) filter.value = '';
  if (kind) kind.value = '';
  applyMapFilters();
});
window.addEventListener('dashboard-context-change', applyMapFilters);
window.addEventListener('popstate', applyMapFilters);
applyMapFilters();
