const filter = document.querySelector('[data-map-filter]');
const kind = document.querySelector('[data-map-kind-filter]');
const reset = document.querySelector('[data-map-reset]');
const repositories = [...document.querySelectorAll('[data-map-repository]')];

function applyMapFilters() {
  const query = (filter?.value || '').toLowerCase().trim();
  const selectedKind = kind?.value || '';
  repositories.forEach((repository) => {
    const repositoryMatch = !query || repository.dataset.search.includes(query) || repository.textContent.toLowerCase().includes(query);
    const componentBlocks = [...repository.querySelectorAll('[data-map-component]')];
    let visibleComponent = false;
    componentBlocks.forEach((component) => {
      const componentMatch = !query || component.dataset.search.includes(query) || component.textContent.toLowerCase().includes(query);
      const nodes = [...component.querySelectorAll('[data-map-node]')];
      let visibleNode = false;
      nodes.forEach((node) => {
        const kindMatch = !selectedKind || node.dataset.mapKind === selectedKind;
        const textMatch = !query || node.textContent.toLowerCase().includes(query) || componentMatch;
        node.hidden = !(kindMatch && textMatch);
        if (!node.hidden) visibleNode = true;
      });
      component.hidden = !(componentMatch || visibleNode);
      if (!component.hidden) visibleComponent = true;
    });
    const repoKindMatch = !selectedKind || selectedKind === 'repository';
    repository.hidden = !(repoKindMatch || visibleComponent || repositoryMatch);
  });
}

[filter, kind].filter(Boolean).forEach((control) => control.addEventListener('input', applyMapFilters));
reset?.addEventListener('click', () => {
  if (filter) filter.value = '';
  if (kind) kind.value = '';
  applyMapFilters();
});
applyMapFilters();
