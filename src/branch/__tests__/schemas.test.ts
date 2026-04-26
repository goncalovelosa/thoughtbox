import { describe, expect, it } from "vitest";
import { validateBranchArgs } from "../schemas.js";

describe("validateBranchArgs", () => {
  it("rejects unknown operations", () => {
    const r = validateBranchArgs("clone", { sessionId: "s" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Unknown branch operation");
  });

  describe("spawn", () => {
    it("accepts a valid input", () => {
      const r = validateBranchArgs("spawn", {
        sessionId: "s",
        branchId: "b",
        branchFromThought: 2,
      });
      expect(r.ok).toBe(true);
    });

    it("rejects missing branchFromThought with a clear message", () => {
      const r = validateBranchArgs("spawn", { sessionId: "s", branchId: "b" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("branchFromThought");
    });

    it("rejects non-positive branchFromThought", () => {
      const r = validateBranchArgs("spawn", {
        sessionId: "s",
        branchId: "b",
        branchFromThought: 0,
      });
      expect(r.ok).toBe(false);
    });
  });

  describe("merge", () => {
    it("accepts a valid 'selected' merge", () => {
      const r = validateBranchArgs("merge", {
        sessionId: "s",
        synthesis: "we picked A",
        resolution: "selected",
        selectedBranchId: "a",
      });
      expect(r.ok).toBe(true);
    });

    it("accepts 'synthesized' merge without selectedBranchId", () => {
      const r = validateBranchArgs("merge", {
        sessionId: "s",
        synthesis: "blended A and B",
        resolution: "synthesized",
      });
      expect(r.ok).toBe(true);
    });

    it("rejects 'selected' resolution with no selectedBranchId", () => {
      const r = validateBranchArgs("merge", {
        sessionId: "s",
        synthesis: "x",
        resolution: "selected",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("selectedBranchId is required");
    });

    it("rejects empty synthesis with the field name in the error", () => {
      const r = validateBranchArgs("merge", {
        sessionId: "s",
        synthesis: "",
        resolution: "synthesized",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("synthesis");
    });

    it("rejects an unknown resolution value", () => {
      const r = validateBranchArgs("merge", {
        sessionId: "s",
        synthesis: "x",
        resolution: "merged-but-not-really",
      });
      expect(r.ok).toBe(false);
    });

    it("translates the legacy mergeMessage/branchIds shape into a friendly error", () => {
      // This is the wrong-shape call that previously surfaced as
      // 'null value in column "thought" violates not-null constraint'
      const r = validateBranchArgs("merge", {
        sessionId: "s",
        branchIds: ["a", "b"],
        selectedBranchId: "a",
        mergeMessage: "selected A",
      });
      expect(r.ok).toBe(false);
      if (!r.ok) {
        expect(r.error).toContain("synthesis");
        expect(r.error).toContain("resolution");
      }
    });
  });

  describe("list", () => {
    it("accepts a valid input", () => {
      expect(validateBranchArgs("list", { sessionId: "s" }).ok).toBe(true);
    });

    it("rejects missing sessionId", () => {
      const r = validateBranchArgs("list", {});
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("sessionId");
    });
  });

  describe("get", () => {
    it("accepts a valid input", () => {
      expect(
        validateBranchArgs("get", { sessionId: "s", branchId: "b" }).ok,
      ).toBe(true);
    });

    it("rejects missing branchId", () => {
      const r = validateBranchArgs("get", { sessionId: "s" });
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toContain("branchId");
    });
  });
});
