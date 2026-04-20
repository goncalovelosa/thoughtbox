import type {
  Confidence,
  FieldRecord,
  RawToolRecord,
  SemanticClass,
  ToolkitSlug,
  ToolRecord,
} from "./types";

type FlattenedField = {
  path: string;
  name: string;
  required: boolean;
  description?: string;
  primitiveType?: string;
  evidence: string[];
};

type Classification = Pick<
  FieldRecord,
  "semanticClass" | "confidence" | "canonicalResource" | "evidence"
>;

type ClassificationContext = {
  direction: "input" | "output";
  toolkit: ToolkitSlug;
  slug: string;
  name: string;
  description: string;
  entityHints: string[];
};

const PAGINATION_FIELD_NAMES = new Set([
  "page",
  "per_page",
  "limit",
  "cursor",
  "offset",
  "sort",
  "order",
  "direction",
  "page_size",
  "max_results",
]);

const CONFIG_FIELD_NAMES = new Set([
  "account_id",
  "auth_config_id",
  "connected_account_id",
  "session_id",
  "workspace_id",
  "team_id",
  "include_archived",
  "include_spam_trash",
  "include_body",
  "include_body_plain",
  "include_body_html",
  "include_metadata",
  "include_permissions",
  "include_subfolders",
  "dry_run",
  "verbose",
  "force",
]);

const TITLE_LIKE = new Set(["title", "subject"]);
const BODY_LIKE = new Set([
  "body",
  "message",
  "content",
  "html_body",
  "text_body",
  "plain_text",
  "plain_text_body",
]);

