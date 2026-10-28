/** Extrait les mentions d'issues du corps, sans transformer une mention en relation parent. */
export function descriptionIssueReferences(body: string | null | undefined, repository: string): string[] {
  if (!body) return [];
  const references = new Set<string>();
  const expression = /https?:\/\/[^\s/]+\/([\w.-]+\/[\w.-]+)\/issues\/(\d+)|(?:([\w.-]+\/[\w.-]+))?#(\d+)\b/g;
  for (const match of body.matchAll(expression)) {
    const number = Number(match[2] ?? match[4]);
    if (Number.isSafeInteger(number) && number > 0)
      references.add(`${match[1] ?? match[3] ?? repository}:issue:${number}`);
  }
  return [...references];
}
