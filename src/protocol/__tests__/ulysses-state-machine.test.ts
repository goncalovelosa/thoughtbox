import { describe, expect, it } from "vitest";
import { InMemoryProtocolHandler } from "../index.js";

/**
 * Complete Ulysses state machine test coverage.
 *
 * States:
 *   A: S=0, active_step=null (checkpoint)
 *   B: S=1, active_step set (primary executing)
 *   C: S=2, active_step set (backup executing)
 *   D: S=2, active_step=null (reflect required)
 *
 * Every valid transition, every error transition, every enforcement sub-state.
 */

describe("Ulysses state machine", () => {
  // ---------------------------------------------------------------------------
  // Valid transitions
  // ---------------------------------------------------------------------------

  // A → plan → B
  it("plan transitions S=0 → S=1 with active_step set", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    const result = await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });

    expect(result.S).toBe(1);
    expect(result.primary).toBe("check logs");
    expect(result.recovery).toBe("check metrics");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toEqual({
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
      timestamp: expect.any(String),
    });
  });

  // B → outcome(expected) → A
  it("expected outcome at S=1 → S=0, checkpoint created", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });

    const result = await handler.ulyssesOutcome(sid, {
      assessment: "expected",
    });

    expect(result.S).toBe(0);
    expect(result.message).toContain("Checkpoint");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toBeNull();
  });

  // B → outcome(unexpected) → C
  it("unexpected outcome at S=1 → S=2, active_step retained for backup", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });

    const result = await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
      details: "logs were empty",
    });

    expect(result.S).toBe(2);
    expect(result.message).toContain("backup");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).not.toBeNull();
  });

  // C → outcome(expected) → A
  it("expected outcome at S=2 (backup succeeded) → S=0, checkpoint created", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });

    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
      details: "logs empty",
    });

    const result = await handler.ulyssesOutcome(sid, {
      assessment: "expected",
    });

    expect(result.S).toBe(0);
    expect(result.message).toContain("Checkpoint");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toBeNull();
  });

  // C → outcome(unexpected) → D
  it("unexpected outcome at S=2 (both moves unexpected) → S=2, reflect required, forbidden_moves populated", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });

    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
      details: "logs empty",
    });

    const result = await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
      details: "metrics empty too",
    });

    expect(result.S).toBe(2);
    expect(result.message).toContain("REFLECT");
    expect(result.forbidden_moves).toContain("check logs");
    expect(result.forbidden_moves).toContain("check metrics");

    const status = await handler.ulyssesStatus();
    expect(status.active_step).toBeNull();
  });

  // D → reflect → A
  it("reflect at S=2 (active_step null) → S=0", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });

    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
      details: "primary failed",
    });
    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
      details: "backup failed",
    });

    const result = await handler.ulyssesReflect(sid, {
      hypothesis: "config is wrong",
      falsification: "changing config doesn't fix it",
    });

    expect(result.S).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Error transitions
  // ---------------------------------------------------------------------------

  // D → plan → error
  it("plan at S=2 (reflect required) throws REFLECT error", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sid, { assessment: "unexpected-unfavorable" });
    await handler.ulyssesOutcome(sid, { assessment: "unexpected-unfavorable" });

    await expect(
      handler.ulyssesPlan(sid, { primary: "x", recovery: "y", irreversible: false }),
    ).rejects.toThrow(/REFLECT/);
  });

  // C → reflect → error
  it("reflect at S=2 with active_step still set throws backup-pending error", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
    });

    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
    });

    await expect(
      handler.ulyssesReflect(sid, {
        hypothesis: "h",
        falsification: "f",
      }),
    ).rejects.toThrow(/Backup move outcome not yet reported/);
  });

  // A → outcome → error
  it("outcome with no active_step throws error", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await expect(
      handler.ulyssesOutcome(sid, { assessment: "expected" }),
    ).rejects.toThrow(/No active step/);
  });

  // B → reflect → error
  it("reflect at S=1 throws S≠2 error", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
    });

    await expect(
      handler.ulyssesReflect(sid, {
        hypothesis: "h",
        falsification: "f",
      }),
    ).rejects.toThrow(/REFLECT requires S=2/);
  });

  // ---------------------------------------------------------------------------
  // Enforcement sub-states
  // ---------------------------------------------------------------------------

  // A → not blocked
  it("enforcement allows mutations at S=0 (checkpoint)", async () => {
    const handler = new InMemoryProtocolHandler();
    await handler.ulyssesInit("bug");

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(false);
  });

  // B → not blocked
  it("enforcement allows mutations at S=1 (primary executing)", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
    });

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(false);
  });

  // C → not blocked
  it("enforcement allows mutations at S=2 with active_step (backup executing)", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
    });

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(false);
  });

  // D → blocked
  it("enforcement blocks mutations at S=2 with no active_step (reflect required)", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "a",
      recovery: "b",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
    });
    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
    });

    const result = await handler.checkEnforcement({
      mutation: true,
      targetPath: "src/app.ts",
    });

    expect(result.enforce).toBe(true);
    expect(result.blocked).toBe(true);
    expect(result.required_action).toBe("reflect");
  });

  // ---------------------------------------------------------------------------
  // Data correctness
  // ---------------------------------------------------------------------------

  it("forbidden_moves contains both primary and recovery after both fail", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
    });
    const result = await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-unfavorable",
    });

    expect(result.forbidden_moves).toEqual(
      expect.arrayContaining(["check logs", "check metrics"]),
    );
  });

  it("unexpected-favorable at S=2 still forbids both moves", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-favorable",
    });
    const result = await handler.ulyssesOutcome(sid, {
      assessment: "unexpected-favorable",
    });

    expect(result.S).toBe(2);
    expect(result.forbidden_moves).toEqual(
      expect.arrayContaining(["check logs", "check metrics"]),
    );
  });

  it("forbidden_moves accumulate across multiple cycles", async () => {
    const handler = new InMemoryProtocolHandler();
    const init = await handler.ulyssesInit("bug");
    const sid = init.session_id as string;

    // First cycle: both moves fail
    await handler.ulyssesPlan(sid, {
      primary: "check logs",
      recovery: "check metrics",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sid, { assessment: "unexpected-unfavorable" });
    await handler.ulyssesOutcome(sid, { assessment: "unexpected-unfavorable" });

    // Reflect → S=0
    await handler.ulyssesReflect(sid, {
      hypothesis: "h1",
      falsification: "f1",
    });

    // Second cycle: both moves fail again
    await handler.ulyssesPlan(sid, {
      primary: "check env",
      recovery: "check config",
      irreversible: false,
    });
    await handler.ulyssesOutcome(sid, { assessment: "unexpected-unfavorable" });
    const result = await handler.ulyssesOutcome(sid, { assessment: "unexpected-unfavorable" });

    // Should contain moves from BOTH cycles
    expect(result.forbidden_moves).toEqual(
      expect.arrayContaining([
        "check logs", "check metrics",
        "check env", "check config",
      ]),
    );
  });
});