function toWords(value: string) {
  return value
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function schemaType(node: Record<string, unknown>): string | undefined {
  const type = node.type;
  if (typeof type === "string") {
    return type;
  }

  if (Array.isArray(type)) {
    const primitive = type.find((item) => typeof item === "string" && item !== "null");
    return typeof primitive === "string" ? primitive : undefined;
  }

  if (Array.isArray(node.enum) && node.enum.length > 0) {
    const first = node.enum[0];
    return typeof first;
  }

  return undefined;
}

function flattenSchema(schema: unknown): FlattenedField[] {
  const fields: FlattenedField[] = [];

  const visit = (
    node: unknown,
    pathParts: string[],
    required: boolean,
    evidence: string[]
  ) => {
    if (!isRecord(node)) {
      return;
    }

    const type = schemaType(node);
    const description =
      typeof node.description === "string"
        ? node.description
        : typeof node.title === "string"
          ? node.title
          : undefined;

    const properties = isRecord(node.properties) ? node.properties : undefined;
    if (properties && Object.keys(properties).length > 0) {
      const requiredSet = new Set(asStringArray(node.required));

      for (const [key, child] of Object.entries(properties)) {
        visit(
          child,
          [...pathParts, key],
          required && requiredSet.has(key),
          [...evidence, `schema property '${[...pathParts, key].join(".")}'`]
        );
      }

      return;
    }

    if (isRecord(node.items)) {
      const nextPathParts =
        pathParts.length === 0
          ? ["[]"]
          : [...pathParts.slice(0, -1), `${pathParts.at(-1)}[]`];

      visit(node.items, nextPathParts, required, [
        ...evidence,
        `array items for '${pathParts.join(".") || "root"}'`,
      ]);
      return;
    }

    const variants = [node.anyOf, node.oneOf, node.allOf].find(Array.isArray);
    if (Array.isArray(variants) && variants.length > 0) {
      for (const [index, variant] of variants.entries()) {
        visit(variant, pathParts, required, [
          ...evidence,
          `schema variant ${index + 1} for '${pathParts.join(".") || "root"}'`,
        ]);
      }
      return;
    }

    if (pathParts.length === 0) {
      return;
    }

    const name = pathParts.at(-1)?.replace(/\[\]$/, "") ?? "value";
    fields.push({
      path: pathParts.join("."),
      name,
      required,
      description,
      primitiveType: type,
      evidence,
    });
  };

  visit(schema, [], true, ["root schema"]);

  const deduped = new Map<string, FlattenedField>();
  for (const field of fields) {
    const existing = deduped.get(field.path);
    if (!existing || (field.description && !existing.description)) {
      deduped.set(field.path, field);
    }
  }

  return [...deduped.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export function parseEntityHints(
  slug: string,
  name: string,
  description: string
): string[] {
  const text = `${slug} ${name} ${description}`.toLowerCase();
  const hints = new Set<string>();

  if (text.includes("gmail") && text.includes("thread")) hints.add("gmail.thread");
  if (text.includes("gmail") && text.includes("message")) hints.add("gmail.message");
  if (text.includes("contact")) hints.add("google.contact");
  if (text.includes("calendar") && text.includes("event")) hints.add("google.calendar.event");
  if (text.includes("drive") || text.includes("file") || text.includes("document") || text.includes("sheet")) {
    hints.add("google.drive.file");
  }
  if (text.includes("folder")) hints.add("google.drive.folder");
  if (text.includes("spreadsheet") || text.includes("sheet")) hints.add("google.sheets");
  if (text.includes("document") || text.includes("docs")) hints.add("google.docs");
  if (text.includes("album") || text.includes("photo") || text.includes("media")) hints.add("google.photos");
  if (text.includes("task")) hints.add("google.tasks");
  if (text.includes("draft")) hints.add("gmail.draft");
  if (text.includes("secret")) hints.add("github.secret");
  if (text.includes("classroom") || text.includes("assignment")) hints.add("github.classroom");
  if (text.includes("label") && (text.includes("gmail") || text.includes("mail") || text.includes("email"))) {
    hints.add("gmail.label");
  }
  if (text.includes("issue")) hints.add("github.issue");
  if (text.includes("pull request") || text.includes("pull_request") || text.includes("pull")) {
    hints.add("github.pull");
  }
  if (text.includes("repository") || text.includes("repo")) hints.add("github.repo");
  if (text.includes("commit") || text.includes("sha")) hints.add("github.commit");
  if (text.includes("branch") || (text.includes("ref") && text.includes("git"))) {
    hints.add("github.branch");
  }
  if (text.includes("organization") || text.includes("org")) hints.add("github.org");
  if (text.includes("team")) hints.add("github.team");
  if (text.includes("gist")) hints.add("github.gist");
  if (text.includes("project")) hints.add("github.project");
  if (text.includes("package") || text.includes("container")) hints.add("github.package");
  if (text.includes("codespace")) hints.add("github.codespace");
  if (text.includes("email") || text.includes("mail")) hints.add("email");
  if (text.includes("person") || text.includes("contact") || text.includes("user")) {
    hints.add("person");
  }
  if (text.includes("search") || text.includes("query") || text.includes("find")) {
    hints.add("search");
  }

  return [...hints].sort();
}

function addEvidence(base: string[], ...items: string[]) {
  return [...base, ...items];
}

function classifyField(
  field: FlattenedField,
  context: ClassificationContext
): Classification {
  const pathWords = toWords(field.path);
  const nameWords = toWords(field.name);
  const descriptionWords = toWords(field.description ?? "");
  const combinedWords = new Set([
    ...pathWords,
    ...nameWords,
    ...descriptionWords,
    ...context.entityHints.flatMap(toWords),
    ...toWords(context.slug),
    ...toWords(context.name),
    ...toWords(context.description),
  ]);

  const lowerName = field.name.toLowerCase();
  const lowerPath = field.path.toLowerCase();
  const fieldEvidence = [...field.evidence];

  const repositoryScoped =
    context.toolkit === "github" &&
    (context.entityHints.includes("github.repo") ||
      context.entityHints.includes("github.issue") ||
      context.entityHints.includes("github.pull") ||
      combinedWords.has("repository") ||
      combinedWords.has("repo"));

  const emailContext =
    context.entityHints.includes("email") ||
    context.toolkit === "googlesuper" ||
    combinedWords.has("email") ||
    combinedWords.has("mail") ||
    combinedWords.has("gmail");

  const issueContext = context.entityHints.includes("github.issue") || combinedWords.has("issue");
  const pullContext =
    context.entityHints.includes("github.pull") ||
    combinedWords.has("pull") ||
    combinedWords.has("request");
  const threadContext =
    context.entityHints.includes("gmail.thread") ||
    combinedWords.has("thread") ||
    lowerPath.includes("thread");
  const messageContext =
    context.entityHints.includes("gmail.message") ||
    combinedWords.has("message") ||
    lowerPath.includes("message");
  const contactContext = context.entityHints.includes("google.contact") || combinedWords.has("contact");
  const calendarContext =
    context.entityHints.includes("google.calendar.event") || combinedWords.has("calendar");
  const driveContext =
    context.entityHints.includes("google.drive.file") ||
    combinedWords.has("drive") ||
    combinedWords.has("document") ||
    combinedWords.has("file");
  const folderContext =
    context.entityHints.includes("google.drive.folder") ||
    combinedWords.has("folder");
  const sheetsContext =
    context.entityHints.includes("google.sheets") ||
    combinedWords.has("spreadsheet") ||
    combinedWords.has("sheet");
  const docsContext =
    context.entityHints.includes("google.docs") ||
    (combinedWords.has("document") && context.toolkit === "googlesuper");
  const photosContext =
    context.entityHints.includes("google.photos") ||
    combinedWords.has("album") ||
    combinedWords.has("photo") ||
    combinedWords.has("media");
  const tasksContext =
    context.entityHints.includes("google.tasks") ||
    combinedWords.has("task");
  const draftContext =
    context.entityHints.includes("gmail.draft") ||
    combinedWords.has("draft");
  const secretContext =
    context.entityHints.includes("github.secret") ||
    combinedWords.has("secret");
  const classroomContext =
    context.entityHints.includes("github.classroom") ||
    combinedWords.has("classroom") ||
    combinedWords.has("assignment");
  const labelContext =
    context.entityHints.includes("gmail.label") ||
    (combinedWords.has("label") && emailContext);
  const branchContext =
    context.entityHints.includes("github.branch") ||
    combinedWords.has("branch");
  const orgContext =
    context.entityHints.includes("github.org") ||
    combinedWords.has("organization");
  const teamContext =
    context.entityHints.includes("github.team") ||
    combinedWords.has("team");
  const gistContext =
    context.entityHints.includes("github.gist") ||
    combinedWords.has("gist");
  const projectContext =
    context.entityHints.includes("github.project") ||
    combinedWords.has("project");
  const packageContext =
    context.entityHints.includes("github.package") ||
    combinedWords.has("package");
  const codespaceContext =
    context.entityHints.includes("github.codespace") ||
    combinedWords.has("codespace");

  const fieldDescriptionWords = new Set(descriptionWords);
  if (
    PAGINATION_FIELD_NAMES.has(lowerName) ||
    PAGINATION_FIELD_NAMES.has(lowerPath) ||
    fieldDescriptionWords.has("pagination")
  ) {
    return {
      semanticClass: "pagination",
      confidence: "high",
      evidence: addEvidence(fieldEvidence, `field '${field.path}' classified as pagination noise`),
    };
  }

  if (
    CONFIG_FIELD_NAMES.has(lowerName) ||
    CONFIG_FIELD_NAMES.has(lowerPath) ||
    lowerName.startsWith("include_") ||
    lowerName.endsWith("_id") && combinedWords.has("account")
  ) {
    return {
      semanticClass: "config",
      confidence: "high",
      evidence: addEvidence(fieldEvidence, `field '${field.path}' classified as config/auth noise`),
    };
  }

  if (["query", "search_query", "search", "keyword", "keywords", "q"].includes(lowerName)) {
    return {
      semanticClass: "content_input",
      canonicalResource: "search.query",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched explicit search-query alias`,
        `tool '${context.slug}' indicates search semantics`
      ),
    };
  }

  if (
    ["name", "full_name", "display_name", "person_name", "contact_name"].includes(lowerName) &&
    (contactContext || combinedWords.has("person"))
  ) {
    return {
      semanticClass: "person_input",
      canonicalResource: "person.name",
      confidence: "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched person-name alias`,
        `tool '${context.slug}' indicates contact/person context`
      ),
    };
  }

  if ((lowerName === "thread_id" || lowerPath.endsWith(".thread_id")) && threadContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "gmail.thread.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched alias 'thread_id'`,
        `tool '${context.slug}' indicates gmail-thread context`
      ),
    };
  }

  if (lowerName === "id" && threadContext && lowerPath.includes("thread")) {
    return {
      semanticClass: "identifier",
      canonicalResource: "gmail.thread.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched nested thread id pattern`,
        `tool '${context.slug}' indicates gmail-thread context`
      ),
    };
  }

  if ((lowerName === "message_id" || lowerPath.endsWith(".message_id")) && messageContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "gmail.message.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched alias 'message_id'`,
        `tool '${context.slug}' indicates gmail-message context`
      ),
    };
  }

  if (lowerName === "id" && messageContext && lowerPath.includes("message")) {
    return {
      semanticClass: "identifier",
      canonicalResource: "gmail.message.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched nested message id pattern`,
        `tool '${context.slug}' indicates gmail-message context`
      ),
    };
  }

  if (lowerName === "issue_number" || (issueContext && lowerName === "number")) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.issue.number",
      confidence: lowerName === "issue_number" ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched issue-number alias`,
        `tool '${context.slug}' indicates github-issue context`
      ),
    };
  }

  if (lowerName === "pull_number" || lowerName === "pr_number" || (pullContext && lowerName === "number")) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.pull.number",
      confidence: lowerName === "number" ? "medium" : "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched pull-number alias`,
        `tool '${context.slug}' indicates github-pull context`
      ),
    };
  }

  if (repositoryScoped && lowerName === "name" && /(repository|repo)/.test(lowerPath)) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.repo.name",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched nested repository name pattern`,
        `tool '${context.slug}' is repository-scoped`
      ),
    };
  }

  if (["repo", "repository", "repo_name", "repository_name"].includes(lowerName)) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.repo.name",
      confidence: repositoryScoped ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched repository-name alias`,
        repositoryScoped
          ? `tool '${context.slug}' is repository-scoped`
          : `field '${field.path}' suggests repository identity without strong scope`
      ),
    };
  }

  if (
    repositoryScoped &&
    ["owner", "org", "organization", "repo_owner", "repository_owner", "username"].includes(lowerName)
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.repo.owner",
      confidence: lowerName === "username" ? "medium" : "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched repository-owner alias '${lowerName}'`,
        `tool '${context.slug}' is repository-scoped`
      ),
    };
  }

  if (
    repositoryScoped &&
    (/(repository|repo)\.owner/.test(lowerPath) || (lowerName === "login" && lowerPath.includes("owner")))
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.repo.owner",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched nested repository owner pattern`,
        `tool '${context.slug}' is repository-scoped`
      ),
    };
  }

  if (["sha", "commit_sha"].includes(lowerName) && (context.entityHints.includes("github.commit") || combinedWords.has("commit"))) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.commit.sha",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched commit-sha alias`,
        `tool '${context.slug}' indicates github-commit context`
      ),
    };
  }

  if ((lowerName === "id" || lowerName.endsWith("_id")) && calendarContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.calendar.event.id",
      confidence: lowerName === "id" ? "medium" : "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched calendar-event id pattern`,
        `tool '${context.slug}' indicates calendar-event context`
      ),
    };
  }

  if ((lowerName === "id" || lowerName === "file_id" || lowerName === "document_id") && driveContext && !folderContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.drive.file.id",
      confidence: lowerName === "id" ? "medium" : "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched drive-file id pattern`,
        `tool '${context.slug}' indicates drive/file context`
      ),
    };
  }

  if (
    ["album_id", "albumid"].includes(lowerName) && photosContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.photos.album.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched Google Photos album id alias`,
        `tool '${context.slug}' operates on a Google Photos album`
      ),
    };
  }

  if (
    ["tasklist_id", "task_list_id"].includes(lowerName) && tasksContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.tasks.tasklist.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched Google Tasks list id alias`,
        `tool '${context.slug}' operates on a Google Tasks list`
      ),
    };
  }

  if (
    ["task_id"].includes(lowerName) && tasksContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.tasks.task.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched Google Tasks task id alias`,
        `tool '${context.slug}' operates on a Google Task`
      ),
    };
  }

  if (
    ["draft_id", "user_id"].includes(lowerName) && draftContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: lowerName === "draft_id" ? "gmail.draft.id" : "gmail.draft.id",
      confidence: lowerName === "draft_id" ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched Gmail draft id alias`,
        `tool '${context.slug}' operates on a Gmail draft`
      ),
    };
  }

  if (
    ["secret_name"].includes(lowerName) && secretContext
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.secret.name",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched GitHub secret name alias`,
        `tool '${context.slug}' operates on a GitHub secret`
      ),
    };
  }

  if (
    ["classroom_id"].includes(lowerName) && classroomContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.classroom.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched GitHub classroom id alias`,
        `tool '${context.slug}' operates on a GitHub classroom`
      ),
    };
  }

  if (
    ["assignment_id"].includes(lowerName) && classroomContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.assignment.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched GitHub assignment id alias`,
        `tool '${context.slug}' operates on a GitHub assignment`
      ),
    };
  }

  if (
    ["drive_id", "driveid"].includes(lowerName) && driveContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.drive.shared.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched shared drive id alias`,
        `tool '${context.slug}' operates on a Google shared drive`
      ),
    };
  }

  if (
    ["spreadsheet_id", "spreadsheetid"].includes(lowerName) && sheetsContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.sheets.spreadsheet.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched spreadsheet id alias`,
        `tool '${context.slug}' operates on a Google Sheets spreadsheet`
      ),
    };
  }

  if (
    ["sheet_id", "sheetid", "tab_id", "tabid"].includes(lowerName) && sheetsContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.sheets.sheet.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched sheet/tab id alias`,
        `tool '${context.slug}' operates on a sheet within a spreadsheet`
      ),
    };
  }

  if (
    ["documentid", "document_id"].includes(lowerName) && docsContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.docs.document.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched Google Docs document id alias`,
        `tool '${context.slug}' operates on a Google Doc`
      ),
    };
  }

  if (
    ["folder_id", "parent_folder_id", "parent_id", "destination_folder_id", "add_parents", "remove_parents"].includes(lowerName) &&
    (folderContext || driveContext)
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.drive.folder.id",
      confidence: lowerName === "parent_id" ? "medium" : "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched drive-folder id alias '${lowerName}'`,
        `tool '${context.slug}' indicates drive/folder context`
      ),
    };
  }

  if ((lowerName === "id" || lowerName === "folder_id") && folderContext && !driveContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "google.drive.folder.id",
      confidence: lowerName === "id" ? "medium" : "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched folder id pattern`,
        `tool '${context.slug}' indicates folder context`
      ),
    };
  }

  if (["label_id", "label_ids"].includes(lowerName) && labelContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "gmail.label.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched gmail-label id alias`,
        `tool '${context.slug}' indicates gmail-label context`
      ),
    };
  }

  if (lowerName === "id" && labelContext && lowerPath.includes("label")) {
    return {
      semanticClass: "identifier",
      canonicalResource: "gmail.label.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched nested label id pattern`,
        `tool '${context.slug}' indicates gmail-label context`
      ),
    };
  }

  if (
    lowerName === "org" ||
    (["organization", "org_name", "organization_name"].includes(lowerName) && context.toolkit === "github")
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.org.name",
      confidence: lowerName === "org" && context.toolkit === "github" ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-org alias '${lowerName}'`,
        `tool '${context.slug}' operates on a GitHub organization`
      ),
    };
  }

  if (
    ["team_slug", "team_name"].includes(lowerName) &&
    (teamContext || context.toolkit === "github")
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.team.slug",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-team alias '${lowerName}'`,
        `tool '${context.slug}' operates on a GitHub team`
      ),
    };
  }

  if (
    ["gist_id"].includes(lowerName) ||
    (lowerName === "id" && gistContext)
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.gist.id",
      confidence: lowerName === "gist_id" ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-gist id alias`,
        `tool '${context.slug}' operates on a GitHub gist`
      ),
    };
  }

  if (
    ["project_id"].includes(lowerName) ||
    (lowerName === "id" && projectContext && !issueContext && !pullContext)
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.project.id",
      confidence: lowerName === "project_id" ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-project id alias`,
        `tool '${context.slug}' operates on a GitHub project`
      ),
    };
  }

  if (["column_id"].includes(lowerName) && projectContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.project.column.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-project column id alias`,
        `tool '${context.slug}' operates on a GitHub project column`
      ),
    };
  }

  if (["card_id"].includes(lowerName) && projectContext) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.project.card.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-project card id alias`,
        `tool '${context.slug}' operates on a GitHub project card`
      ),
    };
  }

  if (
    ["package_name"].includes(lowerName) && packageContext
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.package.name",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-package name alias`,
        `tool '${context.slug}' operates on a GitHub package`
      ),
    };
  }

  if (
    ["package_version_id"].includes(lowerName) && packageContext
  ) {
    return {
      semanticClass: "identifier",
      canonicalResource: "github.package.version.id",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-package version id alias`,
        `tool '${context.slug}' operates on a GitHub package version`
      ),
    };
  }

  if (
    ["codespace_name"].includes(lowerName) && codespaceContext
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.codespace.name",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-codespace name alias`,
        `tool '${context.slug}' operates on a GitHub codespace`
      ),
    };
  }

  if (
    lowerName === "username" &&
    context.toolkit === "github" &&
    !repositoryScoped
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.user.login",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched github-user login alias`,
        `tool '${context.slug}' operates on a GitHub user`
      ),
    };
  }

  if (
    ["ref", "branch", "head", "base", "default_branch"].includes(lowerName) &&
    (branchContext || repositoryScoped)
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "github.branch.ref",
      confidence: ["ref", "branch"].includes(lowerName) ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched git-branch alias '${lowerName}'`,
        `tool '${context.slug}' indicates github branch/repo context`
      ),
    };
  }

  if (
    lowerName.includes("email") ||
    ["to", "cc", "bcc", "recipient", "recipients"].includes(lowerName)
  ) {
    return {
      semanticClass: "locator",
      canonicalResource: "email.address",
      confidence: emailContext ? "high" : "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched email-address alias`,
        emailContext
          ? `tool '${context.slug}' indicates email/contact context`
          : `field '${field.path}' appears to contain an email address`
      ),
    };
  }

  if (emailContext && TITLE_LIKE.has(lowerName)) {
    return {
      semanticClass: "content_input",
      canonicalResource: "email.subject",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched email subject alias`,
        `tool '${context.slug}' indicates email context`
      ),
    };
  }

  if (emailContext && BODY_LIKE.has(lowerName)) {
    return {
      semanticClass: "content_input",
      canonicalResource: "email.body",
      confidence: "high",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched email body/content alias`,
        `tool '${context.slug}' indicates email context`
      ),
    };
  }

  if (issueContext && lowerName === "title") {
    return {
      semanticClass: "content_input",
      canonicalResource: "github.issue.title",
      confidence: "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched issue title alias`,
        `tool '${context.slug}' indicates github-issue context`
      ),
    };
  }

  if (issueContext && BODY_LIKE.has(lowerName)) {
    return {
      semanticClass: "content_input",
      canonicalResource: "github.issue.body",
      confidence: "medium",
      evidence: addEvidence(
        fieldEvidence,
        `field '${field.path}' matched issue body/content alias`,
        `tool '${context.slug}' indicates github-issue context`
      ),
    };
  }

  if (["state", "status", "label", "labels", "assignee", "author", "since"].includes(lowerName)) {
    return {
      semanticClass: "filter",
      confidence: "medium",
      evidence: addEvidence(fieldEvidence, `field '${field.path}' classified as filter input`),
    };
  }

  return {
    semanticClass: "unknown",
    confidence: "low",
    evidence: addEvidence(fieldEvidence, `field '${field.path}' did not match a deterministic canonical-resource rule`),
  };
}

