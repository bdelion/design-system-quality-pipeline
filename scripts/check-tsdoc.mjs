import process from 'node:process';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

/** Recense les sources maintenues, en excluant les contrats de déclaration. */
function sourceFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? sourceFiles(path.join(directory, entry.name))
        : /\.(?:ts|js)$/.test(entry.name) && !entry.name.endsWith('.d.ts')
          ? [path.join(directory, entry.name)]
          : []
    );
}

/** Identifie les fonctions nommées et leur déclaration porteuse, sans imposer un commentaire à chaque callback anonyme. */
function functionOwner(node) {
  if (ts.isFunctionDeclaration(node) && node.name) return node;
  if (
    ts.isVariableDeclaration(node) &&
    ts.isIdentifier(node.name) &&
    node.initializer &&
    (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
  )
    return node.parent.parent;
  if (ts.isMethodDeclaration(node)) return node;
  return undefined;
}

const missing = [];
for (const file of sourceFiles('src')) {
  const text = fs.readFileSync(file, 'utf8'),
    source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  /** Vérifie récursivement la présence d'un bloc TSDoc sur chaque fonction nommée. */
  function visit(node) {
    const owner = functionOwner(node);
    if (owner) {
      const comments = ts.getLeadingCommentRanges(text, owner.getFullStart()) ?? [];
      if (!comments.some((comment) => text.slice(comment.pos, comment.end).startsWith('/**')))
        missing.push(`${file}:${source.getLineAndCharacterOfPosition(owner.getStart(source)).line + 1}`);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
if (missing.length) {
  process.stderr.write('Fonctions sans TSDoc :\n' + missing.join('\n') + '\n');
  process.exitCode = 1;
} else
  process.stdout.write(
    'TSDoc présent sur toutes les fonctions nommées des sources TypeScript et JavaScript.\n'
  );
