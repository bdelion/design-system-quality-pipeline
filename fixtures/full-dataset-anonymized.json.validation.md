# Fixture validation report

- **Source:** `fixtures/full-dataset-anonymized.json`
- **Repositories:** 3
- **Issues:** 1749
- **Pull requests:** 1499
- **Suspicious strings:** 0
- **Integrity errors:** 1
- **Result:** ❌ INVALID

## 1. Suspicious strings

No suspicious strings detected.

## 2. Relational integrity

| # | Error | Repository | Scope | Source path | Reference |
|---:|---|---|---|---|---|
| 1 | Missing issue | demo-react | repository | `$.repositories[0].pullRequests[1088].relatedIssueIds[0]` | `issue-4d76bdad` |

### Integrity error 1: missing issue

- **Repository:** `demo-react`
- **Scope:** `repository`
- **Source entity:** `pr-53e244c7`
- **Source path:** `$.repositories[0].pullRequests[1088].relatedIssueIds[0]`
- **Referenced ID:** `issue-4d76bdad`

**Anonymized source object:**

```json
{
  "id": "pr-53e244c7",
  "number": 395865,
  "state": "MERGED",
  "mergedAt": "2023-02-06T14:39:09.000Z",
  "relatedIssueIds": [
    "issue-4d76bdad"
  ]
}
```

## 3. Interpretation

- A **suspicious string** means the scanner found a URL, email, token, bearer token, or phone-like value in the fixture.
- ISO timestamps are structured date values and are excluded from phone detection; phone-like values embedded in free-form text remain detectable.
- An **integrity error** means a relationship points to an entity that is not present in the same repository scope. A `cross-repository` scope means the referenced entity exists elsewhere in the fixture.
- The JSON path and source value above identify the exact fixture element that triggered each finding.
- The optional RAW trace manifest maps anonymized entities to source-file paths and source IDs. It is intentionally local and must not be committed or distributed.
