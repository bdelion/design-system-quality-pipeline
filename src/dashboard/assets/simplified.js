import { startReview } from './review.js';
import { markReview } from './review-core.js';
import { downloadCsv } from './csv.js';
import { githubTargets } from './github-links.js';
/* Restitution de faits Analytics : filtres et tris précèdent toujours la pagination. */
const model = JSON.parse(document.getElementById('simplified-data').textContent);
const state = new Map();
const issueById = new Map(model.issues.map((issue) => [issue.id, issue]));
const content = document.getElementById('content');
const form = document.getElementById('context');
const spaces = {
  summary: ['priorities'],
  components: ['component-activity', 'components'],
  activity: ['activity'],
  team: ['repositories', 'delays'],
  versions: ['campaigns', 'audit-criticality', 'audit-category', 'audit-component']
};
const labels = {
  summary: 'Que faut-il faire maintenant ?',
  components: 'Composants',
  activity: 'Activité des équipes',
  team: 'Repositories et équipe',
  versions: 'Audits par version'
};
let space = 'summary';
let detailRows = [];
let detailPage = 0;
let detailSize = 25;
/** Crée un élément et insère du texte sans interpréter de HTML source. */
function element(tag, text, parent) {
  const node = markReview('s1w', document.createElement(tag));
  if (text !== undefined) node.textContent = text;
  if (parent) parent.append(node);
  return node;
}
/** Formate les valeurs inconnues et numériques sans masquer les vrais zéros. */
function display(value) {
  return value === null
    ? 'Indisponible'
    : typeof value === 'number'
      ? new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(value)
      : String(value);
}
/** Accepte uniquement les liens web sources, sans protocoles exécutables. */
function sourceLink(url, label, parent) {
  if (!url || !/^https?:\/\//i.test(url)) return;
  const link = markReview('s1x', element('a', label, parent));
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
}
/** Ajoute au seul en-tête une destination GitHub, ou explique son indisponibilité. */
function githubLinks(cell, title, parent, note, options = {}) {
  const refs = [...new Set(cell.refs || [])];
  const result = githubTargets(
    refs.map((id) => issueById.get(id) || { url: '' }),
    {
      ...options,
      universe: model.issues,
      allowBroader: options.allowBroader ?? true
    }
  );
  const direct = result.links.length === 1 && !result.links[0].search;
  let url = result.links[0]?.url;
  let approximate = result.approximate;
  if (
    options.allowBroader !== false &&
    !direct &&
    cell.url &&
    /^https:\/\/[^/@?#\s]+\/[^/]+\/[^/]+\/(issues|pulls|labels)(?:\?|$)/.test(cell.url)
  ) {
    const source = new window.URL(cell.url);
    if (!source.searchParams.has('q'))
      source.searchParams.set('q', source.pathname.endsWith('/pulls') ? 'is:pr' : 'is:issue');
    url = source.href;
    approximate = Boolean(cell.searchApproximate);
  }
  const projectView =
    cell.url &&
    /^https:\/\/[^/@?#\s]+\/(orgs|users)\/[\w.-]+\/projects\/[1-9]\d*\/views\/[1-9]\d*\?/.test(cell.url);
  if (projectView && options.allowBroader !== false) {
    url = cell.url;
    approximate = true;
  }
  if (url) {
    sourceLink(url, 'Ouvrir dans GitHub ↗', parent);
    const link = parent.lastElementChild;
    link.className = 'github-shortcut';
    link.setAttribute(
      'aria-label',
      'Ouvrir dans GitHub — ' +
        title +
        (approximate ? ' — recherche élargie au composant ou au dépôt' : '') +
        ' — nouvel onglet'
    );
    if (approximate)
      markReview(
        's1y',
        element(
          'span',
          ' Recherche GitHub élargie au composant ou au dépôt : elle peut contenir des issues absentes de cette liste. La liste locale et son CSV conservent la sélection exacte.',
          note
        )
      );
    if (!direct)
      markReview(
        's1z',
        element(
          'span',
          ' La recherche GitHub affiche l’état actuel ; la liste locale conserve les faits du snapshot.',
          note
        )
      );
  } else {
    markReview('s20', element('span', 'Accès GitHub indisponible', parent)).className = 'unavailable';
    markReview(
      's21',
      element(
        'span',
        ' ' + (result.reason || 'Aucune destination GitHub disponible pour cette sélection.'),
        note
      )
    );
  }
  if (!url && options.allowBroader === false)
    markReview(
      'review-measurable-limit',
      element(
        'span',
        ' La cohorte de délais mesurables ne peut pas être reproduite par ces filtres GitHub. La liste locale et son CSV conservent exactement les issues mesurables.',
        note
      )
    );
  if (result.stateMismatch)
    markReview(
      's22',
      element(
        'span',
        options.requireState
          ? ' La recherche GitHub est limitée aux issues ouvertes ; elle peut différer des statuts Project du snapshot.'
          : ' Le statut Project diffère de l’état GitHub : aucun filtre d’état réducteur n’est ajouté.',
        note
      )
    );
  return result;
}
/** Expose les éléments exacts d’une cellule, paginés sur place. */
function details(cell, title, options = {}) {
  detailRows = (cell.refs || []).map((id) => issueById.get(id)).filter(Boolean);
  detailPage = 0;
  document.getElementById('detail-title').textContent = title;
  const note = document.getElementById('detail-note');
  note.replaceChildren();
  markReview(
    's23',
    element(
      'span',
      cell.note ||
        (cell.value === null
          ? 'Population indisponible.'
          : 'Les liens ouvrent les sources GitHub ; leur état actuel peut différer du snapshot.'),
      note
    )
  );
  if (!document.getElementById('detail-actions')) {
    // Regroupe les actions sur la ligne du titre, conformément à la maquette A.
    const detailHeader = markReview('s24', element('div'));
    detailHeader.className = 'detail-header';
    const detailActions = markReview('s25', element('div'));
    detailActions.id = 'detail-actions';
    detailActions.setAttribute('role', 'group');
    detailActions.setAttribute('aria-label', 'Actions de la fenêtre');
    detailHeader.append(
      document.getElementById('detail-title'),
      detailActions,
      document.getElementById('close-detail')
    );
    document.getElementById('detail').prepend(detailHeader);
  }
  const actions = document.getElementById('detail-actions');
  actions.replaceChildren();
  githubLinks(cell, title, actions, note, { directSingle: !cell.url, matchLabels: true, ...options });
  if (['Issues Done', 'Issues Cancelled'].includes(title) && !cell.url)
    element(
      'span',
      ' Le filtre Project du composant n’est pas disponible : vérifier GITHUB_PROJECT_* dans .env et le label source du composant. Aucun filtre Closed ne remplace Done ou Cancelled.',
      note
    );
  renderDetails();
  document.getElementById('detail').showModal();
}
/** Affiche la liste exacte de preuves sans fabriquer de lien à partir d’un identifiant anonymisé. */
function renderDetails() {
  const target = document.getElementById('detail-content');
  target.dataset.reviewState = JSON.stringify({ page: detailPage + 1, size: detailSize });
  target.replaceChildren();
  const tools = markReview('s26', element('div', undefined, target));
  tools.className = 'details-tools';
  const exportButton = markReview('s27', element('button', 'Exporter les issues en CSV', tools));
  exportButton.type = 'button';
  exportButton.addEventListener('click', () =>
    downloadCsv('issues-associees.csv', [
      [
        'Repository',
        'Issue',
        'État GitHub',
        'Traitement',
        'Création',
        'URL GitHub',
        'Signalements',
        'Délai correction (j)',
        'Source du délai',
        'Début',
        'Fin'
      ],
      ...detailRows.map((issue) => [
        issue.repository,
        issue.title,
        issue.state,
        issue.correction,
        issue.createdAt,
        issue.url,
        issue.warnings.join(' ; '),
        issue.processing?.value ?? '',
        issue.processing?.source ?? '',
        issue.processing?.start ?? '',
        issue.processing?.end ?? ''
      ])
    ])
  );
  const table = markReview('s28', element('table'));
  if (detailRows.length) target.append(table);
  const head = markReview(
    's29',
    element('tr', undefined, markReview('s2a', element('thead', undefined, table)))
  );
  for (const [field, label] of [
    ['issue', 'Issue'],
    ['github', 'GitHub'],
    ['correction', 'Traitement'],
    ['warnings', 'Signalements']
  ]) {
    const th = markReview('s2b', element('th', label, head));
    th.scope = 'col';
    th.dataset.reviewKey = field;
  }
  if (detailRows.some((issue) => issue.processing)) {
    const th = markReview(
      'review-processing-header',
      element('th', 'Délai de correction — bornes et provenance', head)
    );
    th.scope = 'col';
  }
  const body = markReview('s2c', element('tbody', undefined, table));
  for (const issue of detailRows.slice(detailPage * detailSize, (detailPage + 1) * detailSize)) {
    const tr = markReview('s2d', element('tr', undefined, body));
    tr.dataset.reviewKey = issue.id;
    const td = markReview('s2e', element('td', undefined, tr));
    if (issue.url) sourceLink(issue.url, issue.title + ' ↗', td);
    else markReview('s2f', element('span', issue.title + ' — lien indisponible', td));
    markReview('s2g', element('td', issue.state, tr));
    markReview('s2h', element('td', issue.correction, tr));
    markReview('s2i', element('td', issue.warnings.join(' ; ') || 'Aucun signalement métier', tr));
    if (detailRows.some((item) => item.processing))
      markReview(
        'review-processing-value',
        element(
          'td',
          issue.processing
            ? display(issue.processing.value) +
                ' j · ' +
                (issue.processing.source === 'project' ? 'Project' : 'Repli GitHub') +
                ' · ' +
                (issue.processing.start || 'début inconnu') +
                ' → ' +
                (issue.processing.end || 'fin inconnue')
            : 'Non applicable',
          tr
        )
      );
  }
  if (!detailRows.length)
    markReview(
      's2j',
      element(
        'p',
        'Aucun élément source individuel disponible dans ce snapshot. Utilisez la recherche GitHub lorsqu’elle est proposée ; un compteur de PR ne contient pas une liste d’issues.',
        target
      )
    );
  pager(
    document.getElementById('detail-pagination'),
    detailRows.length,
    detailPage,
    detailSize,
    (page, size) => {
      detailPage = page;
      detailSize = size;
      renderDetails();
    }
  );
}
/** Construit un contrôle de pagination et annonce la population filtrée. */
function pager(target, count, page, size, change) {
  target.replaceChildren();
  const total = Math.max(1, Math.ceil(count / size));
  for (const [action, name, value] of [
    ['first', 'Première', 0],
    ['previous', 'Précédente', page - 1],
    ['next', 'Suivante', page + 1],
    ['last', 'Dernière', total - 1]
  ]) {
    const button = markReview('s2k', element('button', name, target));
    button.type = 'button';
    button.dataset.reviewKey = action;
    button.disabled = value < 0 || value >= total || value === page;
    button.addEventListener('click', () => change(value, size));
  }
  const info = markReview(
    's2l',
    element(
      'span',
      count ? 'Page ' + (page + 1) + ' / ' + total + ' · ' + count + ' résultats' : '0 résultat',
      target
    )
  );
  info.setAttribute('aria-live', 'polite');
  const label = markReview('s2m', element('label', 'Lignes par page ', target));
  const select = markReview('s2n', element('select', undefined, label));
  for (const n of [10, 25, 50, 100]) {
    const option = markReview('s2o', element('option', String(n), select));
    option.value = n;
    option.selected = size === n;
  }
  select.addEventListener('change', () => change(0, Number(select.value)));
}
/** Compare numériquement ou textuellement, en maintenant les inconnus à la fin. */
function compare(a, b, direction) {
  if (a === null || b === null) return a === b ? 0 : a === null ? 1 : -1;
  return (
    direction *
    (typeof a === 'number' && typeof b === 'number'
      ? a - b
      : String(a).localeCompare(String(b), 'fr', { numeric: true, sensitivity: 'base' }))
  );
}
/** Filtre contexte et population avant tri, pagination et export, sans recalcul métier. */
function selected(table, local) {
  const repo = form.elements.repository.value;
  const version = form.elements.version.value.toLowerCase();
  return table.rows
    .filter(
      (row) =>
        (!repo || row.repository === repo) &&
        (!version ||
          ['repositories', 'delays', 'component-activity'].includes(table.id) ||
          row.version.toLowerCase().includes(version)) &&
        row.cells.some((cell) => display(cell.value).toLowerCase().includes(local.search.toLowerCase())) &&
        (!table.populationColumns || Number(row.cells[local.population ?? 3]?.value) > 0) &&
        (!local.from || String(row.cells.at(-1)?.value) >= local.from) &&
        (!local.to || String(row.cells.at(-1)?.value) < local.to + 'T99')
    )
    .sort((a, b) =>
      compare(
        (a.cells[local.sort]?.sortValue !== undefined
          ? a.cells[local.sort].sortValue
          : a.cells[local.sort]?.value) ?? null,
        (b.cells[local.sort]?.sortValue !== undefined
          ? b.cells[local.sort].sortValue
          : b.cells[local.sort]?.value) ?? null,
        local.direction
      )
    );
}
/** Installe les tableaux ; les répartitions commencent par Total décroissant, avant pagination et export. */
function mount(table) {
  const local = state.get(table.id) || {
    page: 0,
    size: 25,
    search: '',
    sort: table.populationColumns ? 3 : 0,
    direction: table.populationColumns ? -1 : 1,
    from: '',
    to: ''
  };
  state.set(table.id, local);
  const panel = markReview('s2p', element('section', undefined, content));
  panel.className = 'panel';
  panel.dataset.tableId = table.id;
  markReview('s2q', element('h2', table.title, panel));
  markReview('s2r', element('p', table.description, panel)).className = 'description';
  const tools = markReview('s2s', element('div', undefined, panel));
  tools.className = 'toolbar';
  if (table.populationColumns) {
    const populationLabel = markReview(
      'review-population-label',
      element('label', 'Population représentée', tools)
    );
    const population = markReview('review-population-select', element('select', undefined, populationLabel));
    for (const index of table.populationColumns) {
      const option = markReview(
        'review-population-option',
        element('option', table.headers[index], population)
      );
      option.dataset.reviewKey = index;
      option.value = index;
      option.selected = index === Number(local.population ?? 3);
    }
    population.addEventListener('change', () => {
      local.population = Number(population.value);
      local.page = 0;
      draw();
    });
  }
  const label = markReview('s2t', element('label', 'Filtrer ce tableau', tools));
  const search = markReview('s2u', element('input', undefined, label));
  search.type = 'search';
  search.value = local.search;
  search.placeholder = 'Toutes les lignes';
  const sortLabel = markReview('s2v', element('label', 'Trier par', tools));
  const sort = markReview('s2w', element('select', undefined, sortLabel));
  sort.setAttribute('aria-label', 'Trier par');
  table.headers.forEach((name, index) => {
    const option = markReview('s2x', element('option', name, sort));
    option.value = index;
    option.selected = index === local.sort;
  });
  const orderLabel = markReview('s2y', element('label', 'Ordre', tools));
  const order = markReview('s2z', element('select', undefined, orderLabel));
  order.setAttribute('aria-label', 'Ordre');
  for (const [name, value] of [
    ['Croissant', 1],
    ['Décroissant', -1]
  ]) {
    const option = markReview('s30', element('option', name, order));
    option.value = value;
    option.selected = value === local.direction;
  }
  if (table.id === 'activity')
    for (const [name, key] of [
      ['Créées à partir du', 'from'],
      ['Créées jusqu’au', 'to']
    ]) {
      const dateLabel = markReview('s31', element('label', name, tools));
      const date = markReview('s32', element('input', undefined, dateLabel));
      date.type = 'date';
      dateLabel.dataset.reviewKey = key;
      date.value = local[key];
      date.addEventListener('input', () => {
        local[key] = date.value;
        local.page = 0;
        draw();
      });
    }
  const exportButton = markReview('s33', element('button', 'Exporter en CSV', tools));
  exportButton.type = 'button';
  exportButton.className = 'export';
  exportButton.addEventListener('click', () => {
    const rows = selected(table, local);
    panel.dataset.reviewState = JSON.stringify({
      page: local.page + 1,
      size: local.size,
      sort: local.sort,
      direction: local.direction,
      from: local.from,
      to: local.to,
      population: local.population
    });
    downloadCsv(table.id + '.csv', [
      [...table.headers, 'Issues associées', 'URL GitHub'],
      ...rows.map((row) => {
        const sources = [...new Set(row.cells.flatMap((cell) => cell.refs || []))]
          .map((id) => issueById.get(id))
          .filter(Boolean);
        return [
          ...row.cells.map((cell) => display(cell.value)),
          sources.map((issue) => issue.title).join(' | '),
          [
            ...new Set(
              [...sources.map((issue) => issue.url), ...row.cells.map((cell) => cell.url)].filter(Boolean)
            )
          ].join(' | ')
        ];
      })
    ]);
  });
  const reset = markReview('s34', element('button', 'Réinitialiser', tools));
  reset.type = 'button';
  reset.addEventListener('click', () => {
    state.delete(table.id);
    render();
  });
  const scroll = markReview('s35', element('div', undefined, panel));
  scroll.className = 'scroll';
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', table.title);
  const grid = markReview('s36', element('table', undefined, scroll));
  const headers = markReview(
    's37',
    element('tr', undefined, markReview('s38', element('thead', undefined, grid)))
  );
  const body = markReview('s39', element('tbody', undefined, grid));
  const pagination = markReview('s3a', element('div', undefined, panel));
  pagination.className = 'pager';
  table.headers.forEach((name, index) => {
    const th = markReview('s3b', element('th', undefined, headers));
    th.scope = 'col';
    th.dataset.reviewKey = 'field:' + index;
    const button = markReview('s3c', element('button', name + ' ↕', th));
    button.type = 'button';
    button.addEventListener('click', () => {
      local.direction = local.sort === index ? -local.direction : 1;
      local.sort = index;
      sort.value = index;
      order.value = local.direction;
      local.page = 0;
      draw();
    });
  });
  /** Rafraîchit les lignes visibles en préservant le focus du champ actif. */
  function draw() {
    const rows = selected(table, local);
    panel.dataset.reviewState = JSON.stringify({
      page: local.page + 1,
      size: local.size,
      sort: local.sort,
      direction: local.direction,
      from: local.from,
      to: local.to
    });
    local.page = Math.min(local.page, Math.max(0, Math.ceil(rows.length / local.size) - 1));
    body.replaceChildren();
    Array.from(headers.children).forEach((th, index) =>
      th.setAttribute(
        'aria-sort',
        index === local.sort ? (local.direction === 1 ? 'ascending' : 'descending') : 'none'
      )
    );
    for (const row of rows.slice(local.page * local.size, (local.page + 1) * local.size)) {
      const tr = markReview('s3d', element('tr', undefined, body));
      tr.dataset.reviewKey = row.reviewKey;
      row.cells.forEach((cell, index) => {
        const td = markReview('s3e', element('td', undefined, tr));
        td.dataset.reviewKey = 'field:' + index;
        if (table.populationColumns && index === Number(local.population ?? 3)) {
          const meter = markReview('review-distribution-meter', element('meter', undefined, td));
          meter.min = 0;
          meter.max = Math.max(1, ...rows.map((item) => Number(item.cells[index].value)));
          meter.value = Number(cell.value);
          meter.setAttribute('aria-label', row.cells[2].value + ' — ' + table.headers[index]);
        }
        const labelRefs =
          typeof cell.value === 'string' && !cell.refs && !cell.url
            ? [...new Set(row.cells.flatMap((item) => item.refs || []))]
            : undefined;
        const presented = labelRefs?.length
          ? { ...cell, refs: labelRefs, note: cell.note || 'Issues associées à cette ligne.' }
          : cell;
        if (presented.refs || presented.url || presented.note) {
          const button = markReview('s3f', element('button', undefined, td));
          markReview('review-cell-value', element('span', display(cell.value), button));
          button.type = 'button';
          button.addEventListener('click', () =>
            details(
              presented,
              table.headers[index],
              table.id === 'component-activity' && index === 3
                ? { state: 'open', requireState: true, directSingle: false }
                : table.id === 'component-activity' && [6, 7, 8, 11].includes(index)
                  ? { allowBroader: false }
                  : space === 'versions'
                    ? { matchLabels: false }
                    : {}
            )
          );
        } else markReview('s3g', element('span', display(cell.value), td));
      });
    }
    if (!rows.length) {
      const td = markReview(
        's3h',
        element('td', 'Aucun résultat pour ces filtres.', markReview('s3i', element('tr', undefined, body)))
      );
      td.colSpan = table.headers.length;
    }
    pager(pagination, rows.length, local.page, local.size, (page, size) => {
      local.page = page;
      local.size = size;
      draw();
    });
  }
  search.addEventListener('input', () => {
    local.search = search.value;
    local.page = 0;
    draw();
  });
  sort.addEventListener('change', () => {
    local.sort = Number(sort.value);
    local.page = 0;
    draw();
  });
  order.addEventListener('change', () => {
    local.direction = Number(order.value);
    local.page = 0;
    draw();
  });
  draw();
}
/** Affiche uniquement les espaces demandés avec un contexte visible et partagé. */
function render() {
  form.elements.version.disabled = space === 'team';
  content.replaceChildren();
  document.getElementById('heading').textContent = labels[space];
  document.getElementById('scope').textContent =
    (form.elements.repository.value || 'Tous les repositories') +
    ' · ' +
    (space === 'team'
      ? 'Toutes dates et versions — stocks et délais'
      : form.elements.version.value || 'Toutes les versions');
  document.querySelectorAll('[data-space]').forEach((link) => {
    if (link.dataset.space === space) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  if (space === 'summary') {
    const table = model.tables.find((item) => item.id === 'components');
    const rows = selected(table, { search: '', sort: 0, direction: 1 });
    const cards = markReview('s3j', element('div', undefined, content));
    cards.className = 'cards summary-cards';
    for (const [role, title, value, link] of [
      [
        'components-review',
        'Composants à examiner',
        selected(
          model.tables.find((item) => item.id === 'priorities'),
          { search: '', sort: 0, direction: 1 }
        ).length,
        'components'
      ],
      [
        'confirmed-corrections',
        'Corrections d’accessibilité confirmées',
        rows.some((row) => row.cells[3].value === null)
          ? null
          : rows.reduce((sum, row) => sum + Number(row.cells[3].value), 0),
        'components'
      ],
      [
        'bugs-without-audit',
        'Bugs sans audit',
        rows.some((row) => row.cells[4].value === null)
          ? null
          : rows.reduce((sum, row) => sum + Number(row.cells[4].value), 0),
        'activity'
      ]
    ]) {
      const card = markReview('s3k', element('section', undefined, cards));
      card.className = 'panel';
      card.dataset.reviewKey = role;
      card.title =
        title === 'Composants à examiner'
          ? 'Nombre de composants à examiner.'
          : 'Occurrences par composant ; une issue peut concerner plusieurs composants.';
      markReview('s3l', element('h2', title, card));
      const metric = markReview('s3m', element('button', undefined, card));
      markReview('review-card-value', element('span', display(value), metric));
      metric.type = 'button';
      metric.className = 'card-metric';
      const index = title.startsWith('Corrections') ? 3 : 4;
      const references =
        title === 'Composants à examiner'
          ? selected(
              model.tables.find((item) => item.id === 'priorities'),
              { search: '', sort: 0, direction: 1 }
            ).flatMap((row) => row.cells[0].refs || [])
          : rows.flatMap((row) => row.cells[index].refs || []);
      const cardCell = {
        value,
        refs: [...new Set(references)],
        note:
          title === 'Composants à examiner'
            ? 'Ce compteur représente des composants ; voici leurs issues associées.'
            : 'Occurrences par composant ; la liste ci-dessous déduplique les issues multi-composants.'
      };
      metric.addEventListener('click', () => details(cardCell, title));
      const anchor = markReview('s3n', element('a', 'Voir →', card));
      anchor.setAttribute('aria-label', 'Voir : ' + title);
      anchor.href = '#' + link;
    }
  }
  for (const id of spaces[space]) {
    const table = model.tables.find((item) => item.id === id);
    if (table) mount(table);
  }
}
/** Restaure l’espace demandé par un lien ou par l’historique du navigateur. */
function navigate() {
  space = Object.hasOwn(spaces, window.location.hash.slice(1)) ? window.location.hash.slice(1) : 'summary';
  render();
}
form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('input', () => {
  state.forEach((value) => (value.page = 0));
  render();
});
form.addEventListener('reset', () => {
  window.setTimeout(() => {
    state.clear();
    render();
  }, 0);
});
document
  .getElementById('close-detail')
  .addEventListener('click', () => document.getElementById('detail').close());
window.addEventListener('hashchange', navigate);
navigate();

/** Maintient le contenu et le focus sous la hauteur réelle du bandeau, y compris au zoom. */
function updateStickyHeight() {
  const height = document.querySelector('.sticky-shell')?.getBoundingClientRect().height || 0;
  document.documentElement.style.setProperty('--sticky-height', height + 8 + 'px');
}
if (window.ResizeObserver) {
  const observer = new window.ResizeObserver(updateStickyHeight);
  observer.observe(document.querySelector('.sticky-shell'));
}
updateStickyHeight();

startReview('simple');
