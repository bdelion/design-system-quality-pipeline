import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
const execute = promisify(execFile);
/** Refuse les entrées absentes et les noms mal structurés avant tout accès réseau. */
it('exige la liste et la sortie et refuse un owner non explicite', async () => {
  await expect(
    execute(process.execPath, ['--import', 'tsx', 'src/cli.ts', 'collect', '--repositories', 'unused.json'])
  ).rejects.toMatchObject({ stderr: expect.stringContaining("required option '--output <file>'") });
  const directory = await mkdtemp(join(tmpdir(), 'dsq-cli-list-'));
  try {
    const input = join(directory, 'repositories.json');
    await writeFile(input, JSON.stringify(['ui']));
    await expect(
      execute(process.execPath, [
        '--import',
        'tsx',
        'src/cli.ts',
        'collect',
        '--repositories',
        input,
        '--output',
        join(directory, 'raw.json')
      ])
    ).rejects.toMatchObject({ stderr: expect.stringContaining('owner/repository') });
    const result = await execute(process.execPath, ['--import', 'tsx', 'src/cli.ts', '--help']);
    expect(result.stdout).toContain('fixture:prepare');
    expect(result.stdout).toContain('fixture:validate');
    for (const command of [
      'fixture:anonymize',
      'reference:prepare',
      'catalogue:generate',
      'system:generate',
      'analyze',
      'snapshot'
    ])
      expect(result.stdout).not.toContain(command);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}, 20000);
