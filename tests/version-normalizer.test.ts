import { describe, expect, it } from 'vitest';
import { normalizeVersions } from '../src/normalizers/versions.js';
import type { Library, Milestone, RawDataset } from '../src/domain/types.js';

describe('Version normalization', () => {
  it('keeps milestone-identifiable PROD versions unpublished without exact PROD tags', () => {
    const raw: RawDataset = {
      collectedAt: '2026-09-28T10:00:00Z',
      catalogueComponents: [],
      nexusAvailable: false,
      repositories: [{
        id: 'repository-1',
        name: 'design-system',
        owner: 'acme',
        defaultBranch: 'main',
        issues: [
          {
            id: 'issue-1',
            number: 1,
            title: 'Audit',
            state: 'CLOSED',
            issueType: 'Audit',
            labels: [],
            criticities: [],
            parents: [],
            createdAt: '2026-09-01T10:00:00Z',
            linkedPullRequestIds: [],
            projectStatuses: [],
            milestone: { id: 101, number: 1, title: '1.2.3-Audit' }
          },
          {
            id: 'issue-2',
            number: 2,
            title: 'Release audit',
            state: 'CLOSED',
            issueType: 'Audit',
            labels: [],
            criticities: [],
            parents: [],
            createdAt: '2026-09-02T10:00:00Z',
            linkedPullRequestIds: [],
            projectStatuses: [],
            milestone: { id: 102, number: 2, title: '2.3.4' }
          }
        ],
        pullRequests: [],
        tags: [
          {
            name: '2.3.4',
            ref: 'refs/tags/2.3.4',
            referenceSha: 'tag-object',
            referenceObjectType: 'tag',
            targetSha: 'release-commit',
            targetType: 'commit',
            createdAt: '2026-09-20T10:00:00Z'
          },
          {
            name: '3.0.0',
            ref: 'refs/tags/3.0.0',
            referenceSha: 'lightweight-commit',
            referenceObjectType: 'commit',
            targetSha: 'lightweight-commit',
            targetType: 'commit'
          },
          {
            name: '3.0.0-rc.1',
            ref: 'refs/tags/3.0.0-rc.1',
            referenceSha: 'rc-commit',
            referenceObjectType: 'commit',
            targetSha: 'rc-commit',
            targetType: 'commit'
          }
        ]
      }]
    };
    const libraries: Library[] = [{
      libraryId: 'library-1',
      name: 'design-system',
      repository: 'acme/design-system',
      status: 'active',
      provenance: { source: 'github', collectedAt: raw.collectedAt },
      dataQualityStatus: 'reliable'
    }];
    const milestones: Milestone[] = [
      {
        milestoneId: 'milestone-1',
        repositoryId: 'repository-1',
        number: 1,
        title: '1.2.3-Audit'
      },
      {
        milestoneId: 'milestone-2',
        repositoryId: 'repository-1',
        number: 2,
        title: '2.3.4'
      }
    ];

    expect(normalizeVersions(raw, libraries, milestones)).toEqual([
      {
        versionId: expect.any(String),
        libraryId: 'library-1',
        number: '1.2.3',
        milestoneId: 'milestone-1',
        published: false,
        catalogueStatus: 'unknown'
      },
      {
        versionId: expect.any(String),
        libraryId: 'library-1',
        number: '2.3.4',
        tag: '2.3.4',
        releasedAt: '2026-09-20T10:00:00Z',
        milestoneId: 'milestone-2',
        published: true,
        catalogueStatus: 'unknown'
      },
      {
        versionId: expect.any(String),
        libraryId: 'library-1',
        number: '3.0.0',
        tag: '3.0.0',
        published: true,
        catalogueStatus: 'unknown'
      }
    ]);
  });
});
