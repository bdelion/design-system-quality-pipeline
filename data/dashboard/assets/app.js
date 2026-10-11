const snapshot = window.__SNAPSHOT__;
const capturedAt = document.querySelector('[data-captured-at]');
const ruleVersion = document.querySelector('[data-rule-version]');
if (capturedAt) capturedAt.textContent = new Date(snapshot.capturedAt).toLocaleString('fr-FR');
if (ruleVersion) ruleVersion.textContent = snapshot.ruleVersion;

const rows = [...document.querySelectorAll('[data-table] tr')];
// Un filtre contextuel absent des attributs de la ligne ne doit jamais être ignoré
// silencieusement : il s'agit d'une information non vérifiable.
const contextParams = new URLSearchParams(window.location.search);
function matchesContext(row, fields = ['repository', 'component', 'version']) {
  return fields.every((field) => {
    const expected = contextParams.get(field);
    return !expected || (row.hasAttribute('data-' + field) && row.getAttribute('data-' + field) === expected);
  });
}

const controls = {
  text: document.querySelector('[data-filter]'),
  repository: document.querySelector('[data-filter-repository]'),
  criticality: document.querySelector('[data-filter-criticality]'),
  category: document.querySelector('[data-filter-category]'),
  status: document.querySelector('[data-filter-status]')
};
function applyFilters() {
  const query = (controls.text?.value || '').toLowerCase();
  rows.forEach((row) => {
    const matches = (!query || row.textContent.toLowerCase().includes(query))
      && (!controls.repository?.value || row.dataset.repository === controls.repository.value)
      && (!controls.criticality?.value || row.dataset.criticality === controls.criticality.value)
      && (!controls.category?.value || row.dataset.categories.split('|').includes(controls.category.value))
      && (!controls.status?.value || row.dataset.status === controls.status.value)
      && matchesContext(row, ['repository']);
    row.hidden = !matches;
  });
}
const params = new URLSearchParams(window.location.search);
if (controls.repository && params.get('repository')) controls.repository.value = params.get('repository');
if (controls.text && params.get('q')) controls.text.value = params.get('q');
if (controls.criticality && params.get('criticality')) controls.criticality.value = params.get('criticality');
if (controls.category && params.get('category')) controls.category.value = params.get('category');
if (controls.status && params.get('status')) controls.status.value = params.get('status');
Object.values(controls).filter(Boolean).forEach((control) => control.addEventListener('input', applyFilters));
document.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
  Object.values(controls).forEach((control) => { if (control) control.value = ''; });
  applyFilters();
});
applyFilters();

// Transmet uniquement les filtres métier connus aux liens internes du dashboard.
// Les liens externes, ancres et téléchargements restent inchangés.
const sharedFilterKeys = ['repository', 'component', 'version'];
const context = new URLSearchParams();
sharedFilterKeys.forEach((key) => {
  const value = params.get(key);
  if (value) context.set(key, value);
});
const propagateContext = () => {
  const repository = controls.repository?.value || params.get('repository');
  if (repository) context.set('repository', repository);
  else context.delete('repository');
  document.querySelectorAll('a[href]').forEach((link) => {
    const raw = link.getAttribute('href');
    if (!raw || !/^(?:index|issues|anomalies|components|audits|graph|history)\.html(?:[?#]|$)/.test(raw)) return;
    const [withoutHash, hash = ''] = raw.split('#', 2);
    const [pathname, search = ''] = withoutHash.split('?', 2);
    const next = new URLSearchParams(search);
    context.forEach((value, key) => { next.set(key, value); });
    sharedFilterKeys.forEach((key) => { if (!context.has(key)) next.delete(key); });
    link.setAttribute('href', pathname + (next.size ? '?' + next.toString() : '') + (hash ? '#' + hash : ''));
  });
};
controls.repository?.addEventListener('change', propagateContext);
propagateContext();

document.querySelectorAll('[data-copy-yaml]').forEach((button) => {
  button.addEventListener('click', async () => {
    const yaml = decodeURIComponent(button.dataset.copyYaml);
    const feedback = button.nextElementSibling;
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
  });
});


const componentRows = [...document.querySelectorAll('[data-component-table] tr[data-component-row]')];
const componentText = document.querySelector('[data-component-filter]');
const componentResult = document.querySelector('[data-component-result]');
const applyComponentFilters = () => {
  const query = (componentText?.value || '').toLowerCase();
  const result = componentResult?.value || '';
  componentRows.forEach((row) => {
    const textMatch = !query || row.textContent.toLowerCase().includes(query);
    const resultMatch = !result || row.dataset.componentResult === result || (result === 'audited' && row.dataset.componentAudited === 'audited') || (result === 'not_audited' && row.dataset.componentAudited === 'not_audited');
    row.hidden = !(textMatch && resultMatch && matchesContext(row, ['repository', 'component']));
  });
};
[componentText, componentResult].filter(Boolean).forEach((control) => control.addEventListener('input', applyComponentFilters));
document.querySelector('[data-reset-component-filters]')?.addEventListener('click', () => { if (componentText) componentText.value = ''; if (componentResult) componentResult.value = ''; applyComponentFilters(); });
applyComponentFilters();

const componentVersionRows = [...document.querySelectorAll('[data-component-version-row]')];
const componentVersionVerdict = document.querySelector('[data-component-version-verdict]');
const applyComponentVersionFilter = () => {
  const verdict = componentVersionVerdict?.value || '';
  componentVersionRows.forEach((row) => { row.hidden = (Boolean(verdict) && row.dataset.verdict !== verdict) || !matchesContext(row); });
};
componentVersionVerdict?.addEventListener('input', applyComponentVersionFilter);
applyComponentVersionFilter();

// Le filtrage contextuel est combiné aux filtres locaux dans leurs fonctions respectives.

