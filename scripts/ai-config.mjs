import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

/** Extrait les titres D/Q et leurs lignes réelles sans modifier leurs identifiants. */
export function decisionEntries(registry) {
  return registry
    .split(/\r?\n/)
    .flatMap((line, index) =>
      /^#{1,6}\s+[DQ]-\d+\b/.test(line) ? [{ line: index + 1, title: line.replace(/^#+\s+/, '').trim() }] : []
    );
}

/** Produit un index déterministe, non normatif et régénérable depuis le registre. */
export function renderDecisionIndex(registry) {
  return (
    '# Index de recherche des décisions et questions\n\nIndex non normatif généré depuis le registre. Rechercher le titre ou l’ID, puis lire\nle texte source et son statut. Les lignes sont indicatives ; régénérer cet index\naprès toute modification du registre avec `npm run ai:index:update`.\n\nSource : `docs/00-cadrage/questions-ouvertes.md` depuis la racine.\n\n| Ligne initiale | Titre |\n| --- | --- |\n' +
    decisionEntries(registry)
      .map(({ line, title }) => `| ${line} | ${title.replaceAll('|', '\\|')} |`)
      .join('\n') +
    '\n'
  );
}

/** Recense uniquement les fichiers du kit demandé, sans explorer les datasets ni les secrets. */
function filesUnder(root, directory) {
  const target = path.join(root, directory);
  if (!fs.existsSync(target)) return [];
  return fs
    .readdirSync(target, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? filesUnder(root, path.join(directory, entry.name))
        : entry.isFile()
          ? [path.join(directory, entry.name)]
          : []
    );
}

