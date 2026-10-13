import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { checkAiConfiguration, decisionEntries, renderDecisionIndex } from '../scripts/ai-config.mjs';

const roots: string[] = [];
const registry = '# Décisions\n\n### D-047 — Date d’audit\n\n### Q-068 — Disponibilité\n';

/** Écrit un fichier de fixture minimale sans dépendre du contenu du dépôt réel. */
function put(root: string, file: string, content: string): void {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), content, 'utf8');
}

/** Assemble un kit IA autonome avec une skill, une instruction, un index et une tâche. */
function kit(): string {
  const root = mkdtempSync(join(tmpdir(), 'dsq-ai-kit-'));
  roots.push(root);
  put(root, 'package.json', JSON.stringify({ scripts: { check: 'node check.mjs' } }));
  put(root, 'AGENTS.md', '# Consignes\n');
  for (const file of [
    'README.md',
    'docs/README.md',
    '.github/copilot-instructions.md',
    'docs/08-implementation/codex-copilot-vscode.md',
    'docs/08-implementation/ai-configuration-validation.md',
    ...['src', 'src/dashboard', 'src/anonymization', 'tests', 'config', 'docs'].map(
      (folder) => folder + '/AGENTS.md'
    )
  ])
    put(root, file, '# Documentation\n');
  put(root, 'docs/00-cadrage/questions-ouvertes.md', registry);
  put(root, 'docs/08-implementation/ai-decisions-index.md', renderDecisionIndex(registry));
  put(root, 'docs/08-implementation/ai-context-map.md', '`AGENTS.md`\n');
  put(
    root,
    '.agents/skills/dsq-change/SKILL.md',
    '---\nname: dsq-change\ndescription: Modifier le code avec tests.\n---\n# Instructions\n'
  );
  put(
    root,
    '.agents/skills/dsq-change/agents/openai.yaml',
    'interface:\n  display_name: Modification\n  short_description: Modifier le code avec tests\n  default_prompt: "Utilise $dsq-change."\n'
  );
  put(
    root,
    '.github/instructions/docs.instructions.md',
    '---\napplyTo: "docs/**/*.md"\n---\nConsulter [les consignes](../../AGENTS.md).\n'
  );
  put(
    root,
    '.vscode/tasks.json',
    JSON.stringify({
      version: '2.0.0',
      tasks: [
        {
          label: 'Contrôle',
          type: 'process',
          command: 'npm',
          windows: { command: 'npm.cmd' },
          args: ['run', 'check'],
          options: { cwd: '${workspaceFolder}' }
        }
      ]
    })
  );
  return root;
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    if (dirname(root) !== tmpdir() || !basename(root).startsWith('dsq-ai-kit-'))
      throw new Error('Répertoire de nettoyage non autorisé');
    rmSync(root, { recursive: true, force: true });
  }
});

describe('configuration IA versionnée', () => {
  it('valide un kit cohérent sans imposer les décisions du dépôt réel', () => {
    expect(checkAiConfiguration(kit())).toEqual([]);
  });
  it('détecte un lien local cassé sans essayer de consulter une URL distante', () => {
    const root = kit();
    put(root, 'AGENTS.md', '[Absent](absent.md)\n[Externe](https://example.invalid/doc)\n');
    expect(checkAiConfiguration(root).join('\n')).toContain('absent.md');
  });
  it('détecte la suppression d’une consigne locale attendue', () => {
    const root = kit();
    rmSync(join(root, 'src/dashboard/AGENTS.md'));
    expect(checkAiConfiguration(root).join('\n')).toContain('AGENTS.md : fichier absent');
  });
  it('refuse un index obsolète après modification du registre', () => {
    const root = kit();
    put(root, 'docs/00-cadrage/questions-ouvertes.md', registry + '\n### D-099 — Nouvelle décision\n');
    expect(checkAiConfiguration(root).join('\n')).toContain('Index D/Q obsolète');
  });
  it('signale les chemins de contexte annoncés depuis la racine', () => {
    const root = kit();
    put(root, 'docs/08-implementation/ai-context-map.md', '`docs/absent.md`\n');
    expect(checkAiConfiguration(root).join('\n')).toContain('docs/absent.md');
  });
  it('refuse une tâche sans script npm existant ou sans commande Windows', () => {
    const root = kit();
    put(
      root,
      '.vscode/tasks.json',
      JSON.stringify({
        version: '2.0.0',
        tasks: [
          {
            label: 'Erreur',
            type: 'process',
            command: 'npm',
            args: ['run', 'absent'],
            options: { cwd: '${workspaceFolder}' }
          }
        ]
      })
    );
    const errors = checkAiConfiguration(root).join('\n');
    expect(errors).toContain('script npm');
    expect(errors).toContain('npm.cmd');
  });
  it('refuse des métadonnées de skill incompatibles avec son répertoire', () => {
    const root = kit();
    put(root, '.agents/skills/dsq-change/SKILL.md', '---\nname: autre\ndescription: ""\n---\nInstructions\n');
    expect(checkAiConfiguration(root).join('\n')).toContain('skill');
  });
  it('transforme les erreurs de syntaxe JSON/YAML en diagnostics', () => {
    const root = kit();
    put(root, '.vscode/tasks.json', '{');
    put(root, '.agents/skills/dsq-change/agents/openai.yaml', 'interface: [');
    const errors = checkAiConfiguration(root).join('\n');
    expect(errors).toContain('JSON invalide');
    expect(errors).toContain('YAML invalide');
  });
  it('génère un index déterministe sans renuméroter ni réécrire les décisions', () => {
    expect(decisionEntries(registry)).toEqual([
      { line: 3, title: 'D-047 — Date d’audit' },
      { line: 5, title: 'Q-068 — Disponibilité' }
    ]);
    const rendered = renderDecisionIndex(registry);
    expect(rendered).toBe(renderDecisionIndex(registry));
    expect(rendered).toContain('| 3 | D-047 — Date d’audit |');
    expect(rendered).toContain('| 5 | Q-068 — Disponibilité |');
  });
});
