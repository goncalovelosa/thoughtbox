import { describe, expect, test } from "bun:test";
import { buildGraph } from "../src/lib/graph";
import { normalizeSnapshots } from "../src/lib/normalize";
import { fixtureSnapshots } from "./fixtures/sample-tools";

const normalizedTools = normalizeSnapshots(fixtureSnapshots);
const graphResult = buildGraph(normalizedTools);

function getTool(slug: string) {
  const tool = normalizedTools.find((item) => item.slug === slug);
  expect(tool).toBeDefined();
  return tool!;
}

describe("field normalization", () => {
  test("GMAIL_REPLY_TO_THREAD requires gmail.thread.id", () => {
    const tool = getTool("GMAIL_REPLY_TO_THREAD");
    expect(
      tool.inputFields.some(
        (field) =>
          field.path === "thread_id" &&
          field.canonicalResource === "gmail.thread.id" &&
          field.confidence === "high"
      )
    ).toBe(true);
  });

  test("GitHub issue mutation requires repo owner, repo name, and issue number", () => {
    const tool = getTool("GITHUB_ADD_LABELS_TO_AN_ISSUE");
    const resources = new Set(
      tool.inputFields
        .map((field) => field.canonicalResource)
        .filter((value): value is string => typeof value === "string")
    );

    expect(resources.has("github.repo.owner")).toBe(true);
    expect(resources.has("github.repo.name")).toBe(true);
    expect(resources.has("github.issue.number")).toBe(true);
  });
});

describe("graph construction", () => {
  test("at least one Google tool produces gmail.thread.id", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "gmail.thread.id" &&
          edge.from === "tool:GMAIL_LIST_THREADS"
      )
    ).toBe(true);
  });

  test("contact-search flow can feed send-email with email.address", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          edge.resourceType === "email.address" &&
          edge.to === "tool:GMAIL_SEND_EMAIL"
      )
    ).toBe(true);

    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "email.address" &&
          edge.from === "tool:GOOGLE_CONTACTS_FIND_CONTACT"
      )
    ).toBe(true);

    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          ["person.name", "search.query"].includes(edge.resourceType) &&
          edge.to === "tool:GOOGLE_CONTACTS_FIND_CONTACT"
      )
    ).toBe(true);
  });

  test("GitHub listing tool produces github.issue.number", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "github.issue.number" &&
          edge.from === "tool:GITHUB_LIST_ISSUES"
      )
    ).toBe(true);
  });

  test("gmail.message.id is produced by thread tools", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "gmail.message.id" &&
          edge.from === "tool:GMAIL_LIST_THREADS"
      )
    ).toBe(true);
  });

  test("gmail.message.id flows to ADD_LABEL_TO_EMAIL", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          edge.resourceType === "gmail.message.id" &&
          edge.to === "tool:GOOGLESUPER_ADD_LABEL_TO_EMAIL"
      )
    ).toBe(true);
  });

  test("gmail.label.id produced by CREATE_LABEL and consumed by ADD_LABEL_TO_EMAIL", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "gmail.label.id" &&
          edge.from === "tool:GOOGLESUPER_CREATE_LABEL"
      )
    ).toBe(true);

    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          edge.resourceType === "gmail.label.id" &&
          edge.to === "tool:GOOGLESUPER_ADD_LABEL_TO_EMAIL"
      )
    ).toBe(true);
  });

  test("google.drive.folder.id flows from CREATE_FOLDER to MOVE_FILE", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "google.drive.folder.id" &&
          edge.from === "tool:GOOGLEDRIVE_CREATE_FOLDER"
      )
    ).toBe(true);

    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          edge.resourceType === "google.drive.folder.id" &&
          edge.to === "tool:GOOGLEDRIVE_MOVE_FILE"
      )
    ).toBe(true);
  });

  test("github.branch.ref flows from LIST_BRANCHES to CREATE_PULL_REQUEST", () => {
    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "produces" &&
          edge.resourceType === "github.branch.ref" &&
          edge.from === "tool:GITHUB_LIST_BRANCHES"
      )
    ).toBe(true);

    expect(
      graphResult.graph.edges.some(
        (edge) =>
          edge.kind === "requires" &&
          edge.resourceType === "github.branch.ref" &&
          edge.to === "tool:GITHUB_CREATE_PULL_REQUEST"
      )
    ).toBe(true);
  });
});

describe("pipeline validation", () => {
  test("both toolkits are present and every tool has a plan hint", () => {
    expect(graphResult.summary.toolkitCounts.googlesuper).toBeGreaterThan(0);
    expect(graphResult.summary.toolkitCounts.github).toBeGreaterThan(0);
    expect(graphResult.toolPlanHints).toHaveLength(normalizedTools.length);
  });

  test("pagination and config fields do not become graph resources", () => {
    const resourceTypes = new Set(
      graphResult.graph.nodes
        .filter((node) => node.kind === "resource")
        .map((node) => node.resourceType)
    );

    expect(resourceTypes.has("page")).toBe(false);
    expect(resourceTypes.has("per_page")).toBe(false);
    expect(resourceTypes.has("include_body")).toBe(false);
  });

  test("every edge has evidence and confidence", () => {
    for (const edge of graphResult.graph.edges) {
      expect(edge.confidence === "high" || edge.confidence === "medium" || edge.confidence === "low").toBe(true);
      expect(edge.evidence.length).toBeGreaterThan(0);
    }
  });
});
