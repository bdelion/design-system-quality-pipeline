# Fixture validation report

- **Source:** `fixtures\my-real-dataset-anonymized.json`
- **Repositories:** 3
- **Issues:** 1716
- **Pull requests:** 1463
- **Suspicious strings:** 0
- **Integrity errors:** 1
- **Result:** ❌ INVALID

## 1. Suspicious strings

No suspicious strings detected.

## 2. Relational integrity

| # | Error | Repository | Scope | Source path | Reference |
|---:|---|---|---|---|---|
| 1 | Missing issue | repo-22768034 | repository | `$.repositories[0].pullRequests[1061].relatedIssueIds[0]` | `issue-64d09b7d` |

### Integrity error 1: missing issue

- **Repository:** `repo-22768034`
- **Scope:** `repository`
- **Source entity:** `pr-48b3fe38`
- **Source path:** `$.repositories[0].pullRequests[1061].relatedIssueIds[0]`
- **Referenced ID:** `issue-64d09b7d`

**Anonymized source object:**

```json
{
  "id": "pr-48b3fe38",
  "number": 237781,
  "state": "MERGED",
  "mergedAt": "2022-02-06T14:39:09.000Z",
  "relatedIssueIds": [
    "issue-64d09b7d"
  ]
}
```

## 3. Interpretation

- A **suspicious string** means the scanner found a URL, email, token, bearer token, or phone-like value in the fixture.
- ISO timestamps are structured date values and are excluded from phone detection; phone-like values embedded in free-form text remain detectable.
- An **integrity error** means a relationship points to an entity that is not present in the same repository scope. A `cross-repository` scope means the referenced entity exists elsewhere in the fixture.
- The JSON path and source value above identify the exact fixture element that triggered each finding.
- The optional RAW trace manifest maps anonymized entities to source-file paths and source IDs. It is intentionally local and must not be committed or distributed.
