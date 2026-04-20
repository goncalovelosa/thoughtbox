# Edge Cases for Parameter Classification

Catalog of tricky classification scenarios for `classifyField()` in
`normalize.ts`. Each entry describes a scenario, the expected classification,
and what could go wrong.

---

## 1. Bare `id` Without Context

**Parameter:** `{ name: "id", type: "string" }`
**Tool:** Generic tool with ambiguous slug (e.g., `GOOGLESUPER_GET_ITEM`)

**Expected:** classification depends entirely on entity hints from tool
slug/name/description. Without context, should classify as `unknown` / `low`
confidence rather than guessing wrong.

**Risk:** If context gating fails (tool description is vague), `id` might get
mapped to a wrong entity type. Prefer `unknown` over a false positive.

---

## 2. `name` Across Services

**In GitHub:** `name` = repository name (`github.repo.name`)
**In Contacts:** `name` = person name (`person.name`)
**In Drive:** `name` = file name (`google.drive.file.name`)

**Expected:** context-gated classification — each service maps `name` to its
own canonical resource.

**Risk:** The classifier currently handles `repo_name` and `person_name` but
does NOT recognize `name` as `google.drive.file.name` in a Drive context. This
is a **coverage gap**.

---

## 3. Nested Array Parameters

**Parameter:** `{ path: "attendees[].email", name: "email", type: "string" }`
**Tool:** `GOOGLECALENDAR_CREATE_EVENT`

**Expected:** `email.address` with calendar context.

