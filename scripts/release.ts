import { readFile } from 'node:fs/promises';
/** Métadonnées publiques utilisées pour rédiger une release. */
export interface ReleasePullRequest {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  merged_at: string | null;
  merge_commit_sha: string | null;
  base: { ref: string };
}
/** Client REST injectable : les tests ne publient rien sur GitHub. */
export type ReleaseApi = <T>(path: string, body?: unknown) => Promise<T>;
/** Calcule une version stable ; toute évolution sans feat ni rupture incrémente le patch. */
export function nextVersion(base: string, messages: string[]): string {
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(base);
  if (!match) throw new Error('Version de référence invalide');
  const [major, minor, patch] = match.slice(1).map(Number) as [number, number, number];
  if (
    messages.some(
      (message) => /^[a-z]+(?:\([^\n]*\))?!:/m.test(message) || /^BREAKING[ -]CHANGE:/m.test(message)
    )
  )
    return 'v' + (major + 1) + '.0.0';
  if (messages.some((message) => /^feat(?:\([^\n]*\))?:/m.test(message)))
    return 'v' + major + '.' + (minor + 1) + '.0';
  return 'v' + major + '.' + minor + '.' + (patch + 1);
}
/** Classe les versions numériques sans comparer leurs chaînes lexicalement. */
function compareVersions(a: string, b: string): number {
  const left = a.replace(/^v/, '').split('.').map(Number);
  const right = b.replace(/^v/, '').split('.').map(Number);
  for (let index = 0; index < 3; index++)
    if (left[index] !== right[index]) return left[index]! - right[index]!;
  return 0;
}
/** Charge toutes les pages d’une collection GitHub pour ne pas omettre tags ou commits. */
async function pages<T>(api: ReleaseApi, path: string): Promise<T[]> {
  const result: T[] = [];
  for (let page = 1; ; page++) {
    const items = await api<T[]>(path + '?per_page=100&page=' + page);
    result.push(...items);
    if (items.length < 100) return result;
  }
}
/** Rédige des notes traçables à partir des textes auteurs, sans inventer de bénéfice ou de limitation. */
export function releaseNotes(
  pr: ReleasePullRequest,
  messages: string[],
  sha: string,
  repository: string,
  runId: string
): string {
  const groups: Record<string, string[]> = {
    Nouveautés: [],
    Corrections: [],
    'Documentation et maintenance': []
  };
  for (const message of messages) {
    const subject = message.split('\n')[0] ?? '';
    const category = /^feat(?:\(|!|:)/.test(subject)
      ? 'Nouveautés'
      : /^fix(?:\(|!|:)/.test(subject)
        ? 'Corrections'
        : 'Documentation et maintenance';
    groups[category]!.push('- ' + subject);
  }
  const authored =
    /<!-- release-notes:start -->([\s\S]*?)<!-- release-notes:end -->/.exec(pr.body ?? '')?.[1]?.trim() ||
    pr.body?.trim() ||
    'Description non renseignée dans la PR ; consulter les changements liés ci-dessous.';
  const breaking = messages.filter(
    (message) => /^[a-z]+(?:\([^\n]*\))?!:/m.test(message) || /^BREAKING[ -]CHANGE:/m.test(message)
  );
  return (
    '# ' +
    pr.title +
    '\n\n' +
    authored +
    '\n\n' +
    Object.entries(groups)
      .filter(([, items]) => items.length)
      .map(([title, items]) => '## ' + title + '\n\n' + items.join('\n'))
      .join('\n\n') +
    (breaking.length
      ? '\n\n## Changements incompatibles\n\n' +
        breaking.map((message) => '- ' + message).join('\n') +
        '\n\nConsulter les instructions de migration de la PR.'
      : '') +
    '\n\n## Validation et traçabilité\n\n- PR : [#' +
    pr.number +
    '](' +
    pr.html_url +
    ')\n- Commit validé : [' +
    sha.slice(0, 7) +
    '](https://github.com/' +
    repository +
    '/commit/' +
    sha +
    ')\n- [CI complète réussie](https://github.com/' +
    repository +
    '/actions/runs/' +
    runId +
    ')\n'
  );
}
/** Publie une release par merge validé ; une relance réutilise le tag du même commit. */
export async function publishRelease(
  api: ReleaseApi,
  sha: string,
  repository: string,
  runId: string,
  baseline: string
): Promise<string | null> {
  const pulls = await pages<ReleasePullRequest>(api, '/commits/' + sha + '/pulls');
  const pr = pulls.find(
    (item) => item.base.ref === 'main' && item.merged_at && item.merge_commit_sha === sha
  );
  if (!pr) return null;
  const commits = await pages<{ commit: { message: string } }>(api, '/pulls/' + pr.number + '/commits');
  const messages = [pr.title + '\n' + (pr.body ?? ''), ...commits.map((item) => item.commit.message)];
  const body = releaseNotes(
    pr,
    commits.map((item) => item.commit.message),
    sha,
    repository,
    runId
  );
  for (let attempt = 0; attempt < 8; attempt++) {
    const tags = (await pages<{ name: string; commit: { sha: string } }>(api, '/tags')).filter((tag) =>
      /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag.name)
    );
    tags.sort((a, b) => compareVersions(b.name, a.name));
    const existing = tags.find((tag) => tag.commit.sha === sha)?.name;
    const tag = existing ?? nextVersion(tags[0]?.name ?? baseline, messages);
    if (existing) {
      try {
        const release = await api<{ draft: boolean }>('/releases/tags/' + tag);
        if (!release.draft) return tag;
        throw new Error('Un brouillon existe déjà pour ' + tag);
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 404)) throw error;
      }
    }
    if (!existing) {
      try {
        await api('/git/refs', { ref: 'refs/tags/' + tag, sha });
      } catch (error) {
        if (!(error instanceof ApiError && error.status === 422)) throw error;
        const refreshed = await pages<{ name: string }>(api, '/tags');
        if (!refreshed.some((item) => item.name === tag)) throw error;
        continue;
      }
    }
    try {
      await api('/releases', {
        tag_name: tag,
        target_commitish: sha,
        name: tag + ' — ' + pr.title,
        body,
        draft: false,
        prerelease: false,
        make_latest: 'legacy'
      });
      return tag;
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 422)) throw error;
      // Une relance simultanée du même commit peut avoir publié la release entre-temps.
      try {
        const release = await api<{ draft: boolean }>('/releases/tags/' + tag);
        if (!release.draft) return tag;
      } catch (lookupError) {
        if (!(lookupError instanceof ApiError && lookupError.status === 404)) throw lookupError;
      }
      throw error;
    }
  }
  throw new Error('Collisions répétées de tags : relancer le job release');
}
/** Transporte uniquement le code HTTP, sans exposer le token ni le corps de réponse. */
export class ApiError extends Error {
  /** Construit une erreur HTTP exploitable par les relances contrôlées. */
  constructor(public readonly status: number) {
    super('GitHub release API : HTTP ' + status);
  }
}
/** Exécute la publication uniquement dans le job autorisé d’un push main. */
export async function runRelease(): Promise<void> {
  if (process.env.GITHUB_EVENT_NAME !== 'push' || process.env.GITHUB_REF !== 'refs/heads/main')
    throw new Error('Publication réservée aux push sur main');
  const {
    GITHUB_TOKEN: token,
    GITHUB_REPOSITORY: repository,
    GITHUB_SHA: sha,
    GITHUB_RUN_ID: runId
  } = process.env;
  if (
    !token ||
    !repository ||
    !/^[\w.-]+\/[\w.-]+$/.test(repository) ||
    !sha ||
    !/^[a-f0-9]{40}$/.test(sha) ||
    !runId
  )
    throw new Error('Contexte de release incomplet');
  /** Appelle l’API GitHub avec les permissions temporaires du job release. */
  const api: ReleaseApi = async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetch('https://api.github.com/repos/' + repository + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + token,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json'
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    if (!response.ok) throw new ApiError(response.status);
    return (await response.json()) as T;
  };
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as {
    version: string;
  };
  const tag = await publishRelease(api, sha, repository, runId, pkg.version);
  process.stdout.write(
    tag
      ? 'Release publiée ou déjà existante : ' + tag + '\n'
      : 'Aucune PR fusionnée sur main pour ce commit : aucune release.\n'
  );
}
