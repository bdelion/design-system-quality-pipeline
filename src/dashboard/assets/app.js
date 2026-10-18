import { contextKeys, contextualHref, currentContext, matchesRow, setContext } from './context.js';

const snapshot = window.__SNAPSHOT__;
const capturedAt = document.querySelector('[data-captured-at]');
const ruleVersion = document.querySelector('[data-rule-version]');
if (capturedAt) capturedAt.textContent = new Date(snapshot.capturedAt).toLocaleString('fr-FR');
if (ruleVersion) ruleVersion.textContent = snapshot.ruleVersion;

const links = new Map(
  [...document.querySelectorAll('a[href]')].map((link) => [link, link.getAttribute('href')])
);
const contextControls = [...document.querySelectorAll('[data-context-filter]')];
const controls = {
  text: document.querySelector('[data-filter]'),
  repository: document.querySelector('[data-filter-repository]'),
  criticality: document.querySelector('[data-filter-criticality]'),
  category: document.querySelector('[data-filter-category]'),
  status: document.querySelector('[data-filter-status]')
};

/** Teste le contexte courant d'une ligne, en combinaison avec ses filtres locaux. */
function matchesContext(row, fields) {
  return matchesRow(row, currentContext(), fields);
}

/** Filtre les lignes statiques ; l'explorateur Composants publie lui-même ses populations dynamiques. */
function applyFilters() {
  const params = currentContext();
  const query = (controls.text?.value || '').toLowerCase();
  document.querySelectorAll('[data-table-row]').forEach((row) => {
    row.hidden =
      !matchesContext(row) ||
      (!!query && !row.textContent.toLowerCase().includes(query)) ||
      (!!controls.repository?.value && row.dataset.repository !== controls.repository.value) ||
      (!!controls.criticality?.value && row.dataset.criticality !== controls.criticality.value) ||
      (!!controls.category?.value &&
        !(row.dataset.categories || '').split('|').includes(controls.category.value)) ||
      (!!controls.status?.value && row.dataset.status !== controls.status.value) ||
      (params.get('corrected') === 'true' && row.dataset.corrected !== 'true');
  });
  const text = document.querySelector('[data-component-filter]')?.value.toLowerCase() || '';
  const result =
    document.querySelector('[data-component-result]')?.value ||
    params.get('result') ||
    params.get('scope') ||
    '';
  document.querySelectorAll('[data-component-row]').forEach((row) => {
    row.hidden =
      !matchesContext(row) ||
      (!!text && !row.textContent.toLowerCase().includes(text)) ||
      (!!result && row.dataset.componentResult !== result && row.dataset.componentAudited !== result);
  });
  const verdict = document.querySelector('[data-component-version-verdict]')?.value || '';
  document.querySelectorAll('[data-component-version-row]').forEach((row) => {
    row.hidden = (!!verdict && row.dataset.verdict !== verdict) || !matchesContext(row);
  });
  document.querySelectorAll('[data-trace-row], [data-transition-row]').forEach((row) => {
    row.hidden = !matchesContext(row);
  });
  document.querySelectorAll('[data-audit-row]').forEach((row) => {
    row.hidden =
      !matchesContext(row) ||
      (Boolean(params.get('progress')) && row.dataset.progress !== params.get('progress')) ||
      (Boolean(params.get('result')) && row.dataset.auditResult !== params.get('result'));
  });
  const feedback = document.querySelector('[data-filter-feedback]');
  if (feedback && !document.querySelector('[data-component-analysis]')) {
    const visible = [
      ...document.querySelectorAll(
        '[data-table-row], [data-component-row], [data-component-version-row], [data-audit-row], [data-trace-row], [data-transition-row], #population [data-workspace-row]'
      )
    ].filter((row) => !row.hidden).length;
    feedback.textContent = `Repository : ${params.get('repository') || 'tous'} · ${visible} lignes visibles dans les tableaux de cette vue.`;
  }
}

/** Restaure les filtres URL, y compris une valeur inconnue, et transmet le périmètre aux liens internes. */
function synchronizeContext() {
  const params = currentContext();
  for (const control of contextControls) {
    const value = params.get(control.dataset.contextFilter) || '';
    if (value && ![...control.options].some((option) => option.value === value)) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = `Référence inconnue : ${value}`;
      control.append(option);
    }
    control.value = value;
  }
  if (controls.repository) controls.repository.value = params.get('repository') || '';
  for (const key of ['progress', 'result']) {
    const control = document.querySelector(`[data-audit-${key}-filter]`);
    if (control) control.value = params.get(key) || '';
  }
  for (const [link, original] of links) {
    const dimensions = /^(?:quality|index)\.html/.test(original)
      ? []
      : original.startsWith('history.html')
        ? ['repository']
        : ['repository', 'component', 'version'];
    const context = link.hasAttribute('data-workspace-nav')
      ? new URLSearchParams([...params].filter(([key]) => dimensions.includes(key)))
      : params;
    link.setAttribute('href', contextualHref(original, context));
  }
  applyFilters();
}
for (const control of contextControls) {
  for (const event of ['input', 'change'])
    control.addEventListener(event, () => setContext({ [control.dataset.contextFilter]: control.value }));
}
document
  .querySelector('[data-clear-context]')
  ?.addEventListener('click', () =>
    setContext(Object.fromEntries([...contextKeys, 'progress', 'result', 'scope'].map((key) => [key, ''])))
  );
window.addEventListener('dashboard-context-change', synchronizeContext);
window.addEventListener('popstate', synchronizeContext);
const params = currentContext();
for (const [key, control] of Object.entries(controls))
  if (control) control.value = params.get(key === 'text' ? 'q' : key) || '';
Object.values(controls)
  .filter(Boolean)
  .forEach((control) =>
    control.addEventListener('input', () => {
      if (control === controls.repository) setContext({ repository: control.value });
      applyFilters();
    })
  );
document.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
  Object.values(controls).forEach((control) => {
    if (control) control.value = '';
  });
  setContext({ repository: '', criticality: '', category: '', status: '', corrected: '', q: '' });
  applyFilters();
});
document
  .querySelectorAll('[data-component-filter], [data-component-result], [data-component-version-verdict]')
  .forEach((control) => control.addEventListener('input', applyFilters));
document.querySelector('[data-reset-component-filters]')?.addEventListener('click', () => {
  document.querySelectorAll('[data-component-filter], [data-component-result]').forEach((control) => {
    control.value = '';
  });
  setContext({ result: '', scope: '' });
  applyFilters();
});

/** Copie une proposition de catalogue et annonce le résultat sans écrire dans le repository. */
async function copyCatalogue(button) {
  const yaml = decodeURIComponent(button.dataset.copyYaml),
    feedback = button.nextElementSibling;
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(yaml);
    else {
      const textarea = document.createElement('textarea');
      textarea.value = yaml;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    button.textContent = 'YAML copié';
    if (feedback) feedback.textContent = 'Prêt à coller dans config/catalogue.yaml';
  } catch {
    if (feedback) feedback.textContent = 'Copie impossible dans ce navigateur';
  }
}
document
  .querySelectorAll('[data-copy-yaml]')
  .forEach((button) => button.addEventListener('click', () => copyCatalogue(button)));
synchronizeContext();
for (const key of ['progress', 'result'])
  document
    .querySelector(`[data-audit-${key}-filter]`)
    ?.addEventListener('input', (event) => setContext({ [key]: event.target.value }));
document
  .querySelector('[data-reset-audit-filters]')
  ?.addEventListener('click', () => setContext({ progress: '', result: '' }));
