const graphFilter = document.querySelector('[data-graph-filter]');
const graphNodes = [...document.querySelectorAll('[data-graph-node]')];
if (graphFilter) {
  graphFilter.addEventListener('input', () => {
    const query = graphFilter.value.toLowerCase();
    graphNodes.forEach((node) => { node.hidden = Boolean(query) && !node.textContent.toLowerCase().includes(query); });
  });
}