**Risk:** The flattened path `attendees[].email` might confuse path-based
matching. The classifier uses `field.name` (leaf node = `email`) which should
work. But the nested structure means this email is inside an array of attendee
objects — the `required` flag semantics are different (the array might be
optional, but each element's email is required within the element).

---

## 4. Union Types (anyOf / oneOf)

**Schema:**
```json
{
  "content": {
    "anyOf": [
      { "type": "string", "description": "Plain text body" },
      { "type": "object", "properties": { "html": { "type": "string" } } }
    ]
  }
}
```

**Expected:** `flattenSchema` visits both variants. The string variant produces
a field at path `content`. The object variant produces `content.html`. The dedup
keeps the one with a description.

**Risk:** Both variants might have descriptions, in which case the first one
wins arbitrarily. If the second variant's description is more informative,
classification quality degrades.

---

## 5. Git Branch References

**Parameter:** `{ name: "ref", type: "string", description: "Branch name or ref" }`
**Tool:** `GITHUB_CREATE_BRANCH`, `GITHUB_LIST_BRANCHES`

**Expected:** should be classified as a branch entity. But there is **no
canonical resource** for branches currently (`github.branch.ref` is missing).

**This is a coverage gap.** Branch references are real entity identifiers that
create dependency edges (LIST_BRANCHES → produces branch refs → CREATE_PR
requires base branch).

---

## 6. Cross-Service Entity Equivalences

**Scenario:** `GITHUB_GET_USER` returns an `email` field. Can this feed
`GMAIL_SEND_EMAIL`'s `to` parameter?

**Expected:** Yes — the canonical resource `email.address` should unify across
toolkits. The current classifier maps both to `email.address` regardless of
toolkit. This is **correct and intentional**.

**Risk:** If the classifier ever adds toolkit-scoped email types
(`github.user.email` vs `gmail.recipient`), cross-service flows would break.
Keep `email.address` as a single unified type.

---

## 7. Label Ambiguity Across Services

**In GitHub:** labels are string tags on issues (`["bug", "feature"]`)
**In Gmail:** labels are category identifiers (`INBOX`, `SENT`, custom IDs)

**Expected:** These should NOT be unified. GitHub labels are user-provided
strings. Gmail labels have IDs (`gmail.label.id`). The current classifier
treats them as `filter` (excluded from graph), which is correct for GitHub
labels as inputs but misses `gmail.label.id` as an entity type.

**Coverage gap:** `gmail.label.id` is not in the classifier. Tools like
`GMAIL_ADD_LABEL_TO_EMAIL` need a label ID that comes from `GMAIL_CREATE_LABEL`
or `GMAIL_LIST_LABELS`.

---

## 8. Enum Parameters

**Parameter:** `{ name: "state", enum: ["open", "closed", "all"] }`
**Tool:** `GITHUB_LIST_ISSUES`

**Expected:** `filter` semantic class, excluded from graph.

**Risk:** `schemaType` detects enums and returns the type of the first value.
But `classifyField` doesn't explicitly check for enum fields. The `state`
field happens to be in the explicit `filter` name list, so it works. But a
novel enum field like `visibility: ["public", "private"]` would fall through
to `unknown`. Consider: any field with an `enum` array should auto-classify as
`filter` or `config`.

---

## 9. URL / Link Parameters

**Parameter:** `{ name: "html_url", type: "string" }`
**Tool:** `GITHUB_GET_ISSUE` (output)

**Expected:** URLs are generally informational outputs, not dependency carriers.
Should classify as `unknown` or a low-value output. No canonical resource for
URLs currently.

**Risk:** A tool that produces a `download_url` might feed another tool's
`file_url` parameter — a real dependency. But these flows are rare and
URL-based dependencies are fragile. Acceptable to ignore in v1.

---

## 10. Composio Response Wrapper Fields

**Output schema contains:**
```json
{
  "successful": { "type": "boolean" },
  "data": { "type": "object", "properties": { ... } },
  "error": { "type": "string" }
}
```

**Expected:** `successful` and `error` should be excluded from entity
classification. Only fields inside `data` carry entity information.

**Risk:** `flattenSchema` will produce fields at paths `successful`, `data.*`,
`error`. The classifier should ignore `successful` and `error` — they don't
match any alias, so they become `unknown` / `low` confidence and get filtered
out by `shouldIncludeField`. This works **by accident** — consider adding an
explicit deny list for response wrapper fields.

---

## 11. The `folder_id` vs `file_id` Distinction

**Parameter:** `{ name: "parent_folder_id", type: "string" }`
**Tool:** `GOOGLEDRIVE_CREATE_FILE`

**Expected:** `google.drive.folder.id` — distinct from `google.drive.file.id`.

**Risk:** The current classifier maps `file_id` and `document_id` to
`google.drive.file.id` but does NOT handle `folder_id` or
`parent_folder_id`. This means MOVE_FILE's destination folder parameter
goes unclassified.

**Coverage gap:** `google.drive.folder.id` is missing from the classifier.

---

## 12. Missing Entity Types (Summary)

Entity types observed in Google/GitHub APIs but not in the current classifier:

| Entity Type | Where it appears | Example tools |
|-------------|-----------------|---------------|
| `github.branch.ref` | Branch name / ref | LIST_BRANCHES, CREATE_PR |
| `gmail.label.id` | Gmail label identifier | CREATE_LABEL, ADD_LABEL |
| `google.drive.folder.id` | Drive folder identifier | CREATE_FOLDER, MOVE_FILE |
| `google.calendar.calendar_id` | Calendar identifier (not event) | LIST_CALENDARS |
| `github.comment.id` | Issue/PR comment identifier | UPDATE_COMMENT, DELETE_COMMENT |
| `github.release.id` | Release identifier | CREATE_RELEASE, GET_RELEASE |
| `github.gist.id` | Gist identifier | GET_GIST, UPDATE_GIST |
| `google.sheets.spreadsheet.id` | Spreadsheet identifier | GET_SPREADSHEET, UPDATE_CELLS |

Adding these would increase graph coverage but each requires corresponding
output inference rules.

---

## 13. CRUD-Completeness Check

For each entity type in the graph, expect the following pattern:

```
LIST / SEARCH  ──produces──▶  entity.id  ◀──requires──  UPDATE / DELETE
```

If an entity type has only producers (edges in, no edges out to action tools)
or only consumers (required by tools, but nothing produces it), flag it:

- **Only producers:** the entity type is generated but never consumed — might
  indicate a misclassified output (false positive entity type).
- **Only consumers:** the entity type is needed but nothing produces it —
  either it's user-provided (correct if in `userProvidableResources`) or the
  output inference missed a producer tool.

This check is a strong structural invariant for graph quality.