function inferActionHints(slug: string, name: string, description: string) {
  const text = `${slug} ${name} ${description}`.toLowerCase();
  return {
    list: /\blist\b/.test(text),
    get: /\bget\b|\bretrieve\b|\bread\b/.test(text),
    search: /\bsearch\b|\bfind\b/.test(text),
    create: /\bcreate\b|\badd\b|\breply\b|\bsend\b/.test(text),
  };
}

function slugHasToken(slug: string, ...tokens: string[]) {
  const normalized = `_${slug.toUpperCase()}_`;
  return tokens.some((token) => normalized.includes(`_${token.toUpperCase()}_`));
}

function pushSyntheticField(
  outputFields: FieldRecord[],
  seenResources: Set<string>,
  resourceType: string,
  semanticClass: SemanticClass,
  confidence: Confidence,
  evidence: string[]
) {
  if (seenResources.has(resourceType)) {
    return;
  }

  outputFields.push({
    path: `$heuristic.${resourceType}`,
    name: resourceType.split(".").at(-1) ?? resourceType,
    required: false,
    primitiveType: "string",
    canonicalResource: resourceType,
    semanticClass,
    confidence,
    evidence,
  });
  seenResources.add(resourceType);
}

function inferHeuristicOutputs(tool: ToolRecord): FieldRecord[] {
  const outputs = [...tool.outputFields];
  const seenResources = new Set(
    tool.outputFields
      .map((field) => field.canonicalResource)
      .filter((value): value is string => typeof value === "string")
  );

  const actions = inferActionHints(tool.slug, tool.name, tool.description);
  const canProduce = actions.list || actions.get || actions.search || actions.create;
  const threadSlug = slugHasToken(tool.slug, "THREAD", "THREADS");
  const messageSlug = slugHasToken(tool.slug, "MESSAGE", "MESSAGES", "EMAIL", "EMAILS");
  const contactSlug = slugHasToken(tool.slug, "CONTACT", "CONTACTS");
  const eventSlug = slugHasToken(tool.slug, "EVENT", "EVENTS");
  const fileSlug = slugHasToken(tool.slug, "FILE", "FILES", "DOCUMENT", "DOCUMENTS");
  const folderSlug = slugHasToken(tool.slug, "FOLDER", "FOLDERS");
  const spreadsheetSlug = slugHasToken(tool.slug, "SPREADSHEET", "SPREADSHEETS", "SHEET", "SHEETS");
  const docsSlug = slugHasToken(tool.slug, "DOCUMENT", "DOCUMENTS", "DOC", "DOCS");
  const albumSlug = slugHasToken(tool.slug, "ALBUM", "ALBUMS", "MEDIA", "PHOTO", "PHOTOS");
  const taskSlug = slugHasToken(tool.slug, "TASK", "TASKS");
  const draftSlug = slugHasToken(tool.slug, "DRAFT", "DRAFTS");
  const secretSlug = slugHasToken(tool.slug, "SECRET", "SECRETS");
  const classroomSlug = slugHasToken(tool.slug, "CLASSROOM", "CLASSROOMS");
  const assignmentSlug = slugHasToken(tool.slug, "ASSIGNMENT", "ASSIGNMENTS");
  const driveIdSlug = slugHasToken(tool.slug, "DRIVE", "DRIVES") && !fileSlug && !folderSlug;
  const labelSlug = slugHasToken(tool.slug, "LABEL", "LABELS");
  const issueSlug = slugHasToken(tool.slug, "ISSUE", "ISSUES");
  const pullSlug = slugHasToken(tool.slug, "PULL", "PULLS", "PULL_REQUEST", "PULL_REQUESTS");
  const repoSlug = slugHasToken(tool.slug, "REPO", "REPOS", "REPOSITORY", "REPOSITORIES");
  const commitSlug = slugHasToken(tool.slug, "COMMIT", "COMMITS");
  const branchSlug = slugHasToken(tool.slug, "BRANCH", "BRANCHES");
  const orgSlug = slugHasToken(tool.slug, "ORG", "ORGANIZATION", "ORGANIZATIONS");
  const teamSlug = slugHasToken(tool.slug, "TEAM", "TEAMS");
  const gistSlug = slugHasToken(tool.slug, "GIST", "GISTS");
  const projectSlug = slugHasToken(tool.slug, "PROJECT", "PROJECTS");
  const packageSlug = slugHasToken(tool.slug, "PACKAGE", "PACKAGES");
  const codespaceSlug = slugHasToken(tool.slug, "CODESPACE", "CODESPACES");

  if (!canProduce) {
    return outputs;
  }

  if (threadSlug) {
    pushSyntheticField(outputs, seenResources, "gmail.thread.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate gmail-thread records are returned`,
    ]);
    pushSyntheticField(outputs, seenResources, "gmail.message.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `gmail threads contain messages with message IDs`,
    ]);
  }

  if (messageSlug) {
    pushSyntheticField(outputs, seenResources, "gmail.message.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate gmail-message records are returned`,
    ]);
  }

  if (contactSlug) {
    pushSyntheticField(outputs, seenResources, "email.address", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate contact email addresses are returned`,
    ]);
  }

  if (eventSlug) {
    pushSyntheticField(outputs, seenResources, "google.calendar.event.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate calendar-event records are returned`,
    ]);
  }

  if (fileSlug) {
    pushSyntheticField(outputs, seenResources, "google.drive.file.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate drive-file records are returned`,
    ]);
  }

  if (folderSlug) {
    pushSyntheticField(outputs, seenResources, "google.drive.folder.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate drive-folder records are returned`,
    ]);
  }

  if (spreadsheetSlug && tool.toolkit === "googlesuper") {
    pushSyntheticField(outputs, seenResources, "google.sheets.spreadsheet.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate Google Sheets spreadsheet data is returned`,
    ]);
    pushSyntheticField(outputs, seenResources, "google.sheets.sheet.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate sheet/tab data is returned`,
    ]);
  }

  if (docsSlug && tool.toolkit === "googlesuper") {
    pushSyntheticField(outputs, seenResources, "google.docs.document.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate Google Docs document data is returned`,
    ]);
  }

  if (albumSlug && tool.toolkit === "googlesuper") {
    pushSyntheticField(outputs, seenResources, "google.photos.album.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate Google Photos album data is returned`,
    ]);
  }

  if (taskSlug && tool.toolkit === "googlesuper") {
    pushSyntheticField(outputs, seenResources, "google.tasks.tasklist.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate Google Tasks list data is returned`,
    ]);
    pushSyntheticField(outputs, seenResources, "google.tasks.task.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate Google Task data is returned`,
    ]);
  }

  if (draftSlug && tool.toolkit === "googlesuper") {
    pushSyntheticField(outputs, seenResources, "gmail.draft.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate Gmail draft data is returned`,
    ]);
  }

  if (secretSlug && tool.toolkit === "github") {
    pushSyntheticField(outputs, seenResources, "github.secret.name", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate GitHub secret data is returned`,
    ]);
  }

  if (classroomSlug && tool.toolkit === "github") {
    pushSyntheticField(outputs, seenResources, "github.classroom.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate GitHub classroom data is returned`,
    ]);
  }

  if (assignmentSlug && tool.toolkit === "github") {
    pushSyntheticField(outputs, seenResources, "github.assignment.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate GitHub assignment data is returned`,
    ]);
  }

  if (driveIdSlug && tool.toolkit === "googlesuper") {
    pushSyntheticField(outputs, seenResources, "google.drive.shared.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate Google shared drive data is returned`,
    ]);
  }

  if (labelSlug && tool.toolkit === "googlesuper") {
    pushSyntheticField(outputs, seenResources, "gmail.label.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate gmail-label records are returned`,
    ]);
  }

  if (issueSlug) {
    pushSyntheticField(outputs, seenResources, "github.issue.number", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github-issue records are returned`,
    ]);
  }

  if (pullSlug) {
    pushSyntheticField(outputs, seenResources, "github.pull.number", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github-pull records are returned`,
    ]);
  }

  if (repoSlug) {
    pushSyntheticField(outputs, seenResources, "github.repo.owner", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github repository owner data is returned`,
    ]);
    pushSyntheticField(outputs, seenResources, "github.repo.name", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github repository name data is returned`,
    ]);
  }

  if (commitSlug) {
    pushSyntheticField(outputs, seenResources, "github.commit.sha", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github commit records are returned`,
    ]);
  }

  if (branchSlug) {
    pushSyntheticField(outputs, seenResources, "github.branch.ref", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github branch references are returned`,
    ]);
  }

  if (orgSlug) {
    pushSyntheticField(outputs, seenResources, "github.org.name", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github organization data is returned`,
    ]);
  }

  if (teamSlug) {
    pushSyntheticField(outputs, seenResources, "github.team.slug", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github team data is returned`,
    ]);
  }

  if (gistSlug) {
    pushSyntheticField(outputs, seenResources, "github.gist.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github gist data is returned`,
    ]);
  }

  if (projectSlug) {
    pushSyntheticField(outputs, seenResources, "github.project.id", "identifier", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github project data is returned`,
    ]);
    if (slugHasToken(tool.slug, "COLUMN", "COLUMNS")) {
      pushSyntheticField(outputs, seenResources, "github.project.column.id", "identifier", "medium", [
        `heuristic output inference for '${tool.slug}'`,
        `tool slug and action indicate github project column data is returned`,
      ]);
    }
    if (slugHasToken(tool.slug, "CARD", "CARDS")) {
      pushSyntheticField(outputs, seenResources, "github.project.card.id", "identifier", "medium", [
        `heuristic output inference for '${tool.slug}'`,
        `tool slug and action indicate github project card data is returned`,
      ]);
    }
  }

  if (packageSlug) {
    pushSyntheticField(outputs, seenResources, "github.package.name", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github package data is returned`,
    ]);
    if (slugHasToken(tool.slug, "VERSION", "VERSIONS")) {
      pushSyntheticField(outputs, seenResources, "github.package.version.id", "identifier", "medium", [
        `heuristic output inference for '${tool.slug}'`,
        `tool slug and action indicate github package version data is returned`,
      ]);
    }
  }

  if (codespaceSlug) {
    pushSyntheticField(outputs, seenResources, "github.codespace.name", "locator", "medium", [
      `heuristic output inference for '${tool.slug}'`,
      `tool slug and action indicate github codespace data is returned`,
    ]);
  }

  return outputs.sort((left, right) => left.path.localeCompare(right.path));
}

