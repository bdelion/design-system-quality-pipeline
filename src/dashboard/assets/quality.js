import { readPageModel } from './page-model.js';
import { currentContext, setContext } from './context.js';
import { paginate, updatePagination } from './pagination.js';
import { qualityMatches, qualityValues, qualityRowHtml } from './quality-presentation.js';
import { downloadCsv } from './csv.js';

const rows = readPageModel()?.data.quality;
const root = document.querySelector('#quality');
const controls = [...document.querySelectorAll('[data-quality-filter]')];
let page = 1;
let sort = -1;
let descending = false;
let filtered = [];

/** Filtre et trie tous les diagnostics avant de monter uniquement la page demandée. */
function render(reset = true) {
  if (!root || !rows) return;
  if (reset) page = 1;
  const params = currentContext();
  for (const control of controls) {
    const value = params.get(control.dataset.qualityFilter) || '';
    if (
      control.tagName === 'SELECT' &&
      value &&
      ![...control.options].some((option) => option.value === value)
    ) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = 'Référence inconnue : ' + value;
      control.append(option);
    }
    control.value = value;
  }
  filtered = rows.filter((row) => qualityMatches(row, params));
  if (sort >= 0)
    filtered.sort((left, right) => {
      const comparison = String(qualityValues(left)[sort]).localeCompare(
        String(qualityValues(right)[sort]),
        'fr',
        { numeric: true }
      );
      return (descending ? -1 : 1) * comparison || left.id.localeCompare(right.id, 'fr', { numeric: true });
    });
  const state = paginate(filtered, page);
  page = state.page;
  root.querySelector('[data-quality-rows]').innerHTML = state.rows.map(qualityRowHtml).join('');
  root.querySelector('[data-quality-count]').textContent = filtered.length;
  updatePagination(root.querySelector('[data-pagination]'), state);
}

if (root && rows) {
  for (const control of controls)
    for (const event of ['input', 'change'])
      control.addEventListener(event, () => setContext({ [control.dataset.qualityFilter]: control.value }));
  root
    .querySelector('[data-quality-reset]')
    .addEventListener('click', () =>
      setContext(Object.fromEntries(controls.map((control) => [control.dataset.qualityFilter, ''])))
    );
  root.querySelector('[data-page-previous]').addEventListener('click', () => {
    page--;
    render(false);
  });
  root.querySelector('[data-page-next]').addEventListener('click', () => {
    page++;
    render(false);
  });
  root.querySelectorAll('[data-quality-sort]').forEach((button) =>
    button.addEventListener('click', () => {
      const next = Number(button.dataset.qualitySort);
      descending = sort === next ? !descending : false;
      sort = next;
      root
        .querySelectorAll('[data-quality-sort]')
        .forEach((header) =>
          header.parentElement.setAttribute(
            'aria-sort',
            header === button ? (descending ? 'descending' : 'ascending') : 'none'
          )
        );
      render();
    })
  );
  root
    .querySelector('[data-quality-export]')
    .addEventListener('click', () =>
      downloadCsv('diagnostics-qualite.csv', [
        [
          'Règle',
          'Sévérité',
          'Repository',
          'Type d’entité',
          'Entité',
          'Diagnostic',
          'Action',
          'Métriques et impacts',
          'Identifiant diagnostic',
          'URL source',
          'Issue liée'
        ],
        ...filtered.map((row) => [...qualityValues(row), row.id, row.sourceUrl, row.issueId])
      ])
    );
  window.addEventListener('dashboard-context-change', () => render());
  window.addEventListener('popstate', () => render());
  render();
}
