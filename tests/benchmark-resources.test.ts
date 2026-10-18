import { it, expect } from 'vitest';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { directoryResources, resourceFiles } from '../scripts/benchmark-resources.js';

it('mesure les dépendances partagées sans doubler le JSON intégré ou les imports communs', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dsq-resources-'));
  try {
    await mkdir(join(root, 'assets'));
    const html = '<script src="assets/app.js"></script><script type="application/json">{"é":1}</script>';
    await writeFile(join(root, 'index.html'), html);
    await writeFile(join(root, 'issues.html'), html);
    await writeFile(join(root, 'assets/app.js'), "import './shared.js';");
    await writeFile(join(root, 'assets/shared.js'), 'export const valeur = 1;');
    const result = await directoryResources(root);
    expect(result.files).toHaveLength(2);
    expect(result.sharedAssetBytes).toBe(result.referencedAssetBytes);
    expect(result.distributionBytes).toBe(Buffer.byteLength(html) * 2 + result.referencedAssetBytes);
    expect(result.pages[0]!.totalBytes).toBe(Buffer.byteLength(html) + result.referencedAssetBytes);
    expect(result.files.find((file) => file.path === '/assets/app.js')!.sha256).toBe(
      createHash('sha256').update("import './shared.js';").digest('hex')
    );
    await expect(resourceFiles(root, ['/../outside.js'])).rejects.toThrow(/hors du dashboard/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