function normalizeFields(
  schema: unknown,
  context: ClassificationContext
): FieldRecord[] {
  return flattenSchema(schema).map((field) => {
    const classification = classifyField(field, context);
    return {
      path: field.path,
      name: field.name,
      required: field.required,
      description: field.description,
      primitiveType: field.primitiveType,
      canonicalResource: classification.canonicalResource,
      semanticClass: classification.semanticClass,
      confidence: classification.confidence,
      evidence: classification.evidence,
    };
  });
}

export function normalizeRawTool(rawTool: RawToolRecord, toolkit: ToolkitSlug): ToolRecord {
  const description =
    typeof rawTool.human_description === "string" && rawTool.human_description.trim().length > 0
      ? rawTool.human_description
      : typeof rawTool.description === "string"
        ? rawTool.description
        : "";

  const name = typeof rawTool.name === "string" ? rawTool.name : rawTool.slug;
  const slug = rawTool.slug;
  const entityHints = parseEntityHints(slug, name, description);

  const inputFields = normalizeFields(rawTool.input_parameters ?? {}, {
    direction: "input",
    toolkit,
    slug,
    name,
    description,
    entityHints,
  });

  const explicitOutputFields = normalizeFields(rawTool.output_parameters ?? {}, {
    direction: "output",
    toolkit,
    slug,
    name,
    description,
    entityHints,
  });

  const tool: ToolRecord = {
    slug,
    toolkit,
    name,
    description,
    inputFields: inputFields.sort((left, right) => left.path.localeCompare(right.path)),
    outputFields: explicitOutputFields.sort((left, right) => left.path.localeCompare(right.path)),
    entityHints,
  };

  return {
    ...tool,
    outputFields: inferHeuristicOutputs(tool),
  };
}

export function normalizeSnapshots(
  snapshots: Array<{ toolkit: ToolkitSlug; items: RawToolRecord[] }>
): ToolRecord[] {
  return snapshots
    .flatMap((snapshot) =>
      snapshot.items.map((rawTool) => normalizeRawTool(rawTool, snapshot.toolkit))
    )
    .sort((left, right) =>
      left.toolkit.localeCompare(right.toolkit) || left.slug.localeCompare(right.slug)
    );
}
