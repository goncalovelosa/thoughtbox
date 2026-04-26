/**
 * Zod schemas for branch tool argument validation.
 *
 * Validates inputs at the toolhost dispatch boundary so wrong-shape calls
 * surface as friendly schema errors instead of leaking through to the
 * database layer (e.g. raw Postgres NOT-NULL constraint violations).
 */

import { z } from "zod";

export const branchSpawnSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  branchId: z.string().min(1, "branchId is required"),
  branchFromThought: z
    .number()
    .int()
    .positive("branchFromThought must be a positive thought number"),
  description: z.string().optional(),
});

export const branchMergeSchema = z
  .object({
    sessionId: z.string().min(1, "sessionId is required"),
    synthesis: z
      .string()
      .min(1, "synthesis is required: a non-empty summary thought to record on the main track"),
    resolution: z.enum(["selected", "synthesized", "abandoned"]),
    selectedBranchId: z.string().min(1).optional(),
  })
  .refine(
    (v) => v.resolution !== "selected" || !!v.selectedBranchId,
    {
      message: "selectedBranchId is required when resolution is 'selected'",
      path: ["selectedBranchId"],
    },
  );

export const branchListSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
});

export const branchGetSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  branchId: z.string().min(1, "branchId is required"),
});

const SCHEMAS = {
  spawn: branchSpawnSchema,
  merge: branchMergeSchema,
  list: branchListSchema,
  get: branchGetSchema,
} as const;

export type BranchOperation = keyof typeof SCHEMAS;

export type BranchValidation =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

/**
 * Validate args for a branch operation. Returns the parsed data on success,
 * or a single human-readable error string on failure.
 *
 * Multiple validation errors are joined into one message so the caller can
 * surface the full picture without parsing a Zod issue array.
 */
export function validateBranchArgs(
  operation: string,
  args: unknown,
): BranchValidation {
  const schema = SCHEMAS[operation as BranchOperation];
  if (!schema) {
    return { ok: false, error: `Unknown branch operation: ${operation}` };
  }
  const parsed = schema.safeParse(args);
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }
  const message = parsed.error.errors
    .map((issue) => {
      const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
      return `${path}${issue.message}`;
    })
    .join("; ");
  return { ok: false, error: `Invalid arguments for branch.${operation}: ${message}` };
}
