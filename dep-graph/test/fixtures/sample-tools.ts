import type { RawToolRecord } from "../../src/lib/types";

function objectSchema(
  properties: Record<string, unknown>,
  required: string[] = []
): Record<string, unknown> {
  return {
    type: "object",
    properties,
    required,
  };
}

export const fixtureSnapshots: Array<{
  toolkit: "googlesuper" | "github";
  items: RawToolRecord[];
}> = [
  {
    toolkit: "googlesuper",
    items: [
      {
        slug: "GMAIL_REPLY_TO_THREAD",
        name: "Reply To Thread",
        description: "Reply to an existing Gmail thread by thread_id.",
        input_parameters: objectSchema(
          {
            thread_id: { type: "string", description: "The Gmail thread identifier." },
            body: { type: "string", description: "Body of the reply email." },
            include_body: { type: "boolean", description: "Include original body in response." },
          },
          ["thread_id", "body"]
        ),
        output_parameters: objectSchema({
          message_id: { type: "string", description: "Identifier of the sent reply message." },
        }),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
      {
        slug: "GMAIL_LIST_THREADS",
        name: "List Threads",
        description: "List Gmail threads for a mailbox.",
        input_parameters: objectSchema({
          page: { type: "integer", description: "Page number for pagination." },
        }),
        output_parameters: objectSchema({
          threads: {
            type: "array",
            items: objectSchema({
              id: { type: "string", description: "The Gmail thread ID." },
              subject: { type: "string", description: "The subject line." },
            }),
          },
        }),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
      {
        slug: "GOOGLE_CONTACTS_FIND_CONTACT",
        name: "Find Contact",
        description: "Search contacts by person name or search query.",
        input_parameters: objectSchema({
          person_name: { type: "string", description: "Name of the person to search for." },
          search_query: { type: "string", description: "General contact query." },
        }),
        output_parameters: objectSchema({
          contacts: {
            type: "array",
            items: objectSchema({
              email: { type: "string", description: "Primary email address for the contact." },
              display_name: { type: "string", description: "Contact display name." },
            }),
          },
        }),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
      {
        slug: "GMAIL_SEND_EMAIL",
        name: "Send Email",
        description: "Send an email message to recipients.",
        input_parameters: objectSchema(
          {
            to: { type: "string", description: "Recipient email address." },
            subject: { type: "string", description: "Email subject line." },
            body: { type: "string", description: "Email body content." },
            per_page: { type: "integer", description: "Unused pagination noise." },
          },
          ["to", "subject", "body"]
        ),
        output_parameters: objectSchema({
          thread_id: { type: "string", description: "Thread ID for the sent email." },
        }),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
      {
        slug: "GOOGLESUPER_ADD_LABEL_TO_EMAIL",
        name: "Add Label To Email",
        description: "Add a Gmail label to a specific email message.",
        input_parameters: objectSchema(
          {
            message_id: { type: "string", description: "Gmail message identifier." },
            label_ids: { type: "array", items: { type: "string" }, description: "Label IDs to apply." },
          },
          ["message_id", "label_ids"]
        ),
        output_parameters: objectSchema({}),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
      {
        slug: "GOOGLESUPER_CREATE_LABEL",
        name: "Create Label",
        description: "Create a new Gmail label.",
        input_parameters: objectSchema(
          { name: { type: "string", description: "Name of the label." } },
          ["name"]
        ),
        output_parameters: objectSchema({
          id: { type: "string", description: "The created label ID." },
        }),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
      {
        slug: "GOOGLEDRIVE_MOVE_FILE",
        name: "Move File",
        description: "Move a file from one folder to another in Google Drive.",
        input_parameters: objectSchema(
          {
            file_id: { type: "string", description: "The ID of the file to move." },
            add_parents: { type: "string", description: "Destination folder ID." },
            remove_parents: { type: "string", description: "Source folder ID." },
          },
          ["file_id", "add_parents", "remove_parents"]
        ),
        output_parameters: objectSchema({}),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
      {
        slug: "GOOGLEDRIVE_CREATE_FOLDER",
        name: "Create Folder",
        description: "Create a new folder in Google Drive.",
        input_parameters: objectSchema(
          { name: { type: "string", description: "Folder name." } },
          ["name"]
        ),
        output_parameters: objectSchema({
          id: { type: "string", description: "The created folder ID." },
        }),
        toolkit: { slug: "googlesuper", name: "Google Super" },
      },
    ],
  },
  {
    toolkit: "github",
    items: [
      {
        slug: "GITHUB_ADD_LABELS_TO_AN_ISSUE",
        name: "Add Labels To An Issue",
        description: "Add labels to a GitHub issue in a repository.",
        input_parameters: objectSchema(
          {
            owner: { type: "string", description: "Owner of the repository." },
            repo: { type: "string", description: "Repository name." },
            issue_number: { type: "integer", description: "Issue number." },
            labels: {
              type: "array",
              items: { type: "string", description: "Label to add." },
            },
          },
          ["owner", "repo", "issue_number", "labels"]
        ),
        output_parameters: objectSchema({
          number: { type: "integer", description: "Issue number after mutation." },
        }),
        toolkit: { slug: "github", name: "GitHub" },
      },
      {
        slug: "GITHUB_LIST_ISSUES",
        name: "List Issues",
        description: "List issues in a GitHub repository.",
        input_parameters: objectSchema(
          {
            owner: { type: "string", description: "Repository owner." },
            repo: { type: "string", description: "Repository name." },
            state: { type: "string", description: "Issue state filter." },
            page: { type: "integer", description: "Page number." },
          },
          ["owner", "repo"]
        ),
        output_parameters: objectSchema({
          issues: {
            type: "array",
            items: objectSchema({
              number: { type: "integer", description: "GitHub issue number." },
              title: { type: "string", description: "Issue title." },
            }),
          },
        }),
        toolkit: { slug: "github", name: "GitHub" },
      },
      {
        slug: "GITHUB_GET_REPOSITORY",
        name: "Get Repository",
        description: "Retrieve a GitHub repository.",
        input_parameters: objectSchema(
          {
            owner: { type: "string", description: "Repository owner." },
            repo: { type: "string", description: "Repository name." },
          },
          ["owner", "repo"]
        ),
        output_parameters: objectSchema({
          repository: objectSchema({
            owner: { type: "string", description: "Repository owner login." },
            name: { type: "string", description: "Repository name." },
          }),
        }),
        toolkit: { slug: "github", name: "GitHub" },
      },
      {
        slug: "GITHUB_LIST_BRANCHES",
        name: "List Branches",
        description: "List branches for a GitHub repository.",
        input_parameters: objectSchema(
          {
            owner: { type: "string", description: "Repository owner." },
            repo: { type: "string", description: "Repository name." },
          },
          ["owner", "repo"]
        ),
        output_parameters: objectSchema({
          branches: {
            type: "array",
            items: objectSchema({
              name: { type: "string", description: "Branch name." },
              commit: objectSchema({
                sha: { type: "string", description: "Head commit SHA." },
              }),
            }),
          },
        }),
        toolkit: { slug: "github", name: "GitHub" },
      },
      {
        slug: "GITHUB_CREATE_PULL_REQUEST",
        name: "Create Pull Request",
        description: "Create a new pull request for a GitHub repository.",
        input_parameters: objectSchema(
          {
            owner: { type: "string", description: "Repository owner." },
            repo: { type: "string", description: "Repository name." },
            title: { type: "string", description: "Pull request title." },
            head: { type: "string", description: "The branch containing changes." },
            base: { type: "string", description: "The branch to merge into." },
          },
          ["owner", "repo", "title", "head", "base"]
        ),
        output_parameters: objectSchema({
          number: { type: "integer", description: "Pull request number." },
        }),
        toolkit: { slug: "github", name: "GitHub" },
      },
    ],
  },
];
