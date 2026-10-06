import { stableId } from '../lib/ids.js';
import type { Library, Milestone, RawDataset, Version } from '../domain/types.js';

interface VersionCandidate {
  libraryId: string;
  number: string;
  milestoneIds: Set<string>;
  tags: Array<NonNullable<RawDataset['repositories'][number]['tags']>[number]>;
}

const prodMilestonePattern = /^(\d+\.\d+\.\d+)(?:-audit)?$/i;
const prodTagPattern = /^(\d+\.\d+\.\d+)$/;

export function normalizeVersions(
  raw: RawDataset,
  libraries: Library[],
  milestones: Milestone[]
): Version[] {
  const libraryByRepository = new Map(libraries.map((library) => [library.name, library]));
  const candidates = new Map<string, VersionCandidate>();
  const getCandidate = (libraryId: string, number: string): VersionCandidate => {
    const key = `${libraryId}:${number}`;
    let candidate = candidates.get(key);
    if (!candidate) {
      candidate = { libraryId, number, milestoneIds: new Set(), tags: [] };
      candidates.set(key, candidate);
    }
    return candidate;
  };

  for (const repository of raw.repositories) {
    const library = libraryByRepository.get(repository.name);
    if (!library) continue;
    const milestoneBySourceId = new Map(
      milestones
        .filter((milestone) => milestone.repositoryId === repository.id)
        .map((milestone) => [`${repository.id}:${milestone.number}`, milestone])
    );

    for (const issue of repository.issues) {
      if (!issue.milestone) continue;
      const match = prodMilestonePattern.exec(issue.milestone.title);
      if (!match?.[1]) continue;
      const milestoneId = milestoneBySourceId.get(`${repository.id}:${issue.milestone.number}`)?.milestoneId;
      if (milestoneId) getCandidate(library.libraryId, match[1]).milestoneIds.add(milestoneId);
    }

    for (const tag of repository.tags ?? []) {
      const match = prodTagPattern.exec(tag.name);
      if (!match?.[1]) continue;
      getCandidate(library.libraryId, match[1]).tags.push(tag);
    }
  }

  return [...candidates.values()]
    .map((candidate): Version => {
      const tag = candidate.tags.length === 1 ? candidate.tags[0] : undefined;
      const milestoneId = candidate.milestoneIds.size === 1
        ? [...candidate.milestoneIds][0]
        : undefined;
      return {
        versionId: stableId('version', `${candidate.libraryId}:${candidate.number}`),
        libraryId: candidate.libraryId,
        number: candidate.number,
        ...(tag ? { tag: tag.name } : {}),
        ...(tag?.createdAt ? { releasedAt: tag.createdAt } : {}),
        ...(milestoneId ? { milestoneId } : {}),
        published: candidate.tags.length > 0,
        catalogueStatus: 'unknown'
      };
    })
    .sort((left, right) =>
      left.libraryId.localeCompare(right.libraryId) || left.number.localeCompare(right.number)
    );
}