/** Vérifie le kit IA local et retourne tous les diagnostics sans modifier les fichiers. */
export function checkAiConfiguration(root) {
  const errors = [];
  /** Lit une source attendue et signale une absence plutôt que d'inventer son contenu. */
  const read = (file) => {
    try {
      return fs.readFileSync(path.join(root, file), 'utf8');
    } catch {
      errors.push(`${file} : fichier absent ou illisible`);
      return '';
    }
  };
  /** Transforme une erreur de syntaxe JSON en diagnostic exploitable. */
  const json = (file) => {
    try {
      return JSON.parse(read(file));
    } catch {
      errors.push(`${file} : JSON invalide`);
      return undefined;
    }
  };
  /** Transforme une erreur de syntaxe YAML en diagnostic exploitable. */
  const yaml = (file, text) => {
    try {
      return YAML.parse(text);
    } catch {
      errors.push(`${file} : YAML invalide`);
      return undefined;
    }
  };
  /** Exige un frontmatter YAML pour une skill ou une instruction ciblée. */
  const frontmatter = (file) => {
    const match = read(file).match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) {
      errors.push(`${file} : frontmatter YAML absent`);
      return undefined;
    }
    return yaml(file, match[1]);
  };
  const packageJson = json('package.json');
  const taskConfig = json('.vscode/tasks.json');
  if (taskConfig?.version !== '2.0.0' || !Array.isArray(taskConfig?.tasks))
    errors.push('.vscode/tasks.json : structure de tâches invalide');
  const labels = new Set();
  for (const task of Array.isArray(taskConfig?.tasks) ? taskConfig.tasks : []) {
    const label = task?.label ?? '(sans label)';
    if (typeof task?.label !== 'string' || !task.label.trim() || labels.has(label))
      errors.push(`Tâche ${label} : label absent ou dupliqué`);
    labels.add(label);
    if (
      task?.type !== 'process' ||
      task?.command !== 'npm' ||
      !Array.isArray(task?.args) ||
      task?.args?.[0] !== 'run' ||
      typeof task?.args?.[1] !== 'string' ||
      !Object.hasOwn(packageJson?.scripts ?? {}, task?.args?.[1] ?? '')
    )
      errors.push(`Tâche ${label} : commande ou script npm invalide`);
    if (task?.windows?.command !== 'npm.cmd')
      errors.push(`Tâche ${label} : commande Windows npm.cmd absente`);
    if (task?.options?.cwd !== '${workspaceFolder}')
      errors.push(`Tâche ${label} : répertoire workspaceFolder absent`);
  }
  const skillFiles = filesUnder(root, '.agents/skills');
  const names = new Set();
  const manifests = skillFiles.filter((file) => path.basename(file) === 'SKILL.md');
  if (!manifests.length) errors.push('Aucune skill de projet trouvée');
  for (const file of manifests) {
    const meta = frontmatter(file);
    if (
      typeof meta?.name !== 'string' ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.name) ||
      meta.name !== path.basename(path.dirname(file)) ||
      names.has(meta.name) ||
      typeof meta.description !== 'string' ||
      !meta.description.trim()
    )
      errors.push(`${file} : métadonnées de skill invalides`);
    names.add(meta?.name);
    const metadataFile = path.join(path.dirname(file), 'agents/openai.yaml');
    if (fs.existsSync(path.join(root, metadataFile))) {
      const ui = yaml(metadataFile, read(metadataFile))?.interface;
      if (
        typeof ui?.display_name !== 'string' ||
        !ui.display_name.trim() ||
        typeof ui?.short_description !== 'string' ||
        ui.short_description.length < 1 ||
        ui.short_description.length > 64 ||
        typeof ui?.default_prompt !== 'string' ||
        !ui.default_prompt.includes('$' + meta?.name)
      )
        errors.push(`${metadataFile} : interface ou invocation de skill invalide`);
    }
  }
  const instructionFiles = filesUnder(root, '.github/instructions').filter((file) =>
    file.endsWith('.instructions.md')
  );
  for (const file of instructionFiles) {
    const meta = frontmatter(file);
    if (typeof meta?.applyTo !== 'string' || !meta.applyTo.trim())
      errors.push(`${file} : applyTo absent ou invalide`);
  }
  const registry = read('docs/00-cadrage/questions-ouvertes.md');
  const index = read('docs/08-implementation/ai-decisions-index.md');
  const expected = decisionEntries(registry);
  const actual = index.split(/\r?\n/).flatMap((line) => {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*(.*?)\s*\|\s*$/);
    return match ? [{ line: Number(match[1]), title: match[2].replaceAll('\\|', '|') }] : [];
  });
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    errors.push('Index D/Q obsolète : exécuter npm run ai:index:update');
  const contextFile = 'docs/08-implementation/ai-context-map.md';
  const context = read(contextFile);
  for (const match of context.matchAll(/`([^`\r\n]+)`/g)) {
    const reference = match[1];
    if (
      (reference === 'AGENTS.md' || /^(?:docs|src|tests|config|scripts|\.agents)\//.test(reference)) &&
      !fs.existsSync(path.join(root, reference))
    )
      errors.push(`${contextFile} : chemin racine absent (${reference})`);
  }
  const documents = [
    'AGENTS.md',
    'README.md',
    'docs/README.md',
    contextFile,
    'docs/08-implementation/ai-decisions-index.md',
    'docs/08-implementation/codex-copilot-vscode.md',
    'docs/08-implementation/ai-configuration-validation.md',
    ...skillFiles.filter((file) => file.endsWith('.md')),
    ...instructionFiles,
    '.github/copilot-instructions.md'
  ];
  for (const folder of ['src', 'src/dashboard', 'src/anonymization', 'tests', 'config', 'docs'])
    documents.push(path.join(folder, 'AGENTS.md'));
  for (const file of new Set(documents)) {
    const text = read(file);
    for (const match of text.matchAll(/\[[^\]]*\]\((?:<([^>]+)>|([^\s)]+))(?:\s+"[^"]*")?\)/g)) {
      const href = match[1] ?? match[2];
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(href)) continue;
      let local;
      try {
        local = decodeURIComponent(href.split('#')[0].split('?')[0]);
      } catch {
        errors.push(`${file} : URL locale invalide (${href})`);
        continue;
      }
      if (!fs.existsSync(path.resolve(root, path.dirname(file), local)))
        errors.push(`${file} : lien local absent (${local})`);
    }
  }
  return errors;
}
